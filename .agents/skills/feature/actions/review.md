# Review Action

Performs a comprehensive code and architecture audit of all changes made for the active feature before completion.

---

## Workflow Steps

### 1. Gather Context & Changes

1.  Read [context/current-feature.md](../../../../context/current-feature.md) using `view_file` to inspect the target goals and constraints.
2.  Inspect git status and diff against `main` using `run_command`:
    ```powershell
    git status
    git diff main --stat
    ```

---

### 2. Comprehensive Review Checklist

Evaluate the implementation across the following criteria:

| Category          | Checkpoint                                                                        | Status |
| :---------------- | :-------------------------------------------------------------------------------- | :----: |
| **Goals & Scope** | All goals in `current-feature.md` are completely implemented                      |  [ ]   |
| **Scope Control** | No scope creep, unrelated refactoring, or extraneous files                        |  [ ]   |
| **Architecture**  | React Server Components (RSC) used by default; `"use client"` only where required |  [ ]   |
| **Type Safety**   | Strictly typed TypeScript without `any` or loose type assertions                  |  [ ]   |
| **Styling**       | Clean Tailwind CSS v4 utility classes and consistent design tokens                |  [ ]   |
| **Performance**   | No N+1 database queries, unnecessary re-renders, or blocking I/O                  |  [ ]   |
| **Security**      | Authentication checks, input validation, and safe data sanitization               |  [ ]   |
| **Quality**       | No dummy code, silent exception catching, or unhandled promise rejections         |  [ ]   |

---

### 3. Verdict & Feedback

Generate a structured review summary:

```markdown
## Code Review Summary: [Feature Name]

### ✅ Accomplishments & Goals Met

- [List verified goals]

### ⚠️ Findings & Recommendations

- [List any improvements, edge cases, or optimizations]

### 📋 Verdict

- **Status**: [Ready for Complete | Changes Required]
- **Next Steps**: [Run `/feature complete` OR address specific findings]
```
