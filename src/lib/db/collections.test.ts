import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createCollection,
  getAllCollections,
  getCollectionById,
  getDashboardCollections,
} from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    collection: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    item: {
      count: vi.fn(),
    },
  },
}));

describe("createCollection DB helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a user-scoped collection with trimmed name and description", async () => {
    const now = new Date("2026-11-26T00:00:00Z");
    vi.mocked(prisma.collection.create).mockResolvedValue({
      id: "col-123",
      name: "React Patterns",
      description: "Hooks and patterns",
      isFavorite: false,
      userId: "user-1",
      defaultTypeId: null,
      createdAt: now,
      updatedAt: now,
    });

    const result = await createCollection("user-1", {
      name: "  React Patterns  ",
      description: "  Hooks and patterns  ",
    });

    expect(prisma.collection.create).toHaveBeenCalledWith({
      data: {
        name: "React Patterns",
        description: "Hooks and patterns",
        userId: "user-1",
      },
    });

    expect(result).toEqual({
      id: "col-123",
      name: "React Patterns",
      description: "Hooks and patterns",
      isFavorite: false,
      itemCount: 0,
      accentColor: "neutral",
      typeIcons: ["folder"],
      createdAt: now,
      updatedAt: now,
    });
  });

  it("stores null description when description is omitted or whitespace-only", async () => {
    const now = new Date("2026-11-26T00:00:00Z");
    vi.mocked(prisma.collection.create).mockResolvedValue({
      id: "col-124",
      name: "Terminal",
      description: null,
      isFavorite: false,
      userId: "user-1",
      defaultTypeId: null,
      createdAt: now,
      updatedAt: now,
    });

    await createCollection("user-1", {
      name: "Terminal",
      description: "   ",
    });

    expect(prisma.collection.create).toHaveBeenCalledWith({
      data: {
        name: "Terminal",
        description: null,
        userId: "user-1",
      },
    });
  });

  it("throws an error if userId is missing", async () => {
    await expect(
      createCollection("", { name: "My Collection" }),
    ).rejects.toThrow("User ID is required");
    expect(prisma.collection.create).not.toHaveBeenCalled();
  });

  it("throws an error if name is empty or whitespace-only", async () => {
    await expect(
      createCollection("user-1", { name: "   " }),
    ).rejects.toThrow("Collection name is required");
    expect(prisma.collection.create).not.toHaveBeenCalled();
  });
});

describe("getDashboardCollections user scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries collections strictly scoped to the provided userId", async () => {
    vi.mocked(prisma.collection.findMany).mockResolvedValue([]);

    const result = await getDashboardCollections("user-42", 12);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.collection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-42" },
        take: 12,
        orderBy: { updatedAt: "desc" },
      }),
    );
    expect(result).toEqual([]);
  });
});

describe("getAllCollections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when userId is empty", async () => {
    const result = await getAllCollections("");

    expect(prisma.collection.findMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("queries all collections for user ordered by favorite and updatedAt and computes accentColor and typeIcons", async () => {
    const now = new Date("2026-11-26T00:00:00Z");
    vi.mocked(prisma.collection.findMany).mockResolvedValue([
      {
        id: "col-1",
        name: "React Patterns",
        description: "Hooks and patterns",
        isFavorite: true,
        userId: "user-1",
        defaultTypeId: null,
        createdAt: now,
        updatedAt: now,
        defaultType: null,
        items: [
          { item: { itemType: { name: "snippet", color: "#3b82f6", icon: "Code" } } },
          { item: { itemType: { name: "snippet", color: "#3b82f6", icon: "Code" } } },
          { item: { itemType: { name: "note", color: "#fde047", icon: "StickyNote" } } },
        ],
        _count: { items: 3 },
      },
      {
        id: "col-2",
        name: "Empty Collection",
        description: null,
        isFavorite: false,
        userId: "user-1",
        defaultTypeId: null,
        createdAt: now,
        updatedAt: now,
        defaultType: null,
        items: [],
        _count: { items: 0 },
      },
    ] as never);

    const result = await getAllCollections("user-1");

    expect(prisma.collection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
      }),
    );

    expect(result).toEqual([
      {
        id: "col-1",
        name: "React Patterns",
        description: "Hooks and patterns",
        isFavorite: true,
        itemCount: 3,
        accentColor: "blue",
        typeIcons: ["snippet", "note"],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "col-2",
        name: "Empty Collection",
        description: null,
        isFavorite: false,
        itemCount: 0,
        accentColor: "neutral",
        typeIcons: ["folder"],
        createdAt: now,
        updatedAt: now,
      },
    ]);
  });
});

