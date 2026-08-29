import "dotenv/config";
import {
  getDashboardPinnedItems,
  getDashboardRecentItems,
} from "../src/lib/db/items";

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🔍 Testing Dashboard Items DB Layer...\n");

  const pinnedItems = await getDashboardPinnedItems();
  console.log(`📌 Pinned Items (${pinnedItems.length}):`);
  for (const item of pinnedItems) {
    console.log(
      `   • [${item.itemType.name.toUpperCase()}] ${item.title} ${item.isFavorite ? "⭐" : ""}\n` +
        `     - ID: ${item.id}\n` +
        `     - Type Icon: ${item.itemType.icon} (${item.itemType.color})\n` +
        `     - Tags: [${item.tags.join(", ")}]\n` +
        `     - Language: ${item.language ?? "N/A"}\n` +
        `     - Description: "${item.description ?? ""}"\n`,
    );
  }

  const recentItems = await getDashboardRecentItems(undefined, 10);
  console.log(`\n🕒 Recent Items (Top ${recentItems.length}):`);
  for (const item of recentItems) {
    console.log(
      `   • [${item.itemType.name.toUpperCase()}] ${item.title} ${item.isPinned ? "📌" : ""} ${item.isFavorite ? "⭐" : ""}\n` +
        `     - Created: ${item.createdAt.toISOString()}\n` +
        `     - Tags: [${item.tags.join(", ")}]\n`,
    );
  }

  console.log("✅ Dashboard Items DB test completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
