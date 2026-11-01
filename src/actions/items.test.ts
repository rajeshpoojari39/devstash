import { describe, it, expect, vi, beforeEach } from "vitest";
import { createItem, updateItem, deleteItem, toggleItemFavorite, toggleItemPin } from "@/actions/items";
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
    item: {
      findFirst: vi.fn(),
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

  it("validates valid file and image payloads", () => {
    const validFile = createItemSchema.safeParse({
      type: "file",
      title: "Quarterly Report",
      fileUrl: "https://pub-r2.test.dev/uploads/user-123/report.pdf",
      fileName: "report.pdf",
      fileSize: 102400,
      tags: ["finance"],
    });
    expect(validFile.success).toBe(true);

    const validImage = createItemSchema.safeParse({
      type: "image",
      title: "Architecture Diagram",
      fileUrl: "https://pub-r2.test.dev/uploads/user-123/arch.png",
      fileName: "arch.png",
      fileSize: 204800,
    });
    expect(validImage.success).toBe(true);
  });

  it("fails if file or image type has missing or empty fileUrl", () => {
    const missingFileUrl = createItemSchema.safeParse({
      type: "file",
      title: "Doc Without File",
      fileUrl: "",
    });
    expect(missingFileUrl.success).toBe(false);

    const missingImageUrl = createItemSchema.safeParse({
      type: "image",
      title: "Image Without File",
    });
    expect(missingImageUrl.success).toBe(false);
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
      fileUrl: undefined,
      fileName: undefined,
      fileSize: undefined,
    });
  });

  it("successfully creates a file item with fileUrl and metadata", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-123", email: "user@example.com" },
      expires: "1",
    });

    const mockFileItem = {
      id: "item-file-1",
      title: "Design System",
      contentType: "FILE",
      fileUrl: "https://pub-r2.test.dev/uploads/user-123/design.pdf",
      fileName: "design.pdf",
      fileSize: 512000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(itemsDbModule.createItem).mockResolvedValueOnce(
      mockFileItem as unknown as itemsDbModule.ItemDetail,
    );

    const result = await createItem({
      type: "file",
      title: "Design System",
      fileUrl: "https://pub-r2.test.dev/uploads/user-123/design.pdf",
      fileName: "design.pdf",
      fileSize: 512000,
      tags: ["design"],
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockFileItem);
    expect(itemsDbModule.createItem).toHaveBeenCalledWith("user-123", {
      type: "file",
      title: "Design System",
      description: undefined,
      content: undefined,
      url: undefined,
      language: undefined,
      tags: ["design"],
      fileUrl: "https://pub-r2.test.dev/uploads/user-123/design.pdf",
      fileName: "design.pdf",
      fileSize: 512000,
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
      isFavorite: true,
      isPinned: false,
    };
    const result = updateItemSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Updated Title");
      expect(result.data.tags).toEqual(["react", "frontend"]);
      expect(result.data.isFavorite).toBe(true);
      expect(result.data.isPinned).toBe(false);
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


describe("toggleItemFavorite server action", () => {
  const mockItemDetail = {
    id: "item-123",
    title: "Item 123",
    isFavorite: true,
    isPinned: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error if item ID is missing", async () => {
    const result = await toggleItemFavorite("");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Item ID is required.");
  });

  it("returns unauthorized error if user session is missing", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const result = await toggleItemFavorite("item-123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("toggles favorite state based on existing item in db when targetState is omitted", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-123", email: "user@example.com" },
      expires: "1",
    });
    vi.mocked(prisma.item.findFirst).mockResolvedValueOnce({
      isFavorite: false,
    } as unknown as Awaited<ReturnType<typeof prisma.item.findFirst>>);
    vi.mocked(itemsDbModule.updateItem).mockResolvedValueOnce(
      mockItemDetail as unknown as itemsDbModule.ItemDetail
    );

    const result = await toggleItemFavorite("item-123");
    expect(result.success).toBe(true);
    expect(itemsDbModule.updateItem).toHaveBeenCalledWith(
      "item-123",
      "user-123",
      { isFavorite: true }
    );
  });

  it("sets explicit favorite state when targetState is provided", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-123", email: "user@example.com" },
      expires: "1",
    });
    vi.mocked(itemsDbModule.updateItem).mockResolvedValueOnce(
      mockItemDetail as unknown as itemsDbModule.ItemDetail
    );

    const result = await toggleItemFavorite("item-123", false);
    expect(result.success).toBe(true);
    expect(itemsDbModule.updateItem).toHaveBeenCalledWith(
      "item-123",
      "user-123",
      { isFavorite: false }
    );
  });
});

describe("toggleItemPin server action", () => {
  const mockItemDetail = {
    id: "item-123",
    title: "Item 123",
    isFavorite: false,
    isPinned: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error if item ID is missing", async () => {
    const result = await toggleItemPin("");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Item ID is required.");
  });

  it("returns unauthorized error if user session is missing", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const result = await toggleItemPin("item-123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("toggles pin state based on existing item in db when targetState is omitted", async () => {
    (authModule.auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-123", email: "user@example.com" },
      expires: "1",
    });
    vi.mocked(prisma.item.findFirst).mockResolvedValueOnce({
      isPinned: false,
    } as unknown as Awaited<ReturnType<typeof prisma.item.findFirst>>);
    vi.mocked(itemsDbModule.updateItem).mockResolvedValueOnce(
      mockItemDetail as unknown as itemsDbModule.ItemDetail
    );

    const result = await toggleItemPin("item-123");
    expect(result.success).toBe(true);
    expect(itemsDbModule.updateItem).toHaveBeenCalledWith(
      "item-123",
      "user-123",
      { isPinned: true }
    );
  });
});
