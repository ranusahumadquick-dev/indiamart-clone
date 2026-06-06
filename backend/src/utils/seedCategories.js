import Category from "../models/Category.js";

const toSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const CATEGORIES = [
  {
    name: "Food & Beverages",
    description: "Grains, pulses, dairy, spices, beverages, snacks, and sweets",
    icon: "🍽️",
    sortOrder: 1,
    subcategories: [
      { name: "Grains & Pulses", sortOrder: 1 },
      { name: "Dairy", sortOrder: 2 },
      { name: "Spices", sortOrder: 3 },
      { name: "Beverages", sortOrder: 4 },
      { name: "Snacks", sortOrder: 5 },
      { name: "Sweets", sortOrder: 6 },
      { name: "Dry Fruits", sortOrder: 7 },
    ],
  },
  {
    name: "Agriculture",
    description: "Fresh produce, seeds, fertilizers, pesticides, herbs, and flowers",
    icon: "🌾",
    sortOrder: 2,
    subcategories: [
      { name: "Fruits", sortOrder: 1 },
      { name: "Vegetables", sortOrder: 2 },
      { name: "Seeds", sortOrder: 3 },
      { name: "Fertilizers", sortOrder: 4 },
      { name: "Pesticides", sortOrder: 5 },
      { name: "Herbs", sortOrder: 6 },
      { name: "Flowers", sortOrder: 7 },
    ],
  },
  {
    name: "Clothing & Apparel",
    description: "Men's, women's, and kids' clothing, traditional wear, sportswear, and winter wear",
    icon: "👕",
    sortOrder: 3,
    subcategories: [
      { name: "Men", sortOrder: 1 },
      { name: "Women", sortOrder: 2 },
      { name: "Kids", sortOrder: 3 },
      { name: "Traditional", sortOrder: 4 },
      { name: "Sportswear", sortOrder: 5 },
      { name: "Winter Wear", sortOrder: 6 },
    ],
  },
  {
    name: "Footwear",
    description: "Shoes, sandals, and footwear for men, women, and kids",
    icon: "👟",
    sortOrder: 4,
    subcategories: [
      { name: "Men", sortOrder: 1 },
      { name: "Women", sortOrder: 2 },
      { name: "Kids", sortOrder: 3 },
    ],
  },
  {
    name: "Electronics",
    description: "Mobile phones, laptops, TVs, cameras, audio, and accessories",
    icon: "📱",
    sortOrder: 5,
    subcategories: [
      { name: "Mobile", sortOrder: 1 },
      { name: "Laptop", sortOrder: 2 },
      { name: "TV", sortOrder: 3 },
      { name: "Camera", sortOrder: 4 },
      { name: "Audio", sortOrder: 5 },
      { name: "Accessories", sortOrder: 6 },
    ],
  },
  {
    name: "Furniture & Home",
    description: "Living room, bedroom, and office furniture",
    icon: "🛋️",
    sortOrder: 6,
    subcategories: [
      { name: "Living Room", sortOrder: 1 },
      { name: "Bedroom", sortOrder: 2 },
      { name: "Office", sortOrder: 3 },
    ],
  },
  {
    name: "Cosmetics & Beauty",
    description: "Skincare, makeup, haircare, and fragrances",
    icon: "💄",
    sortOrder: 7,
    subcategories: [
      { name: "Skincare", sortOrder: 1 },
      { name: "Makeup", sortOrder: 2 },
      { name: "Haircare", sortOrder: 3 },
      { name: "Fragrances", sortOrder: 4 },
    ],
  },
  {
    name: "Hardware & Tools",
    description: "Hand tools, power tools, and paints",
    icon: "🔧",
    sortOrder: 8,
    subcategories: [
      { name: "Hand Tools", sortOrder: 1 },
      { name: "Power Tools", sortOrder: 2 },
      { name: "Paints", sortOrder: 3 },
    ],
  },
  {
    name: "Sports & Fitness",
    description: "Cricket, gym equipment, yoga, cycling, and badminton",
    icon: "⚽",
    sortOrder: 9,
    subcategories: [
      { name: "Cricket", sortOrder: 1 },
      { name: "Gym", sortOrder: 2 },
      { name: "Yoga", sortOrder: 3 },
      { name: "Cycling", sortOrder: 4 },
      { name: "Badminton", sortOrder: 5 },
    ],
  },
  {
    name: "Toys & Kids",
    description: "Educational toys and outdoor toys for kids",
    icon: "🧸",
    sortOrder: 10,
    subcategories: [
      { name: "Educational", sortOrder: 1 },
      { name: "Outdoor Toys", sortOrder: 2 },
    ],
  },
  {
    name: "Jewelry",
    description: "Rings, necklaces, earrings, and ornaments",
    icon: "💍",
    sortOrder: 11,
    subcategories: [
      { name: "Rings", sortOrder: 1 },
      { name: "Necklaces", sortOrder: 2 },
      { name: "Earrings", sortOrder: 3 },
    ],
  },
  {
    name: "Industrial Machinery",
    description: "CNC machines, hydraulic equipment, packaging machines, and industrial tools",
    icon: "⚙️",
    sortOrder: 12,
    subcategories: [
      { name: "CNC Machines", sortOrder: 1 },
      { name: "Hydraulic Equipment", sortOrder: 2 },
      { name: "Packaging Machines", sortOrder: 3 },
      { name: "Lathe Machines", sortOrder: 4 },
      { name: "Welding Equipment", sortOrder: 5 },
      { name: "Compressors", sortOrder: 6 },
    ],
  },
  {
    name: "Construction & Building",
    description: "Steel, cement, pipes, tiles, and construction materials",
    icon: "🏗️",
    sortOrder: 13,
    subcategories: [
      { name: "Steel & Iron", sortOrder: 1 },
      { name: "Cement & Concrete", sortOrder: 2 },
      { name: "Pipes & Fittings", sortOrder: 3 },
      { name: "Tiles & Flooring", sortOrder: 4 },
      { name: "Paints & Coatings", sortOrder: 5 },
      { name: "Bricks & Blocks", sortOrder: 6 },
    ],
  },
  {
    name: "Chemicals & Plastics",
    description: "Industrial chemicals, plastic raw materials, and rubber products",
    icon: "🧪",
    sortOrder: 14,
    subcategories: [
      { name: "Industrial Chemicals", sortOrder: 1 },
      { name: "Plastic Raw Materials", sortOrder: 2 },
      { name: "Rubber Products", sortOrder: 3 },
      { name: "Adhesives & Sealants", sortOrder: 4 },
      { name: "Paint & Coating Chemicals", sortOrder: 5 },
    ],
  },
  {
    name: "Industrial Supplies",
    description: "Safety equipment, packaging materials, tools, and MRO supplies",
    icon: "📦",
    sortOrder: 15,
    subcategories: [
      { name: "Safety Equipment", sortOrder: 1 },
      { name: "Packaging Materials", sortOrder: 2 },
      { name: "Hand & Power Tools", sortOrder: 3 },
      { name: "Bearings & Belts", sortOrder: 4 },
      { name: "Cleaning Supplies", sortOrder: 5 },
    ],
  },
  {
    name: "Automobile Parts",
    description: "Car parts, two-wheeler components, tyres, and auto accessories",
    icon: "🚗",
    sortOrder: 16,
    subcategories: [
      { name: "Engine Parts", sortOrder: 1 },
      { name: "Tyres & Wheels", sortOrder: 2 },
      { name: "Electrical Parts", sortOrder: 3 },
      { name: "Body Parts", sortOrder: 4 },
    ],
  },
  {
    name: "Medical & Healthcare",
    description: "Hospital equipment, surgical instruments, diagnostics, and pharma",
    icon: "🏥",
    sortOrder: 17,
    subcategories: [
      { name: "Hospital Equipment", sortOrder: 1 },
      { name: "Surgical Instruments", sortOrder: 2 },
      { name: "Diagnostic Equipment", sortOrder: 3 },
      { name: "Pharmaceutical Chemicals", sortOrder: 4 },
    ],
  },
];

