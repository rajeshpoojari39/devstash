# GEMINI.md - Project Guidelines & Instructions for DevStash

## Project Overview

**DevStash** is a Next.js web application which is a develooper knowledge hub for snippets, commands, prompts, notes, files, image, links and custom types designed for developer productivity and resource management.

---

### Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)

---

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands & Scripts

| Command         | Action                                           |
| --------------- | ------------------------------------------------ |
| `npm run dev`   | Starts the Next.js development server            |
| `npm run build` | Builds the application for production            |
| `npm run start` | Runs the production server                       |
| `npm run lint`  | Runs ESLint to check for code quality and errors |

---

## Code Architecture & Conventions

### Directory Structure

```
devstash/
├── src/
│   └── app/            # Next.js App Router pages and layouts
├── public/             # Static assets
├── package.json        # Project metadata & dependencies
├── tsconfig.json       # TypeScript configuration
└── GEMINI.md           # Agent rules & instructions
```

### Component Guidelines

- **Server Components First**: Use React Server Components (RSC) by default. Only add `"use client"` when interactive state or lifecycle hooks (`useState`, `useEffect`, event listeners) are required.
- **TypeScript**: Always write strictly typed TypeScript. Define props interfaces for components and avoid using `any`.
- **Styling**: Use Tailwind CSS v4 utility classes. Keep class names clean and avoid repetitive styles by creating reusable UI components.
- **Next.js 16 Notice**: Heed Next.js 16 API conventions and breaking changes. Refer to `node_modules/next/dist/docs/` when working with async request APIs (such as `params`, `searchParams`, `cookies()`, and `headers()`).

---

## Agent Rules & Workflow Requirements

1. **Verification**: Always run `npm run build` or `npm run lint` after significant changes to confirm code correctness.
2. **Preserve Comments & Docs**: Do not remove existing docstrings or structural comments unless requested.
3. **No Dummy Code**: Always write complete, functional implementations without placeholders or silent exception swallowing.
