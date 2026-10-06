import "dotenv/config";
import {
  createItem,
  getItemById,
  deleteItem,
} from "../src/lib/db/items";
import { getDefaultUserId } from "../src/lib/db/collections";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🔍 Testing Item Create DB Layer...\n");

  const userId = await getDefaultUserId();
  if (!userId) {
    throw new Error("No default user found to test item create.");
  }

  // 1. Test Snippet Creation
  console.log("📝 Creating test snippet...");
  const snippet = await createItem(userId, {
    type: "snippet",
    title: "Test Created Snippet",
    description: "Automated test snippet description",
    content: "const testValue = 42;",
    language: "typescript",
    tags: ["test-create-tag", "snippet-tag"],
  });

  console.log(`   ✓ Created Snippet ID: ${snippet.id} (type: ${snippet.itemType.name})`);
  if (snippet.title !== "Test Created Snippet" || snippet.contentType !== "TEXT") {
    throw new Error(`Snippet verification failed for ID ${snippet.id}`);
  }

  // 2. Test Link Creation
  console.log("🔗 Creating test link...");
  const link = await createItem(userId, {
    type: "link",
    title: "Test Created Link",
    description: "Automated test link description",
    url: "https://example.com/test-docs",
    tags: ["test-create-tag", "link-tag"],
  });

  console.log(`   ✓ Created Link ID: ${link.id} (type: ${link.itemType.name}, url: ${link.url})`);
  if (link.contentType !== "URL" || link.url !== "https://example.com/test-docs") {
    throw new Error(`Link verification failed for ID ${link.id}`);
  }

  // 3. Test Command Creation
  console.log("💻 Creating test command...");
  const command = await createItem(userId, {
    type: "command",
    title: "Test Created Command",
    content: "docker run -d -p 80:80 nginx",
    language: "bash",
    tags: ["test-create-tag", "docker"],
  });

  console.log(`   ✓ Created Command ID: ${command.id}`);

  // 4. Verify fetched detail
  console.log("\n🔍 Verifying item detail via getItemById...");
  const fetchedSnippet = await getItemById(snippet.id, userId);
  if (!fetchedSnippet || fetchedSnippet.tags.length !== 2) {
    throw new Error(`Fetched snippet detail mismatch for ID ${snippet.id}`);
  }
  console.log(`   ✓ Fetched snippet has tags: [${fetchedSnippet.tags.join(", ")}]`);

  // 5. Cleanup created items
  console.log("\n🧹 Cleaning up test items...");
  await deleteItem(snippet.id, userId);
  await deleteItem(link.id, userId);
  await deleteItem(command.id, userId);

  const verifyDeleted = await getItemById(snippet.id, userId);
  if (verifyDeleted) {
    throw new Error("Failed to delete test snippet during cleanup.");
  }
  console.log("   ✓ Successfully cleaned up all test items.");

  console.log("\n✅ Item Create DB test completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
