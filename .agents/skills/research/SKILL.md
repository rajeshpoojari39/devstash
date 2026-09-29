---
name: research
description: >-
  Execute structured research tasks to investigate codebase architecture, database schemas,
  feature requirements, dependencies, and external integrations, producing comprehensive markdown documentation.
  Use when the user asks to research a topic, investigate a technical area, analyze existing code,
  or execute a research task via `/research <prompt-name>` or a research prompt file.
argument-hint: <prompt-name>
---

# Codebase & Architecture Research

Execute structured research workflows in **DevStash** to analyze technical requirements, investigate existing codebase implementations, inspect database schemas, and synthesize findings into clear, actionable markdown documentation.

---

## Working Context Files

- 👉 [context/project-overview.md](../../../context/project-overview.md) — System architecture, models, and core stack
- 👉 [context/coding-standards.md](../../../context/coding-standards.md) — Technical conventions and best practices
- 👉 [context/ai-interaction.md](../../../context/ai-interaction.md) — Workflow and communication guidelines

---

## Workflow Steps

Follow these sequential steps to perform the research task:

### 1. Input Validation & Prompt Resolution

Parse `$ARGUMENTS`:

- **Prompt Name Provided**:
  1. Search for a research prompt file at `context/research/{$ARGUMENTS}.md` or `context/features/{$ARGUMENTS}.md`.
  2. If found, load the specification from that file.
  3. If not found at the expected path, list existing prompt files in `context/` or ask the user to clarify the target topic.
- **Direct Research Topic**:
  - If `$ARGUMENTS` contains a topic description or research query rather than a file name, proceed directly with that research objective.
- **No Arguments**:
  - Prompt the user:
    > "Please specify a research prompt name or topic (e.g., `/research database-schema` or `/research auth-flow`)."
  - List any available prompt files located in `context/research/` or `context/features/`.

---

### 2. Parse Research Specification

When reading from a prompt file, extract the following core sections:

| Field        | Description                                                   | Default Fallback                     |
| :----------- | :------------------------------------------------------------ | :----------------------------------- |
| **Output**   | Destination file path for generated documentation             | `docs/research/{$ARGUMENTS}.md`      |
| **Research** | Core questions, architectural goals, and areas to investigate | Extracted from prompt or user input  |
| **Include**  | Specific details, diagrams, interfaces, or tables required    | Comprehensive technical overview     |
| **Sources**  | Target files, database tables, components, or external docs   | Project codebase and database schema |

---

### 3. Investigation & Tool Execution

Execute systematic research using the appropriate tools:

1. **Codebase Exploration**:
   - Inspect route handlers, server actions, and components across `src/`.
   - Analyze schema models and database migrations.
   - Trace data flow, TypeScript interfaces, and shared utilities.
2. **Database Schema & State Inspection**:
   - When inspecting the database via **Neon MCP**, strictly adhere to project parameters:
     - `org_id`: `"org-tiny-resonance-19531518"`
     - `project_id`: `"dawn-wildflower-34666399"`
     - `branch_id`: `"br-damp-meadow-a56n40h5"` (branch name: `development`)
   - _Never target or query the production branch._
3. **Subagent Delegation (Optional)**:
   - For wide-ranging codebase audits or heavy exploration that could clutter the context window, delegate investigation steps to the `research` subagent.
4. **External Documentation**:
   - For third-party libraries (e.g., NextAuth / Auth.js, Next.js 16, Tailwind CSS v4, Prisma / Drizzle), search web documentation if APIs or breaking changes need verification.

---

### 4. Synthesize Findings & Write Documentation

Write the research findings to the designated **Output** path adhering to these formatting standards:

- **Structured Headings**: Use clear H1, H2, and H3 sections organizing the findings logically.
- **Clickable File Links**: Reference source files using standard clickable links (e.g. `[auth.ts](file:///src/lib/auth.ts)`).
- **Mermaid Diagrams**: Include flowcharts, sequence diagrams, or ER diagrams (`flowchart TD`, `sequenceDiagram`, `erDiagram`) where architecture or data flow is clarified.
- **Code Snippets**: Provide typed TypeScript code examples illustrating patterns, API contracts, or proposed schema definitions.
- **Actionable Recommendations**: Include a dedicated section outlining concrete next steps, implementation risks, or architectural decisions.

---

### 5. Delivery & Summary

1. Save the document to the destination file.
2. Provide a concise executive summary in the chat response:
   - Highlight key discoveries and core architectural conclusions.
   - Provide a clickable link to the generated markdown file.
   - List any open questions or trade-offs requiring user feedback.

---

## Rules & Constraints

> [!IMPORTANT]
> **Documentation Only**: This skill produces documentation and analysis only.
>
> - Do **NOT** modify application source code files (`src/`).
> - Do **NOT** create git branches, commits, or pull requests.
> - Adhere to [context/ai-interaction.md](../../../context/ai-interaction.md) and [context/coding-standards.md](../../../context/coding-standards.md).

> [!WARNING]
> **Database Safety**: All database queries must target the `development` branch (`br-damp-meadow-a56n40h5`). Never execute write mutations or schema drops during research without explicit authorization.
