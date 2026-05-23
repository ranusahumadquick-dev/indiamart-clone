import Category from "../models/Category.js";

const toSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const CATEGORIES = [
  {
    name: "Industrial Machinery",
    description: "CNC machines, hydraulic equipment, packaging machines, and industrial tools",
    icon: "⚙️",
    sortOrder: 1,
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
    name: "Agriculture & Farming",
    description: "Seeds, fertilizers, farm equipment, and agricultural supplies",
    icon: "🌾",
    sortOrder: 2,
    subcategories: [
      { name: "Seeds & Plants", sortOrder: 1 },
      { name: "Fertilizers & Pesticides", sortOrder: 2 },
      { name: "Farm Equipment", sortOrder: 3 },
      { name: "Irrigation Systems", sortOrder: 4 },
      { name: "Wheat & Flour", sortOrder: 5 },
      { name: "Rice", sortOrder: 6 },
    ],
  },
  {
    name: "Electronics & Electrical",
    description: "LED lights, solar panels, cables, switches, and electrical components",
    icon: "⚡",
    sortOrder: 3,
    subcategories: [
      { name: "LED Lights", sortOrder: 1 },
      { name: "Solar Products", sortOrder: 2 },
      { name: "Wires & Cables", sortOrder: 3 },
      { name: "Switches & Sockets", sortOrder: 4 },
      { name: "Motors & Pumps", sortOrder: 5 },
      { name: "Batteries & UPS", sortOrder: 6 },
    ],
  },
  {
    name: "Textiles & Apparel",
    description: "Fabrics, garments, yarn, and textile machinery",
    icon: "🧵",
    sortOrder: 4,
    subcategories: [
      { name: "Cotton Fabric", sortOrder: 1 },
      { name: "Synthetic Fabric", sortOrder: 2 },
      { name: "Garments & Clothing", sortOrder: 3 },
      { name: "Yarn & Thread", sortOrder: 4 },
      { name: "Sarees & Ethnic Wear", sortOrder: 5 },
    ],
  },
  {
    name: "Construction & Building",
    description: "Steel, cement, pipes, tiles, and construction materials",
    icon: "🏗️",
    sortOrder: 5,
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
    name: "Food & Beverages",
    description: "Spices, grains, packaged foods, and food processing equipment",
    icon: "🌽",
    sortOrder: 6,
    subcategories: [
      { name: "Spices & Condiments", sortOrder: 1 },
      { name: "Packaged Foods", sortOrder: 2 },
      { name: "Dairy Products", sortOrder: 3 },
      { name: "Edible Oils", sortOrder: 4 },
      { name: "Beverages", sortOrder: 5 },
      { name: "Pulses & Lentils", sortOrder: 6 },
    ],
  },
  {
    name: "Chemicals & Plastics",
    description: "Industrial chemicals, plastic raw materials, and rubber products",
    icon: "🧪",
    sortOrder: 7,
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
    icon: "🔧",
    sortOrder: 8,
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
    sortOrder: 9,
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
    sortOrder: 10,
    subcategories: [
      { name: "Hospital Equipment", sortOrder: 1 },
      { name: "Surgical Instruments", sortOrder: 2 },
      { name: "Diagnostic Equipment", sortOrder: 3 },
      { name: "Pharmaceutical Chemicals", sortOrder: 4 },
    ],
  },
  {
    name: "Packaging",
    description: "Corrugated boxes, plastic packaging, labels, and packing tape",
    icon: "📦",
    sortOrder: 11,
    subcategories: [
      { name: "Corrugated Boxes", sortOrder: 1 },
      { name: "Plastic Packaging", sortOrder: 2 },
      { name: "Label & Printing", sortOrder: 3 },
      { name: "Tape & Adhesives", sortOrder: 4 },
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
