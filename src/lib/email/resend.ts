import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey && process.env.NODE_ENV === "production") {
  console.warn(
    "⚠️ Warning: RESEND_API_KEY is not defined in environment variables.",
  );
}

export const resend = new Resend(apiKey || "re_dummy_key_for_build");
export const EMAIL_FROM =
  process.env.EMAIL_FROM || "DevStash <onboarding@resend.dev>";
