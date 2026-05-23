import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

import User from "../models/User.js";

const demoUsers = [
  {
    name: "Test Buyer",
    email: "buyer@test.com",
    phone: "9876543210",
    password: "test1234",
    role: "buyer",
  },
  {
    name: "Test Seller",
    email: "seller@test.com",
    phone: "9876543211",
    password: "test1234",
    role: "seller",
    profileCompleted: true,
  },
  {
    name: "Admin User",
    email: "admin@test.com",
    phone: "9876543212",
    password: "test1234",
    role: "admin",
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB Connected");

  for (const data of demoUsers) {
    // Always delete and recreate to ensure correct password hash + role
    await User.deleteOne({ email: data.email });
    await User.create(data);
    console.log(`✅ Seeded [${data.role}]: ${data.email} / ${data.password}`);
  }

  await mongoose.disconnect();
  console.log("\n🎉 Seed complete. Fresh users with correct hashes.");
  console.log("─────────────────────────────────");
  console.log("  buyer@test.com   / test1234");
  console.log("  seller@test.com  / test1234");
  console.log("  admin@test.com   / test1234");
  console.log("─────────────────────────────────");
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
