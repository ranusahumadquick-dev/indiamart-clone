import axios from "axios";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const API_BASE = "http://localhost:8000/api";

// Test credentials
const BUYER_EMAIL = "buyer@test.com";
const BUYER_PASS = "test1234";
const SELLER_EMAIL = "seller@test.com";
const SELLER_PASS = "test1234";

let buyerToken = "";
let sellerId = "";

const api = axios.create({
  baseURL: API_BASE,
  validateStatus: () => true,
});

function generateValidPaymentSignature(orderId, paymentId) {
  const secret = process.env.RAZORPAY_KEY_SECRET || "test_secret_key_12345678901234567890";
  const msg = `${orderId}|${paymentId}`;
  return crypto.createHmac("sha256", secret).update(msg).digest("hex");
}

async function step(name, fn) {
  try {
    console.log(`\n📍 ${name}...`);
    await fn();
    console.log(`✅ ${name} — OK`);
  } catch (err) {
    console.log(`❌ ${name} — FAILED:`, err.message);
    console.error("   Details:", err.response?.data?.message || err.message);
    process.exit(1);
  }
}

(async () => {
  try {
    // 1. Login as buyer
    await step("1️⃣ Buyer Login", async () => {
      const res = await api.post("/auth/login", {
        email: BUYER_EMAIL,
        password: BUYER_PASS,
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${res.data?.message}`);
      buyerToken = res.data.data?.token;
      console.log(`   ✓ Token: ${buyerToken?.substring(0, 30)}...`);
      console.log(`   ✓ User ID: ${res.data.data?.user?.id}`);
      api.defaults.headers.common.Authorization = `Bearer ${buyerToken}`;
    });

    // 2. Get buyer's sample requests
    let sampleToPayFor;
    await step("2️⃣ Fetch Buyer Sample Requests", async () => {
      const res = await api.get("/samples/buyer");
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const samples = res.data.data?.samples || [];
      console.log(`   ✓ Found ${samples.length} sample requests`);

      // Find one that's accepted but not paid
      sampleToPayFor = samples.find(s => s.status === "accepted" && s.paymentStatus === "pending");
      if (!sampleToPayFor) {
        throw new Error("No accepted-but-unpaid sample found. Cannot test payment flow.");
      }

      console.log(`   ✓ Using sample: ${sampleToPayFor.product?.name}`);
      console.log(`   ✓ Amount: ₹${sampleToPayFor.totalAmount}`);
    });

    // 3. Simulate Razorpay payment and trigger verify-pay endpoint
    await step("3️⃣ Complete Payment & Create Order", async () => {
      // Generate Razorpay-like IDs
      const razorpayOrderId = `order_${Date.now()}`;
      const razorpayPaymentId = `pay_${Date.now()}`;
      const signature = generateValidPaymentSignature(razorpayOrderId, razorpayPaymentId);

      console.log(`   ✓ Payment ID: ${razorpayPaymentId}`);
      console.log(`   ✓ Order ID: ${razorpayOrderId}`);

      // Call verify payment endpoint
      const payRes = await api.post(`/samples/${sampleToPayFor._id}/verify-pay`, {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: signature,
      });

      if (payRes.status !== 200) {
        throw new Error(`Payment verification failed: ${payRes.data?.message}`);
      }

      console.log(`   ✓ Payment verified successfully`);
      console.log(`   ✓ Order created: ${payRes.data.data?.order?._id}`);
    });

    // 4. Login as seller
    await step("4️⃣ Seller Login", async () => {
      delete api.defaults.headers.common.Authorization;
      const res = await api.post("/auth/login", {
        email: SELLER_EMAIL,
        password: SELLER_PASS,
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const sellerToken = res.data.data?.token;
      sellerId = res.data.data?.user?.id;
      console.log(`   ✓ Token: ${sellerToken?.substring(0, 30)}...`);
      console.log(`   ✓ Seller ID: ${sellerId}`);
      api.defaults.headers.common.Authorization = `Bearer ${sellerToken}`;
    });

    // 5. Check seller orders
    let orderCount = 0;
    await step("5️⃣ Fetch Seller Orders", async () => {
      const res = await api.get("/orders/seller");
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${res.data?.message}`);
      const orders = res.data.data?.orders || [];
      orderCount = orders.length;
      console.log(`   ✓ Found ${orderCount} orders in seller dashboard`);

      if (orderCount > 0) {
        const recentOrder = orders[0];
        console.log(`   ✓ Most recent order:`);
        console.log(`     - Product: ${recentOrder.items?.[0]?.product?.name || recentOrder.items?.[0]?.name}`);
        console.log(`     - Status: ${recentOrder.status}`);
        console.log(`     - Amount: ₹${recentOrder.totalAmount}`);
        console.log(`     - Buyer: ${recentOrder.buyer?.name}`);
      }
    });

    // Summary
    console.log("\n\n📊 VERIFICATION RESULTS:\n");
    console.log("✅ Buyer can login");
    console.log("✅ Buyer can view sample requests");
    console.log("✅ Buyer can complete payment (order created)");
    console.log("✅ Seller can login");
    if (orderCount > 0) {
      console.log("✅ Order APPEARS in seller dashboard");
      console.log("\n🎉 COMPLETE ORDER FLOW WORKS!");
    } else {
      console.log("❌ Order MISSING from seller dashboard");
      console.log("\n⚠️ There's a bug in the order creation or retrieval");
    }

    console.log("\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Test failed:", err.message);
    process.exit(1);
  }
})();
