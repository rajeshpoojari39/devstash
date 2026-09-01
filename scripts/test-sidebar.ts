import "dotenv/config";
import {
  getSidebarItemTypes,
  getSidebarCollections,
  getSidebarUser,
  getSidebarData,
} from "../src/lib/db/items";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🔍 Testing Sidebar DB Layer...\n");

  const [itemTypes, collections, user, fullData] = await Promise.all([
    getSidebarItemTypes(),
    getSidebarCollections(),
    getSidebarUser(),
    getSidebarData(),
  ]);

  console.log(`🏷️ System Item Types (${itemTypes.length}):`);
  for (const t of itemTypes) {
    console.log(
      `   • ${t.name.padEnd(10)} [Icon: ${t.icon}, Color: ${t.color}] -> Count: ${t.count}`,
    );
  }

  console.log(`\n📁 Collections (${collections.length}):`);
  for (const c of collections) {
    console.log(
      `   • ${c.name.padEnd(22)} [${c.isFavorite ? "⭐ Favorite" : "🕒 Recent"}] -> Dominant: ${c.dominantTypeName} (${c.dominantColor}), Items: ${c.itemCount}`,
    );
  }

  console.log(`\n👤 User Profile:`);
  console.log(
    `   • Name: ${user?.name}, Email: ${user?.email}, Pro: ${user?.isPro}`,
  );

  console.log(`\n📊 Composite Data Summary:`);
  console.log(
    `   • Types: ${fullData.itemTypes.length}, Collections: ${fullData.collections.length}, User: ${fullData.user?.name}`,
  );

  console.log("\n✅ Sidebar DB test completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Sidebar test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
