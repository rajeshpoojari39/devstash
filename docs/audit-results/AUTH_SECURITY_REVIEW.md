# Authentication & Authorization Security Review

**Last Audit Date:** 2026-09-27 07:05:00 UTC  
**Auditor:** Auth Security Auditor Subagent  
**Scope:** NextAuth v5 implementation, Credentials & GitHub providers, Email verification, Password reset, Profile management, and Route Protection

---

## Executive Summary

| Severity     | Open Count | Resolved Count | Primary Impact Areas                                                          |
| :----------- | :--------- | :------------- | :---------------------------------------------------------------------------- |
| **Critical** | 0          | 0              | No direct remote code execution or complete authentication bypasses detected  |
| **High**     | 2          | 1              | Rate limiting absence, lack of session revocation on password change          |
| **Medium**   | 0          | 2              | All medium issues resolved (atomic reset transaction, dashboard RSC guard)    |
| **Low**      | 3          | 0              | Account deletion without re-auth, sign-in timing disparity, route config sync |

---

## Resolved Findings

### [RESOLVED - HIGH] Account Enumeration on Resend Verification

- **Category:** Email Verification / Information Disclosure
- **Location:** [`src/app/api/auth/resend-verification/route.ts`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/app/api/auth/resend-verification/route.ts#L38-L68)
- **Resolution:** Updated `POST /api/auth/resend-verification` to look up users silently and return a uniform `200 OK` generic response (_"If an unverified account exists with this email address, a verification link has been sent."_). Account existence and verification states are no longer exposed to unauthenticated callers.

### [RESOLVED - MEDIUM] Non-Atomic Password Reset Token Verification and Consumption

- **Category:** Password Reset Flow
- **Location:** [`src/app/api/auth/reset-password/route.ts`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/app/api/auth/reset-password/route.ts#L53-L67), [`src/lib/tokens.ts`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/lib/tokens.ts#L349-L437)
- **Resolution:** Created `consumePasswordResetTokenAndSetPassword` helper in `src/lib/tokens.ts` that encapsulates token verification, password updating, and token deletion inside an atomic `prisma.$transaction`. Race condition windows and duplicate token consumption vulnerabilities are eliminated.

### [RESOLVED - MEDIUM] Unauthenticated Default User Data Exposure Fallback on Dashboard

- **Category:** Session & Authorization
- **Location:** [`src/app/dashboard/page.tsx`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/app/dashboard/page.tsx#L18-L38)
- **Resolution:** Added server-side RSC session validation in `DashboardPage` (`if (!session?.user) redirect('/sign-in?callbackUrl=/dashboard')`). Unauthenticated requests are immediately redirected before any database queries can execute, preventing fallback to demo user data.

---

## Open Findings & Hardening Recommendations

### [HIGH] Complete Absence of Rate Limiting across Authentication & Sensitive Endpoints

- **Category:** Rate Limiting & Brute-Force Defense
- **Severity:** High
- **Location:**
  - [`src/auth.ts:L24-L62`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/auth.ts#L24-L62) (Credentials `authorize`)
  - [`src/app/api/auth/forgot-password/route.ts:L8-L63`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/app/api/auth/forgot-password/route.ts#L8-L63)
  - [`src/app/api/auth/resend-verification/route.ts:L8-L77`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/app/api/auth/resend-verification/route.ts#L8-L77)
  - [`src/app/api/auth/register/route.ts:L9-L133`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/app/api/auth/register/route.ts#L9-L133)
  - [`src/app/api/user/change-password/route.ts:L6-L101`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/app/api/user/change-password/route.ts#L6-L101)
- **Vulnerability Description:**
  None of the sensitive authentication, credential verification, or email-triggering endpoints implement rate limiting or brute-force mitigation (such as IP-based or identifier-based throttles).
  - **Credentials Login:** An attacker can perform automated high-frequency brute-force dictionary attacks against user passwords without triggering delays, lockouts, or CAPTCHAs.
  - **Email Endpoints (`forgot-password`, `resend-verification`):** Unauthenticated attackers can spam email generation, exhausting third-party API quotas (Resend), incurring financial cost, or orchestrating email-bombing attacks against target inboxes.
  - **Registration:** Vulnerable to automated bot account creation spam.
  - **Password Change:** An attacker with authenticated session access can attempt brute-force guessing of `currentPassword` without limits.

- **Specific Fix & Recommendation:**
  Integrate a sliding-window rate limiter (e.g., using `@upstash/ratelimit` with Redis or an in-memory token bucket for Next.js route handlers) to limit requests by IP address and target account identifier:

```typescript
// Example Rate Limiting utility with Upstash / Edge KV or In-Memory Limiter
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const authLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
});

export async function checkRateLimit(req: Request, keyPrefix: string) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const { success } = await authLimiter.limit(`${keyPrefix}:${ip}`);
  return success;
}
```

---

### [HIGH] Missing Session Revocation / Token Invalidation on Password Reset and Password Change

- **Category:** Password Reset & Session Management
- **Severity:** High
- **Location:**
  - [`src/app/api/auth/reset-password/route.ts`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/app/api/auth/reset-password/route.ts)
  - [`src/lib/db/profile.ts:L201-L209`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/lib/db/profile.ts#L201-L209)
  - [`src/auth.ts:L16`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/auth.ts#L16) / [`src/auth.config.ts:L24-L35`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/auth.config.ts#L24-L35)
- **Vulnerability Description:**
  The application utilizes stateless JWT sessions (`session: { strategy: "jwt" }`). When a user resets their password via a recovery link or changes their password via the profile settings, the password hash in the database is modified, but active JWT sessions on other devices or compromised browsers are NOT invalidated.
  Because the JWT contains no version identifier (`tokenVersion`) or `passwordChangedAt` timestamp check, all previously issued session cookies remain valid until their expiration date (default 30 days). A malicious actor with access to a stolen session cookie will retain full account access despite the legitimate user completing a password reset.

- **Specific Fix & Recommendation:**
  1. Add a `tokenVersion: Int @default(0)` or `passwordUpdatedAt: DateTime @default(now())` to the `User` model in [`prisma/schema.prisma`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/prisma/schema.prisma).
  2. Embed `tokenVersion` in the JWT during `jwt` callback.
  3. Increment `tokenVersion` or update `passwordUpdatedAt` whenever a password is changed or reset.
  4. In the `jwt` callback or session validation, verify that the token's version matches the user's current version in the database.

---

### [LOW] Sensitive Account Deletion Endpoint Lacks Re-Authentication / Password Confirmation

- **Category:** Session & Profile Management
- **Severity:** Low
- **Location:**
  - [`src/app/api/user/account/route.ts:L6-L43`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/app/api/user/account/route.ts#L6-L43)
  - [`src/components/profile/delete-account-dialog.tsx:L43-L67`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/components/profile/delete-account-dialog.tsx#L43-L67)
- **Vulnerability Description:**
  The account deletion route (`DELETE /api/user/account`) permanently purges the user account, items, collections, tokens, and OAuth accounts without requiring credentials re-authentication (current password verification).
  While the client-side dialog requires the user to type `"DELETE"`, this validation exists solely in frontend state. An attacker with temporary access to an active browser session or an unauthorized script can trigger permanent account deletion without providing the user's password.

- **Specific Fix & Recommendation:**
  For credentials-based accounts, require `currentPassword` in the `DELETE` request payload and verify it against `bcrypt.compare` before performing the deletion. For OAuth users, require an explicit confirmation timestamp or re-authentication flow.

---

### [LOW] Timing Discrepancy on Credentials Sign-in Allows User Enumeration

- **Category:** Password Security / Timing Attack
- **Severity:** Low
- **Location:**
  - [`src/auth.ts:L37-L48`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/auth.ts#L37-L48)
- **Vulnerability Description:**
  In [`src/auth.ts`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/auth.ts#L37-L48) `authorize()`, if the user does not exist or has no password, the function returns `null` immediately (~1ms). If the user exists, it executes `await bcrypt.compare(password, user.password)` (~80–120ms).
  This measurable execution time difference allows an attacker to distinguish between registered and non-registered email addresses on the sign-in endpoint by observing request round-trip latency.

- **Specific Fix & Recommendation:**
  Perform a dummy `bcrypt.compare` against a pre-computed static hash when the user is not found to equalize response times.

---

### [LOW] Route Protection Configuration Mismatch Between NextAuth Config and Next.js Proxy

- **Category:** Route Protection & NextAuth Configuration
- **Severity:** Low
- **Location:**
  - [`src/auth.config.ts:L36-L47`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/auth.config.ts#L36-L47)
  - [`src/proxy.ts:L7-L29`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/proxy.ts#L7-L29)
- **Vulnerability Description:**
  In [`src/auth.config.ts`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/auth.config.ts#L36-L47), the `authorized` callback only evaluates `nextUrl.pathname.startsWith("/dashboard")` and omits `/profile`.
  While [`src/proxy.ts`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/proxy.ts#L7-L29) actively inspects both `/dashboard` and `/profile`, the underlying `authConfig.callbacks.authorized` configuration is out of sync.

- **Specific Fix & Recommendation:**
  Synchronize `authConfig.callbacks.authorized` in [`src/auth.config.ts`](file:///c:/Rajesh%20Files/Personal%20Project/devstash/src/auth.config.ts#L36-L47) to check `/profile` alongside `/dashboard`.

---

## Passed & Verified Checks

- [x] **Email Enumeration Prevention**: Masked on both `POST /api/auth/forgot-password` and `POST /api/auth/resend-verification`.
- [x] **Atomic Token Consumption**: Password reset token validation, user update, and token deletion are executed atomically inside `prisma.$transaction`.
- [x] **RSC Server-Side Session Guarding**: Both `/dashboard` and `/profile` pages enforce strict session verification with immediate redirects.
- [x] **Strong Password Hashing**: `bcryptjs` with 10 salt rounds used consistently; plaintext passwords and hashes are never exposed.
- [x] **Cryptographically Secure Random Tokens**: 256-bit crypto tokens (`crypto.randomBytes(32)`) with strict expiration.
- [x] **Zero Trust on Client User IDs**: User IDs are always resolved from authenticated sessions (`auth()`).
- [x] **OAuth Account Hijacking Protection**: Automatic unlinked account merging is disabled.
