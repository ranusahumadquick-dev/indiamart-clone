import mongoose from "mongoose";
import Product from "../models/Product.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Migration Script: Fix Products with Missing Images
 * Adds placeholder images and validates existing image URLs
 */

const PLACEHOLDER_IMAGE = "http://localhost:8000/placeholder-product.png";

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find products with missing/invalid images
    const productsToFix = await Product.find({
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } },
        { "images.url": { $exists: false } },
      ],
    });

    console.log(
      `📋 Found ${productsToFix.length} products needing image fixes\n`
    );

    if (productsToFix.length === 0) {
      console.log("✅ All products have valid images!");
      process.exit(0);
    }

    let updated = 0;
    let errors = 0;

    for (const product of productsToFix) {
      try {
        // Check if product has any images at all
        if (!product.images || product.images.length === 0) {
          // Add placeholder image
          product.images = [
            {
              url: PLACEHOLDER_IMAGE,
              publicId: "placeholder",
              isFallback: true,
              uploadedAt: new Date(),
            },
          ];

          await product.save();
          updated++;
          console.log(`✅ Fixed: ${product.name} (added placeholder)`);
        } else {
          // Validate existing images
          let hasValidImage = false;

          const validatedImages = product.images.map((img) => {
            if (img.url && typeof img.url === "string") {
              hasValidImage = true;
              return {
                ...img,
                uploadedAt: img.uploadedAt || new Date(),
              };
            }
            return null;
          });

          if (!hasValidImage) {
            // No valid images, add placeholder
            validatedImages.push({
              url: PLACEHOLDER_IMAGE,
              publicId: "placeholder",
              isFallback: true,
              uploadedAt: new Date(),
            });

            product.images = validatedImages.filter((img) => img !== null);
            await product.save();
            updated++;
            console.log(
              `✅ Fixed: ${product.name} (replaced invalid images)`
            );
          } else {
            // Valid images exist, just clean up
            product.images = validatedImages.filter((img) => img !== null);
            await product.save();
            updated++;
            console.log(`✅ Validated: ${product.name}`);
          }
        }
      } catch (err) {
        errors++;
        console.error(`❌ Error fixing ${product._id}:`, err.message);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total products to fix: ${productsToFix.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Errors encountered: ${errors}`);
    console.log("=".repeat(60));

    if (updated === productsToFix.length) {
      console.log("✅ Migration completed successfully!");
    } else {
      console.log(
        `⚠️ ${errors} products still need manual review`
      );
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  }
})();
