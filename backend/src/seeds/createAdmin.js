import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../models/User.js";

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/indiamart";

const ADMIN_EMAIL = "admin@indiamart.com";
const ADMIN_PASSWORD = "Admin@2024";

async function createAdmin() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected");

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save({ validateBeforeSave: false });
      console.log("✅ Existing user upgraded to admin");
    } else {
      console.log("ℹ️  Admin user already exists");
    }
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: "Admin",
    email: ADMIN_EMAIL,
    phone: "9000000000",
    password: ADMIN_PASSWORD,
    role: "admin",
    isVerified: true,
    profileCompleted: true,
  });

  console.log("✅ Admin user created successfully");
  console.log("   Email   :", ADMIN_EMAIL);
  console.log("   Password:", ADMIN_PASSWORD);

  await mongoose.disconnect();
}

createAdmin().catch((e) => { console.error(e); process.exit(1); });
