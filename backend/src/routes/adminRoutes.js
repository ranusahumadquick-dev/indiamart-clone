import express from "express";
import mongoose from "mongoose";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getDashboard,
  getDashboardAnalytics,
  getProducts,
  getProductDetail,
  approveProduct,
  rejectProduct,
  batchProductAction,
  getUsers,
  updateUserStatus,
  verifyUser,
  deleteUser,
  getCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} from "../controllers/adminController.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import Product from "../models/Product.js";

const router = express.Router();

// ─── Seed Variants - Single Product ───
router.post(
  "/seed-variants/:productId",
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json(new ApiResponse(404, null, "Product not found"));
    }

    // Determine variant type based on product category/name
    let variantTypes = [];
    let variants = [];
    const basePrice = product.price;
    const baseStock = product.stock || 100;

    // Get product name for variant detection
    const productName = product.name.toLowerCase();
    const images = product.images.map((img) => img.url);

    // Different variant patterns for different products
    if (
      productName.includes("fabric") ||
      productName.includes("cloth") ||
      productName.includes("textile")
    ) {
      // Fabric variants - Color + Size
      variantTypes = [
        {
          name: "Color",
          type: "swatch",
          values: [
            { label: "White", value: "white", hex: "#FFFFFF" },
            { label: "Blue", value: "blue", hex: "#0066FF" },
            { label: "Pink", value: "pink", hex: "#FF69B4" },
            { label: "Black", value: "black", hex: "#000000" },
          ],
        },
        {
          name: "Size",
          type: "button",
          values: [
            { label: "500M", value: "500m" },
            { label: "1000M", value: "1000m" },
            { label: "2000M", value: "2000m" },
          ],
        },
      ];

      variants = [
        {
          _id: new mongoose.Types.ObjectId(),
          sku: `${product._id}-WHITE-500M`,
          name: "White 500M",
          attributeValues: new Map([
            ["Color", "white"],
            ["Size", "500m"],
          ]),
          images: images.slice(0, 2),
          thumbnail: images[0],
          price: basePrice,
          originalPrice: product.comparePrice,
          stock: baseStock,
          moq: product.minOrderQuantity,
          specifications: product.specifications,
          available: true,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          sku: `${product._id}-BLUE-500M`,
          name: "Blue 500M",
          attributeValues: new Map([
            ["Color", "blue"],
            ["Size", "500m"],
          ]),
          images: images.slice(1, 3),
          thumbnail: images[1] || images[0],
          price: basePrice + 50,
          originalPrice: product.comparePrice,
          stock: baseStock - 20,
          moq: product.minOrderQuantity,
          specifications: product.specifications,
          available: true,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          sku: `${product._id}-PINK-500M`,
          name: "Pink 500M",
          attributeValues: new Map([
            ["Color", "pink"],
            ["Size", "500m"],
          ]),
          images: images.slice(2, 4),
          thumbnail: images[2] || images[0],
          price: basePrice + 75,
          originalPrice: product.comparePrice,
          stock: baseStock - 40,
          moq: product.minOrderQuantity,
          specifications: product.specifications,
          available: true,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          sku: `${product._id}-WHITE-1000M`,
          name: "White 1000M",
          attributeValues: new Map([
            ["Color", "white"],
            ["Size", "1000m"],
          ]),
          images: images.slice(0, 2),
          thumbnail: images[0],
          price: basePrice + 100,
          originalPrice: product.comparePrice,
          stock: baseStock - 10,
          moq: product.minOrderQuantity,
          specifications: product.specifications,
          available: true,
        },
      ];
    } else if (
      productName.includes("mat") ||
      productName.includes("car") ||
      productName.includes("floor")
    ) {
      // Mat/Car variants - Color only
      variantTypes = [
        {
          name: "Color",
          type: "swatch",
          values: [
            { label: "Black", value: "black", hex: "#000000" },
            { label: "White", value: "white", hex: "#FFFFFF" },
            { label: "Gray", value: "gray", hex: "#808080" },
            { label: "Beige", value: "beige", hex: "#F5F5DC" },
          ],
        },
      ];

      variants = [
        {
          _id: new mongoose.Types.ObjectId(),
          sku: `${product._id}-BLACK`,
          name: "Black",
          attributeValues: new Map([["Color", "black"]]),
          images: images.slice(0, 2),
          thumbnail: images[0],
          price: basePrice,
          originalPrice: product.comparePrice,
          stock: baseStock,
          moq: product.minOrderQuantity,
          specifications: product.specifications,
          available: true,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          sku: `${product._id}-WHITE`,
          name: "White",
          attributeValues: new Map([["Color", "white"]]),
          images: images.slice(1, 3),
          thumbnail: images[1] || images[0],
          price: basePrice + 100,
          originalPrice: product.comparePrice,
          stock: baseStock - 50,
          moq: product.minOrderQuantity,
          specifications: product.specifications,
          available: true,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          sku: `${product._id}-GRAY`,
          name: "Gray",
          attributeValues: new Map([["Color", "gray"]]),
          images: images.slice(2, 4),
          thumbnail: images[2] || images[0],
          price: basePrice + 50,
          originalPrice: product.comparePrice,
          stock: baseStock - 25,
          moq: product.minOrderQuantity,
          specifications: product.specifications,
          available: true,
        },
      ];
    } else {
      // Default variants - Color + Size
      variantTypes = [
        {
          name: "Color",
          type: "swatch",
          values: [
            { label: "Black", value: "black", hex: "#000000" },
            { label: "White", value: "white", hex: "#FFFFFF" },
            { label: "Red", value: "red", hex: "#FF0000" },
          ],
        },
        {
          name: "Size",
          type: "button",
          values: [
            { label: "S", value: "s" },
            { label: "M", value: "m" },
            { label: "L", value: "l" },
          ],
        },
      ];

      variants = [
        {
          _id: new mongoose.Types.ObjectId(),
          sku: `${product._id}-BLACK-S`,
          name: "Black S",
          attributeValues: new Map([
            ["Color", "black"],
            ["Size", "s"],
          ]),
          images: images.slice(0, 2),
          thumbnail: images[0],
          price: basePrice,
          originalPrice: product.comparePrice,
          stock: baseStock,
          moq: product.minOrderQuantity,
          specifications: product.specifications,
          available: true,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          sku: `${product._id}-WHITE-S`,
          name: "White S",
          attributeValues: new Map([
            ["Color", "white"],
            ["Size", "s"],
          ]),
          images: images.slice(1, 3),
          thumbnail: images[1] || images[0],
          price: basePrice + 50,
          originalPrice: product.comparePrice,
          stock: baseStock - 20,
          moq: product.minOrderQuantity,
          specifications: product.specifications,
          available: true,
        },
      ];
    }

    // Update product with variants
    product.hasVariants = true;
    product.variants = variants;
    product.variantTypes = variantTypes;

    await product.save();

    return res.status(200).json(
      new ApiResponse(200, {
        productId: product._id,
        productName: product.name,
        variantCount: variants.length,
        hasVariants: true,
      }, `Variants added to ${product.name}`)
    );
  })
);

