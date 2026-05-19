// Meta Webhook Simulation Script
const BASE = "http://localhost:3002/api";

async function simulateWebhook() {
  // Use the tenant ID from the previous auth test if possible, 
  // or just use a known one from the DB or a hardcoded one.
  // From api-test.mjs, I see tenantId: "3c2dafb0-a342-4ca6-907b-c3d0d3b96e26"
  const tenantId = "3c2dafb0-a342-4ca6-907b-c3d0d3b96e26";
  
  console.log(`\nSimulating Inbound WhatsApp Message for Tenant: ${tenantId}`);

  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WABA_ID",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "1234567890",
                phone_number_id: "PHONE_NUMBER_ID"
              },
              contacts: [
                {
                  profile: { name: "John Doe" },
                  wa_id: "1234567890"
                }
              ],
              messages: [
                {
                  from: "1234567890",
                  id: `wamid.HBgLMTIzNDU2Nzg5MB${Date.now()}`,
                  timestamp: Math.floor(Date.now() / 1000),
                  text: { body: "Hello from Meta Simulation!" },
                  type: "text"
                }
              ]
            },
            field: "messages"
          }
        ]
      }
    ]
  };

  const crypto = await import("crypto");
  const secret = "placeholder_add_later"; // From .env
  const bodyString = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", secret);
  const signature = "sha256=" + hmac.update(bodyString).digest("hex");

  try {
    const res = await fetch(`${BASE}/webhooks/whatsapp/${tenantId}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-hub-signature-256": signature
      },
      body: bodyString
    });
    
    const data = await res.json();
    if (res.ok) {
      console.log("✅ Webhook Received Successfully");
    } else {
      console.log("❌ Webhook Failed:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("💥 Error during webhook simulation:", err.message);
  }
}

simulateWebhook();
