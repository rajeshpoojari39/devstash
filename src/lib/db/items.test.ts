import { describe, it, expect, vi, beforeEach } from "vitest";
import { createItem, updateItem } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    itemType: {
      findFirst: vi.fn(),
    },
    tag: {
      createMany: vi.fn(),
    },
    collection: {
      findMany: vi.fn(),
    },
    itemCollection: {
      findMany: vi.fn(),
    },
    item: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/storage/r2", () => ({
  deleteFromR2: vi.fn(),
}));

describe("items DB collection assignment", () => {
  const now = new Date("2026-11-26T00:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createItem links deduplicated collections after verifying user ownership", async () => {
    vi.mocked(prisma.itemType.findFirst).mockResolvedValue({
      id: "type-snippet",
      name: "snippet",
      icon: "Code",
      color: "#3b82f6",
    } as never);

    vi.mocked(prisma.collection.findMany).mockResolvedValue([
      { id: "col-1" },
      { id: "col-2" },
    ] as never);

    vi.mocked(prisma.item.create).mockResolvedValue({
      id: "item-1",
      title: "useDebounce",
      contentType: "TEXT",
      content: "export function useDebounce() {}",
      description: null,
      isFavorite: false,
      isPinned: false,
      language: "typescript",
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      createdAt: now,
      updatedAt: now,
      itemTypeId: "type-snippet",
      itemType: {
        id: "type-snippet",
        name: "snippet",
        icon: "Code",
        color: "#3b82f6",
      },
      tags: [],
      collections: [
        { collection: { id: "col-1", name: "React Patterns" } },
        { collection: { id: "col-2", name: "Utilities" } },
      ],
    } as never);

    const created = await createItem("user-1", {
      type: "snippet",
      title: "useDebounce",
      content: "export function useDebounce() {}",
      language: "typescript",
      collectionIds: ["col-1", " col-2 ", "col-1"],
    });

    expect(prisma.collection.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["col-1", "col-2"] },
        userId: "user-1",
      },
      select: { id: true },
    });

    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collections: {
            create: [{ collectionId: "col-1" }, { collectionId: "col-2" }],
          },
        }),
      }),
    );

    expect(created.collections).toEqual([
      { id: "col-1", name: "React Patterns" },
      { id: "col-2", name: "Utilities" },
    ]);
  });

  it("createItem throws and aborts if any collection is not owned by the user", async () => {
    vi.mocked(prisma.itemType.findFirst).mockResolvedValue({
      id: "type-snippet",
      name: "snippet",
      icon: "Code",
      color: "#3b82f6",
    } as never);

    vi.mocked(prisma.collection.findMany).mockResolvedValue([
      { id: "col-1" },
    ] as never);

    await expect(
      createItem("user-1", {
        type: "snippet",
        title: "Unauthorized Collection Test",
        collectionIds: ["col-1", "col-other-user"],
      }),
    ).rejects.toThrow("One or more selected collections were not found");

    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it("updateItem adds new collections and removes unselected collections", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue({
      id: "item-1",
      userId: "user-1",
    } as never);

    vi.mocked(prisma.collection.findMany).mockResolvedValue([
      { id: "col-2" },
      { id: "col-3" },
    ] as never);

    vi.mocked(prisma.itemCollection.findMany).mockResolvedValue([
      { collectionId: "col-1" },
      { collectionId: "col-2" },
    ] as never);

    vi.mocked(prisma.item.update).mockResolvedValue({
      id: "item-1",
      title: "useDebounce",
      contentType: "TEXT",
      content: null,
      description: null,
      isFavorite: false,
      isPinned: false,
      language: null,
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      createdAt: now,
      updatedAt: now,
      itemTypeId: "type-snippet",
      itemType: {
        id: "type-snippet",
        name: "snippet",
        icon: "Code",
        color: "#3b82f6",
      },
      tags: [],
      collections: [
        { collection: { id: "col-2", name: "Utilities" } },
        { collection: { id: "col-3", name: "Hooks" } },
      ],
    } as never);

    const updated = await updateItem("item-1", "user-1", {
      collectionIds: ["col-2", "col-3"],
    });

    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-1" },
        data: expect.objectContaining({
          collections: {
            deleteMany: { collectionId: { in: ["col-1"] } },
            create: [{ collectionId: "col-3" }],
          },
        }),
      }),
    );

    expect(updated?.collections).toEqual([
      { id: "col-2", name: "Utilities" },
      { id: "col-3", name: "Hooks" },
    ]);
  });

  it("updateItem leaves collections untouched when collectionIds is undefined", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue({
      id: "item-1",
      userId: "user-1",
    } as never);

    vi.mocked(prisma.item.update).mockResolvedValue({
      id: "item-1",
      title: "useDebounce",
      contentType: "TEXT",
      content: null,
      description: null,
      isFavorite: true,
      isPinned: false,
      language: null,
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      createdAt: now,
      updatedAt: now,
      itemTypeId: "type-snippet",
      itemType: {
        id: "type-snippet",
        name: "snippet",
        icon: "Code",
        color: "#3b82f6",
      },
      tags: [],
      collections: [{ collection: { id: "col-1", name: "React Patterns" } }],
    } as never);

    await updateItem("item-1", "user-1", { isFavorite: true });

    expect(prisma.collection.findMany).not.toHaveBeenCalled();
    expect(prisma.itemCollection.findMany).not.toHaveBeenCalled();
    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isFavorite: true },
      }),
    );
  });
});
