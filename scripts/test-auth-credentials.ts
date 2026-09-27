import "dotenv/config";
import { POST as registerHandler } from "../src/app/api/auth/register/route";
import { authConfig } from "../src/auth.config";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function testCredentialsAuth() {
  console.log("🔐 Testing Auth Credentials Provider & Registration Flow...\n");

  // 1. Check Auth Config Providers
  console.log("1. Checking auth.config.ts providers...");
  const providers = (authConfig.providers ?? []) as Array<
    { id?: string; name?: string } | ((...args: unknown[]) => unknown)
  >;
  const providerNames = providers.map((p) => {
    if (typeof p === "function") return p.name || "custom-provider";
    return p.id || p.name || "provider";
  });
  console.log(`   ✓ Configured providers: ${providerNames.join(", ")}`);

  const hasGitHub = providerNames.some((n) =>
    n.toLowerCase().includes("github"),
  );
  const hasCredentials = providerNames.some((n) =>
    n.toLowerCase().includes("credentials"),
  );

  if (!hasGitHub) throw new Error("❌ GitHub provider missing in authConfig");
  if (!hasCredentials)
    throw new Error("❌ Credentials provider missing in authConfig");
  console.log("   ✓ Both GitHub and Credentials providers found in authConfig");

  // 2. Test Registration Validation
  console.log("\n2. Testing /api/auth/register validation...");

  // Test missing email
  const resMissingEmail = await registerHandler(
    new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.1.1",
      },
      body: JSON.stringify({
        password: "password123",
        confirmPassword: "password123",
      }),
    }),
  );
  if (resMissingEmail.status !== 400) {
    throw new Error(
      `❌ Expected 400 for missing email, got ${resMissingEmail.status}`,
    );
  }
  console.log("   ✓ Missing email rejected with 400");

  // Test password mismatch
  const resMismatch = await registerHandler(
    new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.1.2",
      },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password456",
      }),
    }),
  );
  if (resMismatch.status !== 400) {
    throw new Error(
      `❌ Expected 400 for password mismatch, got ${resMismatch.status}`,
    );
  }
  console.log("   ✓ Password mismatch rejected with 400");

  // Test short password
  const resShortPass = await registerHandler(
    new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.1.3",
      },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        password: "short",
        confirmPassword: "short",
      }),
    }),
  );
  if (resShortPass.status !== 400) {
    throw new Error(
      `❌ Expected 400 for short password, got ${resShortPass.status}`,
    );
  }
  console.log("   ✓ Short password (<8 chars) rejected with 400");

  // 3. Test Successful User Registration
  console.log("\n3. Testing valid user registration...");
  const testEmail = `test-user-${Date.now()}@devstash.test`;
  const testPassword = "securePassword123!";
  const testName = "Registration Test User";

  const resRegister = await registerHandler(
    new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.1.4",
      },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    }),
  );

  if (resRegister.status !== 201) {
    const data = await resRegister.json();
    throw new Error(
      `❌ Registration failed with status ${resRegister.status}: ${JSON.stringify(data)}`,
    );
  }
  const regData = await resRegister.json();
  if (!regData.success || !regData.user?.id) {
    throw new Error(
      `❌ Invalid registration response payload: ${JSON.stringify(regData)}`,
    );
  }
  console.log(`   ✓ User registered successfully with id: ${regData.user.id}`);

  // 4. Test Duplicate Email Prevention
  console.log("\n4. Testing duplicate email rejection...");
  const resDuplicate = await registerHandler(
    new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.1.5",
      },
      body: JSON.stringify({
        name: "Duplicate User",
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    }),
  );
  if (resDuplicate.status !== 409) {
    throw new Error(
      `❌ Expected 409 Conflict for duplicate email, got ${resDuplicate.status}`,
    );
  }
  console.log("   ✓ Duplicate registration correctly rejected with 409");

  // 5. Verify Password Hash & Credential Validation
  console.log("\n5. Testing password hashing & credential verification...");
  const dbUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (!dbUser || !dbUser.password) {
    throw new Error("❌ User or hashed password not found in database");
  }

  const isPasswordMatch = await bcrypt.compare(testPassword, dbUser.password);
  if (!isPasswordMatch) {
    throw new Error("❌ Password comparison failed against stored hash");
  }
  console.log("   ✓ Correct password matches stored bcrypt hash");

  const isWrongPasswordMatch = await bcrypt.compare(
    "wrongPassword123",
    dbUser.password,
  );
  if (isWrongPasswordMatch) {
    throw new Error("❌ Incorrect password incorrectly matched");
  }
  console.log("   ✓ Incorrect password correctly rejected");

  // 6. Test Demo User Credentials
  console.log("\n6. Checking seeded Demo User credentials...");
  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
  });
  if (demoUser && demoUser.password) {
    const isDemoMatch = await bcrypt.compare("12345678", demoUser.password);
    if (!isDemoMatch) {
      throw new Error("❌ Demo user password does not match seeded hash");
    }
    console.log(
      "   ✓ Demo user (demo@devstash.io) verified with demo password (12345678)",
    );
  } else {
    console.log("   ℹ Demo user not in database (run seed if needed)");
  }

  // 7. Cleanup Test User
  console.log("\n7. Cleaning up temporary test user...");
  await prisma.user.delete({
    where: { email: testEmail },
  });
  console.log("   ✓ Cleaned up temporary test user from database");

  console.log(
    "\n✅ All Auth Credentials and Registration tests passed successfully!\n",
  );
}

testCredentialsAuth()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
