import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const product = await Product.findOne({ images: { $exists: true, $ne: [] } });
    
    if (product) {
      console.log("Product:", product.name);
      console.log("Images:");
      product.images.forEach((img, i) => {
        console.log(`${i + 1}. URL: ${img.url}`);
      });
    } else {
      console.log("No products with images found");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
