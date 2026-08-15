import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./src/models/Order.js";
import SampleRequest from "./src/models/SampleRequest.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected\n");

    // Find all paid samples
    const paidSamples = await SampleRequest.find({ paymentStatus: "paid" });
    console.log("📌 Total paid samples:", paidSamples.length, "\n");

    if (paidSamples.length === 0) {
      console.log("ℹ️  No paid samples found. Create a sample request and complete payment to test.\n");
      process.exit(0);
    }

    // For each paid sample, check if order exists
    let missingOrders = 0;
    let existingOrders = 0;

    console.log("Checking if orders exist for each paid sample:\n");
    for (const sample of paidSamples) {
      const order = await Order.findOne({ sampleRequest: sample._id });
      if (!order) {
        missingOrders++;
        console.log(`❌ MISSING ORDER for sample: ${sample._id}`);
        console.log(`   Buyer: ${sample.buyer}`);
        console.log(`   Seller: ${sample.seller}`);
        console.log(`   Amount: ₹${sample.totalAmount}\n`);
      } else {
        existingOrders++;
        console.log(`✅ Order exists: ${order._id}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Payment Status: ${order.paymentStatus}\n`);
      }
    }

    console.log("=".repeat(50));
    console.log(`📊 Summary:`);
    console.log(`   Paid Samples: ${paidSamples.length}`);
    console.log(`   Orders Found: ${existingOrders}`);
    console.log(`   Missing Orders: ${missingOrders}`);
    console.log("=".repeat(50), "\n");

    if (missingOrders > 0) {
      console.log("⚠️  WARNING: Some paid samples don't have corresponding orders!");
      console.log("   Check backend logs for order creation failures.\n");
    } else {
      console.log("✅ All paid samples have corresponding orders!\n");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
