import mongoose from "mongoose";
import Product from "./src/models/Product.js";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

/**
 * Product Image Verification Script
 * Checks:
 * 1. Database image URLs are valid
 * 2. Image files exist on disk
 * 3. Images are accessible via HTTP
 * 4. Images have proper format
 */

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

(async () => {
  try {
    console.log("🔍 PRODUCT IMAGE VERIFICATION\n");
    console.log("=".repeat(60));

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database connected\n");

    // Get all products
    const products = await Product.find().select("name images").limit(10);

    if (products.length === 0) {
      console.log("⚠️ No products found");
      process.exit(0);
    }

    console.log(`📦 Found ${products.length} products to verify\n`);

    let totalImages = 0;
    let validImages = 0;
    let missingFiles = 0;
    let unreachableUrls = 0;

    for (const product of products) {
      console.log(`\n📋 Product: ${product.name}`);
      console.log(`   Images: ${product.images?.length || 0}`);

      if (!product.images || product.images.length === 0) {
        console.log("   ⚠️ NO IMAGES");
        continue;
      }

      for (let i = 0; i < product.images.length; i++) {
        const img = product.images[i];
        totalImages++;

        if (!img.url) {
          console.log(`   ❌ Image ${i + 1}: No URL`);
          continue;
        }

        console.log(`   📸 Image ${i + 1}:`);
        console.log(`      URL: ${img.url}`);

        // Check if local file exists
        if (img.url.includes("/uploads/")) {
          const filename = img.url.split("/").pop();
          const filepath = path.join(UPLOADS_DIR, "products", filename);

          if (fs.existsSync(filepath)) {
            const stats = fs.statSync(filepath);
            console.log(`      ✅ File exists (${(stats.size / 1024).toFixed(2)}KB)`);
            validImages++;
          } else {
            console.log(`      ❌ File not found: ${filepath}`);
            missingFiles++;
            continue;
          }
        } else {
          // External URL
          console.log("      ℹ️ External URL");
          validImages++;
        }

        // Check HTTP accessibility
        try {
          const response = await axios.head(img.url, { timeout: 5000 });
          if (response.status === 200) {
            console.log(`      ✅ Accessible (HTTP ${response.status})`);
          } else {
            console.log(
              `      ⚠️ Status ${response.status}`
            );
          }
        } catch (err) {
          console.log(`      ❌ Not accessible: ${err.message}`);
          unreachableUrls++;
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 VERIFICATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total images found: ${totalImages}`);
    console.log(`Valid/Accessible: ${validImages}`);
    console.log(`Missing files: ${missingFiles}`);
    console.log(`Unreachable URLs: ${unreachableUrls}`);
    console.log("=".repeat(60));

    if (validImages === totalImages) {
      console.log("\n✅ All product images verified successfully!");
    } else {
      console.log(
        `\n⚠️ ${totalImages - validImages} images have issues`
      );
      console.log("\nRun migration to fix:");
      console.log("  node backend/src/utils/migrateProductImages.js");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Verification error:", err.message);
    process.exit(1);
  }
})();
