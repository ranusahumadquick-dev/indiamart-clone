import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getSellerOrders,
  getSellerOrderById,
  updateSellerOrderStatus,
  getBuyerOrders,
  getBuyerOrderById,
  cancelOrder,
  reorder,
} from "../controllers/orderController.js";

const router = express.Router();
router.use(authMiddleware);

// =============================================
// 🛍️ BUYER ROUTES — Buyer's order management
// =============================================
router.get("/buyer", getBuyerOrders);
router.get("/buyer/:id", getBuyerOrderById);
router.post("/:id/cancel", cancelOrder);
router.post("/:id/reorder", reorder);

// =============================================
// 📦 SELLER ROUTES — Seller's received orders
// =============================================
router.get("/seller", roleMiddleware("seller"), getSellerOrders);
router.get("/seller/:id", roleMiddleware("seller"), getSellerOrderById);
router.put("/seller/:id/status", roleMiddleware("seller"), updateSellerOrderStatus);

export default router;
