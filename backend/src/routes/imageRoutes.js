import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { getProductImageCached } from '../services/productImageService.js';
import Product from '../models/Product.js';

const router = express.Router();

/**
 * Get product image by ID and title
 * Fetches real product image from external API
 */
router.get('/products/:productId/image', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { title, category } = req.query;

  if (!productId || !title) {
    throw new ApiError(400, 'Product ID and title are required');
  }

  try {
    const imageUrl = await getProductImageCached(productId, title, category || 'products');

    return res.status(200).json(
      new ApiResponse(200, { imageUrl }, 'Product image fetched successfully')
    );
  } catch (error) {
    console.error('Error fetching product image:', error);
    throw new ApiError(500, 'Failed to fetch product image');
  }
}));

/**
 * Bulk fetch images for multiple products
 * Used when loading product grid
 */
router.post('/products/images/batch', asyncHandler(async (req, res) => {
  const { products } = req.body;

  if (!products || !Array.isArray(products)) {
    throw new ApiError(400, 'Products array is required');
  }

  try {
    const imageUrls = await Promise.all(
      products.map(p =>
        getProductImageCached(p._id || p.id, p.title, p.category)
      )
    );

    const result = products.map((p, index) => ({
      productId: p._id || p.id,
      imageUrl: imageUrls[index]
    }));

    return res.status(200).json(
      new ApiResponse(200, { images: result }, 'Product images fetched')
    );
  } catch (error) {
    console.error('Error fetching batch images:', error);
    throw new ApiError(500, 'Failed to fetch batch images');
  }
}));

export default router;
