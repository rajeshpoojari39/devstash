import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail, isEmailVerificationEnabled } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword } = body;

    // 1. Required fields check
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    if (!confirmPassword || typeof confirmPassword !== "string") {
      return NextResponse.json(
        { error: "Password confirmation is required" },
        { status: 400 },
      );
    }

    // 2. Email format validation
    const normalizedEmail = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 },
      );
    }

    // 3. Password length check
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    // 4. Password confirmation match check
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 },
      );
    }

    // 5. Existing user check
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    // 6. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Check if email verification is enabled
    const verificationEnabled = isEmailVerificationEnabled();

    // 8. Create user in database (auto-verified if verification is disabled)
    const user = await prisma.user.create({
      data: {
        name: typeof name === "string" && name.trim() ? name.trim() : null,
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: verificationEnabled ? null : new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // 9. If verification is enabled, generate token and dispatch email via Resend
    if (verificationEnabled) {
      const verificationToken =
        await generateVerificationToken(normalizedEmail);

      await sendVerificationEmail({
        email: normalizedEmail,
        name: user.name,
        token: verificationToken.token,
      });

      return NextResponse.json(
        {
          success: true,
          requiresVerification: true,
          message:
            "User registered successfully! Please check your email to verify your account.",
          user,
          email: normalizedEmail,
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        requiresVerification: false,
        message: "User registered successfully! You can now sign in.",
        user,
        email: normalizedEmail,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error during user registration:", error);
    return NextResponse.json(
      { error: "Failed to register user. Please try again later." },
      { status: 500 },
    );
  }
}
