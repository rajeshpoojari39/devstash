# Explain Action

Generates a clear architectural breakdown of all files created or modified for the active feature, highlighting structural changes and component relationships.

---

## Workflow Steps

### 1. Collect Changed Files

1.  Read [context/current-feature.md](../../../../context/current-feature.md) using `view_file` to retrieve feature context.
2.  List changed files against `main` using `run_command`:
    ```powershell
    git diff main --name-only
    ```

---

### 2. Detail File Modifications

For each modified or newly created file:

- Provide a clickable markdown file link.
- Label clearly as `[NEW]` or `[MODIFIED]`.
- Provide a 1–2 sentence summary explaining its purpose, exported functions/components, and rationale.
- Highlight key patterns used (e.g., Server Actions, Prisma queries, Base UI integration, context providers).

---

### 3. Structural & Data Flow Explanation

Synthesize how the components connect:

- **Data Flow**: How data moves from Prisma / database layer to Server Components down to client UI.
- **State & Interactivity**: Client-side state hooks, context providers, or event handlers.
- **Integration Points**: Route handlers, layouts, or navigation integration.

---

## Output Template

```markdown
# Architecture Explanation: [Feature Name]

## Files Changed

- **[NEW]** `[src/lib/db/feature.ts](file:///...)`
  - Added database query functions for retrieving feature data.
- **[MODIFIED]** `[src/app/dashboard/page.tsx](file:///...)`
  - Integrated server-side data fetching with `Promise.all` and passed props to child sections.

## Data & Control Flow

1. **Database Layer**: `src/lib/db/...` handles typed Prisma operations.
2. **Server Component**: `page.tsx` fetches data concurrently during RSC render.
3. **UI Layer**: Renders accessible, styled components with Tailwind CSS v4.
```
