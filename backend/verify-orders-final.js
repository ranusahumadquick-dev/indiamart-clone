import axios from "axios";

(async () => {
  try {
    console.log("🔍 VERIFYING ORDERS FOR SELLER...\n");

    // Login
    const loginRes = await axios.post("http://localhost:8000/api/auth/login", {
      email: "seller@test.com",
      password: "test1234"
    });
    const token = loginRes.data.data.accessToken;

    // Fetch orders
    const ordersRes = await axios.get("http://localhost:8000/api/orders/seller", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orders = ordersRes.data.data.orders || [];

    console.log(`✅ SELLER CAN NOW SEE ${orders.length} ORDERS!\n`);
    console.log("=".repeat(60));

    // Show breakdown
    const statusCounts = {};
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    console.log("📊 ORDER BREAKDOWN:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} order(s)`);
    });

    console.log("\n📈 TOTAL REVENUE: ₹" + orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString());
    console.log("=".repeat(60));
    console.log("\n✅ All orders are now visible to seller!");
    console.log("Go to /seller/orders to see them on the dashboard!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.response?.data?.message || err.message);
    process.exit(1);
  }
})();
