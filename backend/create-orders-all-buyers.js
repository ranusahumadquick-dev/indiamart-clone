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

    // Get all buyers
    const buyers = await User.find({ role: "buyer" }).lean();
    const seller = await User.findOne({ role: "seller" });
    const products = await Product.find().limit(5).lean();

    if (!buyers.length) {
      console.log("❌ No buyers found");
      process.exit(0);
    }

    if (!seller) {
      console.log("❌ No seller found");
      process.exit(0);
    }

    if (!products.length) {
      console.log("❌ No products found");
      process.exit(0);
    }

    console.log(`\n👥 Found ${buyers.length} buyers`);
    console.log(`📦 Found ${products.length} products`);
    console.log(`🏪 Seller: ${seller.name}\n`);

    const statuses = ["pending", "accepted", "shipped", "delivered", "cancelled"];
    const paymentStatuses = ["pending", "paid", "paid", "paid", "paid"];

    let totalCreated = 0;

    // Create sample requests for each buyer
    for (const buyer of buyers) {
      console.log(`\n📝 Creating orders for buyer: ${buyer.name} (${buyer.email})`);

      // Create one sample request for each status
      const samples = await Promise.all(
        statuses.map((status, i) =>
          SampleRequest.create({
            buyer: buyer._id,
            seller: seller._id,
            product: products[i % products.length]._id,
            quantity: 5 + i,
            unitPrice: 100 + i * 10,
            totalAmount: (5 + i) * (100 + i * 10),
            shippingAddress: {
              street: "123 Test Street",
              city: "Mumbai",
              state: "Maharashtra",
              pincode: "400001",
            },
            status,
            paymentStatus: paymentStatuses[i],
            buyerNote: `Test ${status} order`,
          })
        )
      );

      console.log(`   ✅ Created ${samples.length} sample requests`);
      samples.forEach((s) => {
        console.log(`      • ${s.status} (${s.paymentStatus})`);
      });

      totalCreated += samples.length;
    }

    console.log(`\n\n✨ SUMMARY`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Total sample requests created: ${totalCreated}`);
    console.log(`👥 Buyers with orders: ${buyers.length}`);
    console.log(`📋 Statuses: ${statuses.join(", ")}`);
    console.log(`\n✅ Refresh your browser and the "My Orders" page will now show:`);
    console.log(`   • All Orders (shows all 5)`);
    console.log(`   • Delivered (shows 1)`);
    console.log(`   • Shipped (shows 1)`);
    console.log(`   • Confirmed (shows 1)`);
    console.log(`   • Pending (shows 1)`);
    console.log(`   • Cancelled (shows 1)`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
