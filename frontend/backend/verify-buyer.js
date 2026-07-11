import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const buyer = await User.findOne({ email: "buyer@test.com" }).select("+password");
    if (buyer) {
      console.log("✅ Buyer found:");
      console.log("   Name:", buyer.name);
      console.log("   Email:", buyer.email);
      console.log("   Role:", buyer.role);
      console.log("   Password hash length:", buyer.password?.length);

      // Try to compare password
      const isMatch = await buyer.comparePassword("test1234");
      console.log("   Password 'test1234' matches:", isMatch);
    } else {
      console.log("❌ Buyer not found");
    }
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
