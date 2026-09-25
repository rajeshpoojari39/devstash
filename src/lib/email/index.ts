import { resend, EMAIL_FROM } from "./resend";
import {
  generateVerificationEmailHtml,
  generateVerificationEmailText,
} from "./templates/verification-email";

export interface SendVerificationEmailParams {
  email: string;
  name?: string | null;
  token: string;
}

/**
 * Checks whether email verification is enabled.
 * Returns true if ENABLE_EMAIL_VERIFICATION or NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION is "true".
 * Defaults to false (disabled) to allow arbitrary email registrations when a custom domain is not linked to Resend.
 */
export function isEmailVerificationEnabled(): boolean {
  return (
    process.env.ENABLE_EMAIL_VERIFICATION === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION === "true"
  );
}

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function sendVerificationEmail({
  email,
  name,
  token,
}: SendVerificationEmailParams): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  try {
    const baseUrl = getAppBaseUrl();
    const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    const html = generateVerificationEmailHtml({ name, verifyUrl });
    const text = generateVerificationEmailText({ name, verifyUrl });

    // Always log verification link in development / test mode for rapid local testing
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[DevStash Email] Verification link generated for ${email}: ${verifyUrl}`,
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn(
        "[DevStash Email] RESEND_API_KEY is not set. Skipped actual email dispatch.",
      );
      return { success: true, data: { simulated: true, verifyUrl } };
    }

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Verify your email address - DevStash",
      html,
      text,
    });

    if (error) {
      console.error("[DevStash Email] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to send email";
    console.error(
      "[DevStash Email] Unexpected error while sending verification email:",
      err,
    );
    return { success: false, error: errorMsg };
  }
}
