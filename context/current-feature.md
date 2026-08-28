# Current Feature

Database Seeding (Sample Data & Demo User)

## Status

<!-- Not Started|In Progress|Completed -->

Completed

## Goals

<!-- Goals & requirements -->

- Overwrite and expand the existing seed script (`prisma/seed.ts`) to populate the database with realistic sample and demo data per `context/features/seed-spec.md`.
- **Demo User Creation**:
  - Email: `demo@devstash.io`
  - Name: `Demo User`
  - Password: `12345678` (hashed with `bcryptjs`, 12 rounds)
  - `isPro`: `false`
  - `emailVerified`: current timestamp
- **System Item Types**:
  - Seed/upsert the 7 immutable system item types (`snippet`, `prompt`, `command`, `note`, `file`, `image`, `link`) with their respective Lucide icon names and hex colors (`isSystem: true`).
- **Collections & Items**:
  - **React Patterns** (Description: _Reusable React patterns and hooks_)
    - 3 TypeScript snippets: Custom hooks (e.g. `useDebounce`, `useLocalStorage`), Component patterns (e.g. Context providers, compound components), and Utility functions.
  - **AI Workflows** (Description: _AI prompts and workflow automations_)
    - 3 prompts: Code review prompt, Documentation generation prompt, and Refactoring assistance prompt.
  - **DevOps** (Description: _Infrastructure and deployment resources_)
    - 1 snippet (Docker, CI/CD configuration)
    - 1 command (Deployment scripts)
    - 2 links (Real documentation URLs)
  - **Terminal Commands** (Description: _Useful shell commands for everyday development_)
    - 4 commands: Git operations, Docker commands, Process management, and Package manager utilities.
  - **Design Resources** (Description: _UI/UX resources and references_)
    - 4 links (Real URLs): CSS/Tailwind references, Component libraries, Design systems, and Icon libraries.
- **Tags & Relations**:
  - Create and associate relevant tags for all items (e.g. `react`, `typescript`, `hooks`, `ai`, `prompts`, `docker`, `ci-cd`, `git`, `terminal`, `tailwind`, `ui-ux`, etc.).
  - Ensure items are properly linked to the demo user and their corresponding collections via `ItemCollection`.
  - Ensure script is idempotent or cleanly resets sample data for the demo user when rerun.

## Notes

<!-- Any extra notes -->

- Install `bcryptjs` and `@types/bcryptjs` for password hashing in the seed script.
- Ensure all seed items have complete, high-quality, practical content with proper `ContentType` enum values (`TEXT`, `FILE`, `URL`).
- Ensure Lucide icon names match those defined in `ITEM_TYPE_ICONS` / spec (`Code`, `Sparkles`, `Terminal`, `StickyNote`, `File`, `Image`, `Link`).
- Overwrite existing content in `prisma/seed.ts`.

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
