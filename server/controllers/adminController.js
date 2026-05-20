/**
 * Admin Controller
 * Handles all administrative operations for the B2B marketplace
 */

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Enquiry = require('../models/Enquiry');
const Review = require('../models/Review');
const Subscription = require('../models/Subscription');
const { ApiError, handleValidationError, handleNotFoundError, handleConflictError } = require('../middleware/apiErrorHandler');
const { wrapAsync, formatApiResponse } = require('../middleware/apiErrorHandler');
const { verifyAdmin, verifySuperAdmin, getAdminStats, logAdminAction, handleBulkAction } = require('../middleware/adminMiddleware');

/**
 * Get admin dashboard statistics
 * @route GET /api/admin/dashboard
 * @access Private/Admin
 */
const getDashboard = wrapAsync(async (req, res, next) => {
  try {
    // Get admin statistics from middleware
    await getAdminStats(req, res, next);
    
    // Format and send response
    formatApiResponse(res, req.adminStats, 200, {
      message: 'Dashboard statistics retrieved successfully'
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get all users with filtering and pagination
 * @route GET /api/admin/users
 * @access Private/Admin
 */
const getAllUsers = wrapAsync(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const status = req.query.status;
    const search = req.query.search;
    
    const query = {};
    
    // Apply filters
    if (role) query.role = role;
    if (status) query.isBanned = status === 'banned';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    // Get paginated users
    const users = await User.find(query)
      .select('-password -resetPasswordToken -emailVerificationToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };
    
    formatApiResponse(res, { users, pagination }, 200, {
      message: 'Users retrieved successfully',
      pagination
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get user details by ID
 * @route GET /api/admin/users/:id
 * @access Private/Admin
 */
const getUserById = wrapAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -emailVerificationToken')
      .populate('subscriptionPlan', 'name price features');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: {
          type: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    formatApiResponse(res, { user }, 200, {
      message: 'User retrieved successfully'
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Update user (admin only)
 * @route PUT /api/admin/users/:id
 * @access Private/Admin
 */
const updateUser = wrapAsync(async (req, res, next) => {
  try {
    const allowedUpdates = [
      'name', 'email', 'role', 'isVerified', 'isBanned',
      'isPremium', 'businessName', 'businessAddress', 'phone',
      'bio', 'website', 'socialLinks', 'gstNumber', 'panNumber'
    ];
    
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    
    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid updates',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Invalid field updates'
        }
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: {
          type: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    formatApiResponse(res, { user }, 200, {
      message: 'User updated successfully',
      action: 'update_user',
      adminId: req.user._id,
      userId: user._id
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Delete user (admin only)
 * @route DELETE /api/admin/users/:id
 * @access Private/Admin
 */
const deleteUser = wrapAsync(async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: {
          type: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Delete user's products, reviews, etc.
    await Product.deleteMany({ seller: req.params.id });
    await Review.deleteMany({ seller: req.params.id });
    await Enquiry.deleteMany({ seller: req.params.id });
    await Subscription.deleteMany({ user: req.params.id });
    
    formatApiResponse(res, {}, 200, {
      message: 'User deleted successfully',
      action: 'delete_user',
      adminId: req.user._id,
      userId: user._id
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Bulk user operations (admin only)
 * @route POST /api/admin/users/bulk
 * @access Private/Admin
 */
const bulkUserOperation = wrapAsync(async (req, res, next) => {
  try {
    // Validate bulk action
    const { ids, action } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid user IDs',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Invalid user IDs'
        }
      });
    }
    
    const allowedActions = [
      'ban', 'unban', 'verify', 'unverify', 'delete'
    ];
    
    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Invalid action'
        }
      });
    }
    
    let result;
    switch (action) {
      case 'ban':
        result = await User.updateMany(
          { _id: { $in: ids } },
          { isBanned: true }
        );
        break;
      case 'unban':
        result = await User.updateMany(
          { _id: { $in: ids } },
          { isBanned: false }
        );
        break;
      case 'verify':
        result = await User.updateMany(
          { _id: { $in: ids } },
          { isVerified: true }
        );
        break;
      case 'unverify':
        result = await User.updateMany(
          { _id: { $in: ids } },
          { isVerified: false }
        );
        break;
      case 'delete':
        await Product.deleteMany({ seller: { $in: ids } });
        await Review.deleteMany({ seller: { $in: ids } });
        await Enquiry.deleteMany({ seller: { $in: ids } });
        await Subscription.deleteMany({ user: { $in: ids } });
        result = await User.deleteMany({ _id: { $in: ids } });
        break;
    }
    
    formatApiResponse(res, {
      modifiedCount: result.modifiedCount || result.deletedCount,
      action
    }, 200, {
      message: `${action} operation completed successfully`,
      action,
      adminId: req.user._id,
      affectedCount: ids.length
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get all products with admin filters
 * @route GET /api/admin/products
 * @access Private/Admin
 */
const getAllProducts = wrapAsync(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const seller = req.query.seller;
    const category = req.query.category;
    const search = req.query.search;
    
    const query = {};
    
    // Apply filters
    if (status) query.status = status;
    if (seller) query.seller = seller;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await Product.countDocuments(query);
    
    // Get products with seller info
    const products = await Product.find(query)
      .populate('seller', 'name businessName email')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };
    
    formatApiResponse(res, { products, pagination }, 200, {
      message: 'Products retrieved successfully',
      pagination
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Approve or reject product
 * @route PUT /api/admin/products/:id/status
 * @access Private/Admin
 */
const updateProductStatus = wrapAsync(async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const { id } = req.params;
    
    const allowedStatuses = ['approved', 'rejected', 'pending'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Invalid status'
        }
      });
    }
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: {
          type: 'NOT_FOUND',
          message: 'Product not found'
        }
      });
    }
    
    // Update product status
    product.status = status;
    if (status === 'rejected' && rejectionReason) {
      product.rejectionReason = rejectionReason;
    }
    product.updatedAt = new Date();
    
    await product.save();
    
    // Send notification to seller
    // TODO: Implement notification system
    
    formatApiResponse(res, { product }, 200, {
      message: `Product ${status} successfully`,
      action: `product_${status}`,
      adminId: req.user._id,
      productId: product._id
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get all categories
 * @route GET /api/admin/categories
 * @access Private/Admin
 */
const getAllCategories = wrapAsync(async (req, res, next) => {
  try {
    const categories = await Category.find()
      .populate('parent', 'name')
      .sort({ name: 1 });
    
    formatApiResponse(res, { categories }, 200, {
      message: 'Categories retrieved successfully'
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Create new category
 * @route POST /api/admin/categories
 * @access Private/Admin
 */
const createCategory = wrapAsync(async (req, res, next) => {
  try {
    const { name, description, parent, image } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Category name is required'
        }
      });
    }
    
    const category = new Category({
      name,
      description,
      parent: parent || null,
      image
    });
    
    await category.save();
    
    formatApiResponse(res, { category }, 201, {
      message: 'Category created successfully',
      action: 'create_category',
      adminId: req.user._id
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Update category
 * @route PUT /api/admin/categories/:id
 * @access Private/Admin
 */
const updateCategory = wrapAsync(async (req, res, next) => {
  try {
    const { name, description, parent, image } = req.body;
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, parent, image, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: {
          type: 'NOT_FOUND',
          message: 'Category not found'
        }
      });
    }
    
    formatApiResponse(res, { category }, 200, {
      message: 'Category updated successfully',
      action: 'update_category',
      adminId: req.user._id
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Delete category
 * @route DELETE /api/admin/categories/:id
 * @access Private/Admin
 */
const deleteCategory = wrapAsync(async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: {
          type: 'NOT_FOUND',
          message: 'Category not found'
        }
      });
    }
    
    // Check if category has products
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with products',
        error: {
          type: 'CONFLICT_ERROR',
          message: 'Category contains products'
        }
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    formatApiResponse(res, {}, 200, {
      message: 'Category deleted successfully',
      action: 'delete_category',
      adminId: req.user._id
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get all enquiries
 * @route GET /api/admin/enquiries
 * @access Private/Admin
 */
const getAllEnquiries = wrapAsync(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const buyer = req.query.buyer;
    const seller = req.query.seller;
    const search = req.query.search;
    
    const query = {};
    
    // Apply filters
    if (status) query.status = status;
    if (buyer) query.buyer = buyer;
    if (seller) query.seller = seller;
    if (search) {
      query.$or = [
        { message: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await Enquiry.countDocuments(query);
    
    // Get enquiries with buyer and seller info
    const enquiries = await Enquiry.find(query)
      .populate('buyer', 'name email')
      .populate('seller', 'name businessName email')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };
    
    formatApiResponse(res, { enquiries, pagination }, 200, {
      message: 'Enquiries retrieved successfully',
      pagination
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Update enquiry status
 * @route PUT /api/admin/enquiries/:id/status
 * @access Private/Admin
 */
const updateEnquiryStatus = wrapAsync(async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const { id } = req.params;
    
    const allowedStatuses = ['new', 'in-progress', 'resolved', 'closed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Invalid status'
        }
      });
    }
    
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found',
        error: {
          type: 'NOT_FOUND',
          message: 'Enquiry not found'
        }
      });
    }
    
    // Update status
    enquiry.status = status;
    if (note) {
      enquiry.notes.push({
        message: note,
        addedBy: req.user._id,
        addedAt: new Date()
      });
    }
    enquiry.updatedAt = new Date();
    
    await enquiry.save();
    
    formatApiResponse(res, { enquiry }, 200, {
      message: `Enquiry status updated to ${status}`,
      action: `update_enquiry_status`,
      adminId: req.user._id
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get all reviews
 * @route GET /api/admin/reviews
 * @access Private/Admin
 */
const getAllReviews = wrapAsync(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const seller = req.query.seller;
    const buyer = req.query.buyer;
    const search = req.query.search;
    
    const query = {};
    
    // Apply filters
    if (status) query.status = status;
    if (seller) query.seller = seller;
    if (buyer) query.buyer = buyer;
    if (search) {
      query.$or = [
        { comment: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await Review.countDocuments(query);
    
    // Get reviews with buyer and seller info
    const reviews = await Review.find(query)
      .populate('buyer', 'name email')
      .populate('seller', 'name businessName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };
    
    formatApiResponse(res, { reviews, pagination }, 200, {
      message: 'Reviews retrieved successfully',
      pagination
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Approve or reject review
 * @route PUT /api/admin/reviews/:id/status
 * @access Private/Admin
 */
const updateReviewStatus = wrapAsync(async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const { id } = req.params;
    
    const allowedStatuses = ['approved', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Invalid status'
        }
      });
    }
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
        error: {
          type: 'NOT_FOUND',
          message: 'Review not found'
        }
      });
    }
    
    // Update review status
    review.status = status;
    if (reason) {
      review.reason = reason;
    }
    review.updatedAt = new Date();
    
    await review.save();
    
    formatApiResponse(res, { review }, 200, {
      message: `Review ${status} successfully`,
      action: `review_${status}`,
      adminId: req.user._id
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get admin activity log
 * @route GET /api/admin/activity-log
 * @access Private/Admin
 */
const getActivityLog = wrapAsync(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const adminId = req.query.adminId;
    const action = req.query.action;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    // TODO: Implement activity log collection in database
    // For now, return empty array
    const activities = [];
    const total = 0;
    
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };
    
    formatApiResponse(res, { activities, pagination }, 200, {
      message: 'Activity log retrieved successfully',
      pagination
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = {
  getDashboard,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  bulkUserOperation,
  getAllProducts,
  updateProductStatus,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllEnquiries,
  updateEnquiryStatus,
  getAllReviews,
  updateReviewStatus,
  getActivityLog
};