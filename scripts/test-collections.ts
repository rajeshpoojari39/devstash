import "dotenv/config";
import {
  getDashboardCollections,
  getDashboardStats,
} from "../src/lib/db/collections";

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🔍 Testing Dashboard Collections & Stats DB Layer...\n");

  const stats = await getDashboardStats();
  console.log("📊 Live Dashboard Stats:");
  console.log(`   • Total Items:          ${stats.totalItems}`);
  console.log(`   • Total Collections:    ${stats.totalCollections}`);
  console.log(`   • Favorite Items:       ${stats.favoriteItems}`);
  console.log(`   • Favorite Collections: ${stats.favoriteCollections}\n`);

  const collections = await getDashboardCollections();
  console.log(`📁 Live Dashboard Collections (${collections.length}):`);
  for (const c of collections) {
    console.log(
      `   • ${c.name} ${c.isFavorite ? "⭐" : ""}\n` +
        `     - Items Count: ${c.itemCount}\n` +
        `     - Accent Color: ${c.accentColor}\n` +
        `     - Type Icons: [${c.typeIcons.join(", ")}]\n` +
        `     - Description: "${c.description}"\n`,
    );
  }

  console.log("✅ Dashboard Collections DB test completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
