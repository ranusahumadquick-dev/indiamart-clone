import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Product from "../models/Product.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/indiamart";

// Correct Unsplash images matched to product names
const IMAGE_MAP = [
  {
    nameContains: "Stainless Steel Pipe",
    url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=450&fit=crop",
  },
  {
    nameContains: "Cotton Printed Fabric",
    url: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=450&fit=crop",
  },
  {
    nameContains: "LED Panel Light",
    url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=450&fit=crop",
  },
  {
    nameContains: "Hydraulic Cylinder",
    url: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&h=450&fit=crop",
  },
  {
    nameContains: "Packaging Machine",
    url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=450&fit=crop",
  },
  {
    nameContains: "Solar Panel",
    url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=450&fit=crop",
  },
  {
    nameContains: "Urea Fertilizer",
    url: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&h=450&fit=crop",
  },
  {
    nameContains: "Woven Sacks",
    url: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&h=450&fit=crop",
  },
];

async function fix() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected");

  for (const { nameContains, url } of IMAGE_MAP) {
    const result = await Product.updateMany(
      { name: { $regex: nameContains, $options: "i" } },
      { $set: { images: [{ url, publicId: "seed_fixed" }] } }
    );
    console.log(`✅ ${nameContains}: updated ${result.modifiedCount} product(s)`);
  }

  await mongoose.disconnect();
  console.log("✅ Done — refresh the browser to see updated images.");
}

fix().catch(e => { console.error("❌", e.message); process.exit(1); });
