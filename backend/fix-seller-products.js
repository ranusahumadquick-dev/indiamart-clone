import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get Test Seller (the one currently logged in)
    const testSellerId = "6a14078ca64a3dd07bf09d8a"; // seller@test.com

    // Update all products to be owned by Test Seller
    const result = await Product.updateMany(
      {},
      { seller: testSellerId },
      { new: true }
    );

    console.log(`✅ Updated ${result.modifiedCount} products`);
    console.log(`   All products now owned by seller: ${testSellerId}`);
    console.log("\n📋 Products owned by Test Seller:");

    const products = await Product.find({ seller: testSellerId })
      .select("name seller")
      .limit(5);

    products.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name}`);
    });

    console.log("\n✅ Done! Now all orders will show for Test Seller");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
