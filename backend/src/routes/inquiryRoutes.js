import express from "express";
import {
  createInquiry,
  getSellerInquiries,
  getBuyerInquiries,
  replyToInquiry,
  markAsRead,
} from "../controllers/inquiryController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// ========================================
// BUYER ROUTES — Send & view inquiries
// ========================================
// POST send inquiry on a product
router.post("/:productId", authMiddleware, createInquiry);

// GET buyer's own inquiries
router.get("/buyer/my-inquiries", authMiddleware, getBuyerInquiries);

// ========================================
// SELLER ROUTES — View & reply to inquiries
// ========================================
// GET seller's received inquiries
router.get(
  "/seller/inbox",
  authMiddleware,
  roleMiddleware(["seller"]),
  getSellerInquiries
);

// PUT reply to inquiry
router.put(
  "/:id/reply",
  authMiddleware,
  roleMiddleware(["seller"]),
  replyToInquiry
);

// PUT mark inquiry as read
router.put(
  "/:id/read",
  authMiddleware,
  roleMiddleware(["seller"]),
  markAsRead
);

export default router;
