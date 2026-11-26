import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateCollection, deleteCollection } from "@/actions/collections";
import * as authModule from "@/auth";
import * as collectionsDbModule from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

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

vi.mock("@/lib/db/collections", () => ({
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
}));

describe("updateCollection server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation error when collectionId is missing", async () => {
    const res = await updateCollection("  ", { name: "Updated" });
    expect(res.success).toBe(false);
    expect(res.error).toContain("Collection ID is required");
    expect(collectionsDbModule.updateCollection).not.toHaveBeenCalled();
  });

  it("returns validation error when name is empty", async () => {
    const res = await updateCollection("col-1", { name: "   " });
    expect(res.success).toBe(false);
    expect(res.error).toContain("Collection name is required");
    expect(collectionsDbModule.updateCollection).not.toHaveBeenCalled();
  });

  it("returns unauthorized when user session is missing", async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as never);

    const res = await updateCollection("col-1", { name: "Updated Name" });
    expect(res.success).toBe(false);
    expect(res.error).toContain("Unauthorized");
    expect(collectionsDbModule.updateCollection).not.toHaveBeenCalled();
  });

  it("updates collection when authenticated via user id", async () => {
    const now = new Date("2026-11-26T00:00:00Z");
    vi.mocked(authModule.auth).mockResolvedValue({
      user: { id: "user-1", email: "demo@devstash.io" },
    } as never);

    const updatedRecord = {
      id: "col-1",
      name: "React Hooks",
      description: "Custom hooks",
      isFavorite: false,
      itemCount: 3,
      accentColor: "blue" as const,
      typeIcons: ["snippet"],
      createdAt: now,
      updatedAt: now,
    };

    vi.mocked(collectionsDbModule.updateCollection).mockResolvedValue(
      updatedRecord,
    );

    const res = await updateCollection("col-1", {
      name: "  React Hooks  ",
      description: "  Custom hooks  ",
    });

    expect(collectionsDbModule.updateCollection).toHaveBeenCalledWith(
      "col-1",
      "user-1",
      {
        name: "React Hooks",
        description: "Custom hooks",
      },
    );
    expect(res.success).toBe(true);
    expect(res.data).toEqual(updatedRecord);
  });

  it("falls back to email lookup when session lacks user.id", async () => {
    const now = new Date("2026-11-26T00:00:00Z");
    vi.mocked(authModule.auth).mockResolvedValue({
      user: { email: "demo@devstash.io" },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-email-1",
    } as never);
    vi.mocked(collectionsDbModule.updateCollection).mockResolvedValue({
      id: "col-1",
      name: "Clean",
      description: null,
      isFavorite: false,
      itemCount: 0,
      accentColor: "neutral",
      typeIcons: ["folder"],
      createdAt: now,
      updatedAt: now,
    });

    const res = await updateCollection("col-1", {
      name: "Clean",
      description: null,
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "demo@devstash.io" },
      select: { id: true },
    });
    expect(collectionsDbModule.updateCollection).toHaveBeenCalledWith(
      "col-1",
      "user-email-1",
      { name: "Clean", description: null },
    );
    expect(res.success).toBe(true);
  });

  it("returns error when collection is not found or not owned by user", async () => {
    vi.mocked(authModule.auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never);
    vi.mocked(collectionsDbModule.updateCollection).mockResolvedValue(null);

    const res = await updateCollection("col-other", { name: "Hijack" });
    expect(res.success).toBe(false);
    expect(res.error).toContain("not found or you do not have permission");
  });

  it("handles auth exceptions and unexpected DB errors gracefully on update", async () => {
    vi.mocked(authModule.auth).mockRejectedValue(new Error("Auth error"));
    const authFailRes = await updateCollection("col-1", { name: "Valid" });
    expect(authFailRes.success).toBe(false);
    expect(authFailRes.error).toContain("Unauthorized");

    vi.mocked(authModule.auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never);
    vi.mocked(collectionsDbModule.updateCollection).mockRejectedValue(
      new Error("DB connection error"),
    );

    const dbFailRes = await updateCollection("col-1", { name: "Valid" });
    expect(dbFailRes.success).toBe(false);
    expect(dbFailRes.error).toBe("DB connection error");
  });
});

describe("deleteCollection server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation error when collectionId is empty", async () => {
    const res = await deleteCollection(" ");
    expect(res.success).toBe(false);
    expect(res.error).toContain("Collection ID is required");
    expect(collectionsDbModule.deleteCollection).not.toHaveBeenCalled();
  });

  it("returns unauthorized when user session is missing", async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as never);

    const res = await deleteCollection("col-1");
    expect(res.success).toBe(false);
    expect(res.error).toContain("Unauthorized");
    expect(collectionsDbModule.deleteCollection).not.toHaveBeenCalled();
  });

  it("deletes collection when authenticated and owned by user", async () => {
    vi.mocked(authModule.auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never);
    vi.mocked(collectionsDbModule.deleteCollection).mockResolvedValue(true);

    const res = await deleteCollection("col-1");

    expect(collectionsDbModule.deleteCollection).toHaveBeenCalledWith(
      "col-1",
      "user-1",
    );
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ id: "col-1" });
  });

  it("returns not found error when collection is missing or belongs to another user", async () => {
    vi.mocked(authModule.auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never);
    vi.mocked(collectionsDbModule.deleteCollection).mockResolvedValue(false);

    const res = await deleteCollection("col-other");
    expect(res.success).toBe(false);
    expect(res.error).toContain("not found or you do not have permission");
  });

  it("handles unexpected DB errors gracefully on delete", async () => {
    vi.mocked(authModule.auth).mockResolvedValue({
      user: { id: "user-1" },
    } as never);
    vi.mocked(collectionsDbModule.deleteCollection).mockRejectedValue(
      new Error("Database timeout"),
    );

    const res = await deleteCollection("col-1");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Database timeout");
  });
});
