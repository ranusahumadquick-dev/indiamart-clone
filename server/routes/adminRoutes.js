/**
 * Admin Routes
 * Defines all administrative endpoints
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');
const { verifySuperAdmin, handleBulkAction, getAdminStats } = require('../middleware/adminMiddleware');
const { wrapAsync, formatApiResponse } = require('../middleware/apiErrorHandler');

/**
 * @description  Get admin dashboard statistics
 * @route        GET /api/admin/dashboard
 * @access       Private/Admin
 */
router.get('/dashboard', protect, verifyAdmin, getAdminStats, adminController.getDashboard);

/**
 * @description  Get all users with filtering and pagination
 * @route        GET /api/admin/users
 * @access       Private/Admin
 */
router.get('/users', protect, verifyAdmin, adminController.getAllUsers);

/**
 * @description  Get user details by ID
 * @route        GET /api/admin/users/:id
 * @access       Private/Admin
 */
router.get('/users/:id', protect, verifyAdmin, adminController.getUserById);

/**
 * @description  Update user (admin only)
 * @route        PUT /api/admin/users/:id
 * @access       Private/Admin
 */
router.put('/users/:id', protect, verifyAdmin, adminController.updateUser);

/**
 * @description  Delete user (admin only)
 * @route        DELETE /api/admin/users/:id
 * @access       Private/Admin
 */
router.delete('/users/:id', protect, verifyAdmin, adminController.deleteUser);

/**
 * @description  Bulk user operations (admin only)
 * @route        POST /api/admin/users/bulk
 * @access       Private/Admin
 */
router.post('/users/bulk', protect, verifyAdmin, handleBulkAction, adminController.bulkUserOperation);

/**
 * @description  Get all products with admin filters
 * @route        GET /api/admin/products
 * @access       Private/Admin
 */
router.get('/products', protect, verifyAdmin, adminController.getAllProducts);

/**
 * @description  Approve or reject product
 * @route        PUT /api/admin/products/:id/status
 * @access       Private/Admin
 */
router.put('/products/:id/status', protect, verifyAdmin, adminController.updateProductStatus);

/**
 * @description  Get all categories
 * @route        GET /api/admin/categories
 * @access       Private/Admin
 */
router.get('/categories', protect, verifyAdmin, adminController.getAllCategories);

/**
 * @description  Create new category
 * @route        POST /api/admin/categories
 * @access       Private/Admin
 */
router.post('/categories', protect, verifyAdmin, adminController.createCategory);

/**
 * @description  Update category
 * @route        PUT /api/admin/categories/:id
 * @access       Private/Admin
 */
router.put('/categories/:id', protect, verifyAdmin, adminController.updateCategory);

/**
 * @description  Delete category
 * @route        DELETE /api/admin/categories/:id
 * @access       Private/Admin
 */
router.delete('/categories/:id', protect, verifyAdmin, adminController.deleteCategory);

/**
 * @description  Get all enquiries
 * @route        GET /api/admin/enquiries
 * @access       Private/Admin
 */
router.get('/enquiries', protect, verifyAdmin, adminController.getAllEnquiries);

/**
 * @description  Update enquiry status
 * @route        PUT /api/admin/enquiries/:id/status
 * @access       Private/Admin
 */
router.put('/enquiries/:id/status', protect, verifyAdmin, adminController.updateEnquiryStatus);

/**
 * @description  Get all reviews
 * @route        GET /api/admin/reviews
 * @access       Private/Admin
 */
router.get('/reviews', protect, verifyAdmin, adminController.getAllReviews);

/**
 * @description  Approve or reject review
 * @route        PUT /api/admin/reviews/:id/status
 * @access       Private/Admin
 */
router.put('/reviews/:id/status', protect, verifyAdmin, adminController.updateReviewStatus);

/**
 * @description  Get admin activity log
 * @route        GET /api/admin/activity-log
 * @access       Private/SuperAdmin
 */
router.get('/activity-log', protect, verifySuperAdmin, adminController.getActivityLog);

/**
 * @description  Get admin statistics (re-export from auth middleware)
 * @route        GET /api/admin/stats
 * @access       Private/Admin
 */
router.get('/stats', protect, verifyAdmin, getAdminStats, (req, res) => {
  formatApiResponse(res, req.adminStats, 200, {
    message: 'Admin statistics retrieved successfully'
  });
});

module.exports = router;