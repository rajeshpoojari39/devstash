import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  getProfilePageData,
  changeUserPassword,
  deleteUserAccount,
} from "../src/lib/db/profile";
import { POST as changePasswordHandler } from "../src/app/api/user/change-password/route";
import { DELETE as deleteAccountHandler } from "../src/app/api/user/account/route";
import { prisma } from "../src/lib/prisma";

async function testProfileFeature() {
  console.log(
    "👤 Testing Profile Page & Account Management Functionality...\n",
  );

  const testEmail = `profile-test-${Date.now()}@devstash.test`;
  const initialPassword = "initialPassword123!";
  const updatedPassword = "updatedPassword456!";
  const testName = "Profile Test User";

  try {
    // 1. Test Demo User Profile Data & Stats
    console.log("1. Testing getProfilePageData for Demo User...");
    const demoUser = await prisma.user.findFirst({
      where: { email: "demo@devstash.io" },
    });

    if (!demoUser) {
      throw new Error("❌ Demo user (demo@devstash.io) not found in database");
    }

    const demoProfile = await getProfilePageData(demoUser.id);
    if (!demoProfile) {
      throw new Error("❌ Failed to fetch profile page data for demo user");
    }

    if (
      demoProfile.user.email !== "demo@devstash.io" ||
      demoProfile.user.name !== "Demo User" ||
      demoProfile.user.hasPassword !== true
    ) {
      throw new Error(
        `❌ Demo user profile mismatch: ${JSON.stringify(demoProfile.user)}`,
      );
    }

    console.log(
      `   ✓ Demo User Profile: ${demoProfile.user.name} (${demoProfile.user.email})`,
    );
    console.log(
      `   ✓ Stats: ${demoProfile.stats.totalItems} items, ${demoProfile.stats.totalCollections} collections`,
    );

    // Verify 7 system item types are present
    const expectedTypes = [
      "snippet",
      "prompt",
      "command",
      "note",
      "file",
      "image",
      "link",
    ];
    const presentTypes = demoProfile.stats.itemTypeBreakdown.map((t) =>
      t.name.toLowerCase(),
    );

    for (const type of expectedTypes) {
      if (!presentTypes.includes(type)) {
        throw new Error(`❌ Missing system item type in breakdown: ${type}`);
      }
    }

    console.log(
      `   ✓ All 7 system item types present in breakdown: ${presentTypes.join(", ")}`,
    );

    // 2. Create Temporary User for Password & Deletion Tests
    console.log(
      "\n2. Creating temporary test user with items and collections...",
    );
    const initialHashedPassword = await bcrypt.hash(initialPassword, 10);
    const testUser = await prisma.user.create({
      data: {
        name: testName,
        email: testEmail,
        password: initialHashedPassword,
        emailVerified: new Date(),
      },
    });

    const snippetType = await prisma.itemType.findFirst({
      where: { name: "snippet" },
    });

    if (!snippetType) {
      throw new Error("❌ System item type 'snippet' not found");
    }

    // Seed test collection and item
    const testCollection = await prisma.collection.create({
      data: {
        name: "Test User Collection",
        userId: testUser.id,
        defaultTypeId: snippetType.id,
      },
    });

    const testItem = await prisma.item.create({
      data: {
        title: "Test User Item",
        contentType: "TEXT",
        content: "console.log('test')",
        userId: testUser.id,
        itemTypeId: snippetType.id,
        collections: {
          create: {
            collectionId: testCollection.id,
          },
        },
      },
    });

    // Seed a verification token
    await prisma.verificationToken.create({
      data: {
        identifier: testEmail,
        token: `test-token-${Date.now()}`,
        expires: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    console.log(
      `   ✓ Test user created (id: ${testUser.id}) with item (${testItem.id}) and collection (${testCollection.id})`,
    );

    // 3. Test getProfilePageData for Test User
    console.log("\n3. Testing getProfilePageData for test user...");
    const testProfile = await getProfilePageData(testUser.id);
    if (!testProfile) {
      throw new Error("❌ Failed to fetch test user profile data");
    }
    if (
      testProfile.stats.totalItems !== 1 ||
      testProfile.stats.totalCollections !== 1
    ) {
      throw new Error(
        `❌ Expected 1 item and 1 collection, got ${testProfile.stats.totalItems} items and ${testProfile.stats.totalCollections} collections`,
      );
    }
    const snippetCount = testProfile.stats.itemTypeBreakdown.find(
      (t) => t.name.toLowerCase() === "snippet",
    )?.count;
    if (snippetCount !== 1) {
      throw new Error(`❌ Expected snippet count 1, got ${snippetCount}`);
    }
    console.log("   ✓ Test user stats verified accurately");

    // 4. Test Change Password Functionality
    console.log("\n4. Testing changeUserPassword service...");

    // Password < 8 characters
    const shortResult = await changeUserPassword(
      testUser.id,
      initialPassword,
      "short",
    );
    if (shortResult.success) {
      throw new Error("❌ Expected failure for password < 8 characters");
    }
    console.log("   ✓ Short password (< 8 chars) properly rejected");

    // Incorrect current password
    const wrongCurrentResult = await changeUserPassword(
      testUser.id,
      "wrongPassword123!",
      updatedPassword,
    );
    if (wrongCurrentResult.success) {
      throw new Error("❌ Expected failure for incorrect current password");
    }
    console.log("   ✓ Incorrect current password properly rejected");

    // Successful password change
    const validChangeResult = await changeUserPassword(
      testUser.id,
      initialPassword,
      updatedPassword,
    );
    if (!validChangeResult.success) {
      throw new Error(
        `❌ Failed to change password: ${validChangeResult.error}`,
      );
    }

    // Verify in database
    const userAfterChange = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    if (!userAfterChange?.password) {
      throw new Error("❌ Password missing after change");
    }
    const isNewValid = await bcrypt.compare(
      updatedPassword,
      userAfterChange.password,
    );
    if (!isNewValid) {
      throw new Error(
        "❌ Password in database does not match updated password",
      );
    }
    console.log("   ✓ Password successfully updated and verified in database");

    // 5. Test Demo User Protection from Account Deletion
    console.log("\n5. Testing demo user account deletion protection...");
    const deleteDemoResult = await deleteUserAccount(demoUser.id);
    if (deleteDemoResult.success) {
      throw new Error(
        "❌ Demo user account should be protected and not deletable",
      );
    }
    console.log("   ✓ Demo user account deletion successfully blocked");

    // 6. Test Account Deletion & Cascading Cleanup
    console.log("\n6. Testing deleteUserAccount service & cascade cleanup...");
    const deleteTestResult = await deleteUserAccount(testUser.id);
    if (!deleteTestResult.success) {
      throw new Error(
        `❌ Failed to delete test user: ${deleteTestResult.error}`,
      );
    }

    // Verify user is deleted
    const deletedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    if (deletedUser) {
      throw new Error("❌ User record still exists after deletion");
    }

    // Verify cascaded items and collections
    const remainingItems = await prisma.item.findMany({
      where: { userId: testUser.id },
    });
    if (remainingItems.length > 0) {
      throw new Error("❌ Items still exist after user deletion");
    }

    const remainingCollections = await prisma.collection.findMany({
      where: { userId: testUser.id },
    });
    if (remainingCollections.length > 0) {
      throw new Error("❌ Collections still exist after user deletion");
    }

    const remainingTokens = await prisma.verificationToken.findMany({
      where: { identifier: testEmail },
    });
    if (remainingTokens.length > 0) {
      throw new Error("❌ Verification tokens still exist after user deletion");
    }

    console.log(
      "   ✓ User account and all associated items, collections, and tokens deleted cleanly",
    );

    // 7. Test Route Handlers Unauthorized Protection
    console.log(
      "\n7. Testing POST /api/user/change-password and DELETE /api/user/account route protection...",
    );
    const unauthChangeRes = await changePasswordHandler(
      new Request("http://localhost:3000/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: "any",
          newPassword: "anyPassword123!",
          confirmPassword: "anyPassword123!",
        }),
      }),
    );
    if (unauthChangeRes.status !== 401) {
      throw new Error(
        `❌ Expected 401 Unauthorized for change password without session, got ${unauthChangeRes.status}`,
      );
    }
    console.log(
      "   ✓ POST /api/user/change-password returns 401 when unauthenticated",
    );

    const unauthDeleteRes = await deleteAccountHandler();
    if (unauthDeleteRes.status !== 401) {
      throw new Error(
        `❌ Expected 401 Unauthorized for delete account without session, got ${unauthDeleteRes.status}`,
      );
    }
    console.log(
      "   ✓ DELETE /api/user/account returns 401 when unauthenticated",
    );

    console.log(
      "\n✅ All Profile Page & Account Management tests passed successfully!\n",
    );
  } finally {
    // Cleanup if any test data remains
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: { contains: "devstash.test" },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: "devstash.test" },
      },
    });
  }
}

testProfileFeature()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
