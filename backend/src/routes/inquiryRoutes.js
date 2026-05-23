import express from "express";
import {
  createInquiry,
  createBulkInquiry,
  getSellerInquiries,
  getBuyerInquiries,
  replyToInquiry,
  markAsRead,
  closeInquiry,
} from "../controllers/inquiryController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// ========================================
// BUYER ROUTES — Send & view inquiries
// ========================================
// POST bulk inquiry — send same message to multiple sellers
router.post("/bulk", authMiddleware, createBulkInquiry);

// POST send inquiry on a product
router.post("/:productId", authMiddleware, createInquiry);

// GET buyer's own inquiries (supports ?status= and ?search=)
router.get("/buyer/my-inquiries", authMiddleware, getBuyerInquiries);

// PUT buyer closes an inquiry
router.put("/:id/close", authMiddleware, closeInquiry);

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
