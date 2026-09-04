# Start Action

Initializes the implementation phase by setting up a dedicated git branch and transitioning the feature status to `In Progress`.

---

## Workflow Steps

### 1. Verify Active Feature

1.  Read [context/current-feature.md](../../../../context/current-feature.md) using `view_file`.
2.  Verify that an active feature is set in the `# Current Feature` heading and `## Goals` contains populated criteria.
3.  If goals are empty or still contain default placeholders, halt and warn:
    > `⚠️ Error: No active feature found. Run /feature load <spec_or_description> first.`

---

### 2. Update Feature Status

Update [context/current-feature.md](../../../../context/current-feature.md) using `replace_file_content`:

- Change `## Status` from `Not Started` to `In Progress`.

---

### 3. Branch Creation & Checkout

Derive a clean kebab-case branch name from the feature title:

- For features: `feature/<feature-name>` (e.g., `feature/dashboard-filters`)
- For fixes: `fix/<fix-name>` (e.g., `fix/auth-session-timeout`)

Execute the git commands via `run_command`:

```powershell
# Ensure working on updated main
git checkout main
git pull origin main

# Create and switch to new feature branch
git checkout -b feature/<feature-name>
```

---

### 4. Implementation Kickoff

1.  List the goals clearly to the user.
2.  Present a brief execution sequence / implementation plan.
3.  Begin working on the first goal following the guidelines in [context/coding-standards.md](../../../../context/coding-standards.md) and [GEMINI.md](../../../../GEMINI.md).

> [!IMPORTANT]
> Keep changes isolated to the goals of this feature. Avoid modifying unrelated code or introducing unapproved dependencies.
