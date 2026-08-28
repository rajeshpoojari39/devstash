import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function testDatabase() {
  console.log("🔍 DevStash Database Verification & Demo Data Explorer\n");

  try {
    // 1. Query System Item Types
    console.log("==================================================");
    console.log("📦 1. SYSTEM ITEM TYPES");
    console.log("==================================================");
    const systemTypes = await prisma.itemType.findMany({
      where: { isSystem: true },
      orderBy: { name: "asc" },
    });

    console.log(`✅ Found ${systemTypes.length} system item types:`);
    systemTypes.forEach((type) => {
      console.log(
        `   • [${type.name.toUpperCase()}] Icon: ${type.icon.padEnd(12)} Color: ${type.color} (ID: ${type.id})`,
      );
    });

    // 2. Query Demo User
    console.log("\n==================================================");
    console.log("👤 2. DEMO USER");
    console.log("==================================================");
    const demoUser = await prisma.user.findUnique({
      where: { email: "demo@devstash.io" },
      include: {
        _count: {
          select: {
            items: true,
            collections: true,
          },
        },
      },
    });

    if (!demoUser) {
      throw new Error(
        "Demo user (demo@devstash.io) not found! Run 'npm run db:seed' or 'npx tsx prisma/seed.ts' first.",
      );
    }

    console.log(`✅ User found:`);
    console.log(`   • ID:             ${demoUser.id}`);
    console.log(`   • Name:           ${demoUser.name}`);
    console.log(`   • Email:          ${demoUser.email}`);
    console.log(
      `   • Password Hash:  ${demoUser.password ? `${demoUser.password.slice(0, 15)}... (bcrypt)` : "None"}`,
    );
    console.log(`   • isPro:          ${demoUser.isPro}`);
    console.log(
      `   • Email Verified: ${demoUser.emailVerified?.toISOString()}`,
    );
    console.log(`   • Total Collections: ${demoUser._count.collections}`);
    console.log(`   • Total Items:       ${demoUser._count.items}`);

    // 3. Query Collections & Items
    console.log("\n==================================================");
    console.log("📂 3. COLLECTIONS & ITEMS");
    console.log("==================================================");
    const collections = await prisma.collection.findMany({
      where: { userId: demoUser.id },
      include: {
        defaultType: true,
        items: {
          include: {
            item: {
              include: {
                itemType: true,
                tags: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(`✅ Found ${collections.length} collections for Demo User:\n`);

    collections.forEach((col, index) => {
      const favBadge = col.isFavorite ? "⭐ [FAVORITE]" : "";
      const defaultTypeBadge = col.defaultType
        ? `(Default Type: ${col.defaultType.name})`
        : "";
      console.log(
        `${index + 1}. 📁 ${col.name} ${favBadge} ${defaultTypeBadge}`,
      );
      if (col.description) {
        console.log(`   Description: "${col.description}"`);
      }
      console.log(`   Items (${col.items.length}):`);

      col.items.forEach(({ item }) => {
        const itemFav = item.isFavorite ? "⭐" : "";
        const itemPin = item.isPinned ? "📌" : "";
        const tags = item.tags.map((t) => `#${t.name}`).join(" ");
        const preview =
          item.contentType === "URL"
            ? `URL: ${item.url}`
            : item.content
              ? `Preview: "${item.content.split("\n")[0].slice(0, 60)}..."`
              : "No content";

        console.log(
          `     ↳ [${item.itemType.name.toUpperCase()}] ${item.title} ${itemPin}${itemFav}`,
        );
        console.log(
          `       - Type: ${item.contentType} | Lang: ${item.language || "N/A"} | Tags: ${tags || "None"}`,
        );
        console.log(`       - ${preview}`);
      });
      console.log("");
    });

    // 4. Tags Summary
    console.log("==================================================");
    console.log("🏷️ 4. ALL SEEDED TAGS");
    console.log("==================================================");
    const allTags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { name: "asc" },
    });

    console.log(`✅ Found ${allTags.length} unique tags in the database:`);
    const tagList = allTags
      .map((t) => `${t.name} (${t._count.items})`)
      .join(", ");
    console.log(`   ${tagList}\n`);

    // 5. Verification Checklist
    console.log("==================================================");
    console.log("🎯 5. DATA INTEGRITY CHECKLIST");
    console.log("==================================================");
    const checks = [
      {
        name: "System Item Types (expected: 7)",
        passed: systemTypes.length === 7,
      },
      { name: "Demo User Exists", passed: !!demoUser },
      {
        name: "Demo User Collections (expected: 5)",
        passed: collections.length === 5,
      },
      {
        name: "Demo User Items (expected: 18)",
        passed: demoUser._count.items === 18,
      },
      {
        name: "All Items have ItemType",
        passed: collections.every((c) =>
          c.items.every((i) => !!i.item.itemType),
        ),
      },
      {
        name: "All Items have Tags",
        passed: collections.every((c) =>
          c.items.every((i) => i.item.tags.length > 0),
        ),
      },
    ];

    checks.forEach((check) => {
      console.log(`   ${check.passed ? "✅" : "❌"} ${check.name}`);
    });

    const allPassed = checks.every((c) => c.passed);
    if (allPassed) {
      console.log("\n🎉 All verification checks passed perfectly!\n");
    } else {
      console.warn("\n⚠️ Some checks failed. Please check the output above.\n");
    }
  } catch (error) {
    console.error("❌ Database test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
