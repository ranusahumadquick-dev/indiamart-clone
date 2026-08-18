import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Product from "../models/Product.js";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import { triggerPriceAlerts, triggerStockAlerts } from "./priceAlertController.js";
import {
  processUploadedImages,
  validateImageFile,
  getPublicImageUrls,
  logImageOperation,
} from "../utils/imageHandler.js";

// =============================================
// 📦 CREATE PRODUCT — Seller creates a product
// =============================================
const createProduct = asyncHandler(async (req, res) => {
  console.log("🔵 [createProduct] Starting product creation...");
  console.log("   Seller:", req.user._id);

  const {
    name,
    description,
    price,
    priceMax,
    comparePrice,
    priceUnit,
    category,
    subCategory,
    tags,
    specifications,
    minOrderQuantity,
    maxOrderQuantity,
    stock,
    city,
    state,
    brand,
    allowSamples,
    samplePrice,
    sampleMinQty,
    sampleMaxQty,
    sampleLeadTime,
    variantTypes,
    variants,
  } = req.body;

  // 1. Validate required fields
  if (!name || !description || !price || !category || !city || !state) {
    console.error("❌ [createProduct] Missing required fields");
    throw new ApiError(
      400,
      "Name, description, price, category, and location (city, state) are required"
    );
  }
  console.log("✅ [createProduct] All required fields present");

  // 2. Parse images from multer upload using image handler
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

  console.log("📤 [createProduct] Processing images...");
  console.log("   req.files type:", typeof req.files);
  console.log("   req.files is Array:", Array.isArray(req.files));
  console.log("   Files received:", req.files?.length || 0);
  if (req.files && req.files.length > 0) {
    console.log("   File details:", req.files.map(f => ({ name: f.originalname, path: f.path, size: f.size })));
  }

  // Separate image files from video file
  const allFiles = req.files || [];
  const imageFiles = allFiles.filter(f => f.fieldname !== "video");
  const videoFileUpload = allFiles.find(f => f.fieldname === "video");

  // Validate image files
  if (imageFiles.length > 0) {
    console.log("🔍 [createProduct] Validating", imageFiles.length, "image files");
    for (const file of imageFiles) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        console.error("❌ [createProduct] File validation failed:", validation.error);
        throw new ApiError(400, validation.error);
      }
    }
  } else {
    console.log("⚠️ [createProduct] No images uploaded (optional)");
  }

  console.log("📦 [createProduct] About to call processUploadedImages with:");
  console.log("   Backend URL:", backendUrl);
  const images = processUploadedImages(imageFiles, backendUrl);

  // Add video to images array if uploaded
  if (videoFileUpload) {
    const videoUrl = `${backendUrl}/uploads/products/${videoFileUpload.filename}`;
    images.push({ url: videoUrl, alt: "Product video", type: "video" });
    console.log("🎥 [createProduct] Video added:", videoUrl);
  }
  console.log("✅ [createProduct] Images processed:", images.length, "images");
  if (images.length > 0) {
    console.log("   First image URL:", images[0].url);
    console.log("   First image full object:", JSON.stringify(images[0], null, 2));
  } else {
    console.log("⚠️ [createProduct] No images returned from processUploadedImages!");
  }

  const photoCount = images.filter((img) => img.type !== "video").length;
  if (photoCount === 0) {
    throw new ApiError(400, "At least one product image is required");
  }

  // 3. Create product
  console.log("💾 [createProduct] Saving product to database...");

  // Parse variant data
  const parsedVariantTypes = variantTypes
    ? typeof variantTypes === "string"
      ? JSON.parse(variantTypes)
      : variantTypes
    : [];
  const parsedVariants = variants
    ? typeof variants === "string"
      ? JSON.parse(variants)
      : variants
    : [];

  console.log("   📋 variantTypes:", JSON.stringify(parsedVariantTypes, null, 2));
  console.log("   📋 variants count:", parsedVariants.length);
  if (parsedVariants.length > 0) {
    console.log("   📋 variants (first 2):", JSON.stringify(parsedVariants.slice(0, 2), null, 2));
  }

  // Validate brand belongs to seller if provided
  if (brand) {
    const brandDoc = await Brand.findOne({ _id: brand, seller: req.user._id, isActive: true });
    if (!brandDoc) throw new ApiError(400, "Selected brand not found or does not belong to you");
  }

  // Create product
  let product = await Product.create({
    name,
    description,
    price,
    priceMax: priceMax || undefined,
    comparePrice,
    priceUnit,
    category,
    subCategory,
    tags: tags ? (typeof tags === "string" ? JSON.parse(tags) : tags) : [],
    specifications: specifications
      ? typeof specifications === "string"
        ? JSON.parse(specifications)
        : specifications
      : [],
    images,
    seller: req.user._id,
    brand: brand || undefined,
    companyName: req.user.companyName,
    // Only approved (onboarding-reviewed), non-frozen sellers can publish
    // live — everyone else can only save as draft. isVerified is a separate
    // buyer-facing trust badge and has no bearing on publish rights.
    status: (req.user.sellerStatus === "approved" && !req.user.accountFrozen) ? "approved" : "draft",
    minOrderQuantity,
    maxOrderQuantity,
    stock,
    city,
    state,
    allowSamples: allowSamples === "true" || allowSamples === true,
    samplePrice: samplePrice || 0,
    sampleMinQty: sampleMinQty || 1,
    sampleMaxQty: sampleMaxQty || 5,
    sampleLeadTime: sampleLeadTime || "3-5 days",
    variantTypes: parsedVariantTypes,
    variants: parsedVariants,
    hasVariants: parsedVariants.length > 0,
  });

  // If variantTypes provided but no variants yet, trigger auto-generation
  if (category) {
    console.log("🔄 [Auto-Variants] Re-fetching product to populate category for auto-variant generation...");
    product = await Product.findById(product._id)
      .populate("category")
      .populate("subCategory");
    console.log(`📦 [Auto-Variants] Category populated: ${product.category?.name || product.category}, SubCategory: ${product.subCategory?.name || "N/A"}`);
    // Save to trigger pre("save") hook for auto-variant generation
    product = await product.save();
    console.log(`✅ [Auto-Variants] Post-save: hasVariants=${product.hasVariants}, variantCount=${product.variants?.length || 0}`);
  }

  console.log("🎉 [createProduct] Product created successfully!");
  console.log("   Product ID:", product._id);
  console.log("   Has Variants:", product.hasVariants);
  console.log("   Variant Types Count:", product.variantTypes?.length || 0);
  console.log("   Variants Count:", product.variants?.length || 0);
  console.log("   Product Name:", product.name);
  console.log("   Images stored:", product.images.length);

  return res
    .status(201)
    .json(new ApiResponse(201, product, "Product created successfully"));
});

