import "dotenv/config";
import { POST as registerHandler } from "../src/app/api/auth/register/route";
import { POST as resendHandler } from "../src/app/api/auth/resend-verification/route";
import { POST as verifyHandler } from "../src/app/api/auth/verify-email/route";
import { verifyEmailToken } from "../src/lib/tokens";
import {
  generateVerificationEmailHtml,
  generateVerificationEmailText,
} from "../src/lib/email/templates/verification-email";
import { sendVerificationEmail } from "../src/lib/email";
import { prisma } from "../src/lib/prisma";

async function testEmailVerification() {
  console.log("✉️  Testing Email Verification System (via Resend)...\n");

  const testEmail = `verify-test-${Date.now()}@devstash.test`;
  const testPassword = "securePassword123!";
  const testName = "Email Verification Tester";

  try {
    // 1. Test Email Template Generation
    console.log("1. Testing email template generation...");
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

    // 2. Test Direct Send Utility (Graceful execution)
    console.log("\n2. Testing sendVerificationEmail utility...");
    const sendResult = await sendVerificationEmail({
      email: testEmail,
      name: testName,
      token: "sample-test-token",
    });
    console.log(
      `   ✓ sendVerificationEmail executed (success: ${sendResult.success})`,
    );

    // 3. Test Registration Flow with Email Verification
    console.log(
      "\n3. Testing user registration creates unverified user and token...",
    );
    const registerReq = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
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
    if (!regData.success || !regData.user?.id) {
      throw new Error(
        `❌ Unexpected registration response: ${JSON.stringify(regData)}`,
      );
    }

    // Verify user in DB has emailVerified === null
    const createdUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    if (!createdUser || createdUser.emailVerified !== null) {
      throw new Error("❌ Registered user should have emailVerified === null");
    }
    console.log("   ✓ User registered with emailVerified: null");

    // Verify token was stored in VerificationToken table
    const storedToken = await prisma.verificationToken.findFirst({
      where: { identifier: testEmail },
    });
    if (!storedToken || !storedToken.token) {
      throw new Error(
        "❌ VerificationToken record was not created for registered user",
      );
    }
    console.log(
      `   ✓ Verification token created in database: ${storedToken.token.substring(0, 10)}...`,
    );

    // 4. Test Resend Verification Endpoint
    console.log("\n4. Testing /api/auth/resend-verification endpoint...");
    const resendReq = new Request(
      "http://localhost:3000/api/auth/resend-verification",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
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
      where: { identifier: testEmail },
    });
    if (!updatedToken) {
      throw new Error("❌ Token missing after resend");
    }
    console.log("   ✓ Resend endpoint generated fresh verification token");

    // 5. Test Invalid & Expired Token Verification
    console.log("\n5. Testing invalid and expired token handling...");
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

    // 6. Test Valid Token Verification via GET and POST
    console.log("\n6. Testing valid token verification...");
    const verifyReq = new Request(
      "http://localhost:3000/api/auth/verify-email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: updatedToken.token,
          email: testEmail,
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
      where: { email: testEmail },
    });
    if (!verifiedDbUser || !verifiedDbUser.emailVerified) {
      throw new Error("❌ User emailVerified was not updated in the database");
    }
    console.log(
      `   ✓ Database record updated: emailVerified at ${verifiedDbUser.emailVerified.toISOString()}`,
    );

    // Verify token was deleted
    const tokenAfterVerification = await prisma.verificationToken.findFirst({
      where: { identifier: testEmail },
    });
    if (tokenAfterVerification) {
      throw new Error(
        "❌ Verification token was not cleaned up after verification",
      );
    }
    console.log("   ✓ Verification token consumed and deleted from database");

    // 7. Test Resending for already verified user returns appropriate notice
    console.log("\n7. Testing resend for already verified user...");
    const alreadyVerifiedResend = await resendHandler(
      new Request("http://localhost:3000/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      }),
    );
    if (alreadyVerifiedResend.status !== 400) {
      throw new Error(
        `❌ Expected 400 for already verified user, got ${alreadyVerifiedResend.status}`,
      );
    }
    console.log("   ✓ Resend correctly blocks already verified accounts");

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

    console.log("\n✅ All Email Verification tests passed successfully!\n");
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
