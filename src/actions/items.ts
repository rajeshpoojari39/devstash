"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateItem as updateItemInDb, ItemDetail } from "@/lib/db/items";
import {
  updateItemSchema,
  UpdateItemInput,
  ActionResult,
} from "@/lib/validations/item";

/**
 * Server action to update an existing item's details.
 * Validates inputs with Zod, checks session and ownership, and updates the database.
 */
export async function updateItem(
  itemId: string,
  data: UpdateItemInput,
): Promise<ActionResult<ItemDetail>> {
  try {
    if (!itemId || typeof itemId !== "string") {
      return {
        success: false,
        error: "Item ID is required.",
      };
    }

    // 1. Validate payload with Zod
    const validation = updateItemSchema.safeParse(data);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const errorMessage = firstIssue
        ? firstIssue.message
        : "Invalid update payload.";
      return {
        success: false,
        error: errorMessage,
      };
    }

    // 2. Authenticate session
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

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized. Please sign in to update items.",
      };
    }

    // 3. Update in database
    const validatedData = validation.data;
    const updated = await updateItemInDb(itemId, userId, {
      title: validatedData.title,
      description: validatedData.description,
      content: validatedData.content,
      url: validatedData.url,
      language: validatedData.language,
      tags: validatedData.tags,
    });

    if (!updated) {
      return {
        success: false,
        error: "Item not found or you do not have permission to edit it.",
      };
    }

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Error in updateItem server action:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating the item.",
    };
  }
}