// =============================================
// 📋 GET ALL PRODUCTS — Public listing with filters
// =============================================
const getAllProducts = asyncHandler(async (req, res) => {
  const {
    category,
    subCategory,
    minPrice,
    maxPrice,
    city,
    state,
    minRating,
    maxMOQ,
    isVerified,
    allowSamples,
    sortBy,
    isFeatured,
    page = 1,
    limit = 20,
  } = req.query;

  // Build filters
  const filters = { isActive: true, status: "approved" };

  // Category filter — resolve name/slug to ObjectId
  if (category) {
    // Check if it's already a valid ObjectId
    const isObjectId = /^[a-f\d]{24}$/i.test(category);
    if (isObjectId) {
      // Always include subcategories so "All Electronics" returns Mobiles/Laptops etc.
      const catObjectId = new mongoose.Types.ObjectId(category);
      const subCats = await Category.find({ parentCategory: catObjectId }).select("_id").lean();
      if (subCats.length > 0) {
        filters.category = { $in: [catObjectId, ...subCats.map((s) => s._id)] };
        console.log(`[getAllProducts] Category ${category} has ${subCats.length} subcategories — using $in`);
      } else {
        filters.category = catObjectId;
      }
    } else {
      // Look up by slug first, then by name (case-insensitive)
      const categoryDoc = await Category.findOne({
        $or: [
          { slug: category.toLowerCase() },
          { slug: category.toLowerCase().replace(/\s+/g, "-") },
          { name: { $regex: `^${category}$`, $options: "i" } },
        ],
      }).select("_id");

      if (categoryDoc) {
        filters.category = categoryDoc._id;
      } else {
        // Try parent categories to match all subcategories
        const parentCat = await Category.findOne({
          name: { $regex: category, $options: "i" },
        }).select("_id");
        if (parentCat) {
          // Get all subcategory IDs under this parent
          const subCats = await Category.find({ parentCategory: parentCat._id }).select("_id");
          const allIds = [parentCat._id, ...subCats.map((s) => s._id)];
          filters.category = { $in: allIds };
        }
        // Category string provided but not found in DB — return empty immediately
        // (using null would match products with no category, which is wrong)
        else {
          console.warn(`[getAllProducts] Category not found: "${category}" — returning empty`);
          return res.status(200).json(
            new ApiResponse(200, { products: [], pagination: { total: 0, page: 1, pages: 0 } }, "No products for this category")
          );
        }
      }
    }
  }

  if (subCategory) {
    const isObjectId = /^[a-f\d]{24}$/i.test(subCategory);
    if (isObjectId) {
      filters.subCategory = subCategory;
    } else {
      const subCatDoc = await Category.findOne({
        $or: [
          { slug: subCategory.toLowerCase() },
          { name: { $regex: `^${subCategory}$`, $options: "i" } },
        ],
      }).select("_id");
      if (subCatDoc) filters.subCategory = subCatDoc._id;
    }
  }
  if (isFeatured === "true") filters.isFeatured = true;
  if (minRating) filters.averageRating = { $gte: Number(minRating) };
  if (city) filters.city = { $regex: city, $options: "i" };
  if (state) filters.state = { $regex: state, $options: "i" };
  // "Verified Sellers Only" — filter by SELLER's isVerified (User model), not product's
  if (isVerified === "true") {
    const verifiedSellers = await User.find({ isVerified: true, role: "seller" }).select("_id").lean();
    if (verifiedSellers.length === 0) {
      console.log("[getAllProducts] No verified sellers found — returning empty");
      return res.status(200).json(
        new ApiResponse(200, { products: [], pagination: { total: 0, page: 1, pages: 0 } }, "No products from verified sellers")
      );
    }
    filters.seller = { $in: verifiedSellers.map((u) => u._id) };
  }
  if (allowSamples === "true") filters.allowSamples = true;
  // maxMOQ: show products where minOrderQuantity <= maxMOQ (buyer can afford the MOQ)
  if (maxMOQ) filters.minOrderQuantity = { $lte: Number(maxMOQ) };

  if (minPrice || maxPrice) {
    filters.price = {};
    if (minPrice) filters.price.$gte = Number(minPrice);
    if (maxPrice) filters.price.$lte = Number(maxPrice);
  }

  // Build sort
  let sortOptions = {};
  switch (sortBy) {
    case "price_low":
      sortOptions = { price: 1 };
      break;
    case "price_high":
      sortOptions = { price: -1 };
      break;
    case "newest":
      sortOptions = { createdAt: -1 };
      break;
    case "rating":
      sortOptions = { averageRating: -1 };
      break;
    case "popular":
      sortOptions = { views: -1 };
      break;
    default:
      sortOptions = { createdAt: -1 };
  }

  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  console.log(`[getAllProducts] filters=${JSON.stringify(filters)} sort=${JSON.stringify(sortOptions)} page=${page} limit=${pageLimit}`);

  const [products, totalProducts] = await Promise.all([
    Product.find(filters)
      .populate("category", "name slug")
      .populate("seller", "name companyName avgResponseTime isVerified")
      .populate("brand", "brandName logo")
      .sort(sortOptions)
      .skip(skip)
      .limit(pageLimit),
    Product.countDocuments(filters),
  ]);

  // Drop any product whose seller no longer exists (legacy orphaned data) —
  // never show a listing with a broken/missing seller link
  const validProducts = products.filter((p) => p.seller);

  console.log(`[getAllProducts] found=${products.length} valid=${validProducts.length} total=${totalProducts}`);

  const pagination = getPaginationMeta(totalProducts, currentPage, pageLimit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products: validProducts,
        pagination,
      },
      "Products fetched successfully"
    )
  );
});

