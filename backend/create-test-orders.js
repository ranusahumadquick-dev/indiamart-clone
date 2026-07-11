import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import SampleRequest from "./src/models/SampleRequest.js";
import Product from "./src/models/Product.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find a buyer and seller
    const buyer = await User.findOne({ role: "buyer" });
    const seller = await User.findOne({ role: "seller" });
    const product = await Product.findOne();

    if (!buyer || !seller || !product) {
      console.log("❌ Missing: buyer, seller, or product");
      console.log(`Buyer: ${buyer ? "✅" : "❌"}, Seller: ${seller ? "✅" : "❌"}, Product: ${product ? "✅" : "❌"}`);
      process.exit(0);
    }

    console.log(`\n📌 Creating test sample requests...`);
    console.log(`   Buyer: ${buyer.name} (${buyer._id})`);
    console.log(`   Seller: ${seller.name} (${seller._id})`);
    console.log(`   Product: ${product.name}`);

    const statuses = ["pending", "accepted", "shipped", "delivered", "cancelled"];
    const paymentStatuses = ["pending", "paid", "paid", "paid", "paid"];

    const samples = await Promise.all(
      statuses.map((status, i) =>
        SampleRequest.create({
          buyer: buyer._id,
          seller: seller._id,
          product: product._id,
          quantity: 5 + i,
          unitPrice: 100,
          totalAmount: (5 + i) * 100,
          shippingAddress: {
            street: "123 Test Street",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
          },
          status,
          paymentStatus: paymentStatuses[i],
          buyerNote: `Test order with status: ${status}`,
        })
      )
    );

    console.log(`\n✅ Created ${samples.length} test sample requests:`);
    samples.forEach((s) => {
      console.log(`   - ${s.status} (Payment: ${s.paymentStatus})`);
    });

    // Get all samples for the buyer
    const allSamples = await SampleRequest.find({ buyer: buyer._id }).lean();
    console.log(`\n📊 Total samples for buyer now: ${allSamples.length}`);

    // Count by status
    const statusCounts = await SampleRequest.aggregate([
      { $match: { buyer: buyer._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    console.log("\n📊 Count by Status:");
    statusCounts.forEach((s) => {
      console.log(`   ${s._id}: ${s.count}`);
    });

    console.log("\n✅ Test data created! Try clicking the filter tabs now.");
    console.log(`   The buyer will now see orders with statuses: ${statuses.join(", ")}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
