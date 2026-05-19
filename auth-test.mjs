// Auth Flow Test Script
const BASE = "http://localhost:3002/api";

async function testAuth() {
  const email = `test_${Date.now()}@example.com`;
  const password = "Password123!";

  console.log(`\nTesting Auth Flow for: ${email}`);

  // 1. Register
  try {
    const regRes = await fetch(`${BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "Test User" })
    });
    const regData = await regRes.json();
    if (regRes.ok) {
      console.log("✅ Registration Successful");
    } else {
      console.log("❌ Registration Failed:", JSON.stringify(regData));
      return;
    }

    // 2. Login
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    if (loginRes.ok) {
      console.log("✅ Login Successful");
      console.log("   Token received:", loginData.data.accessToken.substring(0, 20) + "...");
    } else {
      console.log("❌ Login Failed:", JSON.stringify(loginData));
    }

    // 3. Me
    const meRes = await fetch(`${BASE}/auth/me`, {
      headers: { "Authorization": `Bearer ${loginData.data.accessToken}` }
    });
    if (meRes.ok) {
      console.log("✅ GET /auth/me Successful");
    } else {
      console.log("❌ GET /auth/me Failed");
    }

  } catch (err) {
    console.error("💥 Error during auth test:", err.message);
  }
}

testAuth();
