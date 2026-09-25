import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail, isEmailVerificationEnabled } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    if (!isEmailVerificationEnabled()) {
      return NextResponse.json(
        {
          error:
            "Email verification is currently disabled. You can sign in directly.",
          verificationDisabled: true,
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 },
      );
    }

    // Check user existence
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Return 404 with helpful error
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 404 },
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        {
          error:
            "This email address is already verified. You can sign in directly.",
          alreadyVerified: true,
        },
        { status: 400 },
      );
    }

    // Generate new token & dispatch email
    const verificationToken = await generateVerificationToken(normalizedEmail);

    await sendVerificationEmail({
      email: normalizedEmail,
      name: user.name,
      token: verificationToken.token,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "A new verification email has been sent. Please check your inbox.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error resending verification email:", error);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again later." },
      { status: 500 },
    );
  }
}
