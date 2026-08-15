import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../models/User.js";

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/indiamart";

const ADMIN = {
  name: "Test Admin",
  email: "admin@test.com",
  phone: "9000000000",
  password: "Admin@123",
  role: "admin",
  isMobileVerified: true,
  isVerified: true,
};

async function run() {
  await mongoose.connect(MONGO_URI);

  const existing = await User.findOne({ email: ADMIN.email }).select("+password");
  if (existing) {
    existing.password = ADMIN.password;
    existing.role = "admin";
    existing.isActive = true;
    existing.isDeleted = false;
    await existing.save();
    console.log(`Updated existing user to admin: ${ADMIN.email}`);
  } else {
    await User.create(ADMIN);
    console.log(`Created admin: ${ADMIN.email}`);
  }

  console.log(`Login with email: ${ADMIN.email}  password: ${ADMIN.password}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seed admin failed:", err.message);
  process.exit(1);
});