describe("getCollectionById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when collectionId or userId is missing", async () => {
    expect(await getCollectionById("", "user-1")).toBeNull();
    expect(await getCollectionById("col-1", "")).toBeNull();
    expect(prisma.collection.findFirst).not.toHaveBeenCalled();
  });

  it("returns null when collection is not found or not owned by user", async () => {
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(null);

    const result = await getCollectionById("col-missing", "user-1");

    expect(prisma.collection.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "col-missing", userId: "user-1" },
      }),
    );
    expect(result).toBeNull();
  });

  it("returns collection details and mapped DashboardItems scoped to user", async () => {
    const now = new Date("2026-11-26T00:00:00Z");
    vi.mocked(prisma.collection.findFirst).mockResolvedValue({
      id: "col-1",
      name: "AI Workflows",
      description: "Prompt engineering templates",
      isFavorite: true,
      userId: "user-1",
      defaultTypeId: null,
      createdAt: now,
      updatedAt: now,
      defaultType: null,
      items: [
        {
          item: {
            id: "item-1",
            title: "Code Review Prompt",
            contentType: "TEXT",
            content: "Review this PR...",
            description: "Thorough review checklist",
            isFavorite: true,
            isPinned: true,
            language: null,
            url: null,
            fileUrl: null,
            fileName: null,
            fileSize: null,
            createdAt: now,
            updatedAt: now,
            itemTypeId: "type-prompt",
            itemType: {
              id: "type-prompt",
              name: "prompt",
              icon: "Sparkles",
              color: "#8b5cf6",
            },
            tags: [{ name: "ai" }, { name: "review" }],
          },
        },
      ],
      _count: { items: 1 },
    } as never);

    const result = await getCollectionById("col-1", "user-1");

    expect(result).toEqual({
      id: "col-1",
      name: "AI Workflows",
      description: "Prompt engineering templates",
      isFavorite: true,
      itemCount: 1,
      accentColor: "purple",
      typeIcons: ["prompt"],
      createdAt: now,
      updatedAt: now,
      items: [
        {
          id: "item-1",
          title: "Code Review Prompt",
          contentType: "TEXT",
          content: "Review this PR...",
          description: "Thorough review checklist",
          isFavorite: true,
          isPinned: true,
          language: null,
          url: null,
          fileUrl: null,
          fileName: null,
          fileSize: null,
          createdAt: now,
          updatedAt: now,
          itemTypeId: "type-prompt",
          itemType: {
            id: "type-prompt",
            name: "prompt",
            icon: "Sparkles",
            color: "#8b5cf6",
          },
          tags: ["ai", "review"],
        },
      ],
    });
  });

  it("falls back to defaultType for accentColor and typeIcons when collection has no items", async () => {
    const now = new Date("2026-11-26T00:00:00Z");
    vi.mocked(prisma.collection.findFirst).mockResolvedValue({
      id: "col-empty",
      name: "Starter Snippets",
      description: null,
      isFavorite: false,
      userId: "user-1",
      defaultTypeId: "type-snippet",
      createdAt: now,
      updatedAt: now,
      defaultType: {
        name: "snippet",
        color: "#3b82f6",
        icon: "Code",
      },
      items: [],
      _count: { items: 0 },
    } as never);

    const result = await getCollectionById("col-empty", "user-1");

    expect(result).toMatchObject({
      id: "col-empty",
      itemCount: 0,
      accentColor: "blue",
      typeIcons: ["snippet"],
      items: [],
    });
  });

  it("computes dominant accentColor and distinct typeIcons across mixed item types", async () => {
    const now = new Date("2026-11-26T00:00:00Z");
    const makeItem = (id: string, typeName: string, icon: string, color: string) => ({
      item: {
        id,
        title: `Item ${id}`,
        contentType: typeName === "link" ? "URL" : "TEXT",
        content: typeName === "link" ? null : "echo hi",
        description: null,
        isFavorite: false,
        isPinned: false,
        language: typeName === "command" ? "bash" : null,
        url: typeName === "link" ? "https://example.com" : null,
        fileUrl: null,
        fileName: null,
        fileSize: null,
        createdAt: now,
        updatedAt: now,
        itemTypeId: `type-${typeName}`,
        itemType: { id: `type-${typeName}`, name: typeName, icon, color },
        tags: [],
      },
    });

    vi.mocked(prisma.collection.findFirst).mockResolvedValue({
      id: "col-mixed",
      name: "DevOps",
      description: "CLI and docs",
      isFavorite: false,
      userId: "user-1",
      defaultTypeId: null,
      createdAt: now,
      updatedAt: now,
      defaultType: null,
      items: [
        makeItem("1", "command", "Terminal", "#f97316"),
        makeItem("2", "command", "Terminal", "#f97316"),
        makeItem("3", "link", "Link", "#10b981"),
      ],
      _count: { items: 3 },
    } as never);

    const result = await getCollectionById("col-mixed", "user-1");

    expect(result?.accentColor).toBe("orange");
    expect(result?.typeIcons).toEqual(["command", "link"]);
    expect(result?.items).toHaveLength(3);
  });
});
