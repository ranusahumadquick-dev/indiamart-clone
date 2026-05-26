import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import SampleRequest from "./src/models/SampleRequest.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get a test buyer
    const buyer = await User.findOne({ role: "buyer" }).lean();
    if (!buyer) {
      console.log("❌ No buyer found in database");
      process.exit(0);
    }

    console.log(`\n📌 Checking orders for buyer: ${buyer.name} (${buyer._id})`);

    // Get all sample requests for this buyer
    const samples = await SampleRequest.find({ buyer: buyer._id })
      .populate("seller", "name companyName")
      .populate("product", "name")
      .lean();

    console.log(`\n📊 Total sample requests: ${samples.length}`);

    if (samples.length === 0) {
      console.log("⚠️  No sample requests found for this buyer");
    } else {
      console.log("\n📋 Sample Requests:");
      samples.forEach((s, i) => {
        console.log(`\n${i + 1}. ${s.product?.name || "Unknown Product"}`);
        console.log(`   Status: ${s.status}`);
        console.log(`   Payment: ${s.paymentStatus}`);
        console.log(`   Seller: ${s.seller?.companyName || s.seller?.name}`);
        console.log(`   Qty: ${s.quantity} × ₹${s.unitPrice}`);
        console.log(`   Created: ${new Date(s.createdAt).toLocaleDateString()}`);
      });
    }

    // Get count by status
    const statusCounts = await SampleRequest.aggregate([
      { $match: { buyer: buyer._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    console.log("\n📊 Count by Status:");
    statusCounts.forEach((s) => {
      console.log(`   ${s._id || "none"}: ${s.count}`);
    });

    // Get count by payment status
    const paymentCounts = await SampleRequest.aggregate([
      { $match: { buyer: buyer._id } },
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
    ]);

    console.log("\n💳 Count by Payment Status:");
    paymentCounts.forEach((p) => {
      console.log(`   ${p._id || "none"}: ${p.count}`);
    });

    console.log("\n✅ Done!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
