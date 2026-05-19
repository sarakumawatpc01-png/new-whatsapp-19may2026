// Stripe Webhook Simulation Script
const BASE = "http://localhost:3002/api";

async function simulateStripe() {
  console.log(`\nSimulating Stripe Subscription Event`);

  const payload = {
    id: `evt_test_${Date.now()}`,
    type: "customer.subscription.created",
    data: {
      object: {
        id: "sub_123456",
        customer: "cus_123456",
        status: "active",
        metadata: {
          tenantId: "3c2dafb0-a342-4ca6-907b-c3d0d3b96e26"
        }
      }
    }
  };

  try {
    const res = await fetch(`${BASE}/webhooks/stripe`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "stripe-signature": "dummy_sig"
      },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (res.ok) {
      console.log("✅ Stripe Webhook Received Successfully");
    } else {
      console.log("❌ Stripe Webhook Failed:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("💥 Error during Stripe simulation:", err.message);
  }
}

simulateStripe();
