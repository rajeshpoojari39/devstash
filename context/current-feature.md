# Current Feature: Item Drawer — Edit Mode

## Status

In Progress

## Goals

- [x] Add inline edit mode toggle to `ItemDrawer` via the action bar Edit button (pencil icon).
- [x] Implement edit mode action bar with `Save` and `Cancel` buttons (replacing standard action bar during editing).
- [x] Render controlled editable form fields based on item type:
  - All types: `title` (required text input), `description` (optional textarea), `tags` (comma-separated text input converting to string array).
  - Type-specific: `content` (textarea for `snippet`, `prompt`, `command`, `note`), `language` (text input for `snippet`, `command`), `url` (text input for `link`).
- [x] Keep item type, collections, and created/updated dates read-only in edit mode.
- [x] Create Zod update schema and server action `updateItem(itemId, data)` in `src/actions/items.ts` following `{ success, data, error }` pattern, session verification, and ownership check.
- [x] Implement database query function `updateItem` in `src/lib/db/items.ts` with tag disconnect and connect-or-create logic, returning updated `ItemDetail`.
- [x] Update `ItemDrawer` state upon save, refresh drawer data without second fetch, trigger toast notification on success/error, and call `router.refresh()` to sync background cards.
- [x] Add unit tests for `src/actions/items.ts` using Vitest and verify database integration.

## Notes

