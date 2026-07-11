import express from "express";
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  createReply,
  updateReply,
  deleteReply,
} from "../controllers/reviewController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// =============================================
// 🔓 PUBLIC ROUTES
// =============================================
router.get("/:productId", getProductReviews);

// =============================================
// 🔒 PROTECTED ROUTES — Logged-in users only
// =============================================
router.post("/:productId", authMiddleware, createReview);
router.put("/:id", authMiddleware, updateReview);
router.delete("/:id", authMiddleware, deleteReview);

// =============================================
// 💬 SELLER REPLIES TO REVIEWS
// =============================================
router.post("/:reviewId/replies", authMiddleware, createReply);
router.put("/:reviewId/replies/:replyId", authMiddleware, updateReply);
router.delete("/:reviewId/replies/:replyId", authMiddleware, deleteReply);

export default router;
