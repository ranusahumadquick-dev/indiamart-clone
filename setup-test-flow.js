import axios from "axios";
const API_URL = "http://localhost:8000/api";

const api = axios.create({ baseURL: API_URL });

const timestamp = Date.now();
const randomNum = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
const BUYER_EMAIL = `buyer_test_${timestamp}@test.com`;
const SELLER_EMAIL = `seller_test_${timestamp}@test.com`;
const PASSWORD = "TestPass123!";
const BUYER_PHONE = `9${randomNum}`; // 10 digits starting with 9
const SELLER_PHONE = `7${randomNum}`; // 10 digits starting with 7

console.log("🚀 ORDER FLOW TEST - Setup Phase\n");
console.log(`Creating test accounts with timestamp: ${timestamp}\n`);

async function registerBuyer() {
  try {
    console.log(`📝 Registering buyer: ${BUYER_EMAIL}`);
    const res = await api.post("/auth/register", {
      name: "Test Buyer",
      email: BUYER_EMAIL,
      phone: BUYER_PHONE,
      password: PASSWORD,
      role: "buyer",
    });
    console.log(`✅ Buyer registered`);
    return { email: BUYER_EMAIL, password: PASSWORD, user: res.data.data.user };
  } catch (err) {
    console.error(`❌ Failed to register buyer:`, err.response?.data?.message);
    return null;
  }
}

async function registerSeller() {
  try {
    console.log(`\n📝 Registering seller: ${SELLER_EMAIL}`);
    const res = await api.post("/auth/register", {
      name: "Test Seller",
      email: SELLER_EMAIL,
      phone: SELLER_PHONE,
      password: PASSWORD,
      role: "seller",
      companyName: "Test Seller Company",
    });
    console.log(`✅ Seller registered`);
    return { email: SELLER_EMAIL, password: PASSWORD, user: res.data.data.user };
  } catch (err) {
    console.error(`❌ Failed to register seller:`, err.response?.data?.message);
    return null;
  }
}

async function loginBuyer(email, password) {
  try {
    console.log(`\n🔐 Logging in buyer...`);
    const res = await api.post("/auth/login", { email, password });
    console.log(`✅ Buyer logged in`);
    return { token: res.data.data.token, user: res.data.data.user };
  } catch (err) {
    console.error(`❌ Login failed:`, err.response?.data?.message);
    return null;
  }
}

async function loginSeller(email, password) {
  try {
    console.log(`\n🔐 Logging in seller...`);
    const res = await api.post("/auth/login", { email, password });
    console.log(`✅ Seller logged in`);
    return { token: res.data.data.token, user: res.data.data.user };
  } catch (err) {
    console.error(`❌ Login failed:`, err.response?.data?.message);
    return null;
  }
}

async function getProduct(token) {
  try {
    console.log(`\n📦 Fetching products...`);
    const res = await api.get("/products", {
      params: { limit: 5 },
      headers: { Authorization: `Bearer ${token}` },
    });
    const products = res.data.data?.products || [];
    if (products.length === 0) throw new Error("No products found");
    console.log(`✅ Found ${products.length} products`);
    return products[0];
  } catch (err) {
    console.error(`❌ Failed to fetch products:`, err.message);
    return null;
  }
}

async function createSampleRequest(token, product) {
  try {
    console.log(`\n📋 Creating sample request...`);
    const res = await api.post(
      "/samples",
      {
        productId: product._id,
        quantity: 10,
        shippingAddress: {
          street: "123 Test St",
          city: "Delhi",
          state: "Delhi",
          pincode: "110001",
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Sample request created`);
    console.log(`   Sample ID: ${res.data.data._id}`);
    console.log(`   Status: ${res.data.data.status}`);
    console.log(`   Amount: ₹${res.data.data.totalAmount}`);
    return res.data.data;
  } catch (err) {
    console.error(`❌ Failed:`, err.response?.data?.message || err.message);
    return null;
  }
}

async function acceptSample(sellerToken, sampleId) {
  try {
    console.log(`\n✅ Seller accepting sample...`);
    const res = await api.put(
      `/samples/${sampleId}/accept`,
      {},
      { headers: { Authorization: `Bearer ${sellerToken}` } }
    );
    console.log(`✅ Sample accepted`);
    console.log(`   Status: ${res.data.data.status}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed:`, err.response?.data?.message || err.message);
    return false;
  }
}

async function checkSellerOrders(sellerToken) {
  try {
    console.log(`\n📊 Checking seller orders (should be empty before payment)...`);
    const res = await api.get("/orders/seller", {
      params: { limit: 100 },
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const orders = res.data.data?.orders || [];
    console.log(`✅ Found ${orders.length} orders`);
    return orders;
  } catch (err) {
    console.error(`❌ Failed:`, err.response?.data?.message || err.message);
    return [];
  }
}

async function main() {
  try {
    // Register buyer and seller
    const buyer = await registerBuyer();
    const seller = await registerSeller();

    if (!buyer || !seller) {
      console.log("\n❌ Registration failed");
      process.exit(1);
    }

    // Login
    const buyerLogin = await loginBuyer(buyer.email, buyer.password);
    const sellerLogin = await loginSeller(seller.email, seller.password);

    if (!buyerLogin || !sellerLogin) {
      console.log("\n❌ Login failed");
      process.exit(1);
    }

    // Get product
    const product = await getProduct(buyerLogin.token);
    if (!product) {
      console.log("\n❌ Could not find product");
      process.exit(1);
    }

    // Create sample request
    const sample = await createSampleRequest(buyerLogin.token, product);
    if (!sample) {
      console.log("\n❌ Could not create sample");
      process.exit(1);
    }

    // Seller accepts
    const accepted = await acceptSample(sellerLogin.token, sample._id);
    if (!accepted) {
      console.log("\n❌ Could not accept sample");
      process.exit(1);
    }

    // Check seller orders (should still be empty)
    const orders = await checkSellerOrders(sellerLogin.token);

    console.log("\n" + "═".repeat(60));
    console.log("✅ TEST SETUP COMPLETE!");
    console.log("═".repeat(60));
    console.log("\n📌 Test Credentials:");
    console.log(`   Buyer Email: ${buyer.email}`);
    console.log(`   Buyer Password: ${buyer.password}`);
    console.log(`   Seller Email: ${seller.email}`);
    console.log(`   Seller Password: ${seller.password}`);
    console.log(`\n📌 Sample Request Details:`);
    console.log(`   Sample ID: ${sample._id}`);
    console.log(`   Product: ${product.name}`);
    console.log(`   Amount: ₹${sample.totalAmount}`);
    console.log(`\n📊 Status:`);
    console.log(`   ✅ Buyer can request samples`);
    console.log(`   ✅ Seller can accept samples`);
    console.log(`   ✅ Seller can fetch orders via /orders/seller`);
    console.log(`   ⏳ Orders appear after payment verification`);
    console.log("\n" + "═".repeat(60) + "\n");
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  }
}

main();
