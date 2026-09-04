# Test Action

Executes verification test suites, validates type safety and linting, and crafts targeted unit/integration tests for newly added or modified business logic.

---

## Workflow Steps

### 1. Identify Testable Code

1.  Read [context/current-feature.md](../../../../context/current-feature.md) using `view_file` to review feature scope and goals.
2.  Identify newly added or modified logic:
    - Database queries and mutations (`src/lib/db/*.ts`)
    - Server actions and API utilities (`src/lib/actions/*.ts`, `src/lib/utils.ts`)
    - Core helper algorithms and validation logic
3.  Check if tests or test scripts already exist for these modules in `scripts/` or `__tests__/`.

---

### 2. Write or Update Unit/Integration Tests

For business logic lacking test coverage:

- Use Vitest or standalone TypeScript test runners (e.g., in `scripts/test-<feature>.ts`).
- Focus on data integrity, boundary values, error handling, and server actions.
- Avoid testing purely static React presentational markup.
- Write realistic test assertions without mocking unnecessarily.

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
