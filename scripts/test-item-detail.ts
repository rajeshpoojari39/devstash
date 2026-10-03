import "dotenv/config";
import { getDashboardRecentItems, getItemById } from "../src/lib/db/items";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🔍 Testing Item Detail DB Layer...\n");

  const recentItems = await getDashboardRecentItems(undefined, 1);
  if (recentItems.length === 0) {
    console.log("⚠️ No items found in database to test.");
    return;
  }

  const sampleItemId = recentItems[0].id;
  console.log(`Fetching item details for ID: ${sampleItemId}`);

  const item = await getItemById(sampleItemId);
  if (!item) {
    throw new Error(`Item ${sampleItemId} not found!`);
  }

  console.log("📄 Item Detail Result:");
  console.log(`   • Title: ${item.title}`);
  console.log(`   • Content Type: ${item.contentType}`);
  console.log(`   • Item Type: ${item.itemType.name} (${item.itemType.color})`);
  console.log(`   • Is Favorite: ${item.isFavorite}`);
  console.log(`   • Is Pinned: ${item.isPinned}`);
  console.log(`   • Language: ${item.language ?? "N/A"}`);
  console.log(`   • Description: ${item.description ?? "N/A"}`);
  console.log(`   • Tags: [${item.tags.join(", ")}]`);
  console.log(
    `   • Collections: [${item.collections.map((c) => c.name).join(", ")}]`,
  );
  console.log(`   • Created At: ${item.createdAt.toISOString()}`);
  console.log(
    `   • Content Preview: ${item.content ? item.content.slice(0, 50) + "..." : "N/A"}`,
  );

  console.log("\n✅ Item Detail DB test completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
