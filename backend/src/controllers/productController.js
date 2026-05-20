import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";

// =============================================
// 📦 CREATE PRODUCT — Seller creates a product
// =============================================
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
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
  } = req.body;

  // 1. Validate required fields
  if (!name || !description || !price || !category) {
    throw new ApiError(
      400,
      "Name, description, price, and category are required"
    );
  }

  // 2. Parse images from multer upload
  const images = req.files?.map((file) => ({
    url: file.path,
    publicId: file.filename,
  })) || [];

  // 3. Create product
  const product = await Product.create({
    name,
    description,
    price,
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
  });

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
      .populate("seller", "name companyName")
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
    .populate("seller", "name companyName city state isVerified avatar");

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

  const updatedProduct = await Product.findByIdAndUpdate(id, updatedData, {
    new: true,
    runValidators: true,
  });

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
  const products = await Product.find({ isFeatured: true, status: "approved", isActive: true })
    .populate("seller", "name companyName city state isVerified avatar")
    .limit(8)
    .sort({ updatedAt: -1 });

  return res.status(200).json(new ApiResponse(200, products, "Featured products fetched"));
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
};
