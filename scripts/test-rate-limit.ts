import "dotenv/config";
import {
  RATE_LIMIT_CONFIGS,
  getClientIp,
  buildRateLimitIdentifier,
  checkRateLimit,
  createRateLimitResponse,
  RateLimitResult,
} from "../src/lib/rate-limit";
import { POST as registerHandler } from "../src/app/api/auth/register/route";
import { POST as forgotPasswordHandler } from "../src/app/api/auth/forgot-password/route";
import { POST as resetPasswordHandler } from "../src/app/api/auth/reset-password/route";
import { POST as resendVerificationHandler } from "../src/app/api/auth/resend-verification/route";

async function testRateLimiting() {
  console.log("🛡️ Testing Rate Limiting Functionality...\n");

  try {
    // 1. Validate Rate Limit Configuration Specs
    console.log("1. Validating rate limit configuration specs...");
    const expectedConfigs = {
      login: { limit: 5, window: "15 m", keyBy: "ip-and-identifier" },
      register: { limit: 3, window: "1 h", keyBy: "ip" },
      "forgot-password": { limit: 3, window: "1 h", keyBy: "ip" },
      "reset-password": { limit: 5, window: "15 m", keyBy: "ip" },
      "resend-verification": {
        limit: 3,
        window: "15 m",
        keyBy: "ip-and-identifier",
      },
    };

    for (const [action, expected] of Object.entries(expectedConfigs)) {
      const config =
        RATE_LIMIT_CONFIGS[action as keyof typeof RATE_LIMIT_CONFIGS];
      if (!config) {
        throw new Error(`❌ Missing configuration for action: ${action}`);
      }
      if (
        config.limit !== expected.limit ||
        config.window !== expected.window ||
        config.keyBy !== expected.keyBy
      ) {
        throw new Error(
          `❌ Config mismatch for action ${action}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(config)}`,
        );
      }
    }
    console.log(
      "   ✓ All 5 auth rate limit configurations match the specification",
    );

    // 2. Test Client IP Extraction
    console.log("\n2. Testing client IP extraction helpers (getClientIp)...");

    // Test x-forwarded-for with single IP
    const singleXffHeaders = new Headers({
      "x-forwarded-for": "203.0.113.195",
    });
    if (getClientIp(singleXffHeaders) !== "203.0.113.195") {
      throw new Error(`❌ getClientIp failed for single x-forwarded-for`);
    }

    // Test x-forwarded-for with multiple proxy IPs (client, proxy1, proxy2)
    const multiXffHeaders = new Headers({
      "x-forwarded-for": "198.51.100.42, 10.0.0.1, 172.16.0.1",
    });
    if (getClientIp(multiXffHeaders) !== "198.51.100.42") {
      throw new Error(
        `❌ getClientIp did not pick first client IP from multi x-forwarded-for`,
      );
    }

    // Test x-real-ip
    const realIpHeaders = new Headers({ "x-real-ip": "192.0.2.1" });
    if (getClientIp(realIpHeaders) !== "192.0.2.1") {
      throw new Error(`❌ getClientIp failed for x-real-ip`);
    }

    // Test cf-connecting-ip
    const cfHeaders = new Headers({ "cf-connecting-ip": "198.51.100.99" });
    if (getClientIp(cfHeaders) !== "198.51.100.99") {
      throw new Error(`❌ getClientIp failed for cf-connecting-ip`);
    }

    // Test fallback to 127.0.0.1 when no headers
    if (
      getClientIp(new Headers()) !== "127.0.0.1" ||
      getClientIp(null) !== "127.0.0.1"
    ) {
      throw new Error(`❌ getClientIp failed to fallback to 127.0.0.1`);
    }

    console.log(
      "   ✓ IP extraction handles x-forwarded-for, x-real-ip, cf-connecting-ip, and fallbacks",
    );

    // 3. Test Identifier Construction
    console.log("\n3. Testing identifier formatting & compound keys...");

    // IP-only action
    const regKey = buildRateLimitIdentifier(
      "register",
      "203.0.113.5",
      "user@test.com",
    );
    if (regKey !== "203.0.113.5") {
      throw new Error(`❌ IP-only action returned compound key: ${regKey}`);
    }

    // IP + identifier action (login)
    const loginKey = buildRateLimitIdentifier(
      "login",
      "203.0.113.5",
      "  User.Name@Example.COM  ",
    );
    if (loginKey !== "203.0.113.5:user.name@example.com") {
      throw new Error(`❌ Compound key normalization failed: ${loginKey}`);
    }

    // IP + identifier action (resend-verification)
    const resendKey = buildRateLimitIdentifier(
      "resend-verification",
      "10.0.0.1",
      "Alex@DevStash.IO",
    );
    if (resendKey !== "10.0.0.1:alex@devstash.io") {
      throw new Error(`❌ Compound key formatting failed: ${resendKey}`);
    }

    console.log(
      "   ✓ Identifiers properly formatted with casing normalization and action scoping",
    );

    // 4. Test Live / Fail-Open Rate Limit Check
    console.log("\n4. Testing rate limit check execution...");
    const testIp = `192.0.2.${Math.floor(Math.random() * 200) + 10}`;
    const checkResult = await checkRateLimit("register", testIp);
    if (!checkResult.success) {
      throw new Error(`❌ checkRateLimit failed for fresh test IP: ${testIp}`);
    }
    if (checkResult.limit !== 3) {
      throw new Error(
        `❌ Expected limit 3 for register, got ${checkResult.limit}`,
      );
    }
    console.log(
      `   ✓ checkRateLimit correctly processed fresh IP (${testIp}) with limit ${checkResult.limit}`,
    );

    // If Redis is active, test that repeated hits decrement and trigger rate limiting
    if (checkResult.remaining < checkResult.limit) {
      console.log("   ✓ Upstash Redis is active: verifying quota decrement...");
      // Consume remaining quota for this test IP
      await checkRateLimit("register", testIp);
      await checkRateLimit("register", testIp);
      const blockedResult = await checkRateLimit("register", testIp);
      if (blockedResult.success) {
        throw new Error(
          "❌ Expected 4th request on limit 3 to be blocked (success: false)",
        );
      }
      console.log(
        `   ✓ Correctly blocked 4th request: retryAfterSeconds = ${blockedResult.retryAfterSeconds}s`,
      );
    } else {
      console.log(
        "   ✓ Unconfigured Redis fail-open guarantee verified (success: true)",
      );
    }

    // 5. Test 429 Too Many Requests Response Formatting
    console.log("\n5. Testing 429 Rate Limit response formatting & headers...");
    const simulatedExceededResult: RateLimitResult = {
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 15 * 60 * 1000,
      retryAfterSeconds: 900,
    };

    const res429 = createRateLimitResponse(simulatedExceededResult);
    if (res429.status !== 429) {
      throw new Error(`❌ Expected status 429, got ${res429.status}`);
    }
    if (res429.headers.get("Retry-After") !== "900") {
      throw new Error(
        `❌ Retry-After header mismatch: ${res429.headers.get("Retry-After")}`,
      );
    }
    if (res429.headers.get("X-RateLimit-Limit") !== "5") {
      throw new Error(`❌ X-RateLimit-Limit header mismatch`);
    }
    if (res429.headers.get("X-RateLimit-Remaining") !== "0") {
      throw new Error(`❌ X-RateLimit-Remaining header mismatch`);
    }

    const res429Body = await res429.json();
    if (!res429Body.error || !res429Body.error.includes("minutes")) {
      throw new Error(
        `❌ 429 response body missing human-readable error message: ${JSON.stringify(res429Body)}`,
      );
    }
    if (res429Body.retryAfter !== 900) {
      throw new Error(`❌ 429 response body retryAfter mismatch`);
    }
    console.log(
      `   ✓ 429 response contains proper headers and message: "${res429Body.error}"`,
    );

    // 6. Test Endpoint Rate Limit Guards (Route Handlers)
    console.log("\n6. Testing auth route handlers integration...");
    const randOffset = Math.floor(Math.random() * 100);

    // Register Handler
    const dummyRegisterReq = new Request(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `198.51.100.${randOffset + 1}`,
        },
        body: JSON.stringify({ email: "invalid-email" }),
      },
    );
    const regRes = await registerHandler(dummyRegisterReq);
    // Should pass rate limit check and fail at input validation (400)
    if (regRes.status !== 400) {
      throw new Error(`❌ Register route unexpected status: ${regRes.status}`);
    }
    console.log(
      "   ✓ POST /api/auth/register successfully executes rate limit check",
    );

    // Forgot Password Handler
    const dummyForgotReq = new Request(
      "http://localhost:3000/api/auth/forgot-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `198.51.100.${randOffset + 2}`,
        },
        body: JSON.stringify({ email: "invalid-email" }),
      },
    );
    const forgotRes = await forgotPasswordHandler(dummyForgotReq);
    if (forgotRes.status !== 400) {
      throw new Error(
        `❌ Forgot-password route unexpected status: ${forgotRes.status}`,
      );
    }
    console.log(
      "   ✓ POST /api/auth/forgot-password successfully executes rate limit check",
    );

    // Reset Password Handler
    const dummyResetReq = new Request(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `198.51.100.${randOffset + 3}`,
        },
        body: JSON.stringify({
          token: "invalid-token",
          password: "pwd",
          confirmPassword: "pwd",
        }),
      },
    );
    const resetRes = await resetPasswordHandler(dummyResetReq);
    if (resetRes.status !== 400) {
      throw new Error(
        `❌ Reset-password route unexpected status: ${resetRes.status}`,
      );
    }
    console.log(
      "   ✓ POST /api/auth/reset-password successfully executes rate limit check",
    );

    // Resend Verification Handler
    const dummyResendReq = new Request(
      "http://localhost:3000/api/auth/resend-verification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `198.51.100.${randOffset + 4}`,
        },
        body: JSON.stringify({ email: `test-${Date.now()}@devstash.test` }),
      },
    );
    const resendRes = await resendVerificationHandler(dummyResendReq);
    // When verification is disabled or user not found, returns valid response
    if (resendRes.status !== 200 && resendRes.status !== 400) {
      throw new Error(
        `❌ Resend-verification route unexpected status: ${resendRes.status}`,
      );
    }
    console.log(
      "   ✓ POST /api/auth/resend-verification successfully executes rate limit check",
    );

    console.log("\n✅ All Rate Limiting tests passed successfully!\n");
  } catch (error) {
    console.error("❌ Rate limiting test failed:", error);
    process.exit(1);
  }
}

testRateLimiting();
