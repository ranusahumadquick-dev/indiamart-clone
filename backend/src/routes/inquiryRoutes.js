import express from "express";
import {
  createInquiry,
  createBulkInquiry,
  getSellerInquiries,
  getBuyerInquiries,
  replyToInquiry,
  markAsRead,
  closeInquiry,
  createTemplate,
  getTemplates,
  updateTemplate,
  deleteTemplate,
  pinTemplate,
  generateQuotation,
  getQuotations,
  updateQuotation,
  deleteQuotation,
} from "../controllers/inquiryController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// ========================================
// BUYER ROUTES — Send & view inquiries
// ========================================
// POST bulk inquiry — send same message to multiple sellers
router.post("/bulk", authMiddleware, createBulkInquiry);

// POST send inquiry — productId optional in body (from InquiryModal)
router.post("/", authMiddleware, async (req, res, next) => {
  const { productId, message, quantity, buyerName, mobileNumber, email: buyerEmail, sellerId, sellerName, productName } = req.body;

  // Build message from InquiryModal fields if needed
  if (!req.body.message) {
    req.body.message = [
      buyerName    ? `From: ${buyerName}`               : "",
      mobileNumber ? `Phone: ${mobileNumber}`           : "",
      buyerEmail   ? `Email: ${buyerEmail}`             : "",
      quantity     ? `Required Quantity: ${quantity}`   : "",
      message      ? message                            : "",
    ].filter(Boolean).join("\n") || "General inquiry";
  }

  if (productId) {
    // Product-specific inquiry — delegate to existing controller
    req.params.productId = productId;
    return createInquiry(req, res, next);
  }

  // General seller inquiry (no specific product)
  try {
    const Inquiry = (await import("../models/Inquiry.js")).default;
    const ApiResponse = (await import("../utils/ApiResponse.js")).default;

    if (!sellerId) {
      return res.status(400).json({ success: false, message: "sellerId or productId is required" });
    }

    const inquiry = await Inquiry.create({
      buyer:      req.user._id,
      buyerName:  buyerName  || req.user.name  || "Unknown",
      buyerEmail: buyerEmail || req.user.email || "",
      buyerPhone: mobileNumber || req.user.phone || "",
      seller:     sellerId,
      message:    req.body.message,
      subject:    productName ? `Inquiry about ${productName}` : "General Inquiry",
      quantityRequired: quantity ? (parseInt(quantity) || undefined) : undefined,
      status: "new",
    });

    return res.status(201).json(new ApiResponse(201, inquiry, "Inquiry sent successfully"));
  } catch (err) {
    next(err);
  }
});

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

// ========================================
// SELLER TEMPLATE ROUTES
// (must be before /:productId wildcard)
// ========================================
// POST create template
router.post(
  "/templates",
  authMiddleware,
  roleMiddleware(["seller"]),
  createTemplate
);

// GET seller's templates
router.get(
  "/templates",
  authMiddleware,
  roleMiddleware(["seller"]),
  getTemplates
);

// PUT update template
router.put(
  "/templates/:templateId",
  authMiddleware,
  roleMiddleware(["seller"]),
  updateTemplate
);

// DELETE template
router.delete(
  "/templates/:templateId",
  authMiddleware,
  roleMiddleware(["seller"]),
  deleteTemplate
);

// PUT pin/unpin template
router.put(
  "/templates/:templateId/pin",
  authMiddleware,
  roleMiddleware(["seller"]),
  pinTemplate
);

// GET buyer's own inquiries (supports ?status= and ?search=)
router.get("/buyer/my-inquiries", authMiddleware, getBuyerInquiries);

// PUT buyer closes an inquiry
router.put("/:id/close", authMiddleware, closeInquiry);

// POST send inquiry on a product (wildcard — must be last)
router.post("/:productId", authMiddleware, createInquiry);

// ========================================
// QUOTATION ROUTES
// ========================================
// POST generate quotation
router.post(
  "/:inquiryId/quotations",
  authMiddleware,
  roleMiddleware(["seller"]),
  generateQuotation
);

// GET quotations for an inquiry
router.get(
  "/:inquiryId/quotations",
  authMiddleware,
  getQuotations
);

// PUT update quotation
router.put(
  "/:inquiryId/quotations/:quotationId",
  authMiddleware,
  roleMiddleware(["seller"]),
  updateQuotation
);

// DELETE quotation
router.delete(
  "/:inquiryId/quotations/:quotationId",
  authMiddleware,
  roleMiddleware(["seller"]),
  deleteQuotation
);

export default router;
