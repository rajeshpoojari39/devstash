import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isEmailVerificationEnabled, getAppBaseUrl } from "@/lib/email";
import {
  generateVerificationEmailHtml,
  generateVerificationEmailText,
} from "@/lib/email/templates/verification-email";
import {
  generateResetPasswordEmailHtml,
  generateResetPasswordEmailText,
} from "@/lib/email/templates/reset-password-email";

describe("email utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isEmailVerificationEnabled", () => {
    it("returns false when environment variables are not set", () => {
      delete process.env.ENABLE_EMAIL_VERIFICATION;
      delete process.env.NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION;
      expect(isEmailVerificationEnabled()).toBe(false);
    });

    it("returns true when ENABLE_EMAIL_VERIFICATION is 'true'", () => {
      process.env.ENABLE_EMAIL_VERIFICATION = "true";
      expect(isEmailVerificationEnabled()).toBe(true);
    });

    it("returns true when NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION is 'true'", () => {
      process.env.NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION = "true";
      expect(isEmailVerificationEnabled()).toBe(true);
    });

    it("returns false when set to other values", () => {
      process.env.ENABLE_EMAIL_VERIFICATION = "false";
      expect(isEmailVerificationEnabled()).toBe(false);
    });
  });

  describe("getAppBaseUrl", () => {
    it("prefers NEXT_PUBLIC_APP_URL without trailing slash", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://devstash.app/";
      expect(getAppBaseUrl()).toBe("https://devstash.app");
    });

    it("uses NEXTAUTH_URL when NEXT_PUBLIC_APP_URL is absent", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.NEXTAUTH_URL = "https://auth.devstash.app/";
      expect(getAppBaseUrl()).toBe("https://auth.devstash.app");
    });

    it("uses VERCEL_URL if set", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXTAUTH_URL;
      process.env.VERCEL_URL = "devstash-preview.vercel.app";
      expect(getAppBaseUrl()).toBe("https://devstash-preview.vercel.app");
    });

    it("falls back to localhost:3000", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXTAUTH_URL;
      delete process.env.VERCEL_URL;
      expect(getAppBaseUrl()).toBe("http://localhost:3000");
    });
  });

  describe("email templates", () => {
    const testUrl = "http://localhost:3000/verify-email?token=123";

    it("generates verification html with greeting and URL", () => {
      const html = generateVerificationEmailHtml({
        name: "Alice",
        verifyUrl: testUrl,
      });
      expect(html).toContain("Alice");
      expect(html).toContain(testUrl);
      expect(html).toContain("Verify Email Address");
    });

    it("generates verification html fallback for missing name", () => {
      const html = generateVerificationEmailHtml({
        name: null,
        verifyUrl: testUrl,
      });
      expect(html).toContain("Developer");
      expect(html).toContain(testUrl);
    });

    it("generates verification text version", () => {
      const text = generateVerificationEmailText({
        name: "Alice",
        verifyUrl: testUrl,
      });
      expect(text).toContain("Hello Alice,");
      expect(text).toContain(testUrl);
    });

    it("generates password reset html with link", () => {
      const resetUrl = "http://localhost:3000/reset-password?token=abc";
      const html = generateResetPasswordEmailHtml({
        name: "Bob",
        resetUrl,
      });
      expect(html).toContain("Bob");
      expect(html).toContain(resetUrl);
      expect(html).toContain("Reset Password");
    });

    it("generates password reset text version", () => {
      const resetUrl = "http://localhost:3000/reset-password?token=abc";
      const text = generateResetPasswordEmailText({
        name: null,
        resetUrl,
      });
      expect(text).toContain("Hello Developer,");
      expect(text).toContain(resetUrl);
    });
  });
});
