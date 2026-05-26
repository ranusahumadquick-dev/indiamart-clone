import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/Product.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const product = await Product.findOne({ name: "Cotton kurta set for woman" });
    
    if (product && product.images.length > 0) {
      console.log("✅ PRODUCT IMAGE FIX VERIFICATION\n");
      console.log("Product:", product.name);
      console.log("Image URL:", product.images[0].url);
      console.log("");
      
      if (product.images[0].url.startsWith("http")) {
        console.log("✅ SUCCESS: Image URL is now absolute!");
        console.log("📸 Try accessing: " + product.images[0].url);
      } else {
        console.log("❌ Image URL is still relative");
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
