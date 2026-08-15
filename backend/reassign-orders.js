import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./src/models/Order.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const newSellerId = "6a14078ca64a3dd07bf09d8a"; // seller@test.com
    const oldSellerId = "6a0d5bb327baea5215dfa82e";

    console.log("🔄 REASSIGNING ORDERS TO PRIMARY SELLER...\n");

    const result = await Order.updateMany(
      { seller: oldSellerId },
      { seller: newSellerId }
    );

    console.log(`✅ Updated ${result.modifiedCount} orders`);
    console.log(`   From seller: ${oldSellerId}`);
    console.log(`   To seller: ${newSellerId}`);
    console.log("");

    // Verify
    const newCount = await Order.countDocuments({ seller: newSellerId });
    console.log(`📊 Total orders for primary seller now: ${newCount}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
