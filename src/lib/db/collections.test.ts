import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCollection, getDashboardCollections } from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    collection: {
      create: vi.fn(),
      findMany: vi.fn(),
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