// =============================================
// 🔍 GET SINGLE PRODUCT — Product detail page
// =============================================
const getSingleProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id)
    .populate("category", "name slug")
    .populate("subCategory", "name slug")
    .populate("seller", "name companyName city state isVerified avatar avgResponseTime phone whatsapp")
    .populate("brand", "brandName logo website");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Never show a broken/sellerless product page (deleted seller account)
  if (!product.seller) {
    throw new ApiError(404, "Product not available");
  }

  // Non-live products (draft/pending/rejected/inactive) are only visible to
  // the owning seller (previewing/editing their own listing) or an admin —
  // everyone else gets the same 404 a public buyer would see for browsing.
  const isLive = product.status === "approved" && product.isActive;
  if (!isLive) {
    let selfId = null;
    let selfRole = null;
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        selfId = decoded.id;
        selfRole = decoded.role;
      } catch { /* not authenticated / expired — treat as public */ }
    }
    const isOwner = selfId && String(product.seller._id) === String(selfId);
    const isAdmin = selfRole === "admin";
    if (!isOwner && !isAdmin) {
      throw new ApiError(404, "Product not available");
    }
  }

  console.log("🔍 [getSingleProduct] Fetched product:", product.name);
  console.log("   Has Variants:", product.hasVariants);
  console.log("   Variant Types Count:", product.variantTypes?.length || 0);
  console.log("   Variants Count:", product.variants?.length || 0);
  if (product.variantTypes?.length > 0) {
    console.log("   First variantType:", JSON.stringify(product.variantTypes[0], null, 2));
  }
  if (product.variants?.length > 0) {
    console.log("   First variant:", JSON.stringify(product.variants[0], null, 2));
  }

  // Transform product to ensure proper serialization
  let transformedProduct = product.toObject ? product.toObject() : JSON.parse(JSON.stringify(product));

  // Transform variants to include 'id' field and properly serialize attributeValues
  if (transformedProduct.variants && Array.isArray(transformedProduct.variants)) {
    transformedProduct.variants = transformedProduct.variants.map((v, idx) => {
      // Convert Map to object if needed
      const attributeValues = v.attributeValues instanceof Map
        ? Object.fromEntries(v.attributeValues)
        : (v.attributeValues || {});

      // Use SKU as ID if available, otherwise use index
      const variantId = v.sku || `variant-${idx}`;

      return {
        ...v,
        attributeValues,
        id: variantId,
      };
    });
  }

  // Increment view count
  await Product.findByIdAndUpdate(id, { $inc: { views: 1 } });

  return res
    .status(200)
    .json(new ApiResponse(200, transformedProduct, "Product fetched successfully"));
});

