"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createItem as createItemInDb,
  updateItem as updateItemInDb,
  deleteItem as deleteItemInDb,
  ItemDetail,
} from "@/lib/db/items";
import {
  createItemSchema,
  CreateItemInput,
  updateItemSchema,
  UpdateItemInput,
  ActionResult,
} from "@/lib/validations/item";

/**
 * Server action to create a new item.
 * Validates inputs with Zod, checks session, creates the item in the database,
 * and revalidates relevant paths.
 */
export async function createItem(
  data: CreateItemInput,
): Promise<ActionResult<ItemDetail>> {
  try {
    // 1. Validate payload with Zod
    const validation = createItemSchema.safeParse(data);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const errorMessage = firstIssue
        ? firstIssue.message
        : "Invalid item payload.";
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
        error: "Unauthorized. Please sign in to create items.",
      };
    }

    // 3. Create in database
    const validatedData = validation.data;
    const created = await createItemInDb(userId, {
      type: validatedData.type,
      title: validatedData.title,
      description: validatedData.description,
      content: validatedData.content,
      url: validatedData.url,
      language: validatedData.language,
      tags: validatedData.tags,
    });

    try {
      revalidatePath("/dashboard");
      revalidatePath("/items");
      revalidatePath(`/items/${validatedData.type}`);
    } catch {
      // Ignore revalidation errors in non-request contexts (e.g. tests)
    }

    return {
      success: true,
      data: created,
    };
  } catch (error) {
    console.error("Error in createItem server action:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating the item.",
    };
  }
}

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

/**
 * Server action to delete an existing item.
 * Checks session and ownership, and deletes the item from the database.
 */
export async function deleteItem(
  itemId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!itemId || typeof itemId !== "string" || !itemId.trim()) {
      return {
        success: false,
        error: "Item ID is required.",
      };
    }

    const trimmedItemId = itemId.trim();

    // 1. Authenticate session
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
        error: "Unauthorized. Please sign in to delete items.",
      };
    }

    // 2. Delete from database
    const deleted = await deleteItemInDb(trimmedItemId, userId);

    if (!deleted) {
      return {
        success: false,
        error: "Item not found or you do not have permission to delete it.",
      };
    }

    return {
      success: true,
      data: { id: trimmedItemId },
    };
  } catch (error) {
    console.error("Error in deleteItem server action:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting the item.",
    };
  }
}

