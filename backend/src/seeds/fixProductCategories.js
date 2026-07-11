/**
 * Fix Product Category References
 *
 * Run: node src/seeds/fixProductCategories.js
 *      OR: npm run fix-categories
 *
 * What it does:
 * 1. Finds all products whose category ObjectId no longer exists in the Category collection
 * 2. Tries to remap them to the correct category using the product's name/tags
 * 3. Falls back to the first available category if no match found
 */

import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/indiamart";

// Keywords → category name hints (used to remap orphaned products)
const PRODUCT_TO_CATEGORY_HINTS = [
  { keywords: ["mobile", "phone", "smartphone", "iphone", "android", "samsung", "oppo", "vivo", "realme", "oneplus"], category: "mobile" },
  { keywords: ["laptop", "computer", "pc", "notebook", "macbook", "dell", "hp", "lenovo", "asus"], category: "laptop" },
  { keywords: ["tv", "television", "led", "oled", "qled", "screen", "monitor", "display"], category: "television" },
  { keywords: ["shirt", "tshirt", "trouser", "pants", "dress", "saree", "kurta", "fabric", "cotton", "polyester", "garment", "clothing"], category: "apparel" },
  { keywords: ["steel", "pipe", "valve", "pump", "industrial", "machinery", "machine", "equipment", "motor", "gear"], category: "machinery" },
  { keywords: ["furniture", "sofa", "chair", "table", "desk", "bed", "wardrobe", "cabinet", "wooden"], category: "furniture" },
  { keywords: ["medicine", "drug", "pharma", "tablet", "capsule", "syrup", "injection", "supplement", "vitamin"], category: "pharmaceutical" },
  { keywords: ["food", "grocery", "rice", "wheat", "sugar", "oil", "spice", "masala", "dal", "flour", "snack", "biscuit"], category: "food" },
  { keywords: ["toy", "game", "doll", "puzzle", "board game", "sport", "cricket", "football", "badminton"], category: "toys" },
  { keywords: ["book", "notebook", "stationery", "pen", "pencil", "paper", "printing"], category: "stationery" },
];

function guessCategory(product, allCategories) {
  const text = `${product.name} ${(product.tags || []).join(" ")} ${product.description || ""}`.toLowerCase();

  for (const hint of PRODUCT_TO_CATEGORY_HINTS) {
    if (hint.keywords.some((kw) => text.includes(kw))) {
      const match = allCategories.find((c) =>
        c.name.toLowerCase().includes(hint.category) ||
        hint.category.includes(c.name.toLowerCase())
      );
      if (match) return match;
    }
  }
  return null;
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB:", MONGO_URI.replace(/\/\/.*@/, "//<credentials>@"));

  // 1. Load all categories
  const allCategories = await Category.find({}).lean();
  console.log(`📂 Found ${allCategories.length} categories in DB`);

  if (allCategories.length === 0) {
    console.error("❌ No categories found. Please seed categories first.");
    await mongoose.disconnect();
    return;
  }

  const catIdSet = new Set(allCategories.map((c) => c._id.toString()));
  const defaultCategory = allCategories[0];

  // 2. Load all products
  const allProducts = await Product.find({}).lean();
  console.log(`📦 Found ${allProducts.length} products in DB`);

  // 3. Identify orphaned products (whose category ID doesn't exist in Category collection)
  const orphaned = allProducts.filter((p) => {
    const catId = p.category?.toString();
    return !catId || !catIdSet.has(catId);
  });

  console.log(`\n🔍 Products with orphaned/missing category refs: ${orphaned.length}`);

  if (orphaned.length === 0) {
    console.log("✅ All products have valid category references!");

    // Print category distribution
    console.log("\n📊 Products per category:");
    for (const cat of allCategories) {
      const count = await Product.countDocuments({ category: cat._id });
      if (count > 0) console.log(`   ${cat.name}: ${count} products`);
    }
    const statusCounts = await Product.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    console.log("\n📊 Products by status:", JSON.stringify(statusCounts));
    const activeCounts = await Product.aggregate([{ $group: { _id: "$isActive", count: { $sum: 1 } } }]);
    console.log("📊 Products by isActive:", JSON.stringify(activeCounts));

    await mongoose.disconnect();
    return;
  }

  // 4. Fix orphaned products
  let fixed = 0;
  let fallback = 0;

  for (const product of orphaned) {
    // Try to guess the right category from product name/tags
    const guessed = guessCategory(product, allCategories);

    const newCategoryId = guessed ? guessed._id : defaultCategory._id;
    const newCategoryName = guessed ? guessed.name : defaultCategory.name;

    await Product.updateOne(
      { _id: product._id },
      { $set: { category: newCategoryId } }
    );

    if (guessed) {
      console.log(`  ✅ "${product.name}" → ${newCategoryName}`);
      fixed++;
    } else {
      console.log(`  ⚠️  "${product.name}" → ${newCategoryName} (fallback)`);
      fallback++;
    }
  }

  console.log(`\n✅ Fixed ${fixed} products with guessed category`);
  console.log(`⚠️  ${fallback} products assigned to default category (review manually)`);

  // 5. Also fix status issues — ensure all active products are approved
  const pendingCount = await Product.countDocuments({ status: { $in: ["pending", "draft"] }, isActive: true });
  if (pendingCount > 0) {
    console.log(`\n🔧 Approving ${pendingCount} active products stuck in pending/draft status...`);
    await Product.updateMany(
      { status: { $in: ["pending", "draft"] }, isActive: true },
      { $set: { status: "approved" } }
    );
    console.log("✅ Done approving products");
  }

  // 6. Final summary
  console.log("\n📊 Final product distribution:");
  for (const cat of allCategories) {
    const count = await Product.countDocuments({ category: cat._id, isActive: true, status: "approved" });
    if (count > 0) console.log(`   ${cat.name}: ${count} active+approved products`);
  }

  await mongoose.disconnect();
  console.log("\n✅ Done! Run the VPS deploy to pick up changes.");
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