// ─── Bulk Seed All Products ───
router.post(
  "/seed-variants-bulk",
  asyncHandler(async (req, res) => {
    const products = await Product.find({ isActive: true });

    if (!products.length) {
      return res.status(404).json(new ApiResponse(404, null, "No products found"));
    }

    const results = [];

    for (const product of products) {
      try {
        // Same variant logic as single product
        let variantTypes = [];
        let variants = [];
        const basePrice = product.price;
        const baseStock = product.stock || 100;
        const images = product.images.map((img) => img.url);
        const productName = product.name.toLowerCase();

        if (
          productName.includes("fabric") ||
          productName.includes("cloth") ||
          productName.includes("textile")
        ) {
          variantTypes = [
            {
              name: "Color",
              type: "swatch",
              values: [
                { label: "White", value: "white", hex: "#FFFFFF" },
                { label: "Blue", value: "blue", hex: "#0066FF" },
                { label: "Pink", value: "pink", hex: "#FF69B4" },
              ],
            },
          ];
          variants = [
            {
              _id: new mongoose.Types.ObjectId(),
              sku: `${product._id}-WHITE`,
              name: "White",
              attributeValues: new Map([["Color", "white"]]),
              images: images.slice(0, 2),
              thumbnail: images[0],
              price: basePrice,
              originalPrice: product.comparePrice,
              stock: baseStock,
              moq: product.minOrderQuantity,
              specifications: product.specifications,
              available: true,
            },
            {
              _id: new mongoose.Types.ObjectId(),
              sku: `${product._id}-BLUE`,
              name: "Blue",
              attributeValues: new Map([["Color", "blue"]]),
              images: images.slice(1, 3),
              thumbnail: images[1] || images[0],
              price: basePrice + 50,
              originalPrice: product.comparePrice,
              stock: baseStock - 20,
              moq: product.minOrderQuantity,
              specifications: product.specifications,
              available: true,
            },
          ];
        } else {
          variantTypes = [
            {
              name: "Color",
              type: "swatch",
              values: [
                { label: "Black", value: "black", hex: "#000000" },
                { label: "White", value: "white", hex: "#FFFFFF" },
              ],
            },
          ];
          variants = [
            {
              _id: new mongoose.Types.ObjectId(),
              sku: `${product._id}-BLK`,
              name: "Black",
              attributeValues: new Map([["Color", "black"]]),
              images: images.slice(0, 2),
              thumbnail: images[0],
              price: basePrice,
              originalPrice: product.comparePrice,
              stock: baseStock,
              moq: product.minOrderQuantity,
              specifications: product.specifications,
              available: true,
            },
            {
              _id: new mongoose.Types.ObjectId(),
              sku: `${product._id}-WHT`,
              name: "White",
              attributeValues: new Map([["Color", "white"]]),
              images: images.slice(1, 3),
              thumbnail: images[1] || images[0],
              price: basePrice + 100,
              originalPrice: product.comparePrice,
              stock: baseStock - 50,
              moq: product.minOrderQuantity,
              specifications: product.specifications,
              available: true,
            },
          ];
        }

        product.hasVariants = true;
        product.variants = variants;
        product.variantTypes = variantTypes;
        await product.save();

        results.push({
          productId: product._id,
          productName: product.name,
          variantCount: variants.length,
          status: "success",
        });
      } catch (error) {
        results.push({
          productId: product._id,
          productName: product.name,
          status: "failed",
          error: error.message,
        });
      }
    }

    return res.status(200).json(
      new ApiResponse(200, {
        totalProducts: products.length,
        successCount: results.filter((r) => r.status === "success").length,
        results,
      }, `Variants added to ${results.filter((r) => r.status === "success").length} products`)
    );
  })
);

