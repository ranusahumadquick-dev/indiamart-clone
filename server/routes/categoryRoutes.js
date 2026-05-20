/**
 * Category Routes
 * Defines all category-related endpoints
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, verifyAdmin } = require('../middleware/authMiddleware');

/**
 * @description  Get all categories with hierarchy
 * @route        GET /api/categories
 * @access       Public
 */
router.get('/', categoryController.getAllCategories);

/**
 * @description  Get category tree (full hierarchy)
 * @route        GET /api/categories/tree
 * @access       Public
 */
router.get('/tree', categoryController.getCategoryTree);

/**
 * @description  Get single category by ID
 * @route        GET /api/categories/:id
 * @access       Public
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @description  Get categories by parent
 * @route        GET /api/categories/parent/:parentId
 * @access       Public
 */
router.get('/parent/:parentId', categoryController.getCategoriesByParent);

/**
 * @description  Search categories
 * @route        GET /api/categories/search
 * @access       Public
 */
router.get('/search', categoryController.searchCategories);

/**
 * @description  Get category statistics
 * @route        GET /api/categories/stats
 * @access       Private (Admin)
 */
router.get('/stats', protect, verifyAdmin, categoryController.getCategoryStats);

/**
 * @description  Create new category
 * @route        POST /api/categories
 * @access       Private (Admin)
 */
router.post('/', protect, verifyAdmin, categoryController.createCategory);

/**
 * @description  Update category
 * @route        PUT /api/categories/:id
 * @access       Private (Admin)
 */
router.put('/:id', protect, verifyAdmin, categoryController.updateCategory);

/**
 * @description  Delete category
 * @route        DELETE /api/categories/:id
 * @access       Private (Admin)
 */
router.delete('/:id', protect, verifyAdmin, categoryController.deleteCategory);

module.exports = router;