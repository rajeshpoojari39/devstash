# Load Action

Loads a feature or bug fix specification into [context/current-feature.md](../../../../context/current-feature.md) to initialize the planning phase.

---

## Workflow Steps

### 1. Parse Arguments (`$ARGUMENTS`)

Evaluate the argument string provided after `load`:

- **Spec File Reference** (single identifier/slug, e.g., `add-navbar`, `user-auth`):
  - Check for specification files in [context/features/](../../../../context/features/) (e.g., `context/features/<name>.md`).
  - Check for fix files in [context/fixes/](../../../../context/fixes/) (e.g., `context/fixes/<name>.md`).
  - Read the file contents using `view_file` to extract goals, notes, and technical constraints.
- **Inline Description** (multiple words / natural language prompt):
  - Synthesize the feature name, clear actionable goals, and relevant technical notes from the user prompt.
- **Missing Argument**:
  - Display an error message indicating that `load` requires either a spec slug or an inline description:
    > `⚠️ Error: Please specify a spec name or feature description. Example: /feature load add-search-bar`

---

### 2. Update `context/current-feature.md`

Modify the active sections of [context/current-feature.md](../../../../context/current-feature.md) using `replace_file_content`:

1.  **Title (H1)**: Update to `# Current Feature: <Feature Name>`
2.  **Status**: Set to `Not Started`
3.  **Goals**: Populate with bulleted acceptance criteria and deliverables.
4.  **Notes**: Populate with relevant architectural notes, constraints, schema dependencies, or references.
5.  **History**: **Do not modify** the `## History` section.

---

### 3. Confirmation & Next Step

Output a summary of the loaded feature:

- **Feature Name**: `<Feature Name>`
- **Status**: `Not Started`
- **Goals**: Bulleted list of goals.
- **Notes**: Summary of notes.

> [!TIP]
> Prompt the user to begin implementation with `/feature start`.
