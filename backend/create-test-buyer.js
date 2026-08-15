import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Check if buyer exists
    const existingBuyer = await User.findOne({ email: "buyer@test.com" });

    if (existingBuyer) {
      console.log("✅ Buyer already exists:", existingBuyer.email);
      // Update password if needed
      existingBuyer.password = "test1234";
      await existingBuyer.save();
      console.log("✅ Password updated to: test1234");
    } else {
      // Create new buyer
      const buyer = await User.create({
        name: "Test Buyer",
        email: "buyer@test.com",
        phone: "9876543210",
        password: "test1234",
        role: "buyer",
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
      });
      console.log("✅ Test buyer created:");
      console.log("   Email: buyer@test.com");
      console.log("   Password: test1234");
      console.log("   Role: buyer");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
