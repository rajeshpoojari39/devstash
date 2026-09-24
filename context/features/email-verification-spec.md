# Email Verification on Register (via Resend)

## Overview

Implement email verification for new user registrations using Resend. When a user registers with credentials (email/password), generate a secure verification token, send a verification email with a confirmation link via Resend, and require email verification before allowing access to the application.

---

## Requirements & Scope

### 1. Resend Integration & Email Service

- Install `resend` package.
- Initialize Resend client using `RESEND_API_KEY` from environment variables.
- Configure fallback/default sender address (e.g., `DevStash <onboarding@resend.dev>`).
- Create responsive HTML email template for email verification with clean DevStash branding and direct verification button/link.

### 2. Token Generation & Storage

- Generate cryptographically secure tokens (e.g. `crypto.randomBytes(32).toString("hex")` or UUID).
- Store verification tokens in `VerificationToken` model (`identifier`: user email, `token`: hashed/unique token, `expires`: 24 hours expiry).
- Clean up or overwrite previous unused tokens when a new verification email is requested for the same email address.

### 3. Registration Flow Updates

- In `POST /api/auth/register`:
  - Create user with `emailVerified: null`.
  - Generate verification token and save in `VerificationToken` table.
  - Dispatch verification email via Resend utility.
  - Return informative response indicating verification email has been sent.

### 4. Verification Endpoint & Verification Page

- Create verification handler (`/api/auth/verify-email` or `/verify-email` route):
  - Validate token presence and expiration against database `VerificationToken` table.
  - Update user record `emailVerified` to `new Date()`.
  - Delete consumed verification token.
  - Render success confirmation UI or redirect to `/sign-in?verified=true`.
  - Handle invalid, already used, or expired tokens with clear error UI and a button to request a new verification email.

### 5. Resend Verification Email Action

- Create `POST /api/auth/resend-verification` endpoint:
  - Accept email address.
  - Verify user exists and is not yet verified.
  - Implement rate limiting / cooldown protection.
  - Generate new token and send email.

### 6. Authentication Guard

- Update `src/auth.ts` Credentials `authorize` function:
  - If user exists and password is correct, check if `user.emailVerified` is set.
  - If not verified, reject authentication with specific error (e.g., `"EMAIL_NOT_VERIFIED"`).
- Update `SignInForm` to display a distinct warning banner when `EMAIL_NOT_VERIFIED` error is returned, with a one-click button to resend verification link.

### 7. Automated Testing & Verification

- Create test script `scripts/test-email-verification.ts`.
- Verify registration token generation, email dispatch (or mock in test mode), verification token consumption, unverified login rejection, and verified login success.
- Run linting (`npm run lint`) and production build (`npm run build`).
