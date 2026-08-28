import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function testDatabase() {
  console.log("🔍 Testing Neon PostgreSQL + Prisma 7 Connection...\n");

  try {
    // 1. Verify connection by querying system item types
    console.log("1. Querying system item types...");
    const systemTypes = await prisma.itemType.findMany({
      where: { isSystem: true },
      orderBy: { name: "asc" },
    });

    console.log(`✅ Found ${systemTypes.length} system item types:`);
    systemTypes.forEach((type) => {
      console.log(
        `   - ${type.name} (icon: ${type.icon}, color: ${type.color})`,
      );
    });

    // 2. Test User Creation & Relations
    console.log("\n2. Testing User, Collection, and Item CRUD operations...");
    const testEmail = `test_${Date.now()}@devstash.local`;

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Test Developer",
        isPro: true,
      },
    });
    console.log(
      `✅ Created test user: ${user.name} (${user.email}) [ID: ${user.id}]`,
    );

    // 3. Create a collection
    const collection = await prisma.collection.create({
      data: {
        name: "Test Collection",
        description: "A test collection for DB verification",
        userId: user.id,
      },
    });
    console.log(
      `✅ Created test collection: ${collection.name} [ID: ${collection.id}]`,
    );

    // 4. Create an item linked to a system type and the collection
    const snippetType =
      systemTypes.find((t) => t.name === "snippet") || systemTypes[0];
    const item = await prisma.item.create({
      data: {
        title: "Test Snippet",
        contentType: "TEXT",
        content: "console.log('Hello DevStash!');",
        language: "typescript",
        userId: user.id,
        itemTypeId: snippetType.id,
        collections: {
          create: {
            collectionId: collection.id,
          },
        },
        tags: {
          create: [{ name: "test-tag" }],
        },
      },
      include: {
        itemType: true,
        collections: {
          include: {
            collection: true,
          },
        },
        tags: true,
      },
    });
    console.log(
      `✅ Created test item: "${item.title}" with type "${item.itemType.name}"`,
    );
    console.log(
      `   - Linked collection: ${item.collections[0]?.collection.name}`,
    );
    console.log(`   - Linked tag: ${item.tags.map((t) => t.name).join(", ")}`);

    // 5. Clean up test data (Cascade delete will remove linked item, collection, itemCollections)
    console.log("\n3. Testing cascade delete and cleanup...");
    await prisma.user.delete({
      where: { id: user.id },
    });
    console.log(
      "✅ Successfully deleted test user and cascade-deleted related records.",
    );

    // Clean up test tag if created
    await prisma.tag.deleteMany({
      where: { name: "test-tag" },
    });

    console.log("\n🎉 All database tests passed successfully!\n");
  } catch (error) {
    console.error("❌ Database test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
