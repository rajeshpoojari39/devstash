import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // 1. Validate email presence
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Validate email format
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    // 3. Look up user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // 4. If user exists, generate token and dispatch reset email
    if (user) {
      const resetToken = await generatePasswordResetToken(normalizedEmail);

      await sendPasswordResetEmail({
        email: normalizedEmail,
        name: user.name,
        token: resetToken.token,
      });
    }

    // 5. Always return a generic success message to prevent user enumeration
    return NextResponse.json(
      {
        success: true,
        message:
          "If an account exists with this email address, you will receive password reset instructions shortly.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error during forgot password request:", error);
    return NextResponse.json(
      { error: "Failed to process request. Please try again later." },
      { status: 500 },
    );
  }
}
