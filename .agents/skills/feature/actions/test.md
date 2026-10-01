# Test Action

Executes verification test suites, validates type safety and linting, and crafts targeted unit/integration tests for newly added or modified business logic.

---

## Workflow Steps

### 1. Identify Testable Code

1.  Read [context/current-feature.md](../../../../context/current-feature.md) using `view_file` to review feature scope and goals.
2.  Identify newly added or modified logic:
    - Server actions (`src/actions/*.ts`)
    - Database queries and mutations (`src/lib/db/*.ts`)
    - API and shared utilities (`src/lib/*.ts`, `src/lib/utils.ts`)
    - Core helper algorithms, parsers, and validation logic
3.  Check if tests already exist for these modules as `src/**/*.test.ts` or standalone verification scripts in `scripts/`.

---

### 2. Write or Update Unit/Integration Tests

For server actions and utilities lacking test coverage:

- Use Vitest unit tests colocated or formatted as `*.test.ts` (executed via `npm test`).
- Focus strictly on server actions, business logic, error handling, boundary values, and utilities.
- **Do NOT write tests for React UI components.**
- Mock external network/database dependencies (Resend, Redis, Prisma, NextAuth) using `vi.mock()` or `vi.fn()`.

---

### 3. Run Test Commands

Execute relevant verification commands using `run_command`:

```powershell
# Run database / feature verification scripts if applicable
npm run test:db
npm run test:items
npm run test:collections
npm run test:sidebar

# Run project unit test suite (if configured)
npm test
```

---

### 4. Verify Linting & Production Build

Confirm that there are zero TypeScript errors, lint warnings, or build breakages:

```powershell
# Run ESLint
npm run lint

# Verify Next.js production build
npm run build
```

---

### 5. Report Results

Provide a structured test report:

- **Automated Tests**: Pass / Fail status with execution counts.
- **Lint & Type Check**: Verification status.
- **Build Verification**: Production compilation status.
- **Coverage Highlights**: Summary of newly tested flows.

> [!CAUTION]
> If any test or build error occurs, resolve the root cause before proceeding to `/feature review` or `/feature complete`.