// =============================================
// ✏️ UPDATE PRODUCT — Seller updates own product
// =============================================
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if product belongs to the seller
  const product = await Product.findOne({ _id: id, seller: req.user._id });

  if (!product) {
    throw new ApiError(404, "Product not found or you don't have permission");
  }

  const updatedData = req.body;

  // Status is seller-verification-gated, not client-controlled.
  // "rejected" is admin-only regardless of verification.
  if (updatedData.status === "rejected") {
    delete updatedData.status;
  }
  if (updatedData.status && updatedData.status !== "draft") {
    if (req.user.accountFrozen) {
      throw new ApiError(403, "Your account has been frozen by admin. Contact support to resume publishing.");
    }
  }

  // Validate brand belongs to seller if provided
  if (updatedData.brand) {
    const brandDoc = await Brand.findOne({ _id: updatedData.brand, seller: req.user._id, isActive: true });
    if (!brandDoc) throw new ApiError(400, "Selected brand not found or does not belong to you");
  }

  // Parse tags and specifications if they come as strings
  if (updatedData.tags && typeof updatedData.tags === "string") {
    updatedData.tags = JSON.parse(updatedData.tags);
  }
  if (
    updatedData.specifications &&
    typeof updatedData.specifications === "string"
  ) {
    updatedData.specifications = JSON.parse(updatedData.specifications);
  }

  // Parse variants and variantTypes if they come as strings
  if (updatedData.variantTypes && typeof updatedData.variantTypes === "string") {
    updatedData.variantTypes = JSON.parse(updatedData.variantTypes);
  }
  if (updatedData.variants && typeof updatedData.variants === "string") {
    updatedData.variants = JSON.parse(updatedData.variants);
  }

  // Set hasVariants based on variants array
  if (updatedData.variants) {
    updatedData.hasVariants = Array.isArray(updatedData.variants) && updatedData.variants.length > 0;
  }

  // Handle images: merge retained existing images with any newly uploaded
  // files, rather than wholesale-replacing the array. The client sends
  // `existingImages` (JSON array of image objects still kept) whenever the
  // images section was touched at all — its absence means "images section
  // wasn't edited, leave the array untouched".
  if (updatedData.existingImages !== undefined) {
    let retained = updatedData.existingImages;
    if (typeof retained === "string") retained = JSON.parse(retained);
    updatedData.images = Array.isArray(retained) ? retained : [];
    delete updatedData.existingImages;
  }

  if (req.files && req.files.length > 0) {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

    // Validate files
    for (const file of req.files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new ApiError(400, validation.error);
      }
    }

    const newImages = processUploadedImages(req.files, backendUrl);
    updatedData.images = [...(updatedData.images || []), ...newImages];
    logImageOperation("product_image_update", {
      productId: id,
      imageCount: newImages.length,
    });
  }

  if (updatedData.images !== undefined) {
    const photoCount = updatedData.images.filter((img) => img.type !== "video").length;
    if (photoCount === 0) {
      throw new ApiError(400, "At least one product image is required");
    }
  }

  const existingProduct = await Product.findOne({ _id: id, seller: req.user._id })
    .populate("category")
    .populate("subCategory");
  const oldPrice = existingProduct?.price;

  // Update product fields
  Object.assign(existingProduct, updatedData);

  if (!existingProduct.city || !existingProduct.state) {
    throw new ApiError(400, "Location (city, state) is required");
  }

  // AUTO-GENERATE VARIANTS if empty
  if ((!existingProduct.variantTypes || existingProduct.variantTypes.length === 0) && existingProduct.category) {
    console.log("🔧 [updateProduct] Auto-generating variants for:", existingProduct.name);

    // Generate default variants for ANY product
    const defaultTemplates = [
      { name: "Size", values: ["Small","Medium","Large","XL"] },
      { name: "Color", values: ["White","Black","Navy","Grey","Red","Blue"] },
      { name: "Variant", values: ["Standard","Premium","Deluxe"] }
    ];

    // Transform to variantTypes
    existingProduct.variantTypes = defaultTemplates.map(template => ({
      name: template.name,
      type: "dropdown",
      values: template.values.map(value => ({
        label: value,
        value: value.toLowerCase().replace(/\s+/g, "-")
      }))
    }));

    // Generate combinations
    const skuPrefix = existingProduct.name?.substring(0, 3).toUpperCase().replace(/\s/g, "") || "SKU";
    const combinations = [];
    let combos = [{}];

    for (const vt of defaultTemplates) {
      const newCombos = [];
      for (const existing of combos) {
        for (const value of vt.values) {
          newCombos.push({ ...existing, [vt.name]: value });
        }
      }
      combos = newCombos;
    }

    const totalCombos = combos.length;
    const stockPerVariant = totalCombos > 0 ? Math.floor((existingProduct.stock || 0) / totalCombos) : 0;

    existingProduct.variants = combos.map((attrs, index) => {
      const attrPart = Object.values(attrs)
        .map(v => v.substring(0, 3).toUpperCase().replace(/\s/g, ""))
        .join("-");

      return {
        sku: `${skuPrefix}-${attrPart}-${String(index + 1).padStart(3, "0")}`,
        name: Object.values(attrs).join(" - "),
        attributeValues: new Map(Object.entries(attrs)),
        images: [],
        thumbnail: "",
        price: existingProduct.price || 0,
        originalPrice: existingProduct.price || 0,
        stock: stockPerVariant,
        moq: 1,
        specifications: [],
        available: stockPerVariant > 0,
      };
    });

    existingProduct.hasVariants = true;
    console.log(`✅ [updateProduct] Generated ${existingProduct.variants.length} variants`);
  }

  // Save with variants
  const updatedProduct = await existingProduct.save({ validateBeforeSave: true });

  // Trigger price alerts if price was lowered
  if (updatedData.price && oldPrice && updatedData.price < oldPrice) {
    triggerPriceAlerts(id, updatedData.price, updatedProduct.name).catch(() => {});
  }
  // Trigger stock alerts if stock went from 0 to >0
  const oldStock = existingProduct?.stock || 0;
  const newStock = Number(updatedData.stock);
  if (!isNaN(newStock) && oldStock === 0 && newStock > 0) {
    triggerStockAlerts(id, newStock, updatedProduct.name).catch(() => {});
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedProduct, "Product updated successfully")
    );
});

// =============================================
// 🔍 GET SELLER'S OWN PRODUCT — for edit page (no status restriction)
// =============================================
const getSellerSingleProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findOne({ _id: id, seller: req.user._id })
    .populate("category", "name slug")
    .populate("subCategory", "name slug")
    .populate("seller", "name companyName city state isVerified avatar avgResponseTime phone whatsapp")
    .populate("brand", "brandName logo website");

  if (!product) {
    throw new ApiError(404, "Product not found or you don't have permission");
  }

  let transformedProduct = product.toObject ? product.toObject() : JSON.parse(JSON.stringify(product));

  if (transformedProduct.variants && Array.isArray(transformedProduct.variants)) {
    transformedProduct.variants = transformedProduct.variants.map((v, idx) => {
      const attributeValues = v.attributeValues instanceof Map
        ? Object.fromEntries(v.attributeValues)
        : (v.attributeValues || {});
      return { ...v, attributeValues, id: v.sku || `variant-${idx}` };
    });
  }

  return res.status(200).json(new ApiResponse(200, transformedProduct, "Product fetched successfully"));
});

// =============================================
// 🗑️ DELETE PRODUCT — Seller deletes own product
// =============================================
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findOne({ _id: id, seller: req.user._id });

  if (!product) {
    throw new ApiError(404, "Product not found or you don't have permission");
  }

  await Product.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Product deleted successfully"));
});

