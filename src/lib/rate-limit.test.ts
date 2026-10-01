import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getClientIp,
  buildRateLimitIdentifier,
  checkRateLimit,
  createRateLimitResponse,
  RATE_LIMIT_CONFIGS,
} from "@/lib/rate-limit";

describe("rate-limit utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getClientIp", () => {
    it("returns default 127.0.0.1 when source is null or empty", () => {
      expect(getClientIp(null)).toBe("127.0.0.1");
      expect(getClientIp(undefined)).toBe("127.0.0.1");
    });

    it("extracts the first IP from x-forwarded-for header", () => {
      const headers = new Headers({
        "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
      });
      expect(getClientIp(headers)).toBe("203.0.113.195");
    });

    it("extracts x-real-ip when x-forwarded-for is missing", () => {
      const headers = new Headers({
        "x-real-ip": "198.51.100.42",
      });
      expect(getClientIp(headers)).toBe("198.51.100.42");
    });

    it("extracts cf-connecting-ip as fallback", () => {
      const headers = new Headers({
        "cf-connecting-ip": "192.0.2.1",
      });
      expect(getClientIp(headers)).toBe("192.0.2.1");
    });

    it("extracts IP from Request object", () => {
      const request = new Request("http://localhost:3000/api/auth/login", {
        headers: {
          "x-forwarded-for": "10.0.0.1",
        },
      });
      expect(getClientIp(request)).toBe("10.0.0.1");
    });
  });

  describe("buildRateLimitIdentifier", () => {
    it("builds composite ip:email key for login action", () => {
      const key = buildRateLimitIdentifier(
        "login",
        "192.168.1.1",
        "  User@EXAMPLE.com ",
      );
      expect(key).toBe("192.168.1.1:user@example.com");
    });

    it("builds IP-only key for register action (even if email provided)", () => {
      const key = buildRateLimitIdentifier(
        "register",
        "192.168.1.1",
        "user@example.com",
      );
      expect(key).toBe("192.168.1.1");
    });

    it("builds composite key for resend-verification action", () => {
      const key = buildRateLimitIdentifier(
        "resend-verification",
        "127.0.0.1",
        "test@devstash.io",
      );
      expect(key).toBe("127.0.0.1:test@devstash.io");
    });
  });

  describe("checkRateLimit (fail-open mode)", () => {
    it("fails open gracefully with success: true when Redis is unconfigured", async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const result = await checkRateLimit(
        "login",
        "127.0.0.1:test@example.com",
      );
      expect(result.success).toBe(true);
      expect(result.limit).toBe(RATE_LIMIT_CONFIGS.login.limit);
      expect(result.remaining).toBe(RATE_LIMIT_CONFIGS.login.limit);
      expect(result.retryAfterSeconds).toBe(0);
    });
  });

  describe("createRateLimitResponse", () => {
    it("creates a 429 JSON response with retry headers and error message", async () => {
      const rateLimitResult = {
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60000,
        retryAfterSeconds: 60,
      };

      const response = createRateLimitResponse(
        rateLimitResult,
        "Too many attempts",
      );
      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("60");
      expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");

      const body = await response.json();
      expect(body.error).toBe("Too many attempts");
      expect(body.retryAfter).toBe(60);
    });
  });
});
