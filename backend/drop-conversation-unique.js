import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    // Drop the unique index on conversations
    try {
      await db.collection("conversations").dropIndex("buyer_1_seller_1_product_1");
      console.log("✅ Dropped unique index: buyer_1_seller_1_product_1");
    } catch (err) {
      console.log("⚠️  Index error:", err.message);
    }

    // Recreate the index WITHOUT unique constraint
    try {
      await db.collection("conversations").createIndex({ buyer: 1, seller: 1, product: 1 });
      console.log("✅ Created non-unique index: buyer_1_seller_1_product_1");
    } catch (err) {
      console.log("ℹ️  Index already exists:", err.message);
    }

    // List all indexes
    const indexes = await db.collection("conversations").listIndexes().toArray();
    console.log("\n📊 Conversation indexes:");
    indexes.forEach((idx) => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? " (UNIQUE)" : ""}`);
    });

    console.log("\n✅ Done! Buyers can now create multiple sample requests");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