// =============================================
// 📊 GET SELLER'S PRODUCTS — Seller dashboard
// =============================================
const getSellerProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  const [products, totalProducts] = await Promise.all([
    Product.find({ seller: req.user._id })
      .populate("category", "name slug")
      .populate("brand", "brandName logo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    Product.countDocuments({ seller: req.user._id }),
  ]);

  const pagination = getPaginationMeta(totalProducts, currentPage, pageLimit);

  return res.status(200).json(
    new ApiResponse(
      200,
      { products, pagination },
      "Seller products fetched successfully"
    )
  );
});

// =============================================
// 🔎 SEARCH PRODUCTS — Full-text search
// =============================================
const searchProducts = asyncHandler(async (req, res) => {
  const { q, category, minPrice, maxPrice, city, minRating, maxMOQ, isVerified, allowSamples, sortBy, page = 1, limit = 20 } = req.query;

  const filters = { isActive: true, status: "approved" };

  // Pattern-based search — substring match anywhere in the word (e.g. "bile"
  // matches "mobile"), not just whole-word/stemmed matches like $text gives.
  if (q) {
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped, "i");
    filters.$or = [{ name: pattern }, { description: pattern }, { tags: pattern }];
  }

  // Category filter — resolve name/slug to ObjectId (same logic as getAllProducts)
  if (category) {
    const isObjectId = /^[a-f\d]{24}$/i.test(category);
    if (isObjectId) {
      const catObjectId = new mongoose.Types.ObjectId(category);
      const subCats = await Category.find({ parentCategory: catObjectId }).select("_id").lean();
      if (subCats.length > 0) {
        filters.category = { $in: [catObjectId, ...subCats.map((s) => s._id)] };
      } else {
        filters.category = catObjectId;
      }
    } else {
      const categoryDoc = await Category.findOne({
        $or: [
          { slug: category.toLowerCase() },
          { slug: category.toLowerCase().replace(/\s+/g, "-") },
          { name: { $regex: `^${category}$`, $options: "i" } },
        ],
      }).select("_id");

      if (categoryDoc) {
        const subCats = await Category.find({ parentCategory: categoryDoc._id }).select("_id").lean();
        filters.category = subCats.length > 0
          ? { $in: [categoryDoc._id, ...subCats.map((s) => s._id)] }
          : categoryDoc._id;
      } else {
        const parentCat = await Category.findOne({
          name: { $regex: category, $options: "i" },
        }).select("_id");
        if (parentCat) {
          const subCats = await Category.find({ parentCategory: parentCat._id }).select("_id");
          filters.category = { $in: [parentCat._id, ...subCats.map((s) => s._id)] };
        } else {
          filters.category = null;
        }
      }
    }
  }

  if (city) filters.city = { $regex: city, $options: "i" };
  if (minRating) filters.averageRating = { $gte: Number(minRating) };
  if (maxMOQ) filters.minOrderQuantity = { $lte: Number(maxMOQ) };
  if (allowSamples === "true") filters.allowSamples = true;
  if (isVerified === "true") {
    const verifiedSellers = await User.find({ isVerified: true, role: "seller" }).select("_id").lean();
    if (verifiedSellers.length === 0) {
      return res.status(200).json(new ApiResponse(200, { products: [], pagination: { total: 0, page: 1, pages: 0 } }, "No products from verified sellers"));
    }
    filters.seller = { $in: verifiedSellers.map((u) => u._id) };
  }

  if (minPrice || maxPrice) {
    filters.price = {};
    if (minPrice) filters.price.$gte = Number(minPrice);
    if (maxPrice) filters.price.$lte = Number(maxPrice);
  }

  let sortOptions = { createdAt: -1 };
  if (sortBy === "price_low") sortOptions = { price: 1 };
  if (sortBy === "price_high") sortOptions = { price: -1 };
  if (sortBy === "newest") sortOptions = { createdAt: -1 };
  if (sortBy === "rating") sortOptions = { averageRating: -1 };

  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  const [products, totalProducts] = await Promise.all([
    Product.find(filters)
      .populate("category", "name slug")
      .populate("seller", "name companyName isVerified")
      .populate("brand", "brandName logo")
      .sort(sortOptions)
      .skip(skip)
      .limit(pageLimit),
    Product.countDocuments(filters),
  ]);

  // Relevance boost — when searching, put name-prefix / name-substring
  // matches ahead of description/tag-only matches, without needing a
  // separate aggregation pipeline.
  if (q && !sortBy) {
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nameRegex = new RegExp(escaped, "i");
    const prefixRegex = new RegExp(`^${escaped}`, "i");
    products.sort((a, b) => {
      const rank = (p) => (prefixRegex.test(p.name) ? 0 : nameRegex.test(p.name) ? 1 : 2);
      return rank(a) - rank(b);
    });
  }

  const validProducts = products.filter((p) => p.seller);
  const pagination = getPaginationMeta(totalProducts, currentPage, pageLimit);

  return res.status(200).json(
    new ApiResponse(200, { products: validProducts, pagination }, "Search results fetched")
  );
});

