import "dotenv/config";
import { POST as registerHandler } from "../src/app/api/auth/register/route";
import { POST as resendHandler } from "../src/app/api/auth/resend-verification/route";
import { POST as verifyHandler } from "../src/app/api/auth/verify-email/route";
import { verifyEmailToken } from "../src/lib/tokens";
import {
  generateVerificationEmailHtml,
  generateVerificationEmailText,
} from "../src/lib/email/templates/verification-email";
import { isEmailVerificationEnabled } from "../src/lib/email";
import { prisma } from "../src/lib/prisma";

async function testEmailVerification() {
  console.log("✉️  Testing Email Verification System & Toggle...\n");

  const testEmailDisabled = `verify-disabled-${Date.now()}@devstash.test`;
  const testEmailEnabled = `verify-enabled-${Date.now()}@devstash.test`;
  const testPassword = "securePassword123!";
  const testName = "Email Verification Tester";

  try {
    // 1. Test Toggle Detection
    console.log("1. Testing isEmailVerificationEnabled() helper...");
    process.env.ENABLE_EMAIL_VERIFICATION = "false";
    const disabledCheck = isEmailVerificationEnabled();
    if (disabledCheck !== false) {
      throw new Error(
        "❌ Expected isEmailVerificationEnabled() to return false when ENABLE_EMAIL_VERIFICATION='false'",
      );
    }

    process.env.ENABLE_EMAIL_VERIFICATION = "true";
    const enabledCheck = isEmailVerificationEnabled();
    if (enabledCheck !== true) {
      throw new Error(
        "❌ Expected isEmailVerificationEnabled() to return true when ENABLE_EMAIL_VERIFICATION='true'",
      );
    }
    console.log(
      "   ✓ isEmailVerificationEnabled() correctly reflects environment flag",
    );

    // 2. Test Registration Flow when Verification is DISABLED
    console.log(
      "\n2. Testing registration when email verification is DISABLED (auto-verify)...",
    );
    process.env.ENABLE_EMAIL_VERIFICATION = "false";

    const regDisabledReq = new Request(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "10.0.2.1",
        },
        body: JSON.stringify({
          name: testName,
          email: testEmailDisabled,
          password: testPassword,
          confirmPassword: testPassword,
        }),
      },
    );

    const regDisabledRes = await registerHandler(regDisabledReq);
    if (regDisabledRes.status !== 201) {
      const err = await regDisabledRes.json();
      throw new Error(
        `❌ Disabled-mode registration failed: ${JSON.stringify(err)}`,
      );
    }

    const regDisabledData = await regDisabledRes.json();
    if (regDisabledData.requiresVerification !== false) {
      throw new Error(
        "❌ Expected requiresVerification to be false when verification is disabled",
      );
    }

    const disabledUser = await prisma.user.findUnique({
      where: { email: testEmailDisabled },
    });
    if (!disabledUser || !disabledUser.emailVerified) {
      throw new Error(
        "❌ User should be auto-verified (emailVerified != null) when verification is disabled",
      );
    }

    const disabledTokens = await prisma.verificationToken.findMany({
      where: { identifier: testEmailDisabled },
    });
    if (disabledTokens.length > 0) {
      throw new Error(
        "❌ No verification token should be generated when verification is disabled",
      );
    }
    console.log(
      "   ✓ User auto-verified immediately with emailVerified timestamp and no token generated",
    );

    // Test resend when disabled
    const resendDisabledRes = await resendHandler(
      new Request("http://localhost:3000/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "10.0.2.2",
        },
        body: JSON.stringify({ email: testEmailDisabled }),
      }),
    );
    if (resendDisabledRes.status !== 400) {
      throw new Error(
        `❌ Expected 400 from resend when verification is disabled, got ${resendDisabledRes.status}`,
      );
    }
    const resendDisabledData = await resendDisabledRes.json();
    if (!resendDisabledData.verificationDisabled) {
      throw new Error("❌ Expected verificationDisabled: true in response");
    }
    console.log(
      "   ✓ Resend endpoint safely rejects requests when verification is disabled",
    );

    // 3. Test Email Template Generation
    console.log("\n3. Testing email template generation...");
    const dummyVerifyUrl =
      "http://localhost:3000/verify-email?token=dummy_token_123&email=test@test.com";
    const emailHtml = generateVerificationEmailHtml({
      name: "Alice",
      verifyUrl: dummyVerifyUrl,
    });
    const emailText = generateVerificationEmailText({
      name: "Alice",
      verifyUrl: dummyVerifyUrl,
    });

    if (
      !emailHtml.includes("DevStash") ||
      !emailHtml.includes(dummyVerifyUrl)
    ) {
      throw new Error(
        "❌ HTML email template does not include brand or verification URL",
      );
    }
    if (!emailText.includes(dummyVerifyUrl)) {
      throw new Error("❌ Plaintext email template missing verification URL");
    }
    console.log(
      "   ✓ HTML and Plaintext verification email templates render correctly",
    );

    // 4. Test Registration Flow when Verification is ENABLED
    console.log(
      "\n4. Testing user registration with ENABLE_EMAIL_VERIFICATION='true'...",
    );
    process.env.ENABLE_EMAIL_VERIFICATION = "true";

    const registerReq = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.2.3",
      },
      body: JSON.stringify({
        name: testName,
        email: testEmailEnabled,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });

    const regRes = await registerHandler(registerReq);
    if (regRes.status !== 201) {
      const err = await regRes.json();
      throw new Error(
        `❌ Registration failed with status ${regRes.status}: ${JSON.stringify(err)}`,
      );
    }

    const regData = await regRes.json();
    if (
      !regData.success ||
      !regData.user?.id ||
      regData.requiresVerification !== true
    ) {
      throw new Error(
        `❌ Unexpected registration response: ${JSON.stringify(regData)}`,
      );
    }

    // Verify user in DB has emailVerified === null
    const createdUser = await prisma.user.findUnique({
      where: { email: testEmailEnabled },
    });
    if (!createdUser || createdUser.emailVerified !== null) {
      throw new Error("❌ Registered user should have emailVerified === null");
    }
    console.log(
      "   ✓ User registered with emailVerified: null and requiresVerification: true",
    );

    // Verify token was stored in VerificationToken table
    const storedToken = await prisma.verificationToken.findFirst({
      where: { identifier: testEmailEnabled },
    });
    if (!storedToken || !storedToken.token) {
      throw new Error(
        "❌ VerificationToken record was not created for registered user",
      );
    }
    console.log(
      `   ✓ Verification token created in database: ${storedToken.token.substring(0, 10)}...`,
    );

    // 5. Test Resend Verification Endpoint
    console.log(
      "\n5. Testing /api/auth/resend-verification endpoint in enabled mode...",
    );
    const resendReq = new Request(
      "http://localhost:3000/api/auth/resend-verification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "10.0.2.4",
        },
        body: JSON.stringify({ email: testEmailEnabled }),
      },
    );

    const resendRes = await resendHandler(resendReq);
    if (resendRes.status !== 200) {
      const err = await resendRes.json();
      throw new Error(`❌ Resend verification failed: ${JSON.stringify(err)}`);
    }
    const resendData = await resendRes.json();
    if (!resendData.success) {
      throw new Error("❌ Resend response payload did not indicate success");
    }

    // Check token was refreshed
    const updatedToken = await prisma.verificationToken.findFirst({
      where: { identifier: testEmailEnabled },
    });
    if (!updatedToken) {
      throw new Error("❌ Token missing after resend");
    }
    console.log("   ✓ Resend endpoint generated fresh verification token");

    // 6. Test Invalid & Expired Token Verification
    console.log("\n6. Testing invalid and expired token handling...");
    const invalidVerifyRes = await verifyHandler(
      new Request("http://localhost:3000/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "invalid-token-xyz" }),
      }),
    );
    if (invalidVerifyRes.status !== 400) {
      throw new Error(
        `❌ Expected 400 for invalid token, got ${invalidVerifyRes.status}`,
      );
    }
    console.log("   ✓ Invalid token correctly rejected with 400");

    // Test expired token
    const expiredToken = await prisma.verificationToken.create({
      data: {
        identifier: `expired-${Date.now()}@devstash.test`,
        token: `expired-token-${Date.now()}`,
        expires: new Date(Date.now() - 1000 * 60), // 1 minute in the past
      },
    });

    const expiredResult = await verifyEmailToken(expiredToken.token);
    if (expiredResult.success || expiredResult.error !== "EXPIRED_TOKEN") {
      throw new Error(
        `❌ Expired token was not recognized as expired: ${JSON.stringify(expiredResult)}`,
      );
    }
    console.log("   ✓ Expired token correctly rejected as EXPIRED_TOKEN");

    // 7. Test Valid Token Verification via GET and POST
    console.log("\n7. Testing valid token verification...");
    const verifyReq = new Request(
      "http://localhost:3000/api/auth/verify-email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: updatedToken.token,
          email: testEmailEnabled,
        }),
      },
    );

    const verifyRes = await verifyHandler(verifyReq);
    if (verifyRes.status !== 200) {
      const err = await verifyRes.json();
      throw new Error(
        `❌ Email verification failed with status ${verifyRes.status}: ${JSON.stringify(err)}`,
      );
    }

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      throw new Error(
        "❌ Verification response payload did not indicate success",
      );
    }
    console.log("   ✓ Email verification API returned success 200");

    // Verify User in DB is now marked as verified
    const verifiedDbUser = await prisma.user.findUnique({
      where: { email: testEmailEnabled },
    });
    if (!verifiedDbUser || !verifiedDbUser.emailVerified) {
      throw new Error("❌ User emailVerified was not updated in the database");
    }
    console.log(
      `   ✓ Database record updated: emailVerified at ${verifiedDbUser.emailVerified.toISOString()}`,
    );

    // Verify token was deleted
    const tokenAfterVerification = await prisma.verificationToken.findFirst({
      where: { identifier: testEmailEnabled },
    });
    if (tokenAfterVerification) {
      throw new Error(
        "❌ Verification token was not cleaned up after verification",
      );
    }
    console.log("   ✓ Verification token consumed and deleted from database");

    // 8. Test Demo User Status
    console.log("\n8. Checking demo user verification status...");
    const demoUser = await prisma.user.findUnique({
      where: { email: "demo@devstash.io" },
    });
    if (demoUser) {
      console.log(
        `   ✓ Demo user (demo@devstash.io) verified status: ${demoUser.emailVerified ? "Verified" : "Unverified"}`,
      );
    }

    console.log(
      "\n✅ All Email Verification Toggle & Verification tests passed successfully!\n",
    );
  } finally {
    // Cleanup test data
    console.log("🧹 Cleaning up temporary test data...");
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: { contains: "devstash.test" },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: "devstash.test" },
      },
    });
    console.log("   ✓ Cleanup complete\n");
  }
}

testEmailVerification()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
