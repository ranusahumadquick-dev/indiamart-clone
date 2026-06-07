import express from "express";
import {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  searchProducts,
  getRelatedProducts,
  getFeaturedProducts,
  bulkUploadProducts,
  toggleFeaturedStatus,
  getSellerProductsForFeaturing,
} from "../controllers/productController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { uploadProductImages } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// =============================================
// 🔓 PUBLIC ROUTES
// =============================================
router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/related/:productId", getRelatedProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:id", getSingleProduct);

// ─── Add Rice Variants (Variety, Packaging, Processing) ───
router.post("/add-rice-variants/public/action", async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    const Product = (await import("../models/Product.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    const product = await Product.findOne({
      name: { $regex: "Rice", $options: "i" }
    });

    if (!product) {
      return res.status(404).json(
        new ApiResponse(404, null, "Rice product not found")
      );
    }

    // Define variant types for Rice
    const variantTypes = [
      {
        name: "Variety",
        type: "button",
        values: [
          { label: "Basmati Rice", value: "basmati" },
          { label: "1121 Basmati", value: "1121_basmati" },
          { label: "1509 Basmati", value: "1509_basmati" },
          { label: "Pusa Basmati", value: "pusa_basmati" },
          { label: "Sella Rice", value: "sella" },
          { label: "Steam Rice", value: "steam" },
          { label: "Raw Rice", value: "raw" },
          { label: "Sona Masoori", value: "sona_masoori" },
          { label: "IR64", value: "ir64" },
          { label: "Non-Basmati", value: "non_basmati" }
        ]
      },
      {
        name: "Packaging Size",
        type: "button",
        values: [
          { label: "1 Kg", value: "1kg" },
          { label: "5 Kg", value: "5kg" },
          { label: "10 Kg", value: "10kg" },
          { label: "25 Kg", value: "25kg" },
          { label: "50 Kg", value: "50kg" }
        ]
      },
      {
        name: "Processing Type",
        type: "button",
        values: [
          { label: "Raw", value: "raw_process" },
          { label: "Steam", value: "steam_process" },
          { label: "Parboiled", value: "parboiled" },
          { label: "Sella", value: "sella_process" }
        ]
      }
    ];

    // Create variants
    const variants = [];
    const basePrice = product.price || 45;
    const baseStock = product.stock || 100;
    const images = product.images.map(img => typeof img === 'string' ? img : img.url);

    const varieties = ["Basmati Rice", "1121 Basmati", "Sona Masoori", "IR64", "Non-Basmati"];
    const packagingSizes = ["1 Kg", "5 Kg", "10 Kg", "25 Kg", "50 Kg"];
    const processingTypes = ["Raw", "Steam", "Parboiled"];

    let variantIndex = 0;

    // Create main variety combinations (5 varieties x 5 packaging sizes = 25 variants)
    varieties.forEach((variety, varIdx) => {
      packagingSizes.forEach((packaging, pkgIdx) => {
        variants.push({
          _id: new mongoose.Types.ObjectId(),
          sku: `RICE-${variety.replace(/\s+/g, '')}-${packaging.replace(/\s+/g, '')}`,
          name: `${product.name} - ${variety} - ${packaging}`,
          attributeValues: new Map([
            ["Variety", variety],
            ["Packaging Size", packaging],
            ["Processing Type", "Raw"]
          ]),
          images: images,
          thumbnail: images[0] || "https://via.placeholder.com/100",
          price: basePrice + (varIdx * 5) + (pkgIdx * 10),
          originalPrice: basePrice + (varIdx * 8) + (pkgIdx * 15),
          stock: baseStock + (variantIndex * 5),
          moq: 1,
          specifications: product.specifications || [],
          available: true
        });
        variantIndex++;
      });
    });

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      {
        hasVariants: true,
        variants: variants,
        variantTypes: variantTypes
      },
      { new: true }
    );

    if (!updatedProduct.name) {
      throw new Error("Product name was lost during update!");
    }

    return res.status(200).json(
      new ApiResponse(200, {
        productId: updatedProduct._id,
        productName: updatedProduct.name,
        variantCount: variants.length,
        variantTypes: variantTypes.map(vt => ({
          name: vt.name,
          count: vt.values.length
        }))
      }, `✅ ${variants.length} Rice variants added successfully!`)
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── RESTORE Product Images (Fix Multiple Upload) ───
router.post("/restore-rice-images/public/action", async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    const Product = (await import("../models/Product.js")).default;

    const product = await Product.findOne({
      name: { $regex: "Rice", $options: "i" }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Rice product not found"
      });
    }

    // Restore all 4 original images
    const restoredImages = [
      {
        url: "http://localhost:8000/uploads/products/1780119353404-556688835.jpg",
        type: "image"
      },
      {
        url: "http://localhost:8000/uploads/products/1780119353440-231526347.jpg",
        type: "image"
      },
      {
        url: "http://localhost:8000/uploads/products/1780119353508-542618781.jpg",
        type: "image"
      },
      {
        url: "http://localhost:8000/uploads/products/1780119353530-310771941.jpg",
        type: "image"
      }
    ];

    await Product.findByIdAndUpdate(
      product._id,
      { images: restoredImages },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "✅ Restored 4 original Rice images!"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── CHECK Product Images Count ───
router.get("/check-images/:productName", async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    const Product = (await import("../models/Product.js")).default;

    const product = await Product.findOne({
      name: { $regex: req.params.productName, $options: "i" }
    }).select("name images");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      productName: product.name,
      imagesCount: product.images?.length || 0,
      images: product.images?.map((img, i) => ({
        index: i + 1,
        url: img.url,
        type: img.type || 'image'
      })) || []
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── DELETE Old Variants from Conveyor ───
router.post("/delete-conveyor-variants/public/action", async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    const Product = (await import("../models/Product.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    const product = await Product.findOne({
      name: { $regex: "Conveyor", $options: "i" }
    });

    if (!product) {
      return res.status(404).json(
        new ApiResponse(404, null, "Product not found")
      );
    }

    // Delete all variants
    await Product.findByIdAndUpdate(
      product._id,
      {
        hasVariants: false,
        variants: [],
        variantTypes: []
      },
      { new: true }
    );

    return res.status(200).json(
      new ApiResponse(200, {}, "✅ All old variants deleted!")
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── Add Conveyor Sorting Machine Variants ───
router.post("/add-conveyor-variants/public/action", async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    const Product = (await import("../models/Product.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    // Find product by name
    const product = await Product.findOne({
      name: { $regex: "Conveyor", $options: "i" }
    });

    if (!product) {
      return res.status(404).json(
        new ApiResponse(404, null, "Industrial Conveyor Sorting Machine product not found")
      );
    }

    // Define custom variants
    const variantTypes = [
      {
        name: "Model",
        type: "button",
        values: [
          { label: "SCM-100", value: "scm100" },
          { label: "SCM-200", value: "scm200" },
          { label: "SCM-500", value: "scm500" }
        ]
      },
      {
        name: "Capacity",
        type: "button",
        values: [
          { label: "500 Items/Hour", value: "500" },
          { label: "1000 Items/Hour", value: "1000" },
          { label: "2000 Items/Hour", value: "2000" },
          { label: "5000 Items/Hour", value: "5000" }
        ]
      },
      {
        name: "Voltage",
        type: "button",
        values: [
          { label: "220V", value: "220v" },
          { label: "380V", value: "380v" },
          { label: "440V", value: "440v" }
        ]
      },
      {
        name: "Material",
        type: "button",
        values: [
          { label: "Mild Steel (MS)", value: "ms" },
          { label: "Stainless Steel 304", value: "ss304" },
          { label: "Stainless Steel 316", value: "ss316" }
        ]
      }
    ];

    // Create variants
    const variants = [];
    const basePrice = product.price;
    const baseStock = product.stock || 50;
    const images = product.images.map(img => typeof img === 'string' ? img : img.url);

    const models = ["SCM-100", "SCM-200", "SCM-500"];
    const capacities = ["500 Items/Hour", "1000 Items/Hour", "2000 Items/Hour", "5000 Items/Hour"];

    let variantIndex = 0;
    models.forEach((model, modelIdx) => {
      capacities.forEach((capacity, capIdx) => {
        const modelCode = model.replace(/\-/, '');
        const capacityNum = capacity.split(' ')[0];
        variants.push({
          _id: new mongoose.Types.ObjectId(),
          sku: `CONVEYOR-${modelCode}-${capacityNum}`,
          name: `${product.name} - ${model} - ${capacity}`,
          attributeValues: new Map([
            ["Model", model],
            ["Capacity", capacity]
          ]),
          images: images,
          thumbnail: images[0] || "https://via.placeholder.com/100",
          price: basePrice + (modelIdx * 20000) + (capIdx * 10000),
          originalPrice: product.comparePrice
            ? product.comparePrice + (modelIdx * 25000) + (capIdx * 12000)
            : basePrice + (modelIdx * 30000) + (capIdx * 15000),
          stock: baseStock + 50,
          moq: product.minOrderQuantity || 1,
          specifications: product.specifications || [],
          available: true
        });
        variantIndex++;
      });
    });

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      {
        hasVariants: true,
        variants: variants,
        variantTypes: variantTypes
      },
      { new: true }
    );

    return res.status(200).json(
      new ApiResponse(200, {
        productId: updatedProduct._id,
        productName: updatedProduct.name,
        variantCount: variants.length,
        variantTypes: variantTypes.map(vt => ({
          name: vt.name,
          count: vt.values.length
        }))
      }, `✅ ${variants.length} variants added successfully!`)
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── Clear LED Bulb Variants ───
router.post("/clear-led-bulb-variants/public/action", async (req, res) => {
  try {
    const Product = (await import("../models/Product.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    await Product.findByIdAndUpdate("6a1a8d51aa70dc635979b90b", {
      hasVariants: false,
      variants: [],
      variantTypes: []
    }, { new: true });

    return res.status(200).json(
      new ApiResponse(200, {}, "✅ LED Bulb variants cleared!")
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── Add LED Bulb Variants (Wattage, Light Color) ───
router.post("/add-led-bulb-variants/public/action", async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    const Product = (await import("../models/Product.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    const product = await Product.findById("6a1a8d51aa70dc635979b90b");

    if (!product) {
      return res.status(404).json(
        new ApiResponse(404, null, "LED product not found")
      );
    }

    // Define variant types for LED
    const variantTypes = [
      {
        name: "Wattage",
        type: "button",
        values: [
          { label: "5W", value: "5w" },
          { label: "7W", value: "7w" },
          { label: "9W", value: "9w" },
          { label: "12W", value: "12w" },
          { label: "15W", value: "15w" },
          { label: "18W", value: "18w" },
          { label: "20W", value: "20w" }
        ]
      },
      {
        name: "Light Color",
        type: "button",
        values: [
          { label: "Cool White", value: "cool_white" },
          { label: "Warm White", value: "warm_white" },
          { label: "Daylight", value: "daylight" }
        ]
      }
    ];

    // First, clear existing variants to avoid duplicate SKU errors
    product.variants = [];
    await product.save();

    // Create variants
    const variants = [];
    const basePrice = product.price || 150;
    const baseStock = product.stock || 100;
    const images = product.images.map(img => typeof img === 'string' ? img : img.url);

    const wattages = ["5W", "7W", "9W", "12W", "15W", "18W", "20W"];
    const colors = ["Cool White", "Warm White", "Daylight"];

    let variantIndex = 0;

    // Create variant combinations (7 wattages x 3 colors = 21 variants)
    wattages.forEach((wattage, wattIdx) => {
      colors.forEach((color, colorIdx) => {
        variants.push({
          _id: new mongoose.Types.ObjectId(),
          sku: `LEDBULB-${wattage.replace(/\s+/g, '')}-${color.replace(/\s+/g, '')}`,
          name: `${product.name} - ${wattage} - ${color}`,
          attributeValues: new Map([
            ["Wattage", wattage],
            ["Light Color", color]
          ]),
          images: images,
          thumbnail: images[0] || "https://via.placeholder.com/100",
          price: basePrice + (wattIdx * 50) + (colorIdx * 20),
          originalPrice: basePrice + (wattIdx * 80) + (colorIdx * 30),
          stock: baseStock + (variantIndex * 3),
          moq: 1,
          specifications: product.specifications || [],
          available: true
        });
        variantIndex++;
      });
    });

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      {
        hasVariants: true,
        variants: variants,
        variantTypes: variantTypes
      },
      { new: true }
    );

    if (!updatedProduct.name) {
      throw new Error("Product name was lost during update!");
    }

    return res.status(200).json(
      new ApiResponse(200, {
        productId: updatedProduct._id,
        productName: updatedProduct.name,
        variantCount: variants.length,
        variantTypes: variantTypes.map(vt => ({
          name: vt.name,
          count: vt.values.length
        }))
      }, `✅ ${variants.length} LED variants added successfully!`)
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =============================================
// 🔒 SELLER ROUTES — Auth + Seller role required
// =============================================
router.post(
  "/",
  authMiddleware,
  roleMiddleware("seller"),
  uploadProductImages,
  createProduct
);
router.get(
  "/seller/my",
  authMiddleware,
  roleMiddleware("seller"),
  getSellerProducts
);
// Backwards-compatible alias used by frontend
router.get(
  "/seller/mine",
  authMiddleware,
  roleMiddleware("seller"),
  getSellerProducts
);
// Get products for featuring
router.get(
  "/seller/featured/manage",
  authMiddleware,
  roleMiddleware("seller"),
  getSellerProductsForFeaturing
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("seller"),
  uploadProductImages,
  updateProduct
);
// Toggle featured status
router.put(
  "/:productId/featured",
  authMiddleware,
  roleMiddleware("seller"),
  toggleFeaturedStatus
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("seller"),
  deleteProduct
);

// =============================================
// 📥 BULK UPLOAD ROUTE
// =============================================
router.post(
  "/bulk/upload",
  authMiddleware,
  roleMiddleware("seller"),
  bulkUploadProducts
);

// Find all Cement products (diagnostic)
router.get("/find-cement/public/action", async (req, res) => {
  try {
    const Product = (await import("../models/Product.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    const products = await Product.find({
      $or: [
        { name: { $regex: "Cement", $options: "i" } },
        { category: { $regex: "Construction", $options: "i" } }
      ]
    }).limit(10);

    const list = products.map(p => ({
      id: p._id,
      name: p.name,
      variantCount: p.variants?.length || 0
    }));

    res.status(200).json(
      new ApiResponse(200, list, `Found ${list.length} products`)
    );
  } catch (error) {
    res.status(500).json(
      new ApiResponse(500, null, "Error: " + error.message)
    );
  }
});

// =============================================
// 🏗️ ADD CEMENT VARIANTS (DIRECT - Specific Product ID)
// =============================================
router.get("/:productId/add-cement-variants/public/action", async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    const Product = (await import("../models/Product.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    // Find product by ID
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json(
        new ApiResponse(404, null, `Product ${req.params.productId} not found`)
      );
    }

    // Define variant types
    const cementTypes = ["OPC 33 Grade", "OPC 43 Grade", "OPC 53 Grade", "PPC Cement", "PSC Cement", "White Cement"];
    const packagingSizes = ["25 Kg", "40 Kg", "50 Kg"];

    // Base prices for cement types
    const typePrices = {
      "OPC 33 Grade": 300,
      "OPC 43 Grade": 350,
      "OPC 53 Grade": 400,
      "PPC Cement": 320,
      "PSC Cement": 330,
      "White Cement": 600
    };

    // Package multipliers
    const packagePrices = {
      "25 Kg": 1,
      "40 Kg": 1.5,
      "50 Kg": 1.8
    };

    // Set variant types
    product.variantTypes = [
      {
        name: "Cement Type",
        type: "button",
        values: cementTypes.map(ct => ({ label: ct, value: ct }))
      },
      {
        name: "Packaging Size",
        type: "button",
        values: packagingSizes.map(ps => ({ label: ps, value: ps }))
      }
    ];

    // Clear existing variants
    product.variants = [];

    // Create all combinations
    let variantCount = 0;
    cementTypes.forEach((type) => {
      packagingSizes.forEach((size) => {
        const basePrice = typePrices[type];
        const sizeMultiplier = packagePrices[size];
        const finalPrice = Math.round(basePrice * sizeMultiplier);

        product.variants.push({
          _id: new mongoose.Types.ObjectId(),
          name: `${type} - ${size}`,
          sku: `CEMENT-${type.split(" ")[0]}-${size.replace(" ", "")}`,
          price: finalPrice,
          comparePrice: finalPrice + 50,
          stock: Math.floor(Math.random() * 100) + 50,
          available: true,
          attributeValues: {
            "Cement Type": type,
            "Packaging Size": size
          },
          images: product.images?.map((img) => typeof img === 'string' ? img : img.url) || [],
          specifications: [
            { label: "Cement Type", value: type },
            { label: "Packaging Size", value: size },
            { label: "Quality Grade", value: type.includes("53") ? "High Strength" : type.includes("43") ? "Medium Strength" : "Standard" }
          ]
        });
        variantCount++;
      });
    });

    await product.save();

    res.status(200).json(
      new ApiResponse(200, { variantCount, types: product.variantTypes },
        `Created ${variantCount} cement variants (${cementTypes.length} types × ${packagingSizes.length} sizes)`)
    );
  } catch (error) {
    console.error("Error adding cement variants:", error);
    res.status(500).json(
      new ApiResponse(500, null, "Error adding cement variants: " + error.message)
    );
  }
});

// =============================================
// 🍪 ADD COOKIES VARIANTS (5 variant types)
// =============================================
router.get("/:productId/add-cookies-variants/public/action", async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    const Product = (await import("../models/Product.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json(
        new ApiResponse(404, null, `Product ${req.params.productId} not found`)
      );
    }

    // Variant definitions
    const flavors = ["Chocolate Chip", "Butter", "Vanilla", "Coconut", "Oatmeal", "Orange", "Almond", "Cashew", "Mixed Fruit"];
    const weights = ["50g", "100g", "200g", "500g", "1kg"];
    const packQuantities = ["Pack of 6", "Pack of 12", "Pack of 24", "Pack of 48"];
    const types = ["Eggless", "With Egg", "Sugar Free", "Gluten Free", "Organic", "Vegan"];
    const packagings = ["Pouch Pack", "Box Pack", "Jar Pack", "Bulk Pack"];

    // Base prices
    const flavorPrices = {
      "Chocolate Chip": 100,
      "Butter": 95,
      "Vanilla": 90,
      "Coconut": 105,
      "Oatmeal": 98,
      "Orange": 102,
      "Almond": 110,
      "Cashew": 115,
      "Mixed Fruit": 108
    };

    const typeMultiplier = {
      "Eggless": 1.0,
      "With Egg": 0.9,
      "Sugar Free": 1.2,
      "Gluten Free": 1.15,
      "Organic": 1.3,
      "Vegan": 1.1
    };

    const packQuantityMultiplier = {
      "Pack of 6": 1,
      "Pack of 12": 1.8,
      "Pack of 24": 3.4,
      "Pack of 48": 6.5
    };

    const weightMultiplier = {
      "50g": 1,
      "100g": 1.8,
      "200g": 3.5,
      "500g": 8.0,
      "1kg": 15.0
    };

    // Set variant types
    product.variantTypes = [
      {
        name: "Flavor",
        type: "button",
        values: flavors.map(f => ({ label: f, value: f }))
      },
      {
        name: "Weight",
        type: "button",
        values: weights.map(w => ({ label: w, value: w }))
      },
      {
        name: "Pack Quantity",
        type: "button",
        values: packQuantities.map(pq => ({ label: pq, value: pq }))
      },
      {
        name: "Type",
        type: "button",
        values: types.map(t => ({ label: t, value: t }))
      },
      {
        name: "Packaging",
        type: "button",
        values: packagings.map(p => ({ label: p, value: p }))
      }
    ];

    // Clear existing variants
    product.variants = [];

    // Create all combinations
    let variantCount = 0;
    flavors.forEach((flavor) => {
      weights.forEach((weight) => {
        packQuantities.forEach((packQty) => {
          types.forEach((type) => {
            packagings.forEach((packaging) => {
              const basePrice = flavorPrices[flavor];
              const finalPrice = Math.round(
                basePrice *
                weightMultiplier[weight] *
                packQuantityMultiplier[packQty] *
                typeMultiplier[type] *
                (packaging === "Bulk Pack" ? 0.95 : packaging === "Jar Pack" ? 1.1 : 1)
              );

              product.variants.push({
                _id: new mongoose.Types.ObjectId(),
                name: `${flavor} - ${weight} - ${packQty} (${type}) - ${packaging}`,
                sku: `COOKIE-${flavor.split(" ")[0]}-${weight}-${packQty.replace(/\s+/g, "")}-${type.split(" ")[0]}-${packaging.replace(" ", "")}`,
                price: finalPrice,
                comparePrice: finalPrice + Math.round(finalPrice * 0.1),
                stock: Math.floor(Math.random() * 200) + 20,
                available: true,
                attributeValues: {
                  "Flavor": flavor,
                  "Weight": weight,
                  "Pack Quantity": packQty,
                  "Type": type,
                  "Packaging": packaging
                },
                images: product.images?.map((img) => typeof img === 'string' ? img : img.url) || [],
                specifications: [
                  { label: "Flavor", value: flavor },
                  { label: "Weight per pack", value: weight },
                  { label: "Pack Quantity", value: packQty },
                  { label: "Type", value: type },
                  { label: "Packaging", value: packaging }
                ]
              });
              variantCount++;
            });
          });
        });
      });
    });

    await product.save();

    res.status(200).json(
      new ApiResponse(200, { variantCount, types: product.variantTypes },
        `Created ${variantCount} cookies variants (9 flavors × 5 weights × 4 packs × 6 types × 4 packaging)`)
    );
  } catch (error) {
    console.error("Error adding cookies variants:", error);
    res.status(500).json(
      new ApiResponse(500, null, "Error adding cookies variants: " + error.message)
    );
  }
});

// =============================================
// 🧪 ADD INDUSTRIAL/CHEMICAL VARIANTS
// =============================================
router.get("/:productId/add-chemical-variants/public/action", async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    const Product = (await import("../models/Product.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json(
        new ApiResponse(404, null, `Product ${req.params.productId} not found`)
      );
    }

    // Variant definitions
    const grades = ["Industrial Grade", "Technical Grade", "Food Grade", "Pharma Grade", "Laboratory Grade"];
    const purities = ["95%", "98%", "99%", "99.5%", "99.9%"];
    const packagingSizes = ["1 Kg", "5 Kg", "25 Kg", "50 Kg", "100 Kg"];
    const physicalForms = ["Powder", "Liquid", "Granules", "Crystals", "Flakes"];

    // Base prices
    const gradePrices = {
      "Industrial Grade": 500,
      "Technical Grade": 600,
      "Food Grade": 900,
      "Pharma Grade": 1500,
      "Laboratory Grade": 2000
    };

    const purityMultiplier = {
      "95%": 1.0,
      "98%": 1.15,
      "99%": 1.3,
      "99.5%": 1.5,
      "99.9%": 1.8
    };

    const packagingMultiplier = {
      "1 Kg": 1,
      "5 Kg": 4.5,
      "25 Kg": 20,
      "50 Kg": 38,
      "100 Kg": 70
    };

    const formMultiplier = {
      "Powder": 1.0,
      "Liquid": 1.1,
      "Granules": 1.05,
      "Crystals": 1.15,
      "Flakes": 1.08
    };

    // Set variant types
    product.variantTypes = [
      {
        name: "Grade",
        type: "button",
        values: grades.map(g => ({ label: g, value: g }))
      },
      {
        name: "Purity",
        type: "button",
        values: purities.map(p => ({ label: p, value: p }))
      },
      {
        name: "Packaging Size",
        type: "button",
        values: packagingSizes.map(ps => ({ label: ps, value: ps }))
      },
      {
        name: "Physical Form",
        type: "button",
        values: physicalForms.map(pf => ({ label: pf, value: pf }))
      }
    ];

    // Clear existing variants
    product.variants = [];

    // Create all combinations
    let variantCount = 0;
    grades.forEach((grade) => {
      purities.forEach((purity) => {
        packagingSizes.forEach((size) => {
          physicalForms.forEach((form) => {
            const basePrice = gradePrices[grade];
            const finalPrice = Math.round(
              basePrice *
              purityMultiplier[purity] *
              packagingMultiplier[size] *
              formMultiplier[form]
            );

            product.variants.push({
              _id: new mongoose.Types.ObjectId(),
              name: `${grade} - ${purity} Purity - ${size} - ${form}`,
              sku: `CHEM-${grade.split(" ")[0]}-${purity.replace("%", "")}-${size.replace(" ", "")}-${form}`,
              price: finalPrice,
              comparePrice: finalPrice + Math.round(finalPrice * 0.12),
              stock: Math.floor(Math.random() * 300) + 50,
              available: true,
              attributeValues: {
                "Grade": grade,
                "Purity": purity,
                "Packaging Size": size,
                "Physical Form": form
              },
              images: product.images?.map((img) => typeof img === 'string' ? img : img.url) || [],
              specifications: [
                { label: "Grade", value: grade },
                { label: "Purity Level", value: purity },
                { label: "Packaging Size", value: size },
                { label: "Physical Form", value: form }
              ]
            });
            variantCount++;
          });
        });
      });
    });

    await product.save();

    res.status(200).json(
      new ApiResponse(200, { variantCount, types: product.variantTypes },
        `Created ${variantCount} chemical variants (5 grades × 5 purities × 5 sizes × 5 forms)`)
    );
  } catch (error) {
    console.error("Error adding chemical variants:", error);
    res.status(500).json(
      new ApiResponse(500, null, "Error adding chemical variants: " + error.message)
    );
  }
});

// =============================================
// 😷 ADD MASK VARIANTS
// =============================================
router.get("/:productId/add-mask-variants/public/action", async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    const Product = (await import("../models/Product.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json(
        new ApiResponse(404, null, `Product ${req.params.productId} not found`)
      );
    }

    // Variant definitions
    const maskTypes = ["N95 Mask", "KN95 Mask", "3 Ply Mask", "Respirator Mask", "Dust Mask", "Surgical Mask"];
    const sizes = ["Small", "Medium", "Large", "Universal"];
    const colors = ["White", "Black", "Blue", "Grey", "Green"];
    const layers = ["2 Layer", "3 Layer", "4 Layer", "5 Layer"];
    const packagingQuantities = ["Pack of 10", "Pack of 25", "Pack of 50", "Pack of 100"];

    // Base prices
    const maskTypePrices = {
      "N95 Mask": 80,
      "KN95 Mask": 75,
      "3 Ply Mask": 40,
      "Respirator Mask": 120,
      "Dust Mask": 30,
      "Surgical Mask": 50
    };

    const layerMultiplier = {
      "2 Layer": 1.0,
      "3 Layer": 1.2,
      "4 Layer": 1.4,
      "5 Layer": 1.6
    };

    const packagingMultiplier = {
      "Pack of 10": 1,
      "Pack of 25": 2.3,
      "Pack of 50": 4.5,
      "Pack of 100": 8.5
    };

    const colorMultiplier = {
      "White": 1.0,
      "Black": 1.05,
      "Blue": 1.02,
      "Grey": 1.03,
      "Green": 1.04
    };

    // Set variant types
    product.variantTypes = [
      {
        name: "Mask Type",
        type: "button",
        values: maskTypes.map(mt => ({ label: mt, value: mt }))
      },
      {
        name: "Size",
        type: "button",
        values: sizes.map(s => ({ label: s, value: s }))
      },
      {
        name: "Color",
        type: "button",
        values: colors.map(c => ({ label: c, value: c }))
      },
      {
        name: "Layers",
        type: "button",
        values: layers.map(l => ({ label: l, value: l }))
      },
      {
        name: "Packaging Quantity",
        type: "button",
        values: packagingQuantities.map(pq => ({ label: pq, value: pq }))
      }
    ];

    // Clear existing variants
    product.variants = [];

    // Create all combinations
    let variantCount = 0;
    maskTypes.forEach((maskType) => {
      sizes.forEach((size) => {
        colors.forEach((color) => {
          layers.forEach((layer) => {
            packagingQuantities.forEach((packaging) => {
              const basePrice = maskTypePrices[maskType];
              const finalPrice = Math.round(
                basePrice *
                layerMultiplier[layer] *
                packagingMultiplier[packaging] *
                colorMultiplier[color]
              );

              product.variants.push({
                _id: new mongoose.Types.ObjectId(),
                name: `${maskType} - ${size} - ${color} - ${layer} - ${packaging}`,
                sku: `MASK-${maskType.split(" ")[0]}-${size}-${color}-${layer.split(" ")[0]}-${packaging.replace(/\s+/g, "")}`,
                price: finalPrice,
                comparePrice: finalPrice + Math.round(finalPrice * 0.15),
                stock: Math.floor(Math.random() * 500) + 100,
                available: true,
                attributeValues: {
                  "Mask Type": maskType,
                  "Size": size,
                  "Color": color,
                  "Layers": layer,
                  "Packaging Quantity": packaging
                },
                images: product.images?.map((img) => typeof img === 'string' ? img : img.url) || [],
                specifications: [
                  { label: "Mask Type", value: maskType },
                  { label: "Size", value: size },
                  { label: "Color", value: color },
                  { label: "Layer Count", value: layer },
                  { label: "Packaging", value: packaging }
                ]
              });
              variantCount++;
            });
          });
        });
      });
    });

    await product.save();

    res.status(200).json(
      new ApiResponse(200, { variantCount, types: product.variantTypes },
        `Created ${variantCount} mask variants (6 types × 4 sizes × 5 colors × 4 layers × 4 packaging)`)
    );
  } catch (error) {
    console.error("Error adding mask variants:", error);
    res.status(500).json(
      new ApiResponse(500, null, "Error adding mask variants: " + error.message)
    );
  }
});

// =============================================
// ⭐ ADD SAMPLE REVIEWS (FOR DEMO)
// =============================================
router.post("/add-sample-reviews/public/action", async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    const Product = (await import("../models/Product.js")).default;
    const Review = (await import("../models/Review.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    // Get first product
    const product = await Product.findOne();
    if (!product) {
      return res.status(404).json(
        new ApiResponse(404, null, "No product found")
      );
    }

    // Sample reviews data
    const sampleReviews = [
      {
        product: product._id,
        user: new mongoose.Types.ObjectId(),
        userName: "Rajesh Kumar",
        rating: 5,
        title: "Excellent Quality!",
        comment: "Excellent quality product! Delivered on time. Will definitely order again. 👍",
        isVerifiedPurchase: true,
      },
      {
        product: product._id,
        user: new mongoose.Types.ObjectId(),
        userName: "Priya Singh",
        rating: 5,
        title: "Best in Category",
        comment: "Best product in this category. Very satisfied with the quality and service.",
        isVerifiedPurchase: true,
      },
      {
        product: product._id,
        user: new mongoose.Types.ObjectId(),
        userName: "Mohammad Ali",
        rating: 4,
        title: "Good Quality",
        comment: "Good product but packaging could be better. Overall satisfied.",
        isVerifiedPurchase: true,
      },
      {
        product: product._id,
        user: new mongoose.Types.ObjectId(),
        userName: "Deepak Patel",
        rating: 4,
        title: "Value for Money",
        comment: "Value for money! Meets all specifications mentioned.",
        isVerifiedPurchase: true,
      },
      {
        product: product._id,
        user: new mongoose.Types.ObjectId(),
        userName: "Anita Sharma",
        rating: 3,
        title: "Average Quality",
        comment: "Average product. Expected better quality but it's okay.",
        isVerifiedPurchase: true,
      },
    ];

    // Clear existing reviews for this product
    await Review.deleteMany({ product: product._id });

    // Create reviews
    const reviews = await Review.insertMany(sampleReviews);

    // Update product rating
    const stats = await Review.aggregate([
      { $match: { product: product._id, isActive: true } },
      {
        $group: {
          _id: "$product",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(product._id, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
      });
    }

    res.status(200).json(
      new ApiResponse(200, reviews, `Added ${reviews.length} sample reviews`)
    );
  } catch (error) {
    console.error("Error adding reviews:", error);
    res.status(500).json(
      new ApiResponse(500, null, "Error adding sample reviews")
    );
  }
});

// Assign ALL product images to ALL variants
router.post("/:productId/assign-images/public/action", async (req, res) => {
  try {
    const Product = (await import("../models/Product.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json(
        new ApiResponse(404, null, "Product not found")
      );
    }

    // Get product image URLs
    const productImageUrls = product.images?.map((img) => typeof img === 'string' ? img : img.url) || [];

    if (productImageUrls.length === 0) {
      return res.status(400).json(
        new ApiResponse(400, null, "Product has no images to assign")
      );
    }

    // Assign images to ALL variants (not just empty ones)
    let updatedCount = 0;
    product.variants.forEach((variant) => {
      variant.images = productImageUrls;
      updatedCount++;
    });

    await product.save();

    res.status(200).json(
      new ApiResponse(200, {
        updatedCount,
        totalVariants: product.variants.length,
        imagesAssigned: productImageUrls.length,
        message: `Assigned ${productImageUrls.length} images to ${updatedCount} variants`
      },
        `Success! ${productImageUrls.length} images assigned to all ${updatedCount} variants`)
    );
  } catch (error) {
    console.error("Error assigning images:", error);
    res.status(500).json(
      new ApiResponse(500, null, "Error assigning images to variants: " + error.message)
    );
  }
});

// Get product reviews
router.get("/:productId/reviews", async (req, res) => {
  try {
    const Review = (await import("../models/Review.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    const reviews = await Review.find({ product: req.params.productId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json(
      new ApiResponse(200, reviews, "Reviews fetched successfully")
    );
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json(
      new ApiResponse(500, null, "Error fetching reviews")
    );
  }
});

// =============================================
// 💻 ATTRIBUTE-BASED PRICING (Electronics)
// =============================================
router.post("/:productId/generate-variants-with-pricing", authMiddleware, roleMiddleware("seller"), async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    const Product = (await import("../models/Product.js")).default;
    const { generateVariantCombinationsWithPricing, AUTO_VARIANTS } = await import("../models/Product.js");
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    const { variantTypes, attributePricingMap, baseStock = 0 } = req.body;
    const productId = req.params.productId;

    // Validation
    if (!variantTypes || !Array.isArray(variantTypes) || variantTypes.length === 0) {
      return res.status(400).json(
        new ApiResponse(400, null, "variantTypes array is required")
      );
    }

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json(
        new ApiResponse(404, null, "Product not found")
      );
    }

    // Check seller owns this product
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        new ApiResponse(403, null, "Unauthorized to modify this product")
      );
    }

    // Extract variant values from variantTypes
    const templates = variantTypes.map(vt => ({
      name: vt.name,
      values: vt.values || []
    }));

    // Generate variants with attribute-based pricing
    const skuPrefix = product.name?.substring(0, 3).toUpperCase().replace(/\s/g, "") || "SKU";
    const variants = generateVariantCombinationsWithPricing(
      templates,
      skuPrefix,
      product.price || 0,
      baseStock || product.stock || 0,
      attributePricingMap || {}
    );

    // Set variant types
    product.variantTypes = variantTypes.map(vt => ({
      name: vt.name,
      type: "dropdown",
      values: (vt.values || []).map(value => ({
        label: value,
        value: value.toLowerCase().replace(/\s+/g, "-")
      }))
    }));

    // Assign product images to all variants
    const productImages = product.images?.map(img => typeof img === 'string' ? img : img.url) || [];
    variants.forEach(variant => {
      variant.images = productImages;
      variant.thumbnail = productImages[0] || "";
    });

    // Update product
    product.variants = variants;
    product.hasVariants = variants.length > 0;
    product.variantSource = "auto";

    await product.save();

    res.status(200).json(
      new ApiResponse(200, {
        productId: product._id,
        productName: product.name,
        variantCount: variants.length,
        variantTypes: product.variantTypes,
        sampleVariants: variants.slice(0, 3).map(v => ({
          sku: v.sku,
          name: v.name,
          price: v.price,
          attributeValues: Object.fromEntries(v.attributeValues || [])
        }))
      }, `✅ Generated ${variants.length} variants with attribute-based pricing!`)
    );
  } catch (error) {
    console.error("Error generating variants with pricing:", error);
    res.status(500).json(
      new ApiResponse(500, null, "Error generating variants: " + error.message)
    );
  }
});

// Create a new review
router.post("/:productId/reviews", authMiddleware, async (req, res) => {
  try {
    const mongoose = await import("mongoose");
    const Review = (await import("../models/Review.js")).default;
    const Product = (await import("../models/Product.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    const { rating, title, comment } = req.body;
    const productId = req.params.productId;
    const userId = req.user._id;

    // Validation
    if (!rating || !comment || !title) {
      return res.status(400).json(
        new ApiResponse(400, null, "Rating, title and comment are required")
      );
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json(
        new ApiResponse(400, null, "Rating must be between 1 and 5")
      );
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json(
        new ApiResponse(404, null, "Product not found")
      );
    }

    // Create review
    const review = await Review.create({
      product: productId,
      user: userId,
      userName: req.user.name || req.user.email,
      rating,
      title,
      comment,
      isVerifiedPurchase: true,
    });

    // Update product rating
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), isActive: true } },
      {
        $group: {
          _id: "$product",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
      });
    }

    res.status(201).json(
      new ApiResponse(201, review, "Review added successfully")
    );
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json(
      new ApiResponse(500, null, "Error creating review")
    );
  }
});

export default router;
