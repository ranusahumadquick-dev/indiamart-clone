/**
 * Category Controller
 * Handles all category-related operations for the B2B marketplace
 */

const Category = require('../models/Category');
const Product = require('../models/Product');
const { ApiError } = require('../middleware/apiErrorHandler');
const { wrapAsync } = require('../middleware/apiErrorHandler');

/**
 * Get all categories with hierarchy
 * @route GET /api/categories
 * @access Public
 */
const getAllCategories = wrapAsync(async (req, res, next) => {
  const { depth = 2, parentId } = req.query;

  let query = {};
  
  // Filter by parent if specified
  if (parentId) {
    query.parent = parentId;
  } else {
    // Get root categories (no parent)
    query.parent = null;
  }

  const categories = await Category.find(query)
    .populate({
      path: 'children',
      populate: {
        path: 'children',
        populate: {
          path: 'children',
          options: { limit: depth > 0 ? 1 : 0 }
        }
      }
    })
    .populate('products', 'name price images')
    .sort({ name: 1 });

  res.json({
    success: true,
    data: categories
  });
});

/**
 * Get single category by ID
 * @route GET /api/categories/:id
 * @access Public
 */
const getCategoryById = wrapAsync(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findById(id)
    .populate({
      path: 'parent',
      select: 'name icon'
    })
    .populate({
      path: 'children',
      select: 'name icon slug'
    })
    .populate({
      path: 'products',
      select: 'name price images status',
      match: { status: 'active' }
    });

  if (!category) {
    return next(new ApiError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
  }

  res.json({
    success: true,
    data: category
  });
});

/**
 * Create new category
 * @route POST /api/categories
 * @access Private (Admin)
 */
const createCategory = wrapAsync(async (req, res, next) => {
  const {
    name,
    description,
    icon,
    parent,
    slug,
    image,
    metaTitle,
    metaDescription,
    isActive = true
  } = req.body;

  // Check if category already exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return next(new ApiError('Category already exists', 400, 'CATEGORY_ALREADY_EXISTS'));
  }

  // Validate parent category if specified
  if (parent) {
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      return next(new ApiError('Parent category not found', 404, 'PARENT_CATEGORY_NOT_FOUND'));
    }

    // Prevent circular references
    if (parent === req.body.parent || parentCategory.parent === parent) {
      return next(new ApiError('Circular reference detected', 400, 'CIRCULAR_REFERENCE'));
    }
  }

  const category = new Category({
    name,
    description,
    icon,
    parent,
    slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
    image,
    metaTitle,
    metaDescription,
    isActive
  });

  await category.save();

  // If parent exists, update its children array
  if (parent) {
    await Category.findByIdAndUpdate(parent, {
      $push: { children: category._id }
    });
  }

  res.status(201).json({
    success: true,
    data: category
  });
});

/**
 * Update category
 * @route PUT /api/categories/:id
 * @access Private (Admin)
 */
const updateCategory = wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  const category = await Category.findById(id);
  if (!category) {
    return next(new ApiError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
  }

  // Prevent changing name to existing one
  if (updates.name && updates.name !== category.name) {
    const existingCategory = await Category.findOne({ name: updates.name, _id: { $ne: id } });
    if (existingCategory) {
      return next(new ApiError('Category name already exists', 400, 'CATEGORY_NAME_EXISTS'));
    }
  }

  // Prevent circular references
  if (updates.parent && updates.parent !== id.toString()) {
    // Check if parent is descendant of current category
    const isDescendant = await isCategoryDescendant(updates.parent, id);
    if (isDescendant) {
      return next(new ApiError('Circular reference detected', 400, 'CIRCULAR_REFERENCE'));
    }
  }

  // Handle parent change
  if (updates.parent && updates.parent !== category.parent?.toString()) {
    // Remove from old parent
    if (category.parent) {
      await Category.findByIdAndUpdate(category.parent, {
        $pull: { children: id }
      });
    }

    // Add to new parent
    if (updates.parent) {
      await Category.findByIdAndUpdate(updates.parent, {
        $push: { children: id }
      });
    }
  }

  Object.assign(category, updates);
  await category.save();

  res.json({
    success: true,
    data: category
  });
});

/**
 * Delete category
 * @route DELETE /api/categories/:id
 * @access Private (Admin)
 */
const deleteCategory = wrapAsync(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    return next(new ApiError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
  }

  // Check if category has products
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    return next(new ApiError('Cannot delete category with products', 400, 'CATEGORY_HAS_PRODUCTS'));
  }

  // Check if category has subcategories
  const childCount = await Category.countDocuments({ parent: id });
  if (childCount > 0) {
    return next(new ApiError('Cannot delete category with subcategories', 400, 'CATEGORY_HAS_SUBCATEGORIES'));
  }

  // Remove from parent's children array
  if (category.parent) {
    await Category.findByIdAndUpdate(category.parent, {
      $pull: { children: id }
    });
  }

  await Category.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

/**
 * Get category tree (full hierarchy)
 * @route GET /api/categories/tree
 * @access Public
 */
const getCategoryTree = wrapAsync(async (req, res, next) => {
  const categories = await Category.find({ parent: null })
    .populate({
      path: 'children',
      populate: {
        path: 'children',
        populate: {
          path: 'children',
          populate: {
            path: 'children',
            populate: {
              path: 'children',
              populate: {
                path: 'children'
              }
            }
          }
        }
      }
    })
    .select('name icon slug description image isActive')
    .sort({ name: 1 });

  res.json({
    success: true,
    data: categories
  });
});

/**
 * Get categories by parent
 * @route GET /api/categories/parent/:parentId
 * @access Public
 */
const getCategoriesByParent = wrapAsync(async (req, res, next) => {
  const { parentId } = req.params;

  const categories = await Category.find({ parent: parentId })
    .populate('products', 'name price images status')
    .sort({ name: 1 });

  res.json({
    success: true,
    data: categories
  });
});

/**
 * Get category statistics
 * @route GET /api/categories/stats
 * @access Private (Admin)
 */
const getCategoryStats = wrapAsync(async (req, res, next) => {
  const stats = await Category.aggregate([
    {
      $group: {
        _id: null,
        totalCategories: { $sum: 1 },
        activeCategories: { $sum: { $cond: ['$isActive', 1, 0] } },
        categoriesWithProducts: {
          $sum: {
            $cond: {
              if: { $gt: ['$products', 0] },
              then: 1,
              then: 0
            }
          }
        }
      }
    }
  ]);

  const categoryHierarchy = await Category.aggregate([
    {
      $group: {
        _id: '$parent',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      total: stats[0]?.totalCategories || 0,
      active: stats[0]?.activeCategories || 0,
      withProducts: stats[0]?.categoriesWithProducts || 0,
      hierarchy: categoryHierarchy
    }
  });
});

/**
 * Search categories
 * @route GET /api/categories/search
 * @access Public
 */
const searchCategories = wrapAsync(async (req, res, next) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    return next(new ApiError('Search query is required', 400, 'SEARCH_QUERY_REQUIRED'));
  }

  const categories = await Category.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { slug: { $regex: q, $options: 'i' } }
    ]
  })
    .select('name description icon slug')
    .limit(Number(limit));

  res.json({
    success: true,
    data: categories
  });
});

// Helper function to check if category is descendant
async function isCategoryDescendant(parentId, categoryId) {
  const category = await Category.findById(categoryId);
  if (!category || !category.parent) return false;

  if (category.parent.toString() === parentId) return true;

  return isCategoryDescendant(parentId, category.parent.toString());
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
  getCategoriesByParent,
  getCategoryStats,
  searchCategories
};