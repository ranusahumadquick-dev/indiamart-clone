import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const products = await Product.find({ images: { $exists: true, $ne: [] } });
    
    console.log(`Found ${products.length} products with images\n`);
    
    let updated = 0;

    for (const product of products) {
      let changed = false;
      
      product.images = product.images.map((img) => {
        // If URL is relative path, convert to absolute
        if (img.url && !img.url.startsWith("http")) {
          changed = true;
          return {
            ...img,
            url: `http://localhost:8000${img.url}`
          };
        }
        return img;
      });

      if (changed) {
        await product.save();
        updated++;
        console.log(`✅ Updated: ${product.name}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total products with images: ${products.length}`);
    console.log(`   Updated: ${updated}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
