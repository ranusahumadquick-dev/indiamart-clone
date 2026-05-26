import Product from "../models/Product.js";
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
    allowSamples,
    samplePrice,
    sampleMinQty,
    sampleMaxQty,
    sampleLeadTime,
  } = req.body;

  // 1. Validate required fields
  if (!name || !description || !price || !category) {
    console.error("❌ [createProduct] Missing required fields");
    throw new ApiError(
      400,
      "Name, description, price, and category are required"
    );
  }
  console.log("✅ [createProduct] All required fields present");

  // 2. Parse images from multer upload using image handler
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

  console.log("📤 [createProduct] Processing images...");
  console.log("   Files received:", req.files?.length || 0);

  // Validate uploaded files
  if (req.files && req.files.length > 0) {
    console.log("🔍 [createProduct] Validating", req.files.length, "files");
    for (const file of req.files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        console.error("❌ [createProduct] File validation failed:", validation.error);
        throw new ApiError(400, validation.error);
      }
      console.log("✅ [createProduct] File valid:", file.originalname);
    }
  } else {
    console.log("⚠️ [createProduct] No images uploaded (optional)");
  }

  const images = processUploadedImages(req.files, backendUrl);
  console.log("✅ [createProduct] Images processed:", images.length, "images");
  if (images.length > 0) {
    console.log("   First image URL:", images[0].url);
  }

  // 3. Create product
  console.log("💾 [createProduct] Saving product to database...");
  const product = await Product.create({
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
    companyName: req.user.companyName,
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
  });

  console.log("🎉 [createProduct] Product created successfully!");
  console.log("   Product ID:", product._id);
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

  if (category) filters.category = category;
  if (subCategory) filters.subCategory = subCategory;
  if (isFeatured === "true") filters.isFeatured = true;
  if (minRating) filters.averageRating = { $gte: Number(minRating) };
  if (city) filters.city = { $regex: city, $options: "i" };
  if (state) filters.state = { $regex: state, $options: "i" };
  if (isVerified === "true") filters.isVerified = true;
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

  const [products, totalProducts] = await Promise.all([
    Product.find(filters)
      .populate("category", "name slug")
      .populate("seller", "name companyName avgResponseTime")
      .sort(sortOptions)
      .skip(skip)
      .limit(pageLimit),
    Product.countDocuments(filters),
  ]);

  const pagination = getPaginationMeta(totalProducts, currentPage, pageLimit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
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

  const product = await Product.findOne({
    _id: id,
    isActive: true,
  })
    .populate("category", "name slug")
    .populate("subCategory", "name slug")
    .populate("seller", "name companyName city state isVerified avatar avgResponseTime");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Increment view count
  await Product.findByIdAndUpdate(id, { $inc: { views: 1 } });

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
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

  // Handle new images if uploaded
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
    updatedData.images = newImages;
    logImageOperation("product_image_update", {
      productId: id,
      imageCount: newImages.length,
    });
  }

  const existingProduct = await Product.findOne({ _id: id, seller: req.user._id });
  const oldPrice = existingProduct?.price;

  const updatedProduct = await Product.findByIdAndUpdate(id, updatedData, {
    returnDocument: 'after',
    runValidators: true,
  });

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
// 🗑️ DELETE PRODUCT — Seller deletes own product
// =============================================
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findOne({ _id: id, seller: req.user._id });

  if (!product) {
    throw new ApiError(404, "Product not found or you don't have permission");
  }

  // Soft delete — mark as inactive
  product.isActive = false;
  await product.save();

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
  const { q, category, minPrice, maxPrice, city, minRating, sortBy, page = 1, limit = 20 } = req.query;

  const filters = { isActive: true, status: "approved" };

  // Full-text search
  if (q) {
    filters.$text = { $search: q };
  }

  if (category) filters.category = category;
  if (city) filters.city = { $regex: city, $options: "i" };
  if (minRating) filters.averageRating = { $gte: Number(minRating) };

  if (minPrice || maxPrice) {
    filters.price = {};
    if (minPrice) filters.price.$gte = Number(minPrice);
    if (maxPrice) filters.price.$lte = Number(maxPrice);
  }

  // Sort by relevance if search query, else newest
  let sortOptions = {};
  if (q) {
    sortOptions = { score: { $meta: "textScore" } };
  } else {
    sortOptions = { createdAt: -1 };
  }

  if (sortBy === "price_low") sortOptions = { price: 1 };
  if (sortBy === "price_high") sortOptions = { price: -1 };
  if (sortBy === "newest") sortOptions = { createdAt: -1 };
  if (sortBy === "rating") sortOptions = { averageRating: -1 };

  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  const [products, totalProducts] = await Promise.all([
    Product.find(filters, q ? { score: { $meta: "textScore" } } : {})
      .populate("category", "name slug")
      .populate("seller", "name companyName")
      .sort(sortOptions)
      .skip(skip)
      .limit(pageLimit),
    Product.countDocuments(filters),
  ]);

  const pagination = getPaginationMeta(totalProducts, currentPage, pageLimit);

  return res.status(200).json(
    new ApiResponse(200, { products, pagination }, "Search results fetched")
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
    status: "approved",
    isActive: true,
    $or: [
      { featuredUntil: { $gte: now } }, // Featured until future date
      { featuredUntil: null }, // No expiry set
    ],
  })
    .populate("seller", "name companyName city state isVerified avatar")
    .limit(8)
    .sort({ updatedAt: -1 });

  return res.status(200).json(new ApiResponse(200, products, "Featured products fetched"));
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

