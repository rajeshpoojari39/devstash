import "dotenv/config";
import {
  deleteItem,
  getItemById,
  getItemTypeBySlug,
} from "../src/lib/db/items";
import { getDefaultUserId } from "../src/lib/db/collections";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🔍 Testing Item Deletion DB Layer...\n");

  const userId = await getDefaultUserId();
  if (!userId) {
    throw new Error("No default user found to test item deletion.");
  }

  const itemType = await getItemTypeBySlug("snippet", userId);
  if (!itemType) {
    throw new Error("Snippet item type not found.");
  }

  // 1. Create a temporary test item
  console.log("➕ Creating temporary test item...");
  const testItem = await prisma.item.create({
    data: {
      title: "Temporary Test Item for Deletion",
      description: "Will be deleted by test-item-delete.ts",
      contentType: "TEXT",
      content: "console.log('temporary');",
      language: "typescript",
      userId,
      itemTypeId: itemType.id,
      tags: {
        connectOrCreate: [
          { where: { name: "test-delete" }, create: { name: "test-delete" } },
        ],
      },
    },
  });

  console.log(`   Created test item with ID: ${testItem.id}`);

  // 2. Verify it exists
  const retrieved = await getItemById(testItem.id, userId);
  if (!retrieved) {
    throw new Error("Test item could not be retrieved after creation.");
  }
  console.log("   Verified item exists in database.");

  // 3. Test unauthorized deletion (different userId)
  console.log("\n🔒 Testing deletion with invalid userId...");
  const unauthorizedResult = await deleteItem(testItem.id, "invalid-user-id");
  if (unauthorizedResult !== false) {
    throw new Error(
      "deleteItem should return false when userId does not match.",
    );
  }
  console.log("   ✅ Unauthorized deletion properly rejected.");

  // 4. Test authorized deletion
  console.log("\n🗑️ Deleting test item with valid userId...");
  const deleteResult = await deleteItem(testItem.id, userId);
  if (deleteResult !== true) {
    throw new Error("deleteItem failed to delete valid item.");
  }
  console.log("   ✅ Item deleted successfully.");

  // 5. Verify it is gone
  const verifyDeleted = await getItemById(testItem.id, userId);
  if (verifyDeleted !== null) {
    throw new Error("Item still exists after deletion!");
  }
  console.log("   ✅ Verified item no longer exists in database.");

  // 6. Test deleting non-existent item
  console.log("\n🔎 Testing deletion of non-existent ID...");
  const notFoundResult = await deleteItem(testItem.id, userId);
  if (notFoundResult !== false) {
    throw new Error("deleteItem should return false for already deleted item.");
  }
  console.log("   ✅ Non-existent item deletion properly returned false.");

  console.log("\n✅ Item Delete DB test completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
