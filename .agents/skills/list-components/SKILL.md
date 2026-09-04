---
name: list-components
description: >-
  Lists React component files (.tsx, .ts, .jsx, .js) in the project or a specified subdirectory.
  Use when the user asks to list, inventory, inspect, or summarize existing UI components.
---

# List Components

Follow these instructions to inspect and list React components in the project.

## Instructions

1. Search for component files (`.tsx`, `.ts`, `.jsx`, `.js`) inside the `src/components` (or root `components/`) directory using file search tools.
2. If the user specified a particular subdirectory or feature folder in their prompt, restrict the search to that folder.

## Output Format

- Numbered list of files with relative paths (as clickable file links)
- Brief one-line description of each component's purpose (inferred from filename or export)
- Summary count at the end (e.g., `Total components: X`)

If no component files are found, respond with:

> "No components found in the specified path."
