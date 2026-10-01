# Feature Specification: Responsive 3-Column Item Listing View

## Overview

Update the item listing page (`/items/[type]`) and its corresponding skeleton loader to use a responsive 3-column grid on larger screens instead of the previous 2-column layout.

---

## Layout & Responsive Breakpoints

| Breakpoint      | Screen Size       | Grid Columns | Tailwind Class   |
| :-------------- | :---------------- | :----------- | :--------------- |
| Mobile          | `< 768px`         | 1 Column     | `grid-cols-1`    |
| Tablet / Medium | `≥ 768px` (`md`)  | 2 Columns    | `md:grid-cols-2` |
| Desktop / Large | `≥ 1024px` (`lg`) | 3 Columns    | `lg:grid-cols-3` |

- **Grid Spacing**: `gap-4`
- **Container**: `max-w-7xl mx-auto space-y-6 pb-10`

---

## Files to Modify

1. `src/app/items/[type]/page.tsx` — Update items grid container class list.
2. `src/app/items/[type]/loading.tsx` — Synchronize loading skeleton grid layout to match the 3-column structure.

---

## Verification Plan

- Run unit test suite: `npm test`
- Run linter: `npm run lint`
- Run production build: `npm run build`
- Inspect responsive breakpoints across mobile, tablet, and desktop viewports.
