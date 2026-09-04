---
name: cleanup
description: >-
  Clean up and maintain codebase health by auditing unused imports, leftover console logs,
  stale TODOs, orphaned files, TypeScript suppressions, context sync, and environment parity.
  Use when the user asks to clean up the project, run a housekeeping check, or fix stale artifacts.
argument-hint: check|run|fix
---

# Codebase Cleanup & Housekeeping

Audit and clean up project artifacts, code hygiene issues, and configuration drift across **DevStash**.

---

## Audit Checklist

Perform the following 8 checks across the workspace:

1. **Feature History Chronology**:
   - Inspect [context/current-feature.md](../../../context/current-feature.md).
   - Ensure entries under `## History` are arranged in chronological order from oldest to newest.

2. **Unnecessary Console Logs**:
   - Search `src/` for leftover debugging statements (`console.log`, `console.debug`, `console.dir`).
   - Exclude intentional production logging or error reporting (`console.error`, `console.warn` in catch blocks).

3. **Unused Imports & Dead Code**:
   - Inspect `src/` for unused imports, unreachable code, and unused local variables.

4. **Stale TODO & FIXME Comments**:
   - Search for `TODO:`, `FIXME:`, `HACK:`, and `XXX:` comments across the codebase.
   - Identify items that are already resolved, obsolete, or need immediate action.

5. **Orphaned / Unused Files**:
   - Identify component, utility, or asset files that are no longer imported or referenced anywhere in the project.

6. **Context Synchronization**:
   - Compare context documentation in `context/` ([project-overview.md](../../../context/project-overview.md), [coding-standards.md](../../../context/coding-standards.md), [ai-interaction.md](../../../context/ai-interaction.md), [current-feature.md](../../../context/current-feature.md)) against the actual codebase state (Next.js 16, React 19, Tailwind v4, route structure, active features).

7. **Environment Variable Parity**:
   - Compare `.env` (or `.env.example` / `.env.local`) variable keys against `.env.production`.
   - Verify that all necessary variable names are defined in both files (values may differ).

8. **TypeScript Suppressions**:
   - Search for `@ts-ignore` and `@ts-expect-error` comments across `src/`.
   - Verify if any suppressions are stale or can now be replaced with proper TypeScript types.

---

## Execution Modes

Parse the action mode from `$ARGUMENTS`:

### Mode A: `check` (Default / Inspection Only)

> Activated when `$ARGUMENTS` is empty, `"check"`, or `"audit"`.

1. Run all 8 audit checks using search and read tools (`grep_search`, `find_by_name`, `view_file`).
2. **Do not modify any files.**
3. Present findings in a structured report:
   - Group findings by check category.
   - Provide clickable file links with line numbers (e.g. `[ItemCard.tsx:L12](file:///path/to/ItemCard.tsx#L12)`).
   - Include a concise summary count of total issues detected.
4. Prompt the user:
   > "To apply fixes, run `/cleanup run` or specify which items to resolve."

---

### Mode B: `run` / `fix` (Interactive Remediation)

> Activated when `$ARGUMENTS` is `"run"`, `"fix"`, or `"apply"`.

1. Run all 8 audit checks and display numbered findings:
   - Format each issue with an index: `[1]`, `[2]`, `[3]`, etc.
2. Ask the user for confirmation before editing:
   > "Which items would you like me to fix? (Enter numbers like `1, 3, 5`, `'all'`, or `'none'`)"
3. Wait for the user's explicit selection.
4. Apply fixes **only** to the selected items:
   - Adhere to [context/coding-standards.md](../../../context/coding-standards.md) (strict TypeScript, Tailwind CSS v4 `@theme`, Server Components first).
   - Preserve existing unrelated comments and docstrings.
5. **Verification**:
   - Run `npm run lint` or `npm run build` after modifications to ensure no regressions.
6. Provide a final summary table of all applied changes and verification results.

---

> [!NOTE]
> All changes must adhere strictly to the guidelines defined in [context/ai-interaction.md](../../../context/ai-interaction.md) and [context/coding-standards.md](../../../context/coding-standards.md).
