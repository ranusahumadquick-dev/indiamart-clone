import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find all test users
    const users = await User.find({ email: { $regex: "test" } }).lean();
    console.log(`Found ${users.length} test users:\n`);

    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.name} (${u.email})`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Password hash: ${u.password?.substring(0, 50)}...`);
      console.log("");
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
