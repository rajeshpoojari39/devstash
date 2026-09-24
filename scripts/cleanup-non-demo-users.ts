import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const DEMO_EMAIL = "demo@devstash.io";

async function cleanupNonDemoUsers() {
  console.log("🧹 DevStash Database Cleanup - Purge Non-Demo Users\n");

  try {
    // 1. Verify Demo User exists
    const demoUser = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
      include: {
        _count: {
          select: {
            items: true,
            collections: true,
            accounts: true,
            sessions: true,
          },
        },
      },
    });

    if (!demoUser) {
      console.warn(
        `⚠️ Warning: Demo user (${DEMO_EMAIL}) was not found in the database.`,
      );
      console.warn(
        "Run `npm run db:seed` if you need to restore the demo user.\n",
      );
    } else {
      console.log(`👤 Protected Demo User:`);
      console.log(`   • ID:          ${demoUser.id}`);
      console.log(`   • Email:       ${demoUser.email}`);
      console.log(`   • Collections: ${demoUser._count.collections}`);
      console.log(`   • Items:       ${demoUser._count.items}\n`);
    }

    // 2. Find all non-demo users
    const nonDemoUsers = await prisma.user.findMany({
      where: {
        email: {
          not: DEMO_EMAIL,
        },
      },
      include: {
        _count: {
          select: {
            items: true,
            collections: true,
            accounts: true,
            sessions: true,
          },
        },
      },
    });

    if (nonDemoUsers.length === 0) {
      console.log(
        "✅ No non-demo users found in database. Database is already clean!\n",
      );
      return;
    }

    console.log(`Found ${nonDemoUsers.length} non-demo user(s) to delete:`);
    nonDemoUsers.forEach((user, idx) => {
      console.log(
        `   ${idx + 1}. [${user.email}] Name: "${user.name || "N/A"}" (Items: ${user._count.items}, Collections: ${user._count.collections}, Accounts: ${user._count.accounts})`,
      );
    });

    const nonDemoEmails = nonDemoUsers.map((u) => u.email);
    const nonDemoUserIds = nonDemoUsers.map((u) => u.id);

    console.log("\n🗑️  Executing deletion...");

    // 3. Delete verification tokens for non-demo users
    const deletedTokens = await prisma.verificationToken.deleteMany({
      where: {
        identifier: {
          in: nonDemoEmails,
        },
      },
    });
    console.log(`   ✓ Deleted ${deletedTokens.count} verification token(s)`);

    // 4. Delete non-demo users (Cascade deletes items, collections, accounts, sessions, item types)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: {
          in: nonDemoUserIds,
        },
      },
    });
    console.log(
      `   ✓ Deleted ${deletedUsers.count} user record(s) and their cascading content`,
    );

    // 5. Clean up any orphaned tags
    const orphanedTags = await prisma.tag.deleteMany({
      where: {
        items: {
          none: {},
        },
      },
    });
    if (orphanedTags.count > 0) {
      console.log(
        `   ✓ Cleaned up ${orphanedTags.count} unused orphaned tag(s)`,
      );
    }

    // 6. Summary of remaining database state
    console.log("\n==================================================");
    console.log("📊 POST-CLEANUP DATABASE SUMMARY");
    console.log("==================================================");
    const totalUsers = await prisma.user.count();
    const totalItems = await prisma.item.count();
    const totalCollections = await prisma.collection.count();
    const totalItemTypes = await prisma.itemType.count();
    const totalTags = await prisma.tag.count();
    const totalTokens = await prisma.verificationToken.count();

    console.log(`   • Total Users:              ${totalUsers}`);
    console.log(`   • Total Collections:        ${totalCollections}`);
    console.log(`   • Total Items:              ${totalItems}`);
    console.log(`   • Total Item Types:         ${totalItemTypes}`);
    console.log(`   • Total Tags:               ${totalTags}`);
    console.log(`   • Remaining Verif. Tokens:  ${totalTokens}`);
    console.log("==================================================");

    console.log("\n🎉 Database cleanup completed successfully!\n");
  } catch (error) {
    console.error("❌ Error during database cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupNonDemoUsers();