// ─── Add Industrial Variants to Existing Products ───
router.post(
  "/add-industrial-variants",
  asyncHandler(async (req, res) => {
    // Find all Industrial category products
    const industrialProducts = await Product.find({ category: "Industrial", isActive: true });

    if (!industrialProducts.length) {
      return res.status(404).json(
        new ApiResponse(404, null, "No Industrial products found. Please create products first.")
      );
    }

    // Define industrial variants
    const variantTypes = [
      {
        name: "Capacity",
        type: "button",
        values: [
          { label: "1 Ton", value: "1ton" },
          { label: "5 Ton", value: "5ton" },
          { label: "10 Ton", value: "10ton" }
        ]
      },
      {
        name: "Power",
        type: "button",
        values: [
          { label: "1 HP", value: "1hp" },
          { label: "2 HP", value: "2hp" },
          { label: "5 HP", value: "5hp" },
          { label: "10 HP", value: "10hp" }
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
        name: "Phase",
        type: "button",
        values: [
          { label: "Single Phase", value: "single" },
          { label: "Three Phase", value: "three" }
        ]
      },
      {
        name: "Type",
        type: "button",
        values: [
          { label: "Automatic", value: "automatic" },
          { label: "Semi Automatic", value: "semi" }
        ]
      },
      {
        name: "Material",
        type: "button",
        values: [
          { label: "Steel", value: "steel" },
          { label: "Cast Iron", value: "castiron" },
          { label: "Aluminum", value: "aluminum" },
          { label: "Stainless Steel", value: "stainless" }
        ]
      }
    ];

    const results = [];

    for (const product of industrialProducts) {
      try {
        // Store original product details (BEFORE any changes)
        const originalName = product.name;
        const originalDescription = product.description;
        const originalPrice = product.price;
        const originalStock = product.stock || 50;
        const originalImages = product.images.map(img => typeof img === 'string' ? img : img.url);

        // Create variants (3 capacity options for each product)
        const variants = [];
        const capacities = ["1 Ton", "5 Ton", "10 Ton"];

        capacities.forEach((capacity, idx) => {
          variants.push({
            _id: new mongoose.Types.ObjectId(),
            sku: `${product._id.toString().slice(0, 8)}-${capacity.replace(/\s+/g, '')}-${idx}`,
            name: `${originalName} - ${capacity}`, // Use ORIGINAL name
            attributeValues: new Map([["Capacity", capacity]]),
            images: originalImages,
            thumbnail: originalImages[0] || "https://via.placeholder.com/100",
            price: originalPrice + (idx * 5000),
            originalPrice: product.comparePrice ? product.comparePrice + (idx * 5000) : originalPrice + (idx * 6000),
            stock: originalStock - (idx * 5),
            moq: product.minOrderQuantity || 1,
            specifications: product.specifications || [],
            available: true
          });
        });

        // Update product with variants ONLY - DO NOT touch other fields
        // Only set the variant-related fields
        const updatedProduct = await Product.findByIdAndUpdate(
          product._id,
          {
            hasVariants: true,
            variants: variants,
            variantTypes: variantTypes
          },
          { new: true }
        );

        // Verify name is still there
        if (!updatedProduct.name) {
          throw new Error("Product name was lost during update!");
        }

        results.push({
          productId: updatedProduct._id,
          productName: updatedProduct.name, // ✅ Use updated product name
          variantCount: variants.length,
          status: "success"
        });
      } catch (error) {
        results.push({
          productId: product._id,
          productName: product.name,
          status: "failed",
          error: error.message
        });
      }
    }

    return res.status(200).json(
      new ApiResponse(200, {
        totalProducts: industrialProducts.length,
        successCount: results.filter((r) => r.status === "success").length,
        results
      }, `Variants added to ${results.filter((r) => r.status === "success").length} existing Industrial products`)
    );
  })
);

// ─── Add Chemical/Fertilizer Variants to Existing Products ───
router.post(
  "/add-chemical-variants",
  asyncHandler(async (req, res) => {
    // Find all Chemical/Fertilizer category products
    const chemicalProducts = await Product.find({
      $or: [
        { category: "Chemical" },
        { category: "Fertilizer" },
        { category: "Chemicals" },
        { category: "Chemicals & Plastics" },
        { category: "Chemicals & Fertilizers" },
        { category: /chemical/i },
        { category: /fertilizer/i }
      ],
      isActive: true
    });

    if (!chemicalProducts.length) {
      return res.status(404).json(
        new ApiResponse(404, null, "No Chemical/Fertilizer products found. Please create products first.")
      );
    }

    // Define chemical/fertilizer variants
    const variantTypes = [
      {
        name: "Weight",
        type: "button",
        values: [
          { label: "50 kg", value: "50kg" },
          { label: "100 kg", value: "100kg" },
          { label: "500 kg", value: "500kg" },
          { label: "1000 kg", value: "1000kg" }
        ]
      },
      {
        name: "Packaging Size",
        type: "dropdown",
        values: [
          { label: "Bag", value: "bag" },
          { label: "Drum", value: "drum" },
          { label: "Tanker", value: "tanker" },
          { label: "Bulk", value: "bulk" }
        ]
      },
      {
        name: "Grade",
        type: "button",
        values: [
          { label: "Agricultural", value: "agricultural" },
          { label: "Industrial", value: "industrial" },
          { label: "Pharmaceutical", value: "pharmaceutical" },
          { label: "Technical", value: "technical" }
        ]
      },
      {
        name: "Purity",
        type: "dropdown",
        values: [
          { label: "95%", value: "95" },
          { label: "97%", value: "97" },
          { label: "99%", value: "99" },
          { label: "99.5%", value: "99.5" }
        ]
      },
      {
        name: "Application Type",
        type: "button",
        values: [
          { label: "Crop Nutrition", value: "crop" },
          { label: "Animal Feed", value: "animal" },
          { label: "Industrial Use", value: "industrial" },
          { label: "Laboratory", value: "laboratory" }
        ]
      }
    ];

    const results = [];

    for (const product of chemicalProducts) {
      try {
        // Store original product details
        const originalName = product.name;
        const originalPrice = product.price;
        const originalStock = product.stock || 100;
        const originalImages = product.images.map(img => typeof img === 'string' ? img : img.url);

        // Create variants (multiple weight options)
        const variants = [];
        const weights = ["50 kg", "100 kg", "500 kg", "1000 kg"];

        weights.forEach((weight, idx) => {
          variants.push({
            _id: new mongoose.Types.ObjectId(),
            sku: `${product._id.toString().slice(0, 8)}-${weight.replace(/\s+/g, '')}-${idx}`,
            name: `${originalName} - ${weight}`,
            attributeValues: new Map([["Weight", weight]]),
            images: originalImages,
            thumbnail: originalImages[0] || "https://via.placeholder.com/100",
            price: originalPrice + (idx * 2000),
            originalPrice: product.comparePrice ? product.comparePrice + (idx * 2000) : originalPrice + (idx * 3000),
            stock: originalStock - (idx * 10),
            moq: product.minOrderQuantity || 1,
            specifications: product.specifications || [],
            available: true
          });
        });

        // Update product with variants ONLY
        const updatedProduct = await Product.findByIdAndUpdate(
          product._id,
          {
            hasVariants: true,
            variants: variants,
            variantTypes: variantTypes
          },
          { new: true }
        );

        // Verify name is still there
        if (!updatedProduct.name) {
          throw new Error("Product name was lost during update!");
        }

        results.push({
          productId: updatedProduct._id,
          productName: updatedProduct.name,
          variantCount: variants.length,
          status: "success"
        });
      } catch (error) {
        results.push({
          productId: product._id,
          productName: product.name,
          status: "failed",
          error: error.message
        });
      }
    }

    return res.status(200).json(
      new ApiResponse(200, {
        totalProducts: chemicalProducts.length,
        successCount: results.filter((r) => r.status === "success").length,
        results
      }, `Variants added to ${results.filter((r) => r.status === "success").length} existing Chemical/Fertilizer products`)
    );
  })
);

// ─── Add Conveyor Sorting Machine Variants by Name ───
router.post(
  "/add-conveyor-variants",
  asyncHandler(async (req, res) => {
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
        variants.push({
          _id: new mongoose.Types.ObjectId(),
          sku: `${product._id.toString().slice(0, 8)}-${model.replace(/\-/, '')}-${capacity.split(' ')[0]}`,
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
          stock: baseStock - (variantIndex * 2),
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
      }, `${variants.length} variants added to ${updatedProduct.name}`)
    );
  })
);

