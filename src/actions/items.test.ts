import { describe, it, expect, vi, beforeEach } from "vitest";
import { createItem, updateItem, deleteItem } from "@/actions/items";
import { createItemSchema, updateItemSchema } from "@/lib/validations/item";
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
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}));

describe("createItemSchema validation", () => {
  it("validates valid snippet payload", () => {
    const validData = {
      type: "snippet" as const,
      title: "React Hook",
      description: "Custom useDebounce hook",
      content: "export function useDebounce() {}",
      language: "typescript",
      tags: ["react", "hooks"],
    };
    const result = createItemSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("React Hook");
      expect(result.data.type).toBe("snippet");
      expect(result.data.language).toBe("typescript");
      expect(result.data.tags).toEqual(["react", "hooks"]);
    }
  });

  it("validates valid prompt, command, note payload", () => {
    const validPrompt = createItemSchema.safeParse({
      type: "prompt",
      title: "System Prompt",
      content: "You are an expert developer.",
    });
    expect(validPrompt.success).toBe(true);

    const validCommand = createItemSchema.safeParse({
      type: "command",
      title: "Docker prune",
      content: "docker system prune -a --volumes",
      language: "bash",
    });
    expect(validCommand.success).toBe(true);

    const validNote = createItemSchema.safeParse({
      type: "note",
      title: "Meeting notes",
      content: "Discuss architecture roadmap",
    });
    expect(validNote.success).toBe(true);
  });

  it("validates valid link payload with required URL", () => {
    const validLink = createItemSchema.safeParse({
      type: "link",
      title: "Next.js Docs",
      url: "https://nextjs.org/docs",
      tags: ["nextjs", "documentation"],
    });
    expect(validLink.success).toBe(true);
  });

  it("fails if link type has missing or empty URL", () => {
    const missingUrl = createItemSchema.safeParse({
      type: "link",
      title: "Next.js Docs",
      url: "",
    });
    expect(missingUrl.success).toBe(false);

    const undefinedUrl = createItemSchema.safeParse({
      type: "link",
      title: "Next.js Docs",
    });
    expect(undefinedUrl.success).toBe(false);
  });

  it("fails if URL has invalid format", () => {
    const invalidUrl = createItemSchema.safeParse({
      type: "link",
      title: "Next.js Docs",
      url: "not-a-valid-url",
    });
    expect(invalidUrl.success).toBe(false);
  });

  it("fails if title is empty or only whitespace", () => {
    const invalidTitle = createItemSchema.safeParse({
      type: "snippet",
      title: "   ",
    });
    expect(invalidTitle.success).toBe(false);
  });

  it("fails if type is invalid or unsupported", () => {
    const invalidType = createItemSchema.safeParse({
      type: "unsupported_type" as unknown as "snippet",
      title: "Some Title",
    });
    expect(invalidType.success).toBe(false);
  });

  it("fails if any tag in array is empty string", () => {
    const invalidTags = createItemSchema.safeParse({
      type: "snippet",
      title: "Valid Title",
      tags: ["valid", "   "],
    });
    expect(invalidTags.success).toBe(false);
  });
});

describe("createItem server action", () => {
  const mockCreatedItem = {
    id: "item-new-123",
    title: "New Snippet",
    contentType: "TEXT",
    content: "console.log('hello');",
    description: "Sample description",
    isFavorite: false,
    isPinned: false,
    language: "javascript",
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
    tags: ["javascript"],
    collections: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error if validation fails (e.g. empty title)", async () => {
    const result = await createItem({
      type: "snippet",
      title: "   ",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns unauthorized error if user session is missing", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const result = await createItem({
      type: "snippet",
      title: "New Snippet",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("returns error if database creation fails (e.g. item type not found)", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-123", email: "user@example.com" },
      expires: "1",
    });
    vi.mocked(itemsDbModule.createItem).mockRejectedValueOnce(
      new Error("Item type 'snippet' not found."),
    );

    const result = await createItem({
      type: "snippet",
      title: "New Snippet",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Item type 'snippet' not found.");
  });

  it("successfully creates item and returns created data", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-123", email: "user@example.com" },
      expires: "1",
    });
    vi.mocked(itemsDbModule.createItem).mockResolvedValueOnce(
      mockCreatedItem as unknown as itemsDbModule.ItemDetail,
    );

    const result = await createItem({
      type: "snippet",
      title: "New Snippet",
      description: "Sample description",
      content: "console.log('hello');",
      language: "javascript",
      tags: ["javascript"],
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockCreatedItem);
    expect(itemsDbModule.createItem).toHaveBeenCalledWith("user-123", {
      type: "snippet",
      title: "New Snippet",
      description: "Sample description",
      content: "console.log('hello');",
      language: "javascript",
      tags: ["javascript"],
      url: undefined,
    });
  });
});

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

