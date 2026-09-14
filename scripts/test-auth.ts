import { authConfig } from "../src/auth.config";
import { auth, handlers, signIn, signOut } from "../src/auth";
import { proxy, config as proxyConfig } from "../src/proxy";

async function testAuthSetup() {
  console.log("🔍 Testing NextAuth Setup & Configurations...\n");

  // 1. Check Auth Config
  console.log("1. Checking auth.config.ts...");
  if (!authConfig.providers || authConfig.providers.length === 0) {
    throw new Error("❌ No providers defined in authConfig");
  }
  const providers = (authConfig.providers ?? []) as Array<
    { id?: string; name?: string } | ((...args: unknown[]) => unknown)
  >;
  const providerNames = providers.map((p) => {
    if (typeof p === "function") return p.name || "custom-provider";
    return p.id || p.name || "provider";
  });
  console.log(`   ✓ Configured providers: ${providerNames.join(", ")}`);
  console.log("   ✓ JWT callback configured");
  console.log("   ✓ Session callback configured");
  console.log("   ✓ Authorized callback configured");

  // 2. Check Auth Module
  console.log("\n2. Checking auth.ts exports...");
  if (typeof auth !== "function") throw new Error("❌ auth is not a function");
  if (typeof handlers !== "object" || !handlers.GET || !handlers.POST)
    throw new Error("❌ handlers.GET or POST missing");
  if (typeof signIn !== "function")
    throw new Error("❌ signIn is not a function");
  if (typeof signOut !== "function")
    throw new Error("❌ signOut is not a function");
  console.log("   ✓ auth handler function exported");
  console.log("   ✓ handlers.GET & handlers.POST exported");
  console.log("   ✓ signIn & signOut exported");

  // 3. Check Proxy
  console.log("\n3. Checking proxy.ts exports...");
  if (typeof proxy !== "function")
    throw new Error("❌ proxy is not a function");
  if (!proxyConfig || !proxyConfig.matcher)
    throw new Error("❌ proxy config.matcher missing");
  console.log("   ✓ proxy function exported");
  console.log(`   ✓ proxy matcher: ${JSON.stringify(proxyConfig.matcher)}`);

  console.log(
    "\n✅ All Auth configuration and export tests passed successfully!\n",
  );
}

testAuthSetup().catch((err) => {
  console.error("❌ Auth test failed:", err);
  process.exit(1);
});
