# Feature Specification: Vitest Unit Testing Setup

## Overview

Set up **Vitest** as the dedicated unit testing framework for **DevStash**, focused exclusively on testing server actions and utilities while deliberately omitting React component tests.

---

## Scope & Boundaries

- **In Scope**:
  - Unit testing server actions (`src/actions/**/*.ts`)
  - Unit testing utility functions, helpers, parsers, and services (`src/lib/**/*.ts`)
  - Fast execution via Vitest `node` environment
  - Path alias resolution (`@/*` -> `./src/*`)
  - Code coverage reporting via `@vitest/coverage-v8`
  - NPM scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`
- **Explicitly Out of Scope**:
  - React component testing (no `@testing-library/react`, no `jsdom`, no `happy-dom`)
  - UI snapshot testing

---

## Configuration Details

- **Config File**: `vitest.config.mts`
- **Environment**: `node`
- **Includes**: `src/**/*.{test,spec}.ts`
- **Excludes**: `node_modules`, `.next`, `dist`, `src/components/**`
- **Coverage Provider**: `v8` (scoped to `src/lib/**` and `src/actions/**`)

---

## Test Suites Included

1. `src/lib/utils.test.ts` — Tests for `cn()` class name merger and Tailwind conflicts.
2. `src/lib/item-utils.test.ts` — Tests for slug normalization, item titles, descriptions, PRO badges, and icon mappings.
3. `src/lib/email/index.test.ts` — Tests for email toggle flags, base URL derivation, and email HTML/text templates.
4. `src/lib/rate-limit.test.ts` — Tests for client IP extraction (`x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`), composite identifier construction, fail-open behavior, and 429 response formatting.

---

## Workflow Integration

- Updated `context/ai-interaction.md` workflow step 4 to require `npm test` before committing.
- Updated `context/coding-standards.md` with explicit unit testing rules and mocking practices.
- Updated `GEMINI.md` commands table and agent workflow requirements.
