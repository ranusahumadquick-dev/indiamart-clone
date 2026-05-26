import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./src/models/Order.js";
import SampleRequest from "./src/models/SampleRequest.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Test Seller ID
    const testSellerId = "6a14078ca64a3dd07bf09d8a";

    console.log("=" .repeat(60));
    console.log("📊 DATABASE ANALYSIS");
    console.log("=" .repeat(60));

    // 1. Total documents
    const totalOrders = await Order.countDocuments();
    const totalSamples = await SampleRequest.countDocuments();

    console.log(`\n1️⃣  TOTAL COUNTS:`);
    console.log(`   Orders: ${totalOrders}`);
    console.log(`   Samples: ${totalSamples}`);

    // 2. Paid samples vs orders
    const paidSamples = await SampleRequest.countDocuments({ paymentStatus: "paid" });
    const ordersForTestSeller = await Order.countDocuments({ seller: testSellerId });

    console.log(`\n2️⃣  PAYMENT STATUS:`);
    console.log(`   Paid Samples: ${paidSamples}`);
    console.log(`   Orders for Test Seller: ${ordersForTestSeller}`);
    console.log(`   ⚠️  Mismatch: ${paidSamples} paid but only ${ordersForTestSeller} orders!`);

    // 3. All orders
    console.log(`\n3️⃣  ALL ORDERS:`);
    const allOrders = await Order.find({}, { _id: 1, seller: 1, totalAmount: 1, status: 1, createdAt: 1 }).lean();
    if (allOrders.length === 0) {
      console.log("   ❌ NO ORDERS!");
    } else {
      allOrders.forEach((o, i) => {
        console.log(`   ${i + 1}. Seller: ${o.seller}, Amount: ${o.totalAmount}, Status: ${o.status}`);
      });
    }

    // 4. Sample requests with payment status
    console.log(`\n4️⃣  PAID SAMPLES (first 10):`);
    const paidSamplesList = await SampleRequest.find({ paymentStatus: "paid" }, { _id: 1, seller: 1, totalAmount: 1, status: 1 }).limit(10).lean();
    paidSamplesList.forEach((s, i) => {
      console.log(`   ${i + 1}. ID: ${s._id}, Seller: ${s.seller}, Amount: ${s.totalAmount}, Status: ${s.status}`);
    });

    // 5. Check if orders are created for each paid sample
    console.log(`\n5️⃣  CHECKING ORDERS FOR PAID SAMPLES:`);
    let ordersFound = 0;
    let ordersMissing = 0;

    for (const sample of paidSamplesList.slice(0, 5)) {
      const order = await Order.findOne({ sampleRequest: sample._id });
      if (order) {
        console.log(`   ✅ Order found for sample ${sample._id}`);
        ordersFound++;
      } else {
        console.log(`   ❌ NO ORDER for sample ${sample._id}`);
        ordersMissing++;
      }
    }

    console.log(`\n   Summary: Found ${ordersFound}, Missing ${ordersMissing}`);

    console.log("\n" + "=".repeat(60));
    if (ordersForTestSeller === 0) {
      console.log("🔴 CRITICAL: No orders are being created!");
      console.log("   Check: Is /verify-pay endpoint being called?");
    } else {
      console.log("🟢 Orders are being created");
    }
    console.log("=".repeat(60));

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
