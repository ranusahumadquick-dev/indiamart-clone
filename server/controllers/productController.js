/**
 * Product Controller
 * Handles all product-related operations for the B2B marketplace
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const { ApiError } = require('../middleware/apiErrorHandler');
const { wrapAsync } = require('../middleware/apiErrorHandler');

/**
 * Get all products with filtering, sorting and pagination
 * @route GET /api/products
 * @access Public
 */
const getAllProducts = wrapAsync(async (req, res, next) => {
  // Query parameters
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    category,
    minPrice,
    maxPrice,
    status = 'active'
  } = req.query;

  // Build query
  let query = {};
  
  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { keywords: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Category filter
  if (category) {
    query.category = category;
  }
  
  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  
  // Status filter
  query.status = status;

  // Sorting
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Pagination
  const skip = (page - 1) * limit;

  try {
    const products = await Product.find(query)
      .populate('seller', 'name businessName email phone')
      .populate('category', 'name description')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get single product by ID
 * @route GET /api/products/:id
 * @access Public
 */
const getProductById = wrapAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id)
    .populate('seller', 'name businessName email phone')
    .populate('category', 'name description');

  if (!product) {
    return next(new ApiError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Increment view count
  product.views += 1;
  await product.save();

  res.json({
    success: true,
    data: product
  });
});

/**
 * Create new product
 * @route POST /api/products
 * @access Private (Seller)
 */
const createProduct = wrapAsync(async (req, res, next) => {
  const {
    name,
    description,
    price,
    category,
    quantity,
    unit,
    specifications,
    images,
    keywords
  } = req.body;

  // Verify category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return next(new ApiError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
  }

  const product = new Product({
    name,
    description,
    price,
    category,
    quantity,
    unit,
    specifications,
    images,
    keywords,
    seller: req.user.id
  });

  await product.save();

  res.status(201).json({
    success: true,
    data: product
  });
});

/**
 * Update product
 * @route PUT /api/products/:id
 * @access Private (Seller/Admin)
 */
const updateProduct = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  const product = await Product.findById(id);

  if (!product) {
    return next(new ApiError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Check ownership
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ApiError('Not authorized to update this product', 403, 'UNAUTHORIZED'));
  }

  Object.assign(product, updates);
  await product.save();

  res.json({
    success: true,
    data: product
  });
});

/**
 * Delete product
 * @route DELETE /api/products/:id
 * @access Private (Seller/Admin)
 */
const deleteProduct = wrapAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    return next(new ApiError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Check ownership
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ApiError('Not authorized to delete this product', 403, 'UNAUTHORIZED'));
  }

  await Product.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

/**
 * Get products by seller
 * @route GET /api/products/seller/:sellerId
 * @access Private (Seller/Admin)
 */
const getSellerProducts = wrapAsync(async (req, res, next) => {
  const { sellerId } = req.params;

  const products = await Product.find({ seller: sellerId })
    .populate('category', 'name description')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: products
  });
});

/**
 * Get featured products
 * @route GET /api/products/featured
 * @access Public
 */
const getFeaturedProducts = wrapAsync(async (req, res, next) => {
  const products = await Product.find({ 
    isFeatured: true,
    status: 'active'
  })
    .populate('seller', 'name businessName')
    .populate('category', 'name')
    .limit(12);

  res.json({
    success: true,
    data: products
  });
});

/**
 * Get related products
 * @route GET /api/products/:id/related
 * @access Public
 */
const getRelatedProducts = wrapAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    return next(new ApiError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  const relatedProducts = await Product.find({
    _id: { $ne: id },
    category: product.category,
    status: 'active'
  })
    .populate('seller', 'name businessName')
    .populate('category', 'name')
    .limit(8);

  res.json({
    success: true,
    data: relatedProducts
  });
});

/**
 * Update product status
 * @route PATCH /api/products/:id/status
 * @access Private (Admin)
 */
const updateProductStatus = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const product = await Product.findById(id);
  if (!product) {
    return next(new ApiError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  product.status = status;
  await product.save();

  res.json({
    success: true,
    data: product
  });
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  getFeaturedProducts,
  getRelatedProducts,
  updateProductStatus
};