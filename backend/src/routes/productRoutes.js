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
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("seller"),
  uploadProductImages,
  updateProduct
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("seller"),
  deleteProduct
);

export default router;
