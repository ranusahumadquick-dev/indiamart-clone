/**
 * Product Routes
 * Defines all product-related endpoints
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, verifySeller, verifyAdmin } = require('../middleware/authMiddleware');

/**
 * @description  Get all products with filtering, sorting and pagination
 * @route        GET /api/products
 * @access       Public
 */
router.get('/', productController.getAllProducts);

/**
 * @description  Get single product by ID
 * @route        GET /api/products/:id
 * @access       Public
 */
router.get('/:id', productController.getProductById);

/**
 * @description  Get featured products
 * @route        GET /api/products/featured
 * @access       Public
 */
router.get('/featured', productController.getFeaturedProducts);

/**
 * @description  Get related products
 * @route        GET /api/products/:id/related
 * @access       Public
 */
router.get('/:id/related', productController.getRelatedProducts);

/**
 * @description  Create new product
 * @route        POST /api/products
 * @access       Private (Seller)
 */
router.post('/', protect, verifySeller, productController.createProduct);

/**
 * @description  Update product
 * @route        PUT /api/products/:id
 * @access       Private (Seller/Admin)
 */
router.put('/:id', protect, productController.updateProduct);

/**
 * @description  Delete product
 * @route        DELETE /api/products/:id
 * @access       Private (Seller/Admin)
 */
router.delete('/:id', protect, productController.deleteProduct);

/**
 * @description  Get products by seller
 * @route        GET /api/products/seller/:sellerId
 * @access       Private (Seller/Admin)
 */
router.get('/seller/:sellerId', protect, productController.getSellerProducts);

/**
 * @description  Update product status
 * @route        PATCH /api/products/:id/status
 * @access       Private (Admin)
 */
router.patch('/:id/status', protect, verifyAdmin, productController.updateProductStatus);

module.exports = router;