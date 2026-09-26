import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  verifyPasswordResetToken,
  deletePasswordResetToken,
} from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    // 1. Validate token presence
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Password reset token is missing or invalid." },
        { status: 400 },
      );
    }

    // 2. Validate password fields
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "New password is required." },
        { status: 400 },
      );
    }

    if (!confirmPassword || typeof confirmPassword !== "string") {
      return NextResponse.json(
        { error: "Password confirmation is required." },
        { status: 400 },
      );
    }

    // 3. Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    // 4. Validate matching passwords
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 },
      );
    }

    // 5. Verify the reset token and check associated user
    const verificationResult = await verifyPasswordResetToken(token);

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.message },
        { status: 400 },
      );
    }

    // 6. Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Update user's password in database
    await prisma.user.update({
      where: { email: verificationResult.email },
      data: {
        password: hashedPassword,
      },
    });

    // 8. Delete/invalidate the consumed token
    await deletePasswordResetToken(token);

    return NextResponse.json(
      {
        success: true,
        message:
          "Your password has been reset successfully! You can now sign in.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error during password reset:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again later." },
      { status: 500 },
    );
  }
}
