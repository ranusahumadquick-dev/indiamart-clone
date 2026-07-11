import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Drop the unique index on samplerequests
    const db = mongoose.connection.db;

    try {
      await db.collection("samplerequests").dropIndex("buyer_1_seller_1_product_1");
      console.log("✅ Dropped unique index: buyer_1_seller_1_product_1");
    } catch (err) {
      console.log("⚠️  Index doesn't exist or error:", err.message);
    }

    // List all remaining indexes
    const indexes = await db.collection("samplerequests").listIndexes().toArray();
    console.log("\n📊 Remaining indexes:");
    indexes.forEach((idx) => {
      console.log(`  - ${JSON.stringify(idx.name)}: ${JSON.stringify(idx.key)}`);
    });

    console.log("\n✅ Done! Buyers can now create multiple sample requests for same product");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
