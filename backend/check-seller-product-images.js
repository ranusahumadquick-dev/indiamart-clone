import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const sellerId = "6a14078ca64a3dd07bf09d8a";
    const products = await Product.find({ seller: sellerId }).select("name images");
    
    console.log(`Found ${products.length} products for seller\n`);
    
    products.forEach((prod, i) => {
      console.log(`${i + 1}. ${prod.name}`);
      if (prod.images && prod.images.length > 0) {
        prod.images.forEach((img, j) => {
          console.log(`   Image ${j + 1}: ${img.url}`);
        });
      } else {
        console.log("   ❌ NO IMAGES");
      }
      console.log("");
    });
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
