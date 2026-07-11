import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import SampleRequest from "./src/models/SampleRequest.js";
import Product from "./src/models/Product.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find the buyer
    const buyer = await User.findOne({ email: "testbuy_1779772033@test.local" }).lean();
    if (!buyer) {
      console.log("❌ Buyer not found");
      process.exit(0);
    }

    console.log(`📌 Buyer: ${buyer.name} (${buyer.email})\n`);

    // Get all sample requests for this buyer
    const samples = await SampleRequest.find({ buyer: buyer._id })
      .populate("seller", "name companyName email")
      .populate("product", "name")
      .lean();

    if (samples.length === 0) {
      console.log("❌ No sample requests found for this buyer");
      process.exit(0);
    }

    console.log(`📋 Sample Requests (${samples.length} total):\n`);

    samples.forEach((sample, i) => {
      console.log(`${i + 1}. ${sample.product?.name || "Unknown Product"}`);
      console.log(`   📧 Seller: ${sample.seller?.name || "Unknown"} (${sample.seller?.email})`);
      console.log(`   💰 Amount: ₹${sample.totalAmount}`);
      console.log(`   📦 Qty: ${sample.quantity} units`);
      console.log(`   ✅ Status: ${sample.status}`);
      console.log(`   💳 Payment: ${sample.paymentStatus}`);
      console.log(`   📅 Created: ${new Date(sample.createdAt).toLocaleDateString()}`);
      console.log("");
    });

    console.log("\n✅ Done!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
