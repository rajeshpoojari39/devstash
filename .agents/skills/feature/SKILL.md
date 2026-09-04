---
name: feature
description: >-
  Manage the full lifecycle of a feature or fix in DevStash — load specifications,
  start feature branches, execute tests, review code quality, explain architectural changes,
  and complete/merge features into main.
argument-hint: load|start|test|review|explain|complete
---

# Feature Workflow

Manages the end-to-end lifecycle of a feature or bug fix in **DevStash**, ensuring systematic planning, isolated branching, thorough testing, code reviews, and clean merges.

---

## Working Context File

The primary tracking file for active work is:
👉 [context/current-feature.md](../../../context/current-feature.md)

### File Structure

The `current-feature.md` file maintains the state of the active feature and historical log:

| Section             | Description                                                                          |
| :------------------ | :----------------------------------------------------------------------------------- |
| `# Current Feature` | H1 title showing active feature name (e.g., `# Current Feature: Add Search Filters`) |
| `## Status`         | Current execution status: `Not Started` \| `In Progress` \| `Complete`               |
| `## Goals`          | Bullet points defining clear acceptance criteria and deliverables                    |
| `## Notes`          | Context, technical constraints, design specs, and referenced files                   |
| `## History`        | Chronological log of completed features (append-only)                                |

---

## Available Actions

Execute the requested action passed in `$ARGUMENTS`:

| Action     | Documentation                                | Description                                                                       |
| :--------- | :------------------------------------------- | :-------------------------------------------------------------------------------- |
| `load`     | [actions/load.md](./actions/load.md)         | Load a feature/fix spec from file or inline description into `current-feature.md` |
| `start`    | [actions/start.md](./actions/start.md)       | Create/checkout the feature branch, set status to `In Progress`, and begin work   |
| `test`     | [actions/test.md](./actions/test.md)         | Run test suites, verify build/lint, and write unit/integration tests for new code |
| `review`   | [actions/review.md](./actions/review.md)     | Inspect code changes against goals, coding standards, and security requirements   |
| `explain`  | [actions/explain.md](./actions/explain.md)   | Document modified files, architectural decisions, and system connectivity         |
| `complete` | [actions/complete.md](./actions/complete.md) | Verify build, commit changes, merge to `main`, archive in `History`, and clean up |

---

## Usage & Argument Handling

1. **Explicit Action**: When invoked with an action (e.g., `/feature load <name>`, `/feature start`, `/feature review`), read and execute the corresponding instructions in [actions/](./actions/).
2. **No Arguments**: If no action argument is provided, display the available actions table above and prompt the user for the desired step.

> [!NOTE]
> All actions strictly adhere to the guidelines defined in [context/ai-interaction.md](../../../context/ai-interaction.md) and [context/coding-standards.md](../../../context/coding-standards.md).
