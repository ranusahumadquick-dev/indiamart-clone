import mongoose from "mongoose";
import Category from "./src/models/Category.js";

await mongoose.connect('mongodb://localhost:27017/indiamart');

console.log("=== CATEGORIES WITH VARIANT TEMPLATES ===\n");

const categories = await Category.find({ variantTemplates: { $exists: true, $ne: [] } });

if (categories.length === 0) {
  console.log("❌ NO CATEGORIES WITH VARIANT TEMPLATES FOUND!");
  
  // Check if variantTemplates field exists at all
  const allCategories = await Category.find({});
  console.log("\nChecking ALL categories...");
  allCategories.slice(0, 3).forEach(cat => {
    console.log(`\nCategory: ${cat.name}`);
    console.log(`  Has variantTemplates field:`, 'variantTemplates' in cat);
    console.log(`  variantTemplates value:`, cat.variantTemplates);
  });
} else {
  console.log(`✅ Found ${categories.length} categories with variant templates\n`);
  
  categories.forEach(cat => {
    console.log(`✅ ${cat.name}`);
    console.log(`   variantTemplates: ${cat.variantTemplates.length}`);
    cat.variantTemplates.forEach(vt => {
      console.log(`   - ${vt.name}: ${vt.values.join(', ')}`);
    });
  });
}

await mongoose.disconnect();
process.exit(0);
