import "dotenv/config";
import {
  getItemTypeBySlug,
  getItemsByType,
  normalizeItemTypeSlug,
  formatItemTypeTitle,
} from "../src/lib/db/items";
import { getDefaultUserId } from "../src/lib/db/collections";

async function main() {
  console.log("🔍 Testing Items by Type DB Layer...\n");

  const userId = await getDefaultUserId();
  console.log(`👤 Active User ID: ${userId}`);

  const testSlugs = [
    "snippets",
    "snippet",
    "prompts",
    "prompt",
    "commands",
    "command",
    "notes",
    "note",
    "files",
    "file",
    "images",
    "image",
    "links",
    "link",
    "non-existent-type",
  ];

  for (const slug of testSlugs) {
    const normalized = normalizeItemTypeSlug(slug);
    const itemType = await getItemTypeBySlug(slug, userId);
    if (!itemType) {
      console.log(
        `❌ Slug "${slug}" (norm: "${normalized}") -> Not Found (expected for invalid types)`,
      );
      continue;
    }

    const items = await getItemsByType(itemType.id, userId);
    const title = formatItemTypeTitle(itemType.name);
    console.log(
      `✅ Slug "${slug}" -> Type: "${itemType.name}" (${title}) | Color: ${itemType.color} | Items Count: ${items.length}`,
    );

    if (items.length > 0) {
      const first = items[0];
      console.log(
        `   Sample item: "${first.title}" (ID: ${first.id}, Tags: [${first.tags.join(", ")}])`,
      );
    }
  }

  console.log("\n✅ Items by Type DB test completed successfully!");
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
