import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const TOKEN_EXPIRY_HOURS = 24;

/**
 * Generate and store a new verification token for the given email address.
 * Replaces any existing tokens for this email to prevent stale or duplicate tokens.
 */
export async function generateVerificationToken(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: normalizedEmail,
    },
  });

  // Create new verification token
  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token,
      expires,
    },
  });

  return verificationToken;
}

/**
 * Look up a verification token by its unique token string.
 */
export async function getVerificationTokenByToken(token: string) {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });
    return verificationToken;
  } catch {
    return null;
  }
}

/**
 * Look up a verification token by email identifier.
 */
export async function getVerificationTokenByEmail(email: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { identifier: normalizedEmail },
    });
    return verificationToken;
  } catch {
    return null;
  }
}

export type VerifyEmailResult =
  | { success: true; message: string; email: string }
  | {
      success: false;
      error:
        | "TOKEN_NOT_FOUND"
        | "EXPIRED_TOKEN"
        | "USER_NOT_FOUND"
        | "ALREADY_VERIFIED"
        | "UNKNOWN_ERROR";
      message: string;
    };

/**
 * Verifies an email token and marks user's emailVerified in the database.
 */
export async function verifyEmailToken(
  token: string,
  emailHint?: string | null,
): Promise<VerifyEmailResult> {
  try {
    if (!token || typeof token !== "string") {
      return {
        success: false,
        error: "TOKEN_NOT_FOUND",
        message: "Verification token is missing or invalid.",
      };
    }

    const verificationToken = await getVerificationTokenByToken(token);

    if (!verificationToken) {
      // Check if user is already verified (in case they clicked link multiple times)
      if (emailHint) {
        const user = await prisma.user.findUnique({
          where: { email: emailHint.toLowerCase().trim() },
        });
        if (user?.emailVerified) {
          return {
            success: true,
            message: "Email is already verified.",
            email: user.email,
          };
        }
      }

      return {
        success: false,
        error: "TOKEN_NOT_FOUND",
        message:
          "Invalid or consumed verification link. Please request a new one.",
      };
    }

    const email = verificationToken.identifier;
    const hasExpired = new Date(verificationToken.expires) < new Date();

    if (hasExpired) {
      // Clean up expired token
      await prisma.verificationToken.deleteMany({
        where: { token },
      });

      return {
        success: false,
        error: "EXPIRED_TOKEN",
        message: "Verification link has expired. Please request a new one.",
      };
    }

    // Check if target user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: false,
        error: "USER_NOT_FOUND",
        message: "Account associated with this email could not be found.",
      };
    }

    // Mark email as verified and delete token atomically or sequentially
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      },
    });

    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    return {
      success: true,
      message: "Email verified successfully! You can now sign in.",
      email: user.email,
    };
  } catch (error) {
    console.error("Error during email token verification:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message:
        "An unexpected error occurred during verification. Please try again.",
    };
  }
}
