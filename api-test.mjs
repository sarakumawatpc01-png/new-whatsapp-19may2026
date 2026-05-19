// Quick API integration test for all major endpoints
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ZjY4YThhMi0zNTg3LTQ0NjEtYWQyMS1lNzI0NmE0YjA2ZDAiLCJ0ZW5hbnRfaWQiOiIzYzJkYWZiMC1hMzQyLTRjYTYtOTA3Yi1jM2QwZDNiOTZlMjYiLCJyb2xlIjoiVEVOQU5UX09XTkVSIiwiaWF0IjoxNzc3OTE1NDQwLCJleHAiOjE3Nzc5MTkwNDB9.QLI6OFSHpmjSJeBqGt9zEfClQIon8t7hbfgT5ibO93M";
const BASE = "http://localhost:3002/api";
const headers = { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" };

async function test(name, path, method = "GET", body = null) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ PASS | ${method} ${path} `);
    } else {
      console.log(`❌ FAIL | ${method} ${path} | ${JSON.stringify(data.error || data)}`);
    }
  } catch (err) {
    console.log(`💥 ERR  | ${method} ${path} | ${err.message}`);
  }
}

async function run() {
  console.log("\n========== API INTEGRATION TEST ==========\n");
  
  await test("Auth Me", "/auth/me");
  await test("Inbox Conversations", "/inbox/conversations");
  await test("Contacts", "/contacts");
  await test("WhatsApp Numbers", "/whatsapp/numbers");
  await test("Campaigns", "/campaigns");
  await test("Automations", "/automations");
  await test("AI Config", "/ai/config");
  await test("AI Documents", "/ai/documents");
  await test("AI FAQs", "/ai/faqs");
  await test("Billing Sub", "/billing/subscription");
  await test("Billing Plans", "/billing/plans");
  await test("Billing Invoices", "/billing/invoices");
  await test("Analytics Overview", "/analytics/overview");
  await test("Analytics Messages", "/analytics/messages");
  await test("Notifications", "/notifications");
  await test("API Keys", "/developer/api-keys");
  await test("Webhooks", "/developer/webhooks");
  await test("Health", "/health");
  await test("Bootstrap", "/bootstrap");
  await test("Whitelabel", "/whitelabel/branding");

  console.log("\n========== TEST COMPLETE ==========\n");
}

run();