// =============================================
// 🔗 RELATED PRODUCTS — "You May Also Like"
// =============================================
const getRelatedProducts = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const limit = Number(req.query.limit) || 10;

  const currentProduct = await Product.findById(productId);

  if (!currentProduct) {
    throw new ApiError(404, "Product not found");
  }

  const relatedProducts = await Product.aggregate([
    {
      $match: {
        _id: { $ne: currentProduct._id },
        isActive: true,
        status: "approved",
      },
    },
    {
      $addFields: {
        categoryMatch: {
          $cond: [{ $eq: ["$category", currentProduct.category] }, 50, 0],
        },
        tagOverlap: {
          $size: {
            $setIntersection: [
              { $ifNull: ["$tags", []] },
              currentProduct.tags || [],
            ],
          },
        },
        priceSimilarity: {
          $cond: [
            {
              $and: [
                { $gte: ["$price", currentProduct.price * 0.5] },
                { $lte: ["$price", currentProduct.price * 1.5] },
              ],
            },
            10,
            0,
          ],
        },
        cityMatch: {
          $cond: [
            {
              $and: [
                currentProduct.city,
                { $eq: ["$city", currentProduct.city] },
              ],
            },
            5,
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        relevanceScore: {
          $add: [
            "$categoryMatch",
            { $multiply: ["$tagOverlap", 15] },
            "$priceSimilarity",
            "$cityMatch",
          ],
        },
      },
    },
    { $sort: { relevanceScore: -1 } },
    { $limit: limit },
    {
      $project: {
        name: 1,
        price: 1,
        images: 1,
        city: 1,
        averageRating: 1,
        companyName: 1,
        category: 1,
        relevanceScore: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        relatedProducts,
        "Related products fetched successfully"
      )
    );
});

// =============================================
// ⭐ GET FEATURED PRODUCTS
// =============================================
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const now = new Date();
  const products = await Product.find({
    isFeatured: true,
    isActive: true,
    $or: [
      { featuredUntil: { $gte: now } },
      { featuredUntil: null },
      { featuredUntil: { $exists: false } },
    ],
  })
    .populate("seller", "name companyName city state isVerified avatar")
    .limit(8)
    .sort({ updatedAt: -1 });

  const validProducts = products.filter((p) => p.seller);

  return res.status(200).json(new ApiResponse(200, validProducts, "Featured products fetched"));
});