// Canonical name set — used to identify stale categories
const CANONICAL_NAMES = new Set([
  ...CATEGORIES.map((c) => c.name),
  ...CATEGORIES.flatMap((c) => c.subcategories.map((s) => s.name)),
]);

export async function seedCategories() {
  try {
    // Delete every category NOT in our canonical list (old duplicates, test data, etc.)
    const stale = await Category.find({
      name: { $nin: Array.from(CANONICAL_NAMES) },
    }).select("name slug");

    if (stale.length > 0) {
      const staleIds = stale.map((c) => c._id);
      await Category.deleteMany({ _id: { $in: staleIds } });
      console.log(`🧹 Removed ${stale.length} stale/duplicate categories: ${stale.map((c) => c.name).join(", ")}`);
    }

    // Upsert each parent + subcategories
    for (const catData of CATEGORIES) {
      const { subcategories, ...parentData } = catData;
      const parentSlug = toSlug(parentData.name);

      const parent = await Category.findOneAndUpdate(
        { slug: parentSlug },
        {
          $set: {
            ...parentData,
            slug: parentSlug,
            isActive: true,
            parentCategory: null,
          },
        },
        { upsert: true, returnDocument: "after" }
      );

      for (const subData of subcategories) {
        const subSlug = toSlug(subData.name);
        await Category.findOneAndUpdate(
          { slug: subSlug },
          {
            $set: {
              ...subData,
              slug: subSlug,
              description: subData.description || "",
              icon: subData.icon || "",
              isActive: true,
              parentCategory: parent._id,
            },
          },
          { upsert: true, returnDocument: "after" }
        );
      }
    }

    const total = await Category.countDocuments({ isActive: true });
    console.log(`✅ Categories ready — ${CATEGORIES.length} parent, ${total - CATEGORIES.length} sub (${total} total)`);
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
  }
}
