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

export const RESET_PASSWORD_TOKEN_EXPIRY_HOURS = 1;
export const RESET_PASSWORD_IDENTIFIER_PREFIX = "reset:";

export function formatResetPasswordIdentifier(email: string): string {
  return `${RESET_PASSWORD_IDENTIFIER_PREFIX}${email.toLowerCase().trim()}`;
}

export function extractEmailFromResetIdentifier(identifier: string): string {
  if (identifier.startsWith(RESET_PASSWORD_IDENTIFIER_PREFIX)) {
    return identifier.slice(RESET_PASSWORD_IDENTIFIER_PREFIX.length);
  }
  return identifier;
}

/**
 * Generate and store a new password reset token for the given email address.
 * Reuses the existing VerificationToken model with a 'reset:<email>' identifier.
 * Replaces any existing password reset tokens for this email.
 */
export async function generatePasswordResetToken(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const identifier = formatResetPasswordIdentifier(normalizedEmail);
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(
    Date.now() + RESET_PASSWORD_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  );

  // Delete any existing reset tokens for this email
  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
    },
  });

  // Create new reset token
  const resetToken = await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return resetToken;
}

/**
 * Look up a password reset token by its unique token string.
 */
export async function getPasswordResetTokenByToken(token: string) {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (
      !verificationToken ||
      !verificationToken.identifier.startsWith(RESET_PASSWORD_IDENTIFIER_PREFIX)
    ) {
      return null;
    }

    return verificationToken;
  } catch {
    return null;
  }
}

export type VerifyPasswordResetResult =
  | { success: true; email: string; token: string }
  | {
      success: false;
      error:
        | "TOKEN_NOT_FOUND"
        | "EXPIRED_TOKEN"
        | "USER_NOT_FOUND"
        | "UNKNOWN_ERROR";
      message: string;
    };

/**
 * Validates a password reset token and returns the associated email.
 * Checks token validity and target user existence.
 */
export async function verifyPasswordResetToken(
  token: string,
): Promise<VerifyPasswordResetResult> {
  try {
    if (!token || typeof token !== "string") {
      return {
        success: false,
        error: "TOKEN_NOT_FOUND",
        message: "Password reset token is missing or invalid.",
      };
    }

    const resetToken = await getPasswordResetTokenByToken(token);

    if (!resetToken) {
      return {
        success: false,
        error: "TOKEN_NOT_FOUND",
        message:
          "Invalid or expired password reset link. Please request a new one.",
      };
    }

    const hasExpired = new Date(resetToken.expires) < new Date();

    if (hasExpired) {
      await prisma.verificationToken.deleteMany({
        where: { token },
      });

      return {
        success: false,
        error: "EXPIRED_TOKEN",
        message: "Password reset link has expired. Please request a new one.",
      };
    }

    const email = extractEmailFromResetIdentifier(resetToken.identifier);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: false,
        error: "USER_NOT_FOUND",
        message: "Account associated with this reset link could not be found.",
      };
    }

    return {
      success: true,
      email: user.email,
      token: resetToken.token,
    };
  } catch (error) {
    console.error("Error verifying password reset token:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message:
        "An unexpected error occurred while verifying the reset link. Please try again.",
    };
  }
}

/**
 * Invalidate and delete a consumed password reset token.
 */
export async function deletePasswordResetToken(token: string) {
  try {
    await prisma.verificationToken.deleteMany({
      where: { token },
    });
  } catch (error) {
    console.error("Error deleting password reset token:", error);
  }
}

export type ConsumePasswordResetTokenResult =
  | { success: true; email: string }
  | {
      success: false;
      error:
        | "TOKEN_NOT_FOUND"
        | "EXPIRED_TOKEN"
        | "USER_NOT_FOUND"
        | "UNKNOWN_ERROR";
      message: string;
    };

/**
 * Atomically validates a password reset token, updates the user's password,
 * and deletes the consumed token within a single database transaction.
 */
export async function consumePasswordResetTokenAndSetPassword(
  token: string,
  newHashedPassword: string,
): Promise<ConsumePasswordResetTokenResult> {
  try {
    if (!token || typeof token !== "string") {
      return {
        success: false,
        error: "TOKEN_NOT_FOUND",
        message: "Password reset token is missing or invalid.",
      };
    }

    return await prisma.$transaction(async (tx) => {
      const verificationToken = await tx.verificationToken.findUnique({
        where: { token },
      });

      if (
        !verificationToken ||
        !verificationToken.identifier.startsWith(
          RESET_PASSWORD_IDENTIFIER_PREFIX,
        )
      ) {
        return {
          success: false,
          error: "TOKEN_NOT_FOUND",
          message:
            "Invalid or expired password reset link. Please request a new one.",
        };
      }

      const hasExpired = new Date(verificationToken.expires) < new Date();

      if (hasExpired) {
        await tx.verificationToken.deleteMany({
          where: { token },
        });

        return {
          success: false,
          error: "EXPIRED_TOKEN",
          message: "Password reset link has expired. Please request a new one.",
        };
      }

      const email = extractEmailFromResetIdentifier(
        verificationToken.identifier,
      );

      const user = await tx.user.findUnique({
        where: { email },
      });

      if (!user) {
        return {
          success: false,
          error: "USER_NOT_FOUND",
          message:
            "Account associated with this reset link could not be found.",
        };
      }

      // 1. Update password
      await tx.user.update({
        where: { email },
        data: {
          password: newHashedPassword,
        },
      });

      // 2. Atomically delete token
      await tx.verificationToken.deleteMany({
        where: { token },
      });

      return {
        success: true,
        email: user.email,
      };
    });
  } catch (error) {
    console.error(
      "Error during atomic password reset token consumption:",
      error,
    );
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message:
        "An unexpected error occurred while resetting your password. Please try again.",
    };
  }
}
