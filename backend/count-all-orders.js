import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./src/models/Order.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const sellerId = "6a14078ca64a3dd07bf09d8a";
    const count = await Order.countDocuments({ seller: sellerId });
    
    console.log(`✅ TOTAL ORDERS FOR SELLER: ${count}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
