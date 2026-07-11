import mongoose from "mongoose";
import Product from "./src/models/Product.js";
import dotenv from "dotenv";

dotenv.config();

const PLACEHOLDER_IMAGE = "http://localhost:8000/placeholder-product.png";

/**
 * Migration Script: Fix Products with Missing or Invalid Images
 * Adds placeholder images to products that need them
 */

(async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find all products
    const allProducts = await Product.find().select("_id name images");
    console.log(`📦 Found ${allProducts.length} products total\n`);

    // Identify products with missing/invalid images
    const productsToFix = allProducts.filter((p) => {
      if (!p.images || p.images.length === 0) return true;
      if (!p.images.some((img) => img && img.url)) return true;
      return false;
    });

    console.log(`🔍 Found ${productsToFix.length} products needing image fixes`);
    if (productsToFix.length === 0) {
      console.log("✅ All products have valid images!");
      process.exit(0);
    }

    console.log("\n📋 Products to fix:");
    productsToFix.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (${p._id})`);
    });

    let fixed = 0;
    let errors = 0;

    console.log("\n🔧 Starting migration...\n");

    for (const product of productsToFix) {
      try {
        if (!product.images || product.images.length === 0) {
          // No images at all - add placeholder
          product.images = [
            {
              url: PLACEHOLDER_IMAGE,
              publicId: "placeholder",
              isFallback: true,
              uploadedAt: new Date(),
            },
          ];
        } else {
          // Has some images but none with valid URLs - add placeholder
          const validImages = product.images.filter((img) => img && img.url);
          if (validImages.length === 0) {
            product.images.push({
              url: PLACEHOLDER_IMAGE,
              publicId: "placeholder",
              isFallback: true,
              uploadedAt: new Date(),
            });
          }
        }

        await product.save();
        fixed++;
        console.log(`✅ Fixed: ${product.name}`);
      } catch (err) {
        errors++;
        console.error(`❌ Error fixing ${product._id}:`, err.message);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total products to fix: ${productsToFix.length}`);
    console.log(`Successfully fixed: ${fixed}`);
    console.log(`Errors: ${errors}`);
    console.log("=".repeat(60));

    if (fixed === productsToFix.length) {
      console.log("\n✅ Migration completed successfully!");
      console.log("All products now have valid image URLs.");
    } else {
      console.log(`\n⚠️ ${errors} products still need manual review`);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  }
})();
