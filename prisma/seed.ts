import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { ContentType } from "../src/generated/prisma/enums";

// 7 Immutable System Item Types
const systemItemTypes = [
  { name: "snippet", icon: "Code", color: "#3b82f6", isSystem: true },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6", isSystem: true },
  { name: "command", icon: "Terminal", color: "#f97316", isSystem: true },
  { name: "note", icon: "StickyNote", color: "#fde047", isSystem: true },
  { name: "file", icon: "File", color: "#6b7280", isSystem: true },
  { name: "image", icon: "Image", color: "#ec4899", isSystem: true },
  { name: "link", icon: "Link", color: "#10b981", isSystem: true },
];

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Seed / Upsert System Item Types
  console.log("📦 Seeding system item types...");
  const itemTypeMap = new Map<string, string>();

  for (const type of systemItemTypes) {
    const existing = await prisma.itemType.findFirst({
      where: {
        name: type.name,
        isSystem: true,
        userId: null,
      },
    });

    let savedType;
    if (existing) {
      savedType = await prisma.itemType.update({
        where: { id: existing.id },
        data: {
          icon: type.icon,
          color: type.color,
          isSystem: type.isSystem,
        },
      });
    } else {
      savedType = await prisma.itemType.create({
        data: {
          name: type.name,
          icon: type.icon,
          color: type.color,
          isSystem: type.isSystem,
        },
      });
    }
    itemTypeMap.set(savedType.name, savedType.id);
  }

  // 2. Create / Upsert Demo User
  console.log("👤 Seeding demo user...");
  const hashedPassword = await bcrypt.hash("12345678", 12);
  const demoEmail = "demo@devstash.io";

  let demoUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (demoUser) {
    demoUser = await prisma.user.update({
      where: { id: demoUser.id },
      data: {
        name: "Demo User",
        password: hashedPassword,
        isPro: false,
        emailVerified: new Date(),
      },
    });

    // Clean up existing demo collections and items to ensure idempotent fresh seed
    console.log("🧹 Cleaning up existing demo data for a fresh seed...");
    await prisma.itemCollection.deleteMany({
      where: { collection: { userId: demoUser.id } },
    });
    await prisma.item.deleteMany({
      where: { userId: demoUser.id },
    });
    await prisma.collection.deleteMany({
      where: { userId: demoUser.id },
    });
  } else {
    demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        name: "Demo User",
        password: hashedPassword,
        isPro: false,
        emailVerified: new Date(),
      },
    });
  }

  const userId = demoUser.id;

  // 3. Define Collections & Sample Items
  console.log("📂 Seeding collections and items...");

  const collectionsData = [
    {
      name: "React Patterns",
      description: "Reusable React patterns and hooks",
      defaultTypeName: "snippet",
      isFavorite: true,
      items: [
        {
          title: "useDebounce Hook",
          contentType: ContentType.TEXT,
          language: "typescript",
          isPinned: true,
          isFavorite: true,
          description:
            "Debounce any fast-changing value in React to optimize performance and reduce unnecessary re-renders or API calls.",
          typeName: "snippet",
          tags: ["react", "typescript", "hooks", "performance"],
          content: `import { useState, useEffect } from "react";

/**
 * Custom hook to debounce rapidly changing values.
 * @param value The value to debounce
 * @param delay Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}`,
        },
        {
          title: "useLocalStorage Hook",
          contentType: ContentType.TEXT,
          language: "typescript",
          isPinned: false,
          isFavorite: true,
          description:
            "Sync React state seamlessly with localStorage, including support for SSR hydration and cross-tab storage events.",
          typeName: "snippet",
          tags: ["react", "typescript", "hooks", "state"],
          content: `import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook to persist state in localStorage with SSR support.
 * @param key LocalStorage key
 * @param initialValue Default value fallback
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(\`Error reading localStorage key "\${key}":\`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(\`Error setting localStorage key "\${key}":\`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}`,
        },
        {
          title: "Compound Tabs Component Pattern",
          contentType: ContentType.TEXT,
          language: "typescript",
          isPinned: false,
          isFavorite: false,
          description:
            "Flexible, accessible compound component pattern for tabbed interfaces using React Context.",
          typeName: "snippet",
          tags: ["react", "patterns", "compound-components", "ui"],
          content: `import React, { createContext, useContext, useState, ReactNode } from "react";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs compound components must be used within <Tabs>");
  }
  return context;
}

export function Tabs({
  defaultTab,
  children,
  className = "",
}: {
  defaultTab: string;
  children: ReactNode;
  className?: string;
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={\`tabs-container \${className}\`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children }: { children: ReactNode }) {
  return <div className="flex border-b border-border gap-2" role="tablist">{children}</div>;
}

export function Tab({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === id;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(id)}
      className={\`px-4 py-2 text-sm font-medium transition-colors \${
        isActive
          ? "border-b-2 border-primary text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }\`}
    >
      {children}
    </button>
  );
}

export function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab } = useTabs();
  if (activeTab !== id) return null;
  return <div role="tabpanel" className="p-4">{children}</div>;
}`,
        },
      ],
    },
    {
      name: "AI Workflows",
      description: "AI prompts and workflow automations",
      defaultTypeName: "prompt",
      isFavorite: true,
      items: [
        {
          title: "Senior Code Review & Security Audit",
          contentType: ContentType.TEXT,
          language: "markdown",
          isPinned: true,
          isFavorite: true,
          description:
            "Comprehensive system prompt for thorough code reviews, analyzing security, edge cases, complexity, and idiomatic conventions.",
          typeName: "prompt",
          tags: ["ai", "prompts", "code-review", "security"],
          content: `You are a Staff Software Engineer and Security Specialist performing a strict code review.

Review the provided code changes against these criteria:
1. **Security Vulnerabilities**: Check for injection risks, improper auth checks, secret leakage, unescaped output, and OWASP Top 10 vulnerabilities.
2. **Correctness & Edge Cases**: Identify race conditions, null pointer/undefined dereferences, off-by-one errors, and uncaught exceptions.
3. **Performance & Scalability**: Point out unnecessary allocations, quadratic complexity (O(N^2)), database N+1 queries, and unoptimized re-renders.
4. **Architectural & Type Quality**: Verify strict typing (no loose \`any\`), clean separation of concerns, DRY principles, and adherence to project conventions.

Provide your feedback in structured format:
- 🚨 **Critical Issues** (Blockers that must be fixed)
- ⚠️ **Warnings & Improvements** (Suggested optimizations & cleaner alternatives)
- 💡 **Nice-to-Haves** (Minor stylistic suggestions)
- 📝 **Summary & Verdict** (Approve / Request Changes with clear rationale)`,
        },
        {
          title: "API & Component Documentation Generator",
          contentType: ContentType.TEXT,
          language: "markdown",
          isPinned: false,
          isFavorite: false,
          description:
            "Generates clean Markdown and TSDoc documentation with usage examples, prop tables, and error states.",
          typeName: "prompt",
          tags: ["ai", "prompts", "documentation", "typescript"],
          content: `You are a Technical Writer and Senior Developer creating production-grade documentation.

Given the attached component, function, or API route:
1. Generate complete **TSDoc / JSDoc comments** with \`@param\`, \`@returns\`, \`@throws\`, and \`@example\` tags.
2. Produce a clean **Markdown README section** with:
   - **Overview**: High-level purpose and architectural role.
   - **Props / Parameters Table**: Name, Type, Default, Description.
   - **Usage Examples**: Minimal snippet + advanced edge-case configuration.
   - **Error Handling & Best Practices**: Known caveats, gotchas, and error handling guidelines.`,
        },
        {
          title: "Legacy Code Refactoring & Modernization",
          contentType: ContentType.TEXT,
          language: "markdown",
          isPinned: false,
          isFavorite: true,
          description:
            "Guide AI in breaking down monolithic legacy code into testable, single-responsibility functions.",
          typeName: "prompt",
          tags: ["ai", "prompts", "refactoring", "clean-code"],
          content: `You are an expert Refactoring Engineer specializing in clean code and software design patterns.

Analyze the provided legacy codebase and create a step-by-step refactoring plan:
1. **Identify Code Smells**: Monolithic functions, tight coupling, duplicated logic, high cyclomatic complexity.
2. **Decomposition Strategy**: Break down large functions into single-responsibility helpers.
3. **Modernize Idioms**: Upgrade obsolete syntax to modern TypeScript/ESNext standards (e.g., async/await, optional chaining, nullish coalescing).
4. **Preserve Behavior**: Ensure backwards compatibility and suggest unit test specifications to verify the refactoring.`,
        },
      ],
    },
    {
      name: "DevOps",
      description: "Infrastructure and deployment resources",
      defaultTypeName: "command",
      isFavorite: false,
      items: [
        {
          title: "Multi-Stage Dockerfile for Next.js",
          contentType: ContentType.TEXT,
          language: "dockerfile",
          isPinned: false,
          isFavorite: false,
          description:
            "Optimized multi-stage Docker build for Next.js with standalone output and nodejs security user.",
          typeName: "snippet",
          tags: ["devops", "docker", "nextjs", "production"],
          content: `FROM node:20-alpine AS base

# Step 1: Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Step 2: Build source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Step 3: Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]`,
        },
        {
          title: "Production Docker Build & Run",
          contentType: ContentType.TEXT,
          language: "bash",
          isPinned: false,
          isFavorite: false,
          description:
            "One-liner command to build and run production Next.js Docker image with environment variables.",
          typeName: "command",
          tags: ["devops", "docker", "deployment", "bash"],
          content:
            "docker build -t devstash:latest -f Dockerfile . && docker run -p 3000:3000 --env-file .env.production devstash:latest",
        },
        {
          title: "Next.js App Router Deployment Guide",
          contentType: ContentType.URL,
          url: "https://nextjs.org/docs/app/building-your-application/deploying",
          isPinned: false,
          isFavorite: true,
          description:
            "Official Next.js deployment guide covering Docker, Node.js servers, and static hosting platforms.",
          typeName: "link",
          tags: ["devops", "nextjs", "docs", "deployment"],
        },
        {
          title: "Prisma Production Migration & Deployment Guide",
          contentType: ContentType.URL,
          url: "https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate",
          isPinned: false,
          isFavorite: false,
          description:
            "Best practices for deploying Prisma database migrations in CI/CD and production environments.",
          typeName: "link",
          tags: ["devops", "prisma", "database", "migrations"],
        },
      ],
    },
    {
      name: "Terminal Commands",
      description: "Useful shell commands for everyday development",
      defaultTypeName: "command",
      isFavorite: false,
      items: [
        {
          title: "Undo Last Git Commit (Keep Changes)",
          contentType: ContentType.TEXT,
          language: "bash",
          isPinned: true,
          isFavorite: true,
          description:
            "Undo the previous commit while keeping all staged and unstaged file modifications in working tree.",
          typeName: "command",
          tags: ["terminal", "git", "cli", "workflow"],
          content: "git reset --soft HEAD~1",
        },
        {
          title: "Prune All Unused Docker Resources",
          contentType: ContentType.TEXT,
          language: "bash",
          isPinned: false,
          isFavorite: false,
          description:
            "Force clean all stopped containers, unused networks, dangling images, and build cache.",
          typeName: "command",
          tags: ["terminal", "docker", "cleanup", "cli"],
          content: "docker system prune -a --volumes -f",
        },
        {
          title: "Kill Process Listening on Port 3000",
          contentType: ContentType.TEXT,
          language: "bash",
          isPinned: false,
          isFavorite: true,
          description:
            "Quick commands to find and kill whatever process is locking local dev port 3000.",
          typeName: "command",
          tags: ["terminal", "ports", "process", "troubleshooting"],
          content: `# macOS / Linux:\nlsof -ti:3000 | xargs kill -9\n\n# Windows PowerShell:\nStop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force`,
        },
        {
          title: "Clean Reinstall Node Modules & Lockfile",
          contentType: ContentType.TEXT,
          language: "bash",
          isPinned: false,
          isFavorite: false,
          description:
            "Complete wipe and fresh install of node dependencies to fix corrupted lockfiles or modules.",
          typeName: "command",
          tags: ["terminal", "npm", "node", "dependencies"],
          content:
            "rm -rf node_modules package-lock.json && npm cache clean --force && npm install",
        },
      ],
    },
    {
      name: "Design Resources",
      description: "UI/UX resources and references",
      defaultTypeName: "link",
      isFavorite: false,
      items: [
        {
          title: "Tailwind CSS v4 Documentation",
          contentType: ContentType.URL,
          url: "https://tailwindcss.com/docs",
          isPinned: false,
          isFavorite: true,
          description:
            "Official documentation and utility class reference for Tailwind CSS v4.",
          typeName: "link",
          tags: ["design", "tailwind", "css", "docs"],
        },
        {
          title: "shadcn/ui Component Library",
          contentType: ContentType.URL,
          url: "https://ui.shadcn.com",
          isPinned: true,
          isFavorite: true,
          description:
            "Beautifully designed, accessible, copy-paste components built with Radix / Base UI and Tailwind CSS.",
          typeName: "link",
          tags: ["design", "ui", "components", "react"],
        },
        {
          title: "Radix UI Colors & Tokens",
          contentType: ContentType.URL,
          url: "https://www.radix-ui.com/colors",
          isPinned: false,
          isFavorite: false,
          description:
            "Accessible color scales for dark and light mode user interfaces.",
          typeName: "link",
          tags: ["design", "colors", "tokens", "accessibility"],
        },
        {
          title: "Lucide React Icons Directory",
          contentType: ContentType.URL,
          url: "https://lucide.dev/icons",
          isPinned: false,
          isFavorite: true,
          description:
            "Beautiful & consistent icon toolkit for modern React applications.",
          typeName: "link",
          tags: ["design", "icons", "lucide", "ui"],
        },
      ],
    },
  ];

  for (const colData of collectionsData) {
    const defaultTypeId = itemTypeMap.get(colData.defaultTypeName);

    const collection = await prisma.collection.create({
      data: {
        name: colData.name,
        description: colData.description,
        isFavorite: colData.isFavorite,
        userId,
        defaultTypeId: defaultTypeId || null,
      },
    });

    console.log(`  📁 Created collection: "${collection.name}"`);

    for (const itemData of colData.items) {
      const itemTypeId = itemTypeMap.get(itemData.typeName);
      if (!itemTypeId) {
        throw new Error(`Item type "${itemData.typeName}" not found!`);
      }

      const item = await prisma.item.create({
        data: {
          title: itemData.title,
          contentType: itemData.contentType,
          content: "content" in itemData ? itemData.content : null,
          url: "url" in itemData ? itemData.url : null,
          language: "language" in itemData ? itemData.language : null,
          description: itemData.description,
          isFavorite: itemData.isFavorite,
          isPinned: itemData.isPinned,
          userId,
          itemTypeId,
          tags: {
            connectOrCreate: itemData.tags.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
          collections: {
            create: {
              collectionId: collection.id,
            },
          },
        },
      });

      console.log(
        `    ↳ 📄 Created item: "${item.title}" [${itemData.typeName}]`,
      );
    }
  }

  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
