import "dotenv/config";
import bcrypt from "bcryptjs";
import { POST as forgotPasswordHandler } from "../src/app/api/auth/forgot-password/route";
import { POST as resetPasswordHandler } from "../src/app/api/auth/reset-password/route";
import {
  generatePasswordResetToken,
  getPasswordResetTokenByToken,
  verifyPasswordResetToken,
  deletePasswordResetToken,
  formatResetPasswordIdentifier,
  extractEmailFromResetIdentifier,
} from "../src/lib/tokens";
import {
  generateResetPasswordEmailHtml,
  generateResetPasswordEmailText,
} from "../src/lib/email/templates/reset-password-email";
import { prisma } from "../src/lib/prisma";

async function testForgotPasswordFlow() {
  console.log("🔐 Testing Forgot Password & Reset Functionality...\n");

  const testEmail = `forgot-pwd-test-${Date.now()}@devstash.test`;
  const initialPassword = "initialPassword123!";
  const newPassword = "newSecurePassword456!";
  const testName = "Forgot Password Tester";

  try {
    // 1. Test Email Template Generation
    console.log("1. Testing reset password email templates...");
    const dummyResetUrl =
      "http://localhost:3000/reset-password?token=sample_token_123&email=test@devstash.test";
    const emailHtml = generateResetPasswordEmailHtml({
      name: "Alex",
      resetUrl: dummyResetUrl,
    });
    const emailText = generateResetPasswordEmailText({
      name: "Alex",
      resetUrl: dummyResetUrl,
    });

    if (
      !emailHtml.includes("DevStash") ||
      !emailHtml.includes(dummyResetUrl) ||
      !emailHtml.includes("Reset Password")
    ) {
      throw new Error(
        "❌ HTML reset password email template missing required brand or reset URL",
      );
    }
    if (!emailText.includes(dummyResetUrl)) {
      throw new Error("❌ Plaintext reset password email missing reset URL");
    }
    console.log(
      "   ✓ HTML and Plaintext reset password email templates render correctly",
    );

    // 2. Test Identifier Prefix Helpers
    console.log("\n2. Testing token identifier formatting and scoping...");
    const sampleEmail = "TEST.user@DevStash.IO";
    const formattedId = formatResetPasswordIdentifier(sampleEmail);
    if (formattedId !== "reset:test.user@devstash.io") {
      throw new Error(
        `❌ Unexpected formatted identifier: expected 'reset:test.user@devstash.io', got '${formattedId}'`,
      );
    }
    const extractedEmail = extractEmailFromResetIdentifier(formattedId);
    if (extractedEmail !== "test.user@devstash.io") {
      throw new Error(
        `❌ Unexpected extracted email: expected 'test.user@devstash.io', got '${extractedEmail}'`,
      );
    }
    console.log(
      "   ✓ Token identifier scoped with 'reset:' prefix and normalized lowercase",
    );

    // 3. Create a Test User in Database
    console.log("\n3. Creating temporary test user in database...");
    const initialHashedPassword = await bcrypt.hash(initialPassword, 10);
    const testUser = await prisma.user.create({
      data: {
        name: testName,
        email: testEmail,
        password: initialHashedPassword,
        emailVerified: new Date(),
      },
    });
    console.log(
      `   ✓ Test user created: ${testUser.email} (id: ${testUser.id})`,
    );

    // 4. Test Token Generation & Database Storage
    console.log("\n4. Testing password reset token generation in database...");
    const generatedToken = await generatePasswordResetToken(testEmail);
    if (!generatedToken || !generatedToken.token) {
      throw new Error("❌ Failed to generate reset token");
    }

    const fetchedToken = await getPasswordResetTokenByToken(
      generatedToken.token,
    );
    if (!fetchedToken || fetchedToken.identifier !== `reset:${testEmail}`) {
      throw new Error(
        `❌ Stored token identifier mismatch: ${fetchedToken?.identifier}`,
      );
    }
    console.log(
      `   ✓ Stored token in VerificationToken table: ${generatedToken.token.substring(0, 10)}... (identifier: ${fetchedToken.identifier})`,
    );

    // Test explicit deletion via deletePasswordResetToken
    await deletePasswordResetToken(generatedToken.token);
    const afterDelete = await getPasswordResetTokenByToken(
      generatedToken.token,
    );
    if (afterDelete) {
      throw new Error("❌ deletePasswordResetToken did not delete token");
    }
    console.log("   ✓ deletePasswordResetToken successfully deleted token");

    // 5. Test Token Expiration Logic
    console.log("\n5. Testing token expiration handling...");
    const expiredTokenRecord = await prisma.verificationToken.create({
      data: {
        identifier: `reset:${testEmail}`,
        token: `expired-reset-token-${Date.now()}`,
        expires: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes in the past
      },
    });

    const expiredResult = await verifyPasswordResetToken(
      expiredTokenRecord.token,
    );
    if (expiredResult.success || expiredResult.error !== "EXPIRED_TOKEN") {
      throw new Error(
        `❌ Expired reset token was not rejected as EXPIRED_TOKEN: ${JSON.stringify(expiredResult)}`,
      );
    }
    console.log("   ✓ Expired token properly detected and rejected");

    // 6. Test Forgot Password API Route: POST /api/auth/forgot-password
    console.log(
      "\n6. Testing POST /api/auth/forgot-password endpoint & enumeration prevention...",
    );

    // Invalid email validation
    const invalidReq = new Request(
      "http://localhost:3000/api/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      },
    );
    const invalidRes = await forgotPasswordHandler(invalidReq);
    if (invalidRes.status !== 400) {
      throw new Error(
        `❌ Expected 400 for invalid email format, got ${invalidRes.status}`,
      );
    }

    // Non-existent email (should still return 200 generic message)
    const nonExistentReq = new Request(
      "http://localhost:3000/api/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "non-existent-user-12345@devstash.test",
        }),
      },
    );
    const nonExistentRes = await forgotPasswordHandler(nonExistentReq);
    if (nonExistentRes.status !== 200) {
      throw new Error(
        `❌ Expected 200 for non-existent user (anti-enumeration), got ${nonExistentRes.status}`,
      );
    }
    const nonExistentData = await nonExistentRes.json();
    if (!nonExistentData.success) {
      throw new Error(
        "❌ Expected success: true for anti-enumeration generic response",
      );
    }
    console.log(
      "   ✓ Non-existent user requests return generic 200 success without leaking existence",
    );

    // Existing user request
    const existingReq = new Request(
      "http://localhost:3000/api/auth/forgot-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      },
    );
    const existingRes = await forgotPasswordHandler(existingReq);
    if (existingRes.status !== 200) {
      throw new Error(
        `❌ Expected 200 for valid forgot password request, got ${existingRes.status}`,
      );
    }

    const latestTokenRecord = await prisma.verificationToken.findFirst({
      where: { identifier: `reset:${testEmail}` },
    });
    if (!latestTokenRecord) {
      throw new Error(
        "❌ Expected reset token in database after forgot-password request",
      );
    }
    console.log(
      `   ✓ Active reset token generated and stored: ${latestTokenRecord.token.substring(0, 10)}...`,
    );

    // 7. Test Reset Password API Route: POST /api/auth/reset-password
    console.log(
      "\n7. Testing POST /api/auth/reset-password validation & password update...",
    );

    // Password length validation
    const shortPwdReq = new Request(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: latestTokenRecord.token,
          password: "short",
          confirmPassword: "short",
        }),
      },
    );
    const shortPwdRes = await resetPasswordHandler(shortPwdReq);
    if (shortPwdRes.status !== 400) {
      throw new Error(
        `❌ Expected 400 for password < 8 characters, got ${shortPwdRes.status}`,
      );
    }

    // Password mismatch validation
    const mismatchReq = new Request(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: latestTokenRecord.token,
          password: newPassword,
          confirmPassword: "differentPassword123!",
        }),
      },
    );
    const mismatchRes = await resetPasswordHandler(mismatchReq);
    if (mismatchRes.status !== 400) {
      throw new Error(
        `❌ Expected 400 for mismatched passwords, got ${mismatchRes.status}`,
      );
    }

    // Successful Password Reset
    const validResetReq = new Request(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: latestTokenRecord.token,
          password: newPassword,
          confirmPassword: newPassword,
        }),
      },
    );
    const validResetRes = await resetPasswordHandler(validResetReq);
    if (validResetRes.status !== 200) {
      const err = await validResetRes.json();
      throw new Error(
        `❌ Expected 200 for valid reset request, got ${validResetRes.status}: ${JSON.stringify(err)}`,
      );
    }

    const validResetData = await validResetRes.json();
    if (!validResetData.success) {
      throw new Error("❌ Reset password response did not indicate success");
    }
    console.log("   ✓ POST /api/auth/reset-password succeeded with 200 OK");

    // 8. Verify Updated Password in Database
    console.log(
      "\n8. Verifying password update and token deletion in database...",
    );
    const updatedUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    if (!updatedUser || !updatedUser.password) {
      throw new Error("❌ Updated user record not found or password missing");
    }

    const matchesOldPassword = await bcrypt.compare(
      initialPassword,
      updatedUser.password,
    );
    if (matchesOldPassword) {
      throw new Error("❌ User password still matches the old password");
    }

    const matchesNewPassword = await bcrypt.compare(
      newPassword,
      updatedUser.password,
    );
    if (!matchesNewPassword) {
      throw new Error(
        "❌ User password hash in database does NOT match the new password",
      );
    }
    console.log(
      "   ✓ Password hash in database successfully updated and verified via bcrypt.compare",
    );

    // 9. Verify Token Consumption & Invalidation
    console.log("\n9. Verifying consumed token invalidation...");
    const consumedToken = await prisma.verificationToken.findUnique({
      where: { token: latestTokenRecord.token },
    });
    if (consumedToken) {
      throw new Error(
        "❌ Reset token was not deleted from database after password reset",
      );
    }

    const replayReq = new Request(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: latestTokenRecord.token,
          password: "anotherPassword123!",
          confirmPassword: "anotherPassword123!",
        }),
      },
    );
    const replayRes = await resetPasswordHandler(replayReq);
    if (replayRes.status !== 400) {
      throw new Error(
        `❌ Replaying consumed token should return 400, got ${replayRes.status}`,
      );
    }
    console.log(
      "   ✓ Consumed token deleted and replay attempt safely rejected with 400",
    );

    console.log(
      "\n✅ All Forgot Password & Reset Functionality tests passed successfully!\n",
    );
  } finally {
    // Cleanup temporary test data
    console.log("🧹 Cleaning up test data...");
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

testForgotPasswordFlow()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
