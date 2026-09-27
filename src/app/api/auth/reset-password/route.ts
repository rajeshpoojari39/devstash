import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { consumePasswordResetTokenAndSetPassword } from "@/lib/tokens";
import {
  getClientIp,
  checkRateLimit,
  createRateLimitResponse,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // 0. Rate limiting check (5 attempts per 15 min by IP)
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimit("reset-password", clientIp);
    if (!rateLimit.success) {
      return createRateLimitResponse(rateLimit);
    }

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

    // 5. Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 6. Atomically verify token, update user password, and delete token within a transaction
    const resetResult = await consumePasswordResetTokenAndSetPassword(
      token,
      hashedPassword,
    );

    if (!resetResult.success) {
      return NextResponse.json({ error: resetResult.message }, { status: 400 });
    }

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
