import express from "express";
import {
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
} from "../controllers/productController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { uploadProductImages } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// =============================================
// 🔓 PUBLIC ROUTES
// =============================================
router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/related/:productId", getRelatedProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:id", getSingleProduct);

// =============================================
// 🔒 SELLER ROUTES — Auth + Seller role required
// =============================================
router.post(
  "/",
  authMiddleware,
  roleMiddleware("seller"),
  uploadProductImages,
  createProduct
);
router.get(
  "/seller/my",
  authMiddleware,
  roleMiddleware("seller"),
  getSellerProducts
);
// Backwards-compatible alias used by frontend
router.get(
  "/seller/mine",
  authMiddleware,
  roleMiddleware("seller"),
  getSellerProducts
);
// Get products for featuring
router.get(
  "/seller/featured/manage",
  authMiddleware,
  roleMiddleware("seller"),
  getSellerProductsForFeaturing
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("seller"),
  uploadProductImages,
  updateProduct
);
// Toggle featured status
router.put(
  "/:productId/featured",
  authMiddleware,
  roleMiddleware("seller"),
  toggleFeaturedStatus
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("seller"),
  deleteProduct
);

// =============================================
// 📥 BULK UPLOAD ROUTE
// =============================================
router.post(
  "/bulk/upload",
  authMiddleware,
  roleMiddleware("seller"),
  bulkUploadProducts
);

export default router;