// =============================================
// 📥 BULK UPLOAD PRODUCTS — From CSV/Excel
// =============================================
const bulkUploadProducts = asyncHandler(async (req, res) => {
  const { products: productsData } = req.body;
  const sellerId = req.user._id;

  if (!productsData || !Array.isArray(productsData) || productsData.length === 0) {
    throw new ApiError(400, "No products data provided");
  }

  if (productsData.length > 500) {
    throw new ApiError(400, "Maximum 500 products can be uploaded at once");
  }

  const results = {
    successful: [],
    failed: [],
    totalProcessed: productsData.length,
  };

  for (let i = 0; i < productsData.length; i++) {
    try {
      const {
        name,
        description,
        price,
        comparePrice,
        currency,
        priceUnit,
        category,
        stock,
        sku,
        images,
      } = productsData[i];

      // Validate required fields
      if (!name || !price) {
        results.failed.push({
          row: i + 2,
          productName: name || `Row ${i + 2}`,
          error: "Name and price are required",
        });
        continue;
      }

      // Parse images if provided as string
      let imageArray = [];
      if (images) {
        if (typeof images === "string") {
          imageArray = images
            .split(";")
            .filter((url) => url.trim())
            .map((url) => ({
              url: url.trim(),
              alt: `${name} - Image`,
              type: "image",
            }));
        } else if (Array.isArray(images)) {
          imageArray = images.map((img) => ({
            url: typeof img === "string" ? img : img.url,
            alt: `${name} - Image`,
            type: "image",
          }));
        }
      }

      // Create product
      const product = await Product.create({
        name,
        description: description || "",
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : undefined,
        currency: currency || "INR",
        priceUnit: priceUnit || "Piece",
        category,
        stock: stock ? Number(stock) : 0,
        sku: sku || `SKU-${Date.now()}-${Math.random()}`,
        images: imageArray,
        seller: sellerId,
        isActive: true,
        status: "pending",
      });

      results.successful.push({
        id: product._id,
        name: product.name,
        sku: product.sku,
      });
    } catch (error) {
      results.failed.push({
        row: i + 2,
        productName: productsData[i].name || `Row ${i + 2}`,
        error: error.message,
      });
    }
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      results,
      `Bulk upload completed: ${results.successful.length} successful, ${results.failed.length} failed`
    )
  );
});

/**
 * Toggle Featured Status on Product
 * PUT /api/products/:productId/featured
 * Auth: Required (Seller owner only)
 * Body: { isFeatured, durationDays }
 */
const toggleFeaturedStatus = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { isFeatured, durationDays = 30 } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Check if seller owns the product
  if (product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only feature your own products");
  }

  let updateData = { isFeatured };

  if (isFeatured) {
    // Calculate featured until date
    const now = new Date();
    const featuredUntil = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    updateData.featuredUntil = featuredUntil;
  } else {
    // Remove featured status
    updateData.featuredUntil = null;
  }

  const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, {
    returnDocument: 'after',
  });

  return res.status(200).json(
    new ApiResponse(200, updatedProduct, `Product ${isFeatured ? 'featured' : 'unfeatured'} successfully`)
  );
});

/**
 * Get Seller's Products with Featured Options
 * GET /api/products/seller/manage
 * Auth: Required (Seller only)
 */
const getSellerProductsForFeaturing = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  const [products, totalProducts] = await Promise.all([
    Product.find({ seller: req.user._id, isActive: true })
      .select("name price isFeatured featuredUntil images city state createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    Product.countDocuments({ seller: req.user._id, isActive: true }),
  ]);

  // Add isFeaturedExpired flag
  const productsWithExpiry = products.map((p) => {
    const obj = p.toObject();
    obj.isFeaturedExpired =
      obj.isFeatured && obj.featuredUntil && new Date(obj.featuredUntil) < new Date();
    return obj;
  });

  const pagination = getPaginationMeta(totalProducts, currentPage, pageLimit);

  return res.status(200).json(
    new ApiResponse(
      200,
      { products: productsWithExpiry, pagination },
      "Products fetched for featuring"
    )
  );
});

export {
  createProduct,
  getAllProducts,
  getSingleProduct,
  getSellerSingleProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  searchProducts,
  getRelatedProducts,
  getFeaturedProducts,
  bulkUploadProducts,
  toggleFeaturedStatus,
  getSellerProductsForFeaturing,
};

