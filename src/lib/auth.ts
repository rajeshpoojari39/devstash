import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Resolves the authenticated user's ID from the current NextAuth session,
 * falling back to a Prisma email lookup if the session lacks `user.id`.
 * Memoized per request via `React.cache`.
 */
export const getAuthenticatedUserId = cache(
  async (): Promise<string | null> => {
    let session = null;
    try {
      session = await auth();
    } catch {
      session = null;
    }

    if (!session?.user) {
      return null;
    }

    if (session.user.id) {
      return session.user.id;
    }

    if (session.user.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      return user?.id ?? null;
    }

    return null;
  },
);

/**
 * Ensures an authenticated user ID is available for the current request,
 * redirecting to `/sign-in` with a `callbackUrl` otherwise.
 */
export async function requireAuthenticatedUserId(
  callbackUrl: string = "/dashboard",
): Promise<string> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return userId;
}
