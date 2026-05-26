import axios from "axios";

const API_URL = "http://localhost:8000/api";

const BUYER_EMAIL = "buyer@test.com";
const BUYER_PASSWORD = "password123";
const SELLER_EMAIL = "seller@test.com";
const SELLER_PASSWORD = "password123";

let buyerToken = null;
let sellerToken = null;

const api = axios.create({ baseURL: API_URL });

console.log("🚀 Starting Order Flow Test\n");

async function loginBuyer() {
  try {
    console.log("📝 Step 1: Logging in as buyer...");
    const res = await api.post("/auth/login", {
      email: BUYER_EMAIL,
      password: BUYER_PASSWORD,
    });
    buyerToken = res.data.data.token;
    api.defaults.headers.common["Authorization"] = `Bearer ${buyerToken}`;
    console.log("✅ Buyer logged in");
  } catch (err) {
    console.error("❌ Login failed:", err.response?.data?.message);
    process.exit(1);
  }
}

async function getProducts() {
  try {
    console.log("\n📦 Step 2: Fetching products...");
    const res = await api.get("/products", { params: { limit: 5 } });
    const products = res.data.data?.products || [];
    console.log(`✅ Found ${products.length} products`);
    return products[0];
  } catch (err) {
    console.error("❌ Failed to fetch products:", err.message);
    process.exit(1);
  }
}

async function createSampleRequest(product) {
  try {
    console.log("\n📋 Step 3: Creating sample request...");
    const res = await api.post("/samples", {
      product: product._id,
      quantity: 5,
      shippingAddress: {
        street: "123 Test St",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
      },
    });
    const sample = res.data.data;
    console.log("✅ Sample request created");
    return sample;
  } catch (err) {
    console.error("❌ Failed to create sample:", err.response?.data?.message);
    process.exit(1);
  }
}

async function acceptSample(sampleId) {
  try {
    console.log("\n✅ Step 4: Accepting sample as seller...");
    const loginRes = await api.post("/auth/login", {
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    sellerToken = loginRes.data.data.token;
    api.defaults.headers.common["Authorization"] = `Bearer ${sellerToken}`;

    const res = await api.post(`/samples/${sampleId}/accept`);
    console.log("✅ Sample accepted");
  } catch (err) {
    console.error("❌ Failed to accept:", err.response?.data?.message);
    process.exit(1);
  }
}

async function createPaymentOrder(sampleId) {
  try {
    console.log("\n💳 Step 5: Creating payment order...");
    api.defaults.headers.common["Authorization"] = `Bearer ${buyerToken}`;
    const res = await api.post(`/samples/${sampleId}/pay`, {});
    console.log("✅ Payment order created");
    return res.data.data;
  } catch (err) {
    console.error("❌ Failed to create payment:", err.response?.data?.message);
    process.exit(1);
  }
}

async function verifyPayment(sampleId, paymentData) {
  try {
    console.log("\n🔐 Step 6: Verifying payment...");
    const crypto = await import("crypto");
    const expectedSig = crypto.default
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${paymentData.orderId}|pay_test123`)
      .digest("hex");

    const res = await api.post(`/samples/${sampleId}/verify-pay`, {
      razorpayOrderId: paymentData.orderId,
      razorpayPaymentId: "pay_test123",
      razorpaySignature: expectedSig,
    });

    console.log("✅ Payment verified!");
    return res.data.data.order._id;
  } catch (err) {
    console.error("❌ Payment verification failed:", err.response?.data?.message);
    process.exit(1);
  }
}

async function checkSellerOrders() {
  try {
    console.log("\n📊 Step 7: Checking seller orders...");
    api.defaults.headers.common["Authorization"] = `Bearer ${sellerToken}`;
    const res = await api.get("/orders/seller", { params: { limit: 10 } });
    const orders = res.data.data?.orders || [];
    console.log(`✅ Found ${orders.length} orders`);
    return orders;
  } catch (err) {
    console.error("❌ Failed to fetch orders:", err.response?.data?.message);
    process.exit(1);
  }
}

async function updateOrderStatus(orderId) {
  try {
    console.log("\n🔄 Step 8: Updating order status...");
    const res = await api.put(`/orders/seller/${orderId}/status`, {
      status: "processing",
      sellerNote: "Order ready",
      courier: "Blue Dart",
      trackingNumber: "BD123456789",
    });
    console.log("✅ Order updated to processing");
  } catch (err) {
    console.error("❌ Failed to update order:", err.response?.data?.message);
    process.exit(1);
  }
}

async function main() {
  try {
    await loginBuyer();
    const product = await getProducts();
    const sample = await createSampleRequest(product);
    await acceptSample(sample._id);
    const paymentData = await createPaymentOrder(sample._id);
    const orderId = await verifyPayment(sample._id, paymentData);
    const orders = await checkSellerOrders();
    if (orders.length > 0) await updateOrderStatus(orders[0]._id);
    console.log("\n✅ ORDER FLOW TEST COMPLETED!");
  } catch (err) {
    console.error("❌ Test failed:", err.message);
  }
}

main();
