import Category from "../models/Category.js";
import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// =============================================
// 📂 CREATE CATEGORY — Admin only
// =============================================
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parentCategory, sortOrder, icon } = req.body;

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  // Check if category already exists
  const existingCategory = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });

  if (existingCategory) {
    throw new ApiError(409, "Category with this name already exists");
  }

  const category = await Category.create({
    name,
    description,
    parentCategory: parentCategory || null,
    sortOrder: sortOrder || 0,
    icon: icon || "",
    image: req.file?.path || "",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

// =============================================
// 📋 GET ALL CATEGORIES — Public (flat list)
// =============================================
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .populate("subcategories");

  return res
    .status(200)
    .json(
      new ApiResponse(200, categories, "Categories fetched successfully")
    );
});

// =============================================
// 🌳 GET CATEGORY TREE — Public (hierarchical)
// =============================================
const getCategoryTree = asyncHandler(async (req, res) => {
  // Fetch all active categories
  const allCategories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  // Build a map for quick lookup
  const catMap = new Map();
  allCategories.forEach((cat) => {
    cat.subcategories = [];
    catMap.set(cat._id.toString(), cat);
  });

  // Build tree: attach children to parents
  const rootCategories = [];
  allCategories.forEach((cat) => {
    if (cat.parentCategory) {
      const parent = catMap.get(cat.parentCategory.toString());
      if (parent) {
        parent.subcategories.push(cat);
      } else {
        rootCategories.push(cat); // orphan → treat as root
      }
    } else {
      rootCategories.push(cat);
    }
  });

  // Count products per category
  const productCounts = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(productCounts.map((p) => [p._id.toString(), p.count]));

  // Attach product counts
  const attachCount = (cats) =>
    cats.map((cat) => ({
      ...cat,
      productCount: countMap.get(cat._id.toString()) || 0,
      subcategories: cat.subcategories ? attachCount(cat.subcategories) : [],
    }));

  const tree = attachCount(rootCategories);

  return res
    .status(200)
    .json(new ApiResponse(200, tree, "Category tree fetched successfully"));
});

// =============================================
// 📂 GET SINGLE CATEGORY — Public (by slug)
// =============================================
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const category = await Category.findOne({ slug, isActive: true }).populate(
    "subcategories"
  );

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // If this is a parent category, also count products in subcategories
  let totalProducts = 0;
  const subCategoryIds = category.subcategories.map((sub) => sub._id);
  const categoryIds = [category._id, ...subCategoryIds];

  totalProducts = await Product.countDocuments({
    category: { $in: categoryIds },
    isActive: true,
  });

  // Get parent info if this is a subcategory
  let parentCategory = null;
  if (category.parentCategory) {
    parentCategory = await Category.findById(category.parentCategory).lean();
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...category.toObject(),
        totalProducts,
        parentCategory,
      },
      "Category fetched successfully"
    )
  );
});

// =============================================
// ✏️ UPDATE CATEGORY — Admin only
// =============================================
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, sortOrder, isActive } = req.body;

  const category = await Category.findByIdAndUpdate(
    id,
    {
      name: name || undefined,
      description: description || undefined,
      sortOrder: sortOrder !== undefined ? sortOrder : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
      image: req.file?.path || undefined,
    },
    { returnDocument: 'after', runValidators: true }
  );

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category updated successfully"));
});

// =============================================
// 🗑️ DELETE CATEGORY — Admin only (soft delete)
// =============================================
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findByIdAndUpdate(
    id,
    { isActive: false },
    { returnDocument: 'after' }
  );

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Category deleted successfully"));
});

export {
  createCategory,
  getAllCategories,
  getCategoryTree,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
};

