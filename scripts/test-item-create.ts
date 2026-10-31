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

  // 4. Test File Creation
  console.log("📄 Creating test file...");
  const fileItem = await createItem(userId, {
    type: "file",
    title: "Test Created File",
    description: "Automated test file description",
    fileUrl: "https://pub-r2.test.dev/uploads/test-user/sample.pdf",
    fileName: "sample.pdf",
    fileSize: 10240,
    tags: ["test-create-tag", "file-tag"],
  });

  console.log(`   ✓ Created File ID: ${fileItem.id} (type: ${fileItem.itemType.name}, fileUrl: ${fileItem.fileUrl})`);
  if (fileItem.contentType !== "FILE" || fileItem.fileName !== "sample.pdf" || fileItem.fileSize !== 10240) {
    throw new Error(`File verification failed for ID ${fileItem.id}`);
  }

  // 5. Test Image Creation
  console.log("🖼️ Creating test image...");
  const imageItem = await createItem(userId, {
    type: "image",
    title: "Test Created Image",
    description: "Automated test image description",
    fileUrl: "https://pub-r2.test.dev/uploads/test-user/architecture.png",
    fileName: "architecture.png",
    fileSize: 20480,
    tags: ["test-create-tag", "image-tag"],
  });

  console.log(`   ✓ Created Image ID: ${imageItem.id} (type: ${imageItem.itemType.name}, fileUrl: ${imageItem.fileUrl})`);
  if (imageItem.contentType !== "FILE" || imageItem.fileName !== "architecture.png" || imageItem.fileSize !== 20480) {
    throw new Error(`Image verification failed for ID ${imageItem.id}`);
  }

  // 6. Verify fetched detail
  console.log("\n🔍 Verifying item detail via getItemById...");
  const fetchedFile = await getItemById(fileItem.id, userId);
  if (!fetchedFile || fetchedFile.fileUrl !== "https://pub-r2.test.dev/uploads/test-user/sample.pdf") {
    throw new Error(`Fetched file detail mismatch for ID ${fileItem.id}`);
  }
  console.log(`   ✓ Fetched file has fileName: ${fetchedFile.fileName}, size: ${fetchedFile.fileSize}`);

  // 7. Cleanup created items
  console.log("\n🧹 Cleaning up test items...");
  await deleteItem(snippet.id, userId);
  await deleteItem(link.id, userId);
  await deleteItem(command.id, userId);
  await deleteItem(fileItem.id, userId);
  await deleteItem(imageItem.id, userId);

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