- **Spec File**: [context/features/item-drawer-edit-spec.md](file:///c:/Rajesh%20Files/Personal%20Project/devstash/context/features/item-drawer-edit-spec.md)
- **Form Handling**: Use controlled inputs with local state inside the drawer (no external form library needed).
- **Client Validation**: Disable Save button when `title` is empty or only whitespace.
- **Server Validation**: Validate input payload in the server action with Zod as the single source of truth.
- **Tag Management**: Disconnect all existing item tags and connect-or-create new tags on update.
- **Coding Standards**: Unit test server action `src/actions/items.ts` and utilities with Vitest (`npm test`). Do NOT write UI component tests.

## History

<!-- Keep this updated. Earliest to latest -->

- **Initial Project Setup & AI Context (2026-08-18)**
  - Initialized Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4.
  - Cleaned up starter template boilerplate and default SVGs.
  - Created project context documentation (`project-overview.md`, `coding-standards.md`, `ai-interaction.md`, `current-feature.md`) and `GEMINI.md`.
  - Verified build and lint configurations.

- **Dashboard UI Phase 1 (2026-08-18)**
  - Initialized and configured ShadCN UI with Tailwind CSS v4 and `@base-ui/react`.
  - Installed base UI components (`button`, `input`, `badge`, `avatar`, `card`, `dropdown-menu`, `sheet`, `separator`, `tooltip`, `scroll-area`).
  - Configured dark mode by default, Inter font family, and global styling tokens.
  - Created DevStash brand logo component (`src/components/brand/logo.tsx`).
  - Built TopBar component with sidebar toggle button, full-height vertical separator line, search input with `⌘ K` keyboard shortcut badge, and action buttons (`src/components/dashboard/top-bar.tsx`).
  - Created `/dashboard` route with dashboard layout (`src/app/dashboard/layout.tsx`) and placeholders for sidebar (`<h2>Sidebar</h2>`) and main area (`<h2>Main</h2>`).

- **Dashboard UI Phase 2 (2026-08-23)**
  - Created `SidebarProvider` and `useSidebar` context to manage desktop collapse and mobile drawer state (`src/components/dashboard/sidebar-context.tsx`).
  - Built `SidebarContent` component with DevStash logo, collapsible Types section with mock data item types, colors, counts, and active links (`/items/[type]`), collapsible Collections section with starred favorites and all collections with item counts (`/collections/[id]`), and pinned user profile footer with avatar and settings (`src/components/dashboard/sidebar-content.tsx`).
  - Built collapsible desktop `Sidebar` transitioning between `w-64` (full) and `w-16` (icon-only) with tooltips and high-contrast vertical separation line (`src/components/dashboard/sidebar.tsx`).
  - Built responsive mobile drawer `MobileSidebar` using ShadCN `Sheet` (`src/components/dashboard/mobile-sidebar.tsx`).
  - Updated `TopBar` with permanent full logo name, sidebar collapse toggle button, responsive search input with `⌘K` badge, and action buttons (`src/components/dashboard/top-bar.tsx`).
  - Integrated complete sidebar navigation into `src/app/dashboard/layout.tsx` and tuned border tokens in `src/app/globals.css`.

- **Dashboard UI Phase 3 (2026-08-26)**
  - Built 4 metric summary stats cards for Total Items, Total Collections, Favorite Items, and Favorite Collections (`src/components/dashboard/stats-cards.tsx`).
  - Built Collections section with 3-column responsive grid, custom colored card borders, favorite stars, descriptions, type category icons, and 3-dots action menus (`src/components/dashboard/collection-card.tsx`, `src/components/dashboard/collections-section.tsx`).
  - Built Item Card component with category type badges, titles, pin/favorite indicators, tags, formatted timestamps, clipboard copy actions, and action dropdowns (`src/components/dashboard/item-card.tsx`).
  - Built Pinned Items section for pinned items (`src/components/dashboard/pinned-items-section.tsx`).
  - Built Recent Items section displaying 10 latest items (`src/components/dashboard/recent-items-section.tsx`).
  - Assembled main dashboard page (`src/app/dashboard/page.tsx`) and isolated content scrolling to the main section while keeping sidebar and top bar fixed (`src/app/dashboard/layout.tsx`, `src/components/dashboard/sidebar.tsx`).

- **Database Setup: Prisma 7 & Neon PostgreSQL (2026-08-28)**
  - Configured Prisma 7 with Neon PostgreSQL and `@prisma/adapter-pg`.
  - Created centralized configuration (`prisma.config.ts`) with datasource, migrations path, and seed command.
  - Implemented initial Prisma schema (`prisma/schema.prisma`) with `User`, `Account`, `Session`, `VerificationToken`, `Item`, `ItemType`, `Collection`, `ItemCollection`, `Tag` models and `ContentType` enum.
  - Set up singleton Prisma Client (`src/lib/prisma.ts`) importing from generated client `@/generated/prisma/client` with `/src/generated/` added to `.gitignore`.
  - Created and executed initial database migration (`20260828060736_init`).
  - Created seed script (`prisma/seed.ts`) populating default 7 system item types (`snippet`, `prompt`, `command`, `note`, `file`, `image`, `link`).
  - Added database verification test script (`scripts/test-db.ts`) and helper commands (`db:generate`, `db:studio`, `test:db`) in `package.json`.

- **Database Seeding: Sample Data & Demo User (2026-08-28)**
  - Installed `bcryptjs` and `@types/bcryptjs` for secure password hashing.
  - Implemented comprehensive, idempotent database seeding in `prisma/seed.ts`.
  - Populated Demo User (`demo@devstash.io`, password `12345678`, `isPro: false`, verified).
  - Seeded 7 system item types (`snippet`, `prompt`, `command`, `note`, `file`, `image`, `link`).
  - Seeded 5 collections (`React Patterns`, `AI Workflows`, `DevOps`, `Terminal Commands`, `Design Resources`) with 18 sample items, custom tags, and relations.
  - Verified seeding idempotency, database test suite (`npm run test:db`), ESLint, and Next.js production build (`npm run build`).

- **Dashboard Collections: Database Integration (2026-08-29)**
  - Created `src/lib/db/collections.ts` with data fetching functions (`getDashboardCollections`, `getDashboardStats`, `getDefaultUserId`).
  - Implemented dynamic calculation of dominant item type per collection to compute accent border color (`blue`, `purple`, `orange`, `yellow`, `emerald`, `pink`, `neutral`).
  - Extracted distinct item type icons present in collections for bottom preview icons.
  - Converted `/dashboard` page into an async React Server Component fetching collections and stats concurrently with `Promise.all`.
  - Updated `CollectionsSection` and `CollectionCard` to render live collections with empty state support.
  - Updated `StatsCards` to display live database metrics for Total Items, Total Collections, Favorite Items, and Favorite Collections.
  - Added `test:collections` script in `package.json` and verification test in `scripts/test-collections.ts`.
  - Verified with database test suite, ESLint (`npm run lint`), and Next.js production build (`npm run build`).

- **Dashboard Items: Database Integration (2026-08-29)**
  - Created `src/lib/db/items.ts` with typed database query functions (`getDashboardPinnedItems`, `getDashboardRecentItems`).
  - Derived item card icon, colors, and badge metadata directly from item type relations.
  - Converted `PinnedItemsSection` and `RecentItemsSection` to receive live database items as props, removing mock data dependencies.
  - Configured conditional rendering for `PinnedItemsSection` so it hides when there are zero pinned items.
  - Integrated parallel data fetching in `src/app/dashboard/page.tsx` React Server Component.
  - Created standalone test script `scripts/test-items.ts` and added `test:items` to `package.json`.
  - Verified with database test suite (`npm run test:items`, `npm run test:collections`), ESLint (`npm run lint`), and Next.js production build (`npm run build`).

- **Stats & Sidebar: Database Integration (2026-09-01)**
  - Added typed query functions `getSidebarItemTypes`, `getSidebarCollections`, `getSidebarUser`, and `getSidebarData` in `src/lib/db/items.ts`.
  - Implemented dynamic item counts per system item type using `prisma.item.groupBy`.
  - Implemented calculation of dominant item type color indicator for recent collections in sidebar.
  - Converted `src/app/dashboard/layout.tsx` to an async Server Component fetching live sidebar data in parallel.
  - Updated `SidebarContent`, `Sidebar`, and `MobileSidebar` to render live item types, counts, collections, indicators, and user profile, eliminating all mock data dependencies.
  - Added "View all collections" link under the collections list linking to `/collections`.
  - Added `test:sidebar` script in `package.json` and verification test in `scripts/test-sidebar.ts`.
  - Verified with test suite (`npm run test:sidebar`, `npm run test:collections`, `npm run test:items`), ESLint (`npm run lint`), and Next.js production build (`npm run build`).

- **Add Pro Badge to Sidebar (2026-09-04)**
  - Added clean, subtle uppercase "PRO" badge to `files` and `images` item types in the sidebar navigation.
  - Used ShadCN UI `Badge` component (`variant="secondary"` with fine-tuned sizing and borders).
  - Integrated badge display across desktop expanded sidebar, mobile drawer, and desktop collapsed icon-only tooltips.
  - Verified with sidebar DB tests (`npm run test:sidebar`), ESLint (`npm run lint`), and Next.js production build (`npm run build`).

- **Performance Quick Wins, DB Indexes & Error Boundaries (2026-09-04)**
  - Wrapped `getDefaultUserId()` with `React.cache()` in `src/lib/db/collections.ts` to eliminate duplicate per-request user queries.
  - Bounded collection items relation queries (`take: 20`) in `src/lib/db/items.ts` and `src/lib/db/collections.ts` using Prisma nested query conventions.
  - Memoized `SidebarProvider` context value in `src/components/dashboard/sidebar-context.tsx` with `React.useMemo`.
  - Upgraded clipboard copy handler in `src/components/dashboard/item-card.tsx` with async `try/catch` error handling.
  - Removed duplicate `<TooltipProvider>` from `src/components/dashboard/sidebar-content.tsx` while retaining `src/lib/mock-data.ts`.
  - Added accessibility attributes (`aria-label="Search items"` in `top-bar.tsx` and `aria-expanded` on sidebar accordion headers).
  - Added composite & foreign key indexes to Prisma schema for `isPinned`, `isFavorite`, `updatedAt`, and join table lookups; generated and applied migration `20260904080106_add_performance_indexes`.
  - Created reusable `Skeleton` UI component (`src/components/ui/skeleton.tsx`), Suspense streaming fallback (`src/app/dashboard/loading.tsx`), route error boundary (`src/app/dashboard/error.tsx`), and global error boundary (`src/app/error.tsx`).
  - Added integer and bounds validation (`safeLimit`) for items and collections database queries.
  - Verified with database test suite (`npm run test:sidebar`, `npm run test:collections`, `npm run test:items`), ESLint (`npm run lint`), and Next.js production build (`npm run build`).

- **Auth Setup: NextAuth v5 + GitHub Provider (Phase 1) (2026-09-14)**
  - Installed NextAuth v5 (`next-auth@beta`) and `@auth/prisma-adapter`.
  - Implemented Edge-compatible split configuration pattern (`src/auth.config.ts` and `src/auth.ts`).
  - Configured GitHub OAuth provider with `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`.
  - Exported auth route handlers in `src/app/api/auth/[...nextauth]/route.ts`.
  - Implemented route protection using Next.js 16 Proxy in `src/proxy.ts` guarding `/dashboard/*` with redirect to `/api/auth/signin`.
  - Extended NextAuth `Session` and `JWT` types with `user.id` (`src/types/next-auth.d.ts`).
  - Added test script `scripts/test-auth.ts` (`npm run test:auth`).
  - Verified with auth test suite, ESLint (`npm run lint`), and Next.js production build (`npm run build`).

- **Auth Credentials & User Registration (Phase 2) (2026-09-14)**
  - Added NextAuth v5 Credentials provider with Edge placeholder in `src/auth.config.ts`.
  - Implemented database user lookup and `bcryptjs` password validation in `src/auth.ts`.
  - Created user registration API route at `src/app/api/auth/register/route.ts` with payload validation, duplicate email prevention, password hashing, and user creation.
  - Added test suite `scripts/test-auth-credentials.ts` and updated `npm run test:auth`.
  - Verified with database test suite (`npm run test:auth`, `npm run test:db`, `npm run test:collections`, `npm run test:items`, `npm run test:sidebar`), ESLint (`npm run lint`), and Next.js production build (`npm run build`).

- **Auth UI - Sign In, Register & Sign Out (Phase 3) (2026-09-15)**
  - Created reusable `UserAvatar` component with automatic initials generation (`src/components/ui/user-avatar.tsx`).
  - Built custom dark-themed Sign In page (`src/app/sign-in/page.tsx`, `src/components/auth/sign-in-form.tsx`) with GitHub OAuth and credentials login.
  - Built custom Register page (`src/app/register/page.tsx`, `src/components/auth/register-form.tsx`) with form validation and redirect on success.
  - Built authenticated User Profile page (`src/app/profile/page.tsx`, `src/components/profile/profile-card.tsx`).
  - Updated sidebar user profile footer with `UserAvatar` and upward/right `DropdownMenu` with Profile link and direct session sign-out action (`src/components/dashboard/sidebar-content.tsx`).
  - Configured NextAuth custom pages (`pages.signIn: "/sign-in"`) in `src/auth.config.ts` and route protection in `src/proxy.ts`.
  - Added automated test suite `scripts/test-auth-ui.ts` and updated `npm run test:auth`.
  - Verified with test suites (`npm run test:auth`, `npm run test:sidebar`, `npm run test:collections`, `npm run test:items`), ESLint (`npm run lint`), and Next.js production build (`npm run build`).

- **Email Verification on Register (via Resend) (2026-09-24)**
  - Integrated Resend email API SDK and initialized singleton client in `src/lib/email/resend.ts`.
  - Created branded, responsive HTML & plaintext email templates in `src/lib/email/templates/verification-email.ts` and dispatch utility in `src/lib/email/index.ts`.
  - Implemented secure token generation (`generateVerificationToken`), token verification (`verifyEmailToken`), and database management in `src/lib/tokens.ts` using PostgreSQL `VerificationToken` table.
  - Updated registration endpoint (`POST /api/auth/register`) to create unverified accounts, generate tokens, and send verification emails.
  - Created resend verification endpoint (`POST /api/auth/resend-verification`) and verification API (`GET`/`POST` `/api/auth/verify-email`).
  - Created dedicated email verification page (`src/app/verify-email/page.tsx`, `src/components/auth/verify-email-card.tsx`) with auto-verification and error handling.
  - Added NextAuth Credentials auth guard throwing `EmailNotVerifiedError` in `src/auth.ts` to block unverified sign-in.
  - Updated `RegisterForm` with "Check your inbox" screen and `SignInForm` with verification success alert and unverified notice with resend button.
  - Added test suite `scripts/test-email-verification.ts` (`npm run test:email`) and database user cleanup utility `scripts/cleanup-non-demo-users.ts` (`npm run db:clean-users`).
  - Verified with full test suite (`npm run test:auth`), database explorer (`npm run test:db`), ESLint (`npm run lint`), and Next.js production build (`npm run build`).

- **Email Verification Toggle Feature Flag (2026-09-25)**
  - Added centralized `isEmailVerificationEnabled()` configuration helper in `src/lib/email/index.ts` checking `ENABLE_EMAIL_VERIFICATION` / `NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION` (defaulting to disabled `false`).
  - Updated registration endpoint (`POST /api/auth/register`) to automatically mark users verified (`emailVerified: new Date()`) and skip tokens/Resend emails when verification is disabled.
  - Updated NextAuth Credentials `authorize` guard in `src/auth.ts` to only require verification when `isEmailVerificationEnabled()` is true.
  - Updated `RegisterForm` to redirect directly to sign-in on unverified flow and `SignInForm` with clean account creation confirmation.
  - Guarded `POST /api/auth/resend-verification` endpoint when verification is disabled.
  - Documented `ENABLE_EMAIL_VERIFICATION` in `.env.example` with Resend domain guidance.
  - Updated `scripts/test-email-verification.ts` to verify both disabled and enabled states.
  - Verified with full authentication test suite (`npm run test:auth`), ESLint (`npm run lint`), and Turbopack production build (`npm run build`).

- **Forgot Password & Reset Functionality (2026-09-26)**
  - Implemented password reset token management (`generatePasswordResetToken`, `verifyPasswordResetToken`, `deletePasswordResetToken`) in `src/lib/tokens.ts` reusing existing `VerificationToken` model with scoped `reset:<email>` identifiers and 1-hour expiration.
  - Created branded, dark-themed HTML & plaintext password reset email templates in `src/lib/email/templates/reset-password-email.ts` and dispatch helper `sendPasswordResetEmail` in `src/lib/email/index.ts`.
  - Built backend API endpoints: `POST /api/auth/forgot-password` (with user enumeration protection) and `POST /api/auth/reset-password` (with `bcryptjs` password hashing and token consumption).
  - Built frontend pages & UI components: `ForgotPasswordForm` (`src/components/auth/forgot-password-form.tsx`, `src/app/forgot-password/page.tsx`), `ResetPasswordForm` (`src/components/auth/reset-password-form.tsx`, `src/app/reset-password/page.tsx`), and added "Forgot password?" link and reset success banner to `SignInForm` (`src/components/auth/sign-in-form.tsx`).
  - Updated route proxy middleware in `src/proxy.ts` to redirect authenticated users accessing forgot/reset password pages to `/dashboard`.
  - Added comprehensive automated test suite `scripts/test-forgot-password.ts` and registered `test:forgot-password` in `package.json` integrated with `npm run test:auth`.
  - Verified with full authentication test suite (`npm run test:auth`), ESLint (`npm run lint`), and Next.js Turbopack production build (`npm run build`).

- **Profile Page & Account Management (2026-09-26)**
  - Integrated persistent dashboard navigation shell (`TopBar`, collapsible `Sidebar`, and `MobileSidebar`) into `/profile` route (`src/app/profile/layout.tsx`).
  - Built responsive 2-column full-width profile view displaying user details, avatar, join date, tier, and auth provider (`src/app/profile/page.tsx`, `src/components/profile/profile-card.tsx`).
  - Implemented usage statistics overview and 7-type breakdown grid (`snippet`, `prompt`, `command`, `note`, `file`, `image`, `link`) with icons, counts, PRO badges, and direct filtering links (`src/components/profile/profile-stats.tsx`, `src/lib/db/profile.ts`).
  - Implemented Change Password functionality for credentials users with validation and backend API endpoint (`src/components/profile/change-password-dialog.tsx`, `src/app/api/user/change-password/route.ts`).
  - Implemented Delete Account workflow with safety confirmation ("DELETE"), demo user protection, and cascading database cleanup (`src/components/profile/delete-account-dialog.tsx`, `src/app/api/user/account/route.ts`).
  - Created reusable Base UI dialog component (`src/components/ui/dialog.tsx`).
  - Added automated test suite `scripts/test-profile.ts` (`npm run test:profile`).
  - Verified with test suite, ESLint (`npm run lint`), and Next.js Turbopack production build (`npm run build`).

- **Auth Security Review & Hardening (2026-09-27)**
  - Performed comprehensive security review of authentication and authorization flows using `.agents/agents/auth-auditor` and generated `docs/audit-results/AUTH_SECURITY_REVIEW.md`.
  - Fixed email enumeration on resend verification endpoint (`src/app/api/auth/resend-verification/route.ts`) by returning uniform generic 200 responses.
  - Implemented atomic password reset transaction helper `consumePasswordResetTokenAndSetPassword` in `src/lib/tokens.ts` and updated `src/app/api/auth/reset-password/route.ts` with `prisma.$transaction`.
  - Added server-side RSC authentication redirect guard in `src/app/dashboard/page.tsx` to prevent unauthenticated fallback queries.
  - Synchronized NextAuth v5 environment variables in `.env.example` (`AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`) and updated `context/project-overview.md`.
  - Verified with full test suite (`npm run test:auth`), ESLint (`npm run lint`), and Next.js Turbopack build.

- **Rate Limiting for Auth (2026-09-27)**
  - Installed `@upstash/ratelimit` and `@upstash/redis` for serverless-compatible rate limiting.
  - Implemented reusable rate limiting utility in `src/lib/rate-limit.ts` using sliding window algorithm, robust client IP extraction, compound identifier keys (`IP:email`), and resilient fail-open error handling.
  - Protected critical authentication endpoints with dedicated limits: Credentials login (5 attempts / 15 min by IP + email via `RateLimitError` in `src/auth.ts`), Registration (3 attempts / 1 hour by IP), Forgot Password (3 attempts / 1 hour by IP), Reset Password (5 attempts / 15 min by IP), and Resend Verification (3 attempts / 15 min by IP + email).
  - Standardized 429 Too Many Requests responses with `Retry-After`, `X-RateLimit-*` headers, and human-readable remaining wait times.
  - Enhanced frontend `SignInForm` to display user-friendly rate limit notices and retry guidance.
  - Documented `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.example`.
  - Added automated test suite `scripts/test-rate-limit.ts` and registered `test:rate-limit` integrated with `npm run test:auth`.
  - Verified with full test suite (`npm run test:auth`, `npm run test:profile`), ESLint (`npm run lint`), and Next.js Turbopack production build (`npm run build`).

- **Dashboard Item Card Left Border Color (2026-09-29)**
  - Added 2px left accent border (`border-l-2`) to dashboard `ItemCard` component (`src/components/dashboard/item-card.tsx`).
  - Styled `borderLeftColor` dynamically using the item type color (`itemType.color`), ensuring snippets, prompts, commands, notes, links, files, and images display category-coded left borders.
  - Verified with test suite (`npm run test:items`) and Next.js Turbopack build (`npm run build`).

- **Items List View (2026-09-29)**
  - Created dynamic route at `/items/[type]` (`src/app/items/[type]/page.tsx`) with dynamic metadata and Next.js 16 async route `params` resolution.
  - Implemented typed database queries `getItemTypeBySlug` and `getItemsByType` in `src/lib/db/items.ts` supporting both singular and plural item type slugs (e.g., `/items/snippets` & `/items/snippet`).
  - Created client-safe utility module `src/lib/item-utils.ts` for title formatting, description generation, PRO badge checks, and icon mapping.
  - Built responsive 2-column item grid (`grid grid-cols-1 md:grid-cols-2 gap-4`) rendering `ItemCard` components with category-colored left accent borders.
  - Built `ItemsListHeader` with breadcrumbs, icon, item count badge, PRO badge, and description, and `ItemsEmptyState` for categories with 0 items.
  - Built `ItemsLayout` (`src/app/items/layout.tsx`), Suspense skeleton (`src/app/items/[type]/loading.tsx`), and error boundary (`src/app/items/[type]/not-found.tsx`).
  - Updated `src/proxy.ts` to protect `/items` routes and updated `SidebarContent` active link highlighting for singular and plural slugs.
  - Added automated test suite `scripts/test-items-by-type.ts` and registered `test:items-by-type` in `package.json`.
  - Verified with test suite (`npm run test:items-by-type`, `npm run test:items`, `npm run test:sidebar`, `npm run test:profile`), ESLint (`npm run lint`), and Next.js Turbopack production build (`npm run build`).

- **Setup Vitest for Unit Testing (2026-10-01)**
  - Installed and configured Vitest (`vitest`, `vite-tsconfig-paths`, `@vitest/coverage-v8`) in `vitest.config.mts`.
  - Configured `node` test environment specifically scoped to server actions (`src/actions/**/*.ts`) and utility functions (`src/lib/**/*.ts`), excluding React UI components.
  - Configured TypeScript path aliases (`@/*` -> `./src/*`) and v8 coverage analysis.
  - Added `npm test` (`vitest run`), `npm run test:watch` (`vitest`), and `npm run test:coverage` (`vitest run --coverage`) to `package.json`.
  - Created initial unit test suites: `src/lib/utils.test.ts` (Tailwind class merger), `src/lib/item-utils.test.ts` (slug normalization, titles, descriptions, PRO badges, icon mappings), `src/lib/email/index.test.ts` (email flags, base URL derivation, templates), and `src/lib/rate-limit.test.ts` (IP extraction, composite key identifiers, fail-open behavior, 429 response builders).
  - Updated project documentation: `context/ai-interaction.md` (testing step 4 & guidelines), `context/coding-standards.md` (unit testing standards), and `GEMINI.md` (test commands & agent verification rules).
  - Verified full test suite (`npm test`), ESLint (`npm run lint`), and Next.js Turbopack production build (`npm run build`).

- **Responsive 3-Column Item Listing & Vertical Card Layout (2026-10-01)**
  - Converted item listing view (`/items/[type]`) and skeleton loader (`src/app/items/[type]/loading.tsx`) to a responsive 3-column grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`).
  - Refactored `ItemCard` (`src/components/dashboard/item-card.tsx`) to use a consistent vertical card layout across all screen sizes, providing full width for title, description, and tags, with bottom-right quick actions.
  - Verified with unit test suite (`npm test`), database test scripts (`npm run test:items-by-type`, `npm run test:items`), ESLint (`npm run lint`), and Next.js Turbopack build (`npm run build`).

- **Item Drawer (2026-10-03)**
  - Built right-side slide-in detail drawer using shadcn/ui `Sheet` (`src/components/items/item-drawer.tsx`) acting as the primary item detail view across the dashboard and items listing pages.
  - Built interactive action bar with Favorite (star icon with active gold fill), Pin (rotated accent state), Copy (with clipboard feedback), Edit, and right-aligned Delete.
  - Implemented responsive viewport scaling: compact icon buttons on mobile (≤640px), 480px–500px on tablet (640px–1024px), and 40%–45% width on desktop.
  - Created client wrapper `ItemDrawerProvider` and `useItemDrawer()` hook (`src/components/items/item-drawer-context.tsx`) managing drawer open state across React Server Component layouts.
  - Updated `ItemCard` (`src/components/dashboard/item-card.tsx`) to open the drawer on card/title click or dropdown "View" click without page navigation.
  - Implemented typed query function `getItemById` in `src/lib/db/items.ts` with joins for item types, tags, and collections.
  - Created authenticated API route handler `GET /api/items/[id]` (`src/app/api/items/[id]/route.ts`) with NextAuth session validation.
  - Added `formatLongDate` utility and unit tests (`src/lib/item-utils.test.ts`), plus database test script (`scripts/test-item-detail.ts`).
  - Verified with full test suite (`npm test`), database test scripts (`npm run test:item-detail`, `npm run test:items`, `npm run test:items-by-type`), ESLint (`npm run lint`), and Next.js Turbopack production build (`npm run build`).


