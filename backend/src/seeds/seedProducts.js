import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/indiamart";

// ─── Demo sellers — distinct companies, not one account for every listing ──
const DEMO_SELLERS = [
  {
    name: "Rakesh Mehta",
    email: "seller@test.com",
    phone: "9876543210",
    companyName: "Demo Exports Pvt Ltd",
    city: "Mumbai",
    state: "Maharashtra",
    isVerified: true,
  },
  {
    name: "Anjali Sharma",
    email: "seller2@test.com",
    phone: "9876543211",
    companyName: "Sharma Textile Mills",
    city: "Surat",
    state: "Gujarat",
    isVerified: true,
  },
  {
    name: "Vikram Singh",
    email: "seller3@test.com",
    phone: "9876543212",
    companyName: "Singh Agro Industries",
    city: "Lucknow",
    state: "Uttar Pradesh",
    isVerified: false,
  },
  {
    name: "Karan Patel",
    email: "seller4@test.com",
    phone: "9876543213",
    companyName: "Patel Engineering Works",
    city: "Ahmedabad",
    state: "Gujarat",
    isVerified: true,
  },
];

async function getOrCreateSellers() {
  const hash = await bcrypt.hash("Test@1234", 12);
  const sellers = [];
  for (const s of DEMO_SELLERS) {
    let seller = await User.findOne({ email: s.email });
    if (!seller) {
      seller = await User.create({
        ...s,
        password: hash,
        role: "seller",
        profileCompleted: true,
        isMobileVerified: true,
      });
      console.log(`✅ Created seller: ${seller.email} (${seller.companyName})`);
    }
    sellers.push(seller);
  }
  return sellers;
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected");

  const sellers = await getOrCreateSellers();

  // Get real category IDs from DB
  const cats = await Category.find({}).select("_id name parent").lean();
  const parentCats = cats.filter((c) => !c.parent);

  const getCat = (name) => {
    const found = cats.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));
    return found?._id || parentCats[0]?._id;
  };

  // Check if active+approved products already exist
  const existing = await Product.countDocuments({ isActive: true, status: "approved" });
  if (existing > 0) {
    console.log(`ℹ️  ${existing} active products already exist. Skipping seed.`);
    await mongoose.disconnect();
    return;
  }

  // Each product carries which demo seller (by index into DEMO_SELLERS) owns it,
  // plus real specifications — matching what a genuinely completed listing has.
  const products = [
    {
      sellerIndex: 0,
      name: "Industrial Stainless Steel Pipe 304 Grade Seamless Tube",
      description: "High quality 304 grade stainless steel seamless tube for industrial use. Suitable for chemical plants, food processing, and marine applications. Available in various sizes.",
      price: 450,
      comparePrice: 600,
      priceUnit: "Meter",
      category: getCat("Machinery") || parentCats[0]._id,
      minOrderQuantity: 50,
      stock: 5000,
      city: "Mumbai",
      state: "Maharashtra",
      images: [{ url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=450&fit=crop", publicId: "seed1" }],
      tags: ["steel", "pipe", "stainless", "industrial"],
      specifications: [
        { key: "Grade", value: "304" },
        { key: "Finish", value: "Seamless" },
        { key: "Application", value: "Chemical, Food, Marine" },
      ],
      status: "approved",
      isActive: true,
    },
    {
      sellerIndex: 1,
      name: "Pure Cotton Printed Fabric for Garments & Home Textile",
      description: "Premium quality pure cotton printed fabric ideal for garments, sarees, curtains, and home textiles. Vibrant colors, soft texture, easy to wash and maintain.",
      price: 120,
      comparePrice: 180,
      priceUnit: "Meter",
      category: getCat("Textile") || parentCats[0]._id,
      minOrderQuantity: 500,
      stock: 20000,
      city: "Surat",
      state: "Gujarat",
      images: [{ url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=450&fit=crop", publicId: "seed2" }],
      tags: ["cotton", "fabric", "textile", "garment"],
      specifications: [
        { key: "Material", value: "100% Cotton" },
        { key: "Width", value: "44 inch" },
        { key: "Pattern", value: "Printed" },
      ],
      status: "approved",
      isActive: true,
    },
    {
      sellerIndex: 3,
      name: "LED Panel Light 18W Square Surface Mounted SMD 2835",
      description: "Energy saving 18W LED panel light for offices, showrooms, and commercial spaces. Long lifespan 50000 hours, uniform light distribution, low heat emission.",
      price: 285,
      priceUnit: "Piece",
      category: getCat("LED") || getCat("Electronic") || parentCats[0]._id,
      minOrderQuantity: 100,
      stock: 10000,
      city: "Delhi",
      state: "Delhi",
      images: [{ url: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600&h=450&fit=crop", publicId: "seed3" }],
      tags: ["led", "light", "panel", "energy saving"],
      specifications: [
        { key: "Wattage", value: "18W" },
        { key: "Lifespan", value: "50,000 hours" },
        { key: "Chip Type", value: "SMD 2835" },
      ],
      status: "approved",
      isActive: true,
    },
    {
      sellerIndex: 3,
      name: "Hydraulic Cylinder 80mm Bore Double Acting Heavy Duty",
      description: "Heavy duty double acting hydraulic cylinder with 80mm bore diameter. High pressure resistance up to 250 bar. Used in construction machinery, presses, and industrial equipment.",
      price: 12500,
      comparePrice: 15000,
      priceUnit: "Piece",
      category: getCat("Hydraulic") || getCat("Machinery") || parentCats[0]._id,
      minOrderQuantity: 5,
      stock: 200,
      city: "Pune",
      state: "Maharashtra",
      images: [{ url: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=600&h=450&fit=crop", publicId: "seed4" }],
      tags: ["hydraulic", "cylinder", "heavy duty", "industrial"],
      specifications: [
        { key: "Bore Diameter", value: "80mm" },
        { key: "Pressure Rating", value: "250 bar" },
        { key: "Type", value: "Double Acting" },
      ],
      status: "approved",
      isActive: true,
    },
    {
      sellerIndex: 0,
      name: "Automatic Pouch Packaging Machine for Food & Pharma",
      description: "Fully automatic multi-lane pouch packaging machine. Speed 60-80 pouches/min. Suitable for powder, granules, liquid, and paste. PLC controlled with touch screen HMI.",
      price: 285000,
      comparePrice: 350000,
      priceUnit: "Set",
      category: getCat("Machinery") || parentCats[0]._id,
      minOrderQuantity: 1,
      stock: 10,
      city: "Ahmedabad",
      state: "Gujarat",
      images: [{ url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=450&fit=crop", publicId: "seed5" }],
      tags: ["packaging", "machine", "automatic", "food"],
      specifications: [
        { key: "Speed", value: "60-80 pouches/min" },
        { key: "Control", value: "PLC + Touch HMI" },
        { key: "Suitable For", value: "Powder, Granules, Liquid, Paste" },
      ],
      status: "approved",
      isActive: true,
    },
    {
      sellerIndex: 2,
      name: "Solar Panel 400W Monocrystalline Half Cut Cell",
      description: "High efficiency 400W monocrystalline solar panel with half-cut cell technology. 21% efficiency, anti-reflective tempered glass, 25 year performance warranty.",
      price: 8500,
      comparePrice: 10000,
      priceUnit: "Piece",
      category: getCat("Solar") || getCat("Electronic") || parentCats[0]._id,
      minOrderQuantity: 10,
      stock: 1000,
      city: "Chennai",
      state: "Tamil Nadu",
      images: [{ url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=450&fit=crop", publicId: "seed6" }],
      tags: ["solar", "panel", "renewable energy", "monocrystalline"],
      specifications: [
        { key: "Wattage", value: "400W" },
        { key: "Efficiency", value: "21%" },
        { key: "Warranty", value: "25 years" },
      ],
      status: "approved",
      isActive: true,
    },
    {
      sellerIndex: 2,
      name: "Urea Fertilizer 46% Nitrogen Agricultural Grade",
      description: "High quality urea fertilizer with 46% nitrogen content. Suitable for all crops. Water soluble, quick release nitrogen for healthy crop growth. BIS certified.",
      price: 280,
      priceUnit: "Kg",
      category: getCat("Fertilizer") || getCat("Agriculture") || parentCats[0]._id,
      minOrderQuantity: 1000,
      stock: 100000,
      city: "Lucknow",
      state: "Uttar Pradesh",
      images: [{ url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=450&fit=crop", publicId: "seed7" }],
      tags: ["fertilizer", "urea", "agriculture", "nitrogen"],
      specifications: [
        { key: "Nitrogen Content", value: "46%" },
        { key: "Form", value: "Granular" },
        { key: "Certification", value: "BIS" },
      ],
      status: "approved",
      isActive: true,
    },
    {
      sellerIndex: 1,
      name: "PP HDPE Woven Sacks / Bags 25Kg to 100Kg Capacity",
      description: "Durable PP/HDPE woven sacks for packaging fertilizers, cement, grains, and chemicals. UV stabilized, moisture resistant. Custom printing available. 25kg to 100kg capacity.",
      price: 18,
      comparePrice: 25,
      priceUnit: "Piece",
      category: getCat("Packaging") || parentCats[0]._id,
      minOrderQuantity: 5000,
      stock: 500000,
      city: "Rajkot",
      state: "Gujarat",
      images: [{ url: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&h=450&fit=crop", publicId: "seed8" }],
      tags: ["sack", "bag", "packaging", "woven"],
      specifications: [
        { key: "Capacity", value: "25kg – 100kg" },
        { key: "Material", value: "PP/HDPE Woven" },
        { key: "Feature", value: "UV Stabilized, Moisture Resistant" },
      ],
      status: "approved",
      isActive: true,
    },
  ];

  // No fabricated averageRating/totalReviews/views — a genuinely created
  // product starts at 0 on all three until real activity happens. Faking
  // those numbers here made seeded products show a rating with zero
  // backing review documents, which is exactly the "doesn't look real"
  // mismatch this rewrite is fixing.
  const toInsert = products.map(({ sellerIndex, ...p }) => {
    const seller = sellers[sellerIndex];
    return {
      ...p,
      seller: seller._id,
      companyName: seller.companyName,
      isVerified: seller.isVerified,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now() + Math.floor(Math.random() * 999),
    };
  });

  await Product.insertMany(toInsert);
  console.log(`✅ Seeded ${toInsert.length} products across ${sellers.length} sellers successfully!`);

  await mongoose.disconnect();
  console.log("✅ Done. Refresh the home page to see products.");
}

seed().catch((e) => { console.error("❌ Seed failed:", e.message); process.exit(1); });
