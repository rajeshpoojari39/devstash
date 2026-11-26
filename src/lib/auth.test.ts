import { describe, it, expect, vi, beforeEach } from "vitest";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUserId,
  requireAuthenticatedUserId,
} from "@/lib/auth";

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

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("auth session helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const userId = await getAuthenticatedUserId();

    expect(userId).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns session.user.id directly when present without querying Prisma", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123", email: "demo@devstash.io" },
    } as never);

    const userId = await getAuthenticatedUserId();

    expect(userId).toBe("user-123");
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("falls back to Prisma email lookup when session.user.id is missing", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "demo@devstash.io" },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-from-db",
    } as never);

    const userId = await getAuthenticatedUserId();

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "demo@devstash.io" },
      select: { id: true },
    });
    expect(userId).toBe("user-from-db");
  });

  it("returns null if auth() throws", async () => {
    vi.mocked(auth).mockRejectedValue(new Error("Session failure"));

    const userId = await getAuthenticatedUserId();

    expect(userId).toBeNull();
  });

  it("returns null when email fallback finds no matching user", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "missing@devstash.io" },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const userId = await getAuthenticatedUserId();

    expect(userId).toBeNull();
  });

  it("returns null when session.user has neither id nor email", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {},
    } as never);

    const userId = await getAuthenticatedUserId();

    expect(userId).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("requireAuthenticatedUserId returns userId when authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-999" },
    } as never);

    const userId = await requireAuthenticatedUserId("/collections");

    expect(userId).toBe("user-999");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("requireAuthenticatedUserId redirects to sign-in with encoded callbackUrl when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(
      requireAuthenticatedUserId("/collections/col-1"),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith(
      "/sign-in?callbackUrl=%2Fcollections%2Fcol-1",
    );
  });
});