// ─── Add Custom Variants to Specific Product ───
router.post(
  "/add-custom-variants/:productId",
  asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json(
        new ApiResponse(404, null, "Product not found")
      );
    }

    // Define custom variants for this product
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

    // Create combinations: Model x Capacity (4 models x 4 capacities = 16 variants)
    const models = ["SCM-100", "SCM-200", "SCM-500"];
    const capacities = ["500 Items/Hour", "1000 Items/Hour", "2000 Items/Hour", "5000 Items/Hour"];

    let variantIndex = 0;
    models.forEach((model, modelIdx) => {
      capacities.forEach((capacity, capIdx) => {
        variants.push({
          _id: new mongoose.Types.ObjectId(),
          sku: `${product._id.toString().slice(0, 8)}-${model.replace(/\-/, '')}-${capacity.split(' ')[0]}`,
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
          stock: baseStock - (variantIndex * 2),
          moq: product.minOrderQuantity || 1,
          specifications: product.specifications || [],
          available: true
        });
        variantIndex++;
      });
    });

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
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
      }, `${variants.length} variants added to ${updatedProduct.name}`)
    );
  })
);

// All admin routes require authentication + admin role
router.use(authMiddleware, roleMiddleware("admin"));

// Dashboard
router.get("/dashboard", getDashboard);
router.get("/dashboard/analytics", getDashboardAnalytics);

// Product management
router.get("/products", getProducts);
router.get("/products/:id", getProductDetail);
router.post("/products/batch-action", batchProductAction);
router.patch("/products/:id/approve", approveProduct);
router.patch("/products/:id/reject", rejectProduct);

// User management
router.get("/users", getUsers);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/verify", verifyUser);
router.delete("/users/:id", deleteUser);

// Category management
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.patch("/categories/:id/status", toggleCategoryStatus);
router.delete("/categories/:id", deleteCategory);

export default router;
