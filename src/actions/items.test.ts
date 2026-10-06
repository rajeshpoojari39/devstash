import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateItem, deleteItem } from "@/actions/items";
import { updateItemSchema } from "@/lib/validations/item";
import * as authModule from "@/auth";
import * as itemsDbModule from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

// Mock dependencies
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/items", () => ({
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}));

describe("updateItemSchema validation", () => {
  it("validates valid payload", () => {
    const validData = {
      title: "Updated Title",
      description: "Updated description",
      content: "const a = 1;",
      url: "https://example.com",
      language: "typescript",
      tags: ["react", "frontend"],
    };
    const result = updateItemSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Updated Title");
      expect(result.data.tags).toEqual(["react", "frontend"]);
    }
  });

  it("fails if title is empty or only whitespace", () => {
    const invalidData = {
      title: "   ",
    };
    const result = updateItemSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("allows empty string or valid URL for url field", () => {
    const withEmptyUrl = updateItemSchema.safeParse({
      title: "Valid Title",
      url: "",
    });
    expect(withEmptyUrl.success).toBe(true);

    const withValidUrl = updateItemSchema.safeParse({
      title: "Valid Title",
      url: "https://github.com",
    });
    expect(withValidUrl.success).toBe(true);

    const withInvalidUrl = updateItemSchema.safeParse({
      title: "Valid Title",
      url: "not-a-valid-url",
    });
    expect(withInvalidUrl.success).toBe(false);
  });

  it("fails if any tag in array is empty string", () => {
    const invalidTags = {
      title: "Valid Title",
      tags: ["valid", "   "],
    };
    const result = updateItemSchema.safeParse(invalidTags);
    expect(result.success).toBe(false);
  });
});

describe("updateItem server action", () => {
  const mockItemDetail = {
    id: "item-123",
    title: "Updated Item",
    contentType: "TEXT",
    content: "Updated content",
    description: "New description",
    isFavorite: false,
    isPinned: false,
    language: "typescript",
    url: null,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    itemTypeId: "type-snippet",
    itemType: {
      id: "type-snippet",
      name: "snippet",
      icon: "Code",
      color: "#3b82f6",
    },
    tags: ["react", "hooks"],
    collections: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error if itemId is missing", async () => {
    const result = await updateItem("", { title: "New Title" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Item ID is required.");
  });

  it("returns error if title is empty", async () => {
    const result = await updateItem("item-123", { title: "   " });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns unauthorized error if user session is missing", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const result = await updateItem("item-123", { title: "New Title" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("returns error if item is not found or not owned by user", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-123", email: "user@example.com" },
      expires: "1",
    });
    vi.mocked(itemsDbModule.updateItem).mockResolvedValueOnce(null);

    const result = await updateItem("item-123", { title: "New Title" });
    expect(result.success).toBe(false);
    expect(result.error).toContain(
      "Item not found or you do not have permission",
    );
  });

  it("successfully updates item and returns updated data", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-123", email: "user@example.com" },
      expires: "1",
    });
    vi.mocked(itemsDbModule.updateItem).mockResolvedValueOnce(
      mockItemDetail as unknown as itemsDbModule.ItemDetail,
    );

    const result = await updateItem("item-123", {
      title: "Updated Item",
      description: "New description",
      content: "Updated content",
      language: "typescript",
      tags: ["react", "hooks"],
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockItemDetail);
    expect(itemsDbModule.updateItem).toHaveBeenCalledWith(
      "item-123",
      "user-123",
      expect.objectContaining({
        title: "Updated Item",
        description: "New description",
        content: "Updated content",
        language: "typescript",
        tags: ["react", "hooks"],
      }),
    );
  });
});

describe("deleteItem server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error if itemId is missing or empty string", async () => {
    const resultEmpty = await deleteItem("");
    expect(resultEmpty.success).toBe(false);
    expect(resultEmpty.error).toBe("Item ID is required.");

    const resultWhitespace = await deleteItem("   ");
    expect(resultWhitespace.success).toBe(false);
    expect(resultWhitespace.error).toBe("Item ID is required.");
  });

  it("returns unauthorized error if user session is missing", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const result = await deleteItem("item-123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("returns error if item is not found or not owned by user", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-123", email: "user@example.com" },
      expires: "1",
    });
    vi.mocked(itemsDbModule.deleteItem).mockResolvedValueOnce(false);

    const result = await deleteItem("item-123");
    expect(result.success).toBe(false);
    expect(result.error).toContain(
      "Item not found or you do not have permission",
    );
    expect(itemsDbModule.deleteItem).toHaveBeenCalledWith("item-123", "user-123");
  });

  it("successfully deletes item and returns item id", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-123", email: "user@example.com" },
      expires: "1",
    });
    vi.mocked(itemsDbModule.deleteItem).mockResolvedValueOnce(true);

    const result = await deleteItem("item-123");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: "item-123" });
    expect(itemsDbModule.deleteItem).toHaveBeenCalledWith("item-123", "user-123");
  });

  it("handles unexpected database exceptions gracefully", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-123", email: "user@example.com" },
      expires: "1",
    });
    vi.mocked(itemsDbModule.deleteItem).mockRejectedValueOnce(
      new Error("Database connection lost"),
    );

    const result = await deleteItem("item-123");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Database connection lost");
  });
});

