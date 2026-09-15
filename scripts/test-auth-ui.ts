import "dotenv/config";
import { getInitials } from "../src/components/ui/user-avatar";
import { authConfig } from "../src/auth.config";
import { POST as registerHandler } from "../src/app/api/auth/register/route";
import { prisma } from "../src/lib/prisma";

async function testAuthUI() {
  console.log("🎨 Testing Auth Phase 3 UI & Configuration...\n");

  // 1. Test getInitials helper
  console.log("1. Testing getInitials logic...");
  const cases: Array<
    [string | null | undefined, string | null | undefined, string]
  > = [
    ["Rajesh Poojari", null, "RP"],
    ["John Doe", "john@example.com", "JD"],
    ["Ada", null, "AD"],
    [null, "developer@devstash.io", "D"],
    ["", "test@domain.com", "T"],
    [null, null, "U"],
    [undefined, undefined, "U"],
  ];

  for (const [name, email, expected] of cases) {
    const result = getInitials(name, email);
    if (result !== expected) {
      throw new Error(
        `❌ getInitials("${name}", "${email}") returned "${result}", expected "${expected}"`,
      );
    }
    console.log(`   ✓ getInitials("${name}", "${email}") -> "${result}"`);
  }

  // 2. Test NextAuth Custom Pages Config
  console.log("\n2. Checking auth.config.ts custom pages...");
  if (authConfig.pages?.signIn !== "/sign-in") {
    throw new Error(
      `❌ authConfig.pages.signIn is "${authConfig.pages?.signIn}", expected "/sign-in"`,
    );
  }
  console.log(`   ✓ authConfig.pages.signIn correctly set to "/sign-in"`);

  // 3. Test Register Endpoint with Phase 3 User
  console.log("\n3. Testing registration API endpoint...");
  const testEmail = `ui-test-${Date.now()}@devstash.test`;
  const testPassword = "securePassword123!";
  const testName = "UI Test User";

  const res = await registerHandler(
    new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    }),
  );

  if (res.status !== 201) {
    const data = await res.json();
    throw new Error(
      `❌ Registration failed with ${res.status}: ${JSON.stringify(data)}`,
    );
  }

  const data = await res.json();
  if (!data.success || !data.user?.id) {
    throw new Error(`❌ Unexpected response: ${JSON.stringify(data)}`);
  }
  console.log(`   ✓ User created successfully with id: ${data.user.id}`);

  // 4. Verify in DB
  console.log("\n4. Verifying registered user in database...");
  const user = await prisma.user.findUnique({
    where: { email: testEmail },
  });
  if (!user || user.name !== testName) {
    throw new Error("❌ User not found in database or name mismatch");
  }
  console.log(
    `   ✓ User verified in database (name: ${user.name}, email: ${user.email})`,
  );

  // 5. Cleanup
  console.log("\n5. Cleaning up test user...");
  await prisma.user.delete({
    where: { email: testEmail },
  });
  console.log("   ✓ Cleaned up test user");

  console.log("\n✅ All Auth UI Phase 3 tests passed successfully!\n");
}

testAuthUI()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
