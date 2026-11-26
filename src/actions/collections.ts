"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  updateCollection as updateCollectionInDb,
  deleteCollection as deleteCollectionInDb,
  DashboardCollection,
} from "@/lib/db/collections";
import {
  updateCollectionSchema,
  UpdateCollectionInput,
  ActionResult,
} from "@/lib/validations/collection";

async function resolveSessionUserId(): Promise<string | null> {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  let userId = session?.user?.id;

  if (!userId && session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id;
  }

  return userId ?? null;
}

function revalidateCollectionRoutes(collectionId: string) {
  try {
    revalidatePath("/dashboard");
    revalidatePath("/collections");
    revalidatePath(`/collections/${collectionId}`);
    revalidatePath("/items");
  } catch {
    // Ignore revalidation errors in non-request contexts (e.g. unit tests)
  }
}

/**
 * Server action to update a collection's metadata (name and description).
 * Validates inputs with Zod, checks authenticated ownership, updates in DB,
 * and revalidates affected routes.
 */
export async function updateCollection(
  collectionId: string,
  data: UpdateCollectionInput,
): Promise<ActionResult<DashboardCollection>> {
  try {
    if (!collectionId || typeof collectionId !== "string" || !collectionId.trim()) {
      return {
        success: false,
        error: "Collection ID is required.",
      };
    }

    const validation = updateCollectionSchema.safeParse(data);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      return {
        success: false,
        error: firstIssue ? firstIssue.message : "Invalid collection payload.",
      };
    }

    const userId = await resolveSessionUserId();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized. Please sign in to edit collections.",
      };
    }

    const trimmedId = collectionId.trim();
    const updated = await updateCollectionInDb(trimmedId, userId, {
      name: validation.data.name,
      description: validation.data.description,
    });

    if (!updated) {
      return {
        success: false,
        error: "Collection not found or you do not have permission to edit it.",
      };
    }

    revalidateCollectionRoutes(trimmedId);

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Error in updateCollection server action:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating the collection.",
    };
  }
}

/**
 * Server action to delete a collection owned by the current user.
 * Items inside the collection are NOT deleted — only their membership in the collection is removed.
 */
export async function deleteCollection(
  collectionId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!collectionId || typeof collectionId !== "string" || !collectionId.trim()) {
      return {
        success: false,
        error: "Collection ID is required.",
      };
    }

    const userId = await resolveSessionUserId();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized. Please sign in to delete collections.",
      };
    }

    const trimmedId = collectionId.trim();
    const deleted = await deleteCollectionInDb(trimmedId, userId);

    if (!deleted) {
      return {
        success: false,
        error:
          "Collection not found or you do not have permission to delete it.",
      };
    }

    revalidateCollectionRoutes(trimmedId);

    return {
      success: true,
      data: { id: trimmedId },
    };
  } catch (error) {
    console.error("Error in deleteCollection server action:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting the collection.",
    };
  }
}
