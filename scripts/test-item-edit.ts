import "dotenv/config";
import {
  getDashboardRecentItems,
  getItemById,
  updateItem,
} from "../src/lib/db/items";
import { getDefaultUserId } from "../src/lib/db/collections";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🔍 Testing Item Edit / Update DB Layer...\n");

  const userId = await getDefaultUserId();
  if (!userId) {
    throw new Error("No default user found to test item edit.");
  }

  const recentItems = await getDashboardRecentItems(userId, 1);
  if (recentItems.length === 0) {
    console.log("⚠️ No items found in database to test.");
    return;
  }

  const targetItem = recentItems[0];
  const initialDetail = await getItemById(targetItem.id, userId);
  if (!initialDetail) {
    throw new Error(`Initial item detail not found for ID: ${targetItem.id}`);
  }

  console.log(
    `Original Item: "${initialDetail.title}" (tags: [${initialDetail.tags.join(", ")}])`,
  );

  // 1. Perform update
  const testTitle = `${initialDetail.title} (Updated Test)`;
  const testTags = ["test-edit-tag-1", "test-edit-tag-2"];
  const testDescription = "Updated test description for verification";

  console.log(`\n✏️ Updating item ID ${targetItem.id}...`);
  const updated = await updateItem(targetItem.id, userId, {
    title: testTitle,
    description: testDescription,
    tags: testTags,
  });

  if (!updated) {
    throw new Error("updateItem returned null!");
  }

  console.log("📄 Updated Item Result:");
  console.log(`   • Title: ${updated.title}`);
  console.log(`   • Description: ${updated.description}`);
  console.log(`   • Tags: [${updated.tags.join(", ")}]`);

  if (updated.title !== testTitle) {
    throw new Error(
      `Title mismatch: expected "${testTitle}", got "${updated.title}"`,
    );
  }
  if (
    !updated.tags.includes("test-edit-tag-1") ||
    !updated.tags.includes("test-edit-tag-2")
  ) {
    throw new Error(
      `Tags mismatch: expected [test-edit-tag-1, test-edit-tag-2], got [${updated.tags.join(", ")}]`,
    );
  }

  // 2. Revert back to original
  console.log("\n🔄 Reverting item to original state...");
  const reverted = await updateItem(targetItem.id, userId, {
    title: initialDetail.title,
    description: initialDetail.description,
    content: initialDetail.content,
    language: initialDetail.language,
    url: initialDetail.url,
    tags: initialDetail.tags,
  });

  if (!reverted || reverted.title !== initialDetail.title) {
    throw new Error("Failed to revert item to original state!");
  }

  console.log("✅ Successfully reverted item state.");
  console.log("\n✅ Item Edit DB test completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
