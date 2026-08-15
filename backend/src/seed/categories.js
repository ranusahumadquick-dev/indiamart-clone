import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";

dotenv.config();

// =============================================
// 🌳 Hierarchical Category Data
// =============================================
const CATEGORY_TREE = [
  {
    name: "Agriculture",
    icon: "🌾",
    description: "Seeds, fertilizers, farming equipment and agricultural products",
    sortOrder: 1,
    subcategories: [
      { name: "Rice", icon: "🍚", description: "Basmati, Kolam, Sona Masoori and other rice varieties", sortOrder: 1 },
      { name: "Wheat & Flour", icon: "🌾", description: "Wheat grains, atta, maida and other flour products", sortOrder: 2 },
      { name: "Seeds", icon: "🌱", description: "Agricultural seeds, hybrid seeds, vegetable seeds", sortOrder: 3 },
      { name: "Fertilizers", icon: "🧪", description: "Organic and chemical fertilizers, pesticides, insecticides", sortOrder: 4 },
      { name: "Spices", icon: "🌶️", description: "Turmeric, chili, cumin, coriander and whole spices", sortOrder: 5 },
      { name: "Pulses & Lentils", icon: "🫘", description: "Toor dal, moong dal, chana dal, urad dal", sortOrder: 6 },
    ],
  },
  {
    name: "Industrial Machinery",
    icon: "⚙️",
    description: "Heavy machinery, industrial equipment and manufacturing tools",
    sortOrder: 2,
    subcategories: [
      { name: "CNC Machines", icon: "🔩", description: "CNC lathe, milling, routing and cutting machines", sortOrder: 1 },
      { name: "Hydraulic Equipment", icon: "🔧", description: "Hydraulic pumps, cylinders, presses and fittings", sortOrder: 2 },
      { name: "Packaging Machines", icon: "📦", description: "Filling, sealing, labeling and wrapping machines", sortOrder: 3 },
      { name: "Compressors", icon: "💨", description: "Air compressors, industrial compressors and parts", sortOrder: 4 },
      { name: "Welding Equipment", icon: "⚡", description: "Welding machines, electrodes, torches and safety gear", sortOrder: 5 },
    ],
  },
  {
    name: "Electronics & Electrical",
    icon: "💡",
    description: "LED lights, electrical panels, switches, cables and components",
    sortOrder: 3,
    subcategories: [
      { name: "LED Lights", icon: "💡", description: "LED panel lights, bulbs, strip lights, flood lights", sortOrder: 1 },
      { name: "Solar Equipment", icon: "☀️", description: "Solar panels, inverters, batteries and mounting kits", sortOrder: 2 },
      { name: "Cables & Wires", icon: "🔌", description: "Electrical cables, power cables, coaxial and fiber optic", sortOrder: 3 },
      { name: "Switches & Panels", icon: "🔴", description: "MCB, DB boards, electrical switches and distribution panels", sortOrder: 4 },
      { name: "Batteries & UPS", icon: "🔋", description: "Inverter batteries, UPS systems, lithium batteries", sortOrder: 5 },
    ],
  },
  {
    name: "Building & Construction",
    icon: "🏗️",
    description: "Cement, steel, pipes, tiles and construction materials",
    sortOrder: 4,
    subcategories: [
      { name: "Cement & Concrete", icon: "🧱", description: "OPC cement, PPC cement, ready-mix concrete", sortOrder: 1 },
      { name: "Steel & Iron", icon: "🔩", description: "TMT bars, structural steel, angle iron, channels", sortOrder: 2 },
      { name: "Pipes & Fittings", icon: "🔧", description: "GI pipes, PVC pipes, stainless steel pipes, fittings", sortOrder: 3 },
      { name: "Tiles & Flooring", icon: "🏠", description: "Ceramic tiles, vitrified tiles, marble, granite", sortOrder: 4 },
      { name: "Paint & Finishing", icon: "🎨", description: "Wall paint, primer, distemper, varnishes", sortOrder: 5 },
    ],
  },
  {
    name: "Textile & Fabrics",
    icon: "🧵",
    description: "Cotton, silk, polyester fabrics and textile products",
    sortOrder: 5,
    subcategories: [
      { name: "Cotton Fabric", icon: "👕", description: "Pure cotton, organic cotton, cotton blends", sortOrder: 1 },
      { name: "Silk Fabric", icon: "🪢", description: "Pure silk, art silk, chiffon, georgette", sortOrder: 2 },
      { name: "Synthetic Fabric", icon: "🧶", description: "Polyester, nylon, acrylic, rayon fabrics", sortOrder: 3 },
      { name: "Yarn & Thread", icon: "🧵", description: "Cotton yarn, polyester yarn, embroidery threads", sortOrder: 4 },
      { name: "Ready-made Garments", icon: "👔", description: "T-shirts, shirts, trousers, uniforms in bulk", sortOrder: 5 },
    ],
  },
  {
    name: "Chemicals",
    icon: "🧪",
    description: "Industrial chemicals, solvents, acids and specialty chemicals",
    sortOrder: 6,
    subcategories: [
      { name: "Industrial Chemicals", icon: "⚗️", description: "Caustic soda, soda ash, sulphuric acid, solvents", sortOrder: 1 },
      { name: "Water Treatment", icon: "💧", description: "RO chemicals, cooling tower chemicals, boiler chemicals", sortOrder: 2 },
      { name: "Paint & Coating Chemicals", icon: "🎨", description: "Resins, pigments, additives, thinners", sortOrder: 3 },
      { name: "Pharmaceutical Chemicals", icon: "💊", description: "API, excipients, pharma intermediates", sortOrder: 4 },
    ],
  },
  {
    name: "Automobile Parts",
    icon: "🚗",
    description: "Auto components, spare parts, batteries and accessories",
    sortOrder: 7,
    subcategories: [
      { name: "Engine Parts", icon: "⚙️", description: "Pistons, cylinders, gaskets, crankshafts", sortOrder: 1 },
      { name: "Body Parts", icon: "🚙", description: "Bumpers, fenders, doors, mirrors", sortOrder: 2 },
      { name: "Electrical Parts", icon: "🔋", description: "Alternators, starters, sensors, wiring harnesses", sortOrder: 3 },
      { name: "Tyres & Wheels", icon: "🛞", description: "Truck tyres, car tyres, alloy wheels, tubes", sortOrder: 4 },
    ],
  },
  {
    name: "Food & Beverages",
    icon: "🍽️",
    description: "Packaged food, beverages, processed food and ingredients",
    sortOrder: 8,
    subcategories: [
      { name: "Beverages", icon: "🥤", description: "Mineral water, juices, tea, coffee, soft drinks", sortOrder: 1 },
      { name: "Snacks & Sweets", icon: "🍪", description: "Biscuits, namkeen, chocolates, Indian sweets", sortOrder: 2 },
      { name: "Dairy Products", icon: "🥛", description: "Milk powder, ghee, butter, cheese, paneer", sortOrder: 3 },
      { name: "Edible Oils", icon: "🫒", description: "Mustard oil, sunflower oil, palm oil, coconut oil", sortOrder: 4 },
    ],
  },
  {
    name: "Medical & Healthcare",
    icon: "🏥",
    description: "Medical devices, hospital equipment, surgical supplies",
    sortOrder: 9,
    subcategories: [
      { name: "Surgical Instruments", icon: "🔪", description: "Scalpels, forceps, scissors, surgical tools", sortOrder: 1 },
      { name: "Hospital Equipment", icon: "🛏️", description: "Hospital beds, wheelchairs, stretchers", sortOrder: 2 },
      { name: "Diagnostic Equipment", icon: "🔬", description: "X-ray machines, ultrasound, blood analyzers", sortOrder: 3 },
      { name: "Pharmaceuticals", icon: "💊", description: "Medicines, tablets, capsules, syrups in bulk", sortOrder: 4 },
    ],
  },
  {
    name: "Packaging",
    icon: "📦",
    description: "Packaging materials, boxes, pouches and printing solutions",
    sortOrder: 10,
    subcategories: [
      { name: "Corrugated Boxes", icon: "📦", description: "Corrugated cartons, shipping boxes, display boxes", sortOrder: 1 },
      { name: "Plastic Packaging", icon: "🛍️", description: "Plastic bags, pouches, shrink wrap, containers", sortOrder: 2 },
      { name: "Label & Printing", icon: "🏷️", description: "Stickers, labels, barcodes, flex printing", sortOrder: 3 },
      { name: "Tape & Adhesives", icon: "📎", description: "Packaging tape, hot melt adhesives, glue sticks", sortOrder: 4 },
    ],
  },
];

// =============================================
// 🌱 Seed Function
// =============================================
async function seedCategories() {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/indiamart";
    await mongoose.connect(MONGO_URI);
    console.log("📦 Connected to MongoDB");

    // Clear existing categories
    await Category.deleteMany({});
    console.log("🗑️  Cleared existing categories");

    let totalParents = 0;
    let totalChildren = 0;

    for (const parentData of CATEGORY_TREE) {
      const { subcategories, ...parentFields } = parentData;

      // Create parent category
      const parent = await Category.create({
        ...parentFields,
        parentCategory: null,
      });
      totalParents++;
      console.log(`  ✅ ${parent.name}`);

      // Create subcategories
      if (subcategories && subcategories.length > 0) {
        for (const subData of subcategories) {
          await Category.create({
            ...subData,
            parentCategory: parent._id,
          });
          totalChildren++;
          console.log(`     └── ${subData.name}`);
        }
      }
    }

    console.log(`\n🎉 Seeded ${totalParents} parent categories with ${totalChildren} subcategories`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    process.exit(1);
  }
}

seedCategories();
