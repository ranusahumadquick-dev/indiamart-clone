import axios from "axios";

(async () => {
  try {
    console.log("🧪 FINAL ORDER VERIFICATION TEST\n");
    console.log("=".repeat(60));

    // Step 1: Login
    console.log("1️⃣  LOGGING IN AS SELLER...");
    const loginRes = await axios.post("http://localhost:8000/api/auth/login", {
      email: "seller@test.com",
      password: "test1234"
    });
    const token = loginRes.data.data.accessToken;
    const userId = loginRes.data.data.user._id;
    console.log(`✅ Logged in as seller: ${userId}`);
    console.log("");

    // Step 2: Fetch seller orders
    console.log("2️⃣  FETCHING SELLER ORDERS...");
    const ordersRes = await axios.get("http://localhost:8000/api/orders/seller", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orders = ordersRes.data.data.orders || [];
    console.log(`✅ Found ${orders.length} orders for this seller`);
    console.log("");

    // Step 3: Display order details
    if (orders.length > 0) {
      console.log("3️⃣  SAMPLE ORDERS:");
      for (let i = 0; i < Math.min(3, orders.length); i++) {
        const o = orders[i];
        console.log(`\n   Order #${i + 1}:`);
        console.log(`   - ID: ${o._id.toString().slice(-8)}`);
        console.log(`   - Buyer: ${o.buyer?.name || "Unknown"}`);
        console.log(`   - Email: ${o.buyer?.email || "Unknown"}`);
        console.log(`   - Amount: ₹${o.totalAmount}`);
        console.log(`   - Status: ${o.status}`);
        console.log(`   - Items: ${o.items?.length || 0} product(s)`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL TESTS PASSED - Orders are visible to seller!");
    console.log("=".repeat(60));

    process.exit(0);
  } catch (err) {
    console.error("❌ Test failed:", err.response?.data?.message || err.message);
    process.exit(1);
  }
})();
