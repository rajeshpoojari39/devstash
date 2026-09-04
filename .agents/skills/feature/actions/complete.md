# Complete Action

Finalizes the active feature, ensures all verification checks pass, commits changes with conventional commit syntax, merges into `main`, records completion in `History`, and cleans up branches.

---

## Workflow Steps

### 1. Pre-Merge Verification

Execute validation checks to confirm the codebase is production ready:

```powershell
# Run ESLint
npm run lint

# Verify production build
npm run build
```

> [!CAUTION]
> If `npm run lint` or `npm run build` fails, resolve all errors before proceeding. Never commit or merge broken code.

---

### 2. Stage & Commit Feature Changes

1.  Request confirmation from the user before committing (as required by [context/ai-interaction.md](../../../../context/ai-interaction.md)).
2.  Stage files and commit with a concise conventional commit message:
    ```powershell
    git add .
    git commit -m "feat(scope): descriptive commit message"
    ```

> [!IMPORTANT]
> Never include "Generated with Claude" or "Generated with Gemini/Antigravity" in commit messages.

---

### 3. Merge to Main

Switch to `main` branch and merge the feature branch:

```powershell
git checkout main
git merge feature/<feature-name>
```

---

### 4. Reset `context/current-feature.md` & Append History

Update [context/current-feature.md](../../../../context/current-feature.md) using `replace_file_content`:

1.  Reset H1 heading to: `# Current Feature`
2.  Set `## Status` to: `Not Started`
3.  Reset `## Goals` and `## Notes` to their default placeholder comments:

    ```markdown
    ## Goals

    <!-- Goals & requirements -->

    ## Notes

    <!-- Any extra notes -->
    ```

4.  Append the completed feature entry to the bottom of `## History` with today's date (`YYYY-MM-DD`):
    ```markdown
    - **<Feature Title> (YYYY-MM-DD)**
      - Summary bullet 1 of accomplishments
      - Summary bullet 2 of components/endpoints created
      - Verified with lint, build, and test suite.
    ```

---

### 5. Commit History Reset & Push

Commit the `current-feature.md` update and push `main`:

```powershell
git add context/current-feature.md
git commit -m "chore: reset current-feature.md after completing <feature-name>"

# Push main to origin
git push origin main
```

---

### 6. Branch Cleanup

Delete the local (and remote if pushed) feature branch:

```powershell
# Delete local feature branch
git branch -d feature/<feature-name>

# Delete remote branch if it was pushed
git push origin --delete feature/<feature-name>
```

---

### 7. Completion Summary

Present a final completion confirmation to the user:

- ✅ Feature successfully merged to `main`.
- ✅ `context/current-feature.md` updated and archived in `History`.
- ✅ Branch `feature/<feature-name>` cleaned up.
