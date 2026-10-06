# Feature Spec: Delete Item Functionality

## Overview
Enable authenticated users to permanently delete items (snippets, prompts, commands, notes, links, files, and images) with a confirmation modal using shadcn UI / Base UI Dialog and instant toast feedback upon successful deletion.

---

## Acceptance Criteria & Deliverables

1. **Database Layer (`src/lib/db/items.ts`)**:
   - Create typed function `deleteItem(itemId: string, userId: string): Promise<boolean>`
   - Verify item ownership (`userId`) before deletion.
   - Clean up relational join table references (`item_collections`, tags disconnect/cleanup) if needed or rely on cascade rules.

2. **Server Action Layer (`src/actions/items.ts`)**:
   - Create `deleteItem(itemId: string): Promise<ActionResult<{ id: string }>>`
   - Validate `itemId` input.
   - Verify NextAuth session authentication and resolve user ID.
   - Execute deletion via `deleteItem` database function.
   - Return `{ success: true, data: { id } }` or informative `{ success: false, error: string }`.

3. **UI Confirmation Dialog (`src/components/items/delete-item-dialog.tsx`)**:
   - Build a reusable confirmation modal using shadcn UI `Dialog` components (`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`).
   - Display clear warning text (e.g. item title, "This action cannot be undone.").
   - Provide "Cancel" (outline/ghost) and "Delete" (destructive variant with loading spinner).

4. **UI Integration**:
   - **Item Drawer (`src/components/items/item-drawer.tsx`)**:
     - Connect action bar Delete button (`Trash2`) to open the confirmation dialog.
     - On successful deletion: close drawer, trigger Sonner toast `toast.success("Item deleted successfully")`, and refresh the router view.
   - **Item Card (`src/components/dashboard/item-card.tsx`)**:
     - Connect dropdown menu "Delete" action to open the confirmation dialog.
     - On successful deletion: trigger Sonner toast `toast.success("Item deleted successfully")`, and refresh the router view.

5. **Testing & Quality Assurance**:
   - Vitest unit tests for `deleteItem` server action in `src/actions/items.test.ts`.
   - Validate test coverage for: unauthorized requests, invalid item IDs, non-existent items, unauthorized ownership, and successful deletion.
   - Verify linting (`npm run lint`), testing (`npm test`), and production build (`npm run build`).
