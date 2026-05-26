import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { uploadCertificate, uploadVideo } from "../middleware/uploadMiddleware.js";
import {
  completeSellerProfile,
  getMySellerProfile,
  updateMySellerProfile,
  getSellerProfile,
  getSellerReviews,
  postSellerReview,
  markReviewHelpful,
  getSellerAnalytics,
  getSellers,
  requestVerification,
  addCertificationDoc,
  deleteCertificationDoc,
  updateWhatsappNumber,
  toggleWhatsappVisibility,
  updateRequirementAlerts,
  getTrustScore,
  getSellerQuotaStatus,
} from "../controllers/sellerController.js";

const router = express.Router();

// ========================================
// SELLER DIRECTORY — Public listing
// ========================================
router.get("/", getSellers);

// ========================================
// SELLER PROFILE ROUTES
// ========================================

// GET - Seller analytics (Auth required, Seller only)
router.get("/analytics", authMiddleware, roleMiddleware(["seller"]), getSellerAnalytics);

// GET - Get own seller profile with completeness score
router.get("/me", authMiddleware, roleMiddleware(["seller"]), getMySellerProfile);

// GET - Get seller's quota status (products, inquiries, featured listings)
router.get("/me/quota-status", authMiddleware, roleMiddleware(["seller"]), getSellerQuotaStatus);

// PUT - Update own seller profile
router.put("/me", authMiddleware, roleMiddleware(["seller"]), updateMySellerProfile);

// POST - Seller completes their profile (initial onboarding)
router.post(
  "/complete-profile",
  authMiddleware,
  roleMiddleware(["seller"]),
  completeSellerProfile
);

// POST - Seller requests platform verification (Auth required, Seller only)
router.post(
  "/request-verification",
  authMiddleware,
  roleMiddleware(["seller"]),
  requestVerification
);

// POST - Add certification document with optional file upload
router.post(
  "/me/certifications",
  authMiddleware,
  roleMiddleware(["seller"]),
  uploadCertificate,
  addCertificationDoc
);

// POST - Upload company video file (stored to Cloudinary)
router.post(
  "/me/video",
  authMiddleware,
  roleMiddleware(["seller"]),
  uploadVideo,
  async (req, res) => {
    const { default: User } = await import("../models/User.js");
    const { default: ApiResponse } = await import("../utils/ApiResponse.js");
    if (!req.file) return res.status(400).json({ success: false, message: "No video uploaded" });
    const seller = await User.findByIdAndUpdate(
      req.user._id,
      { companyVideo: req.file.path },
      { returnDocument: 'after' }
    ).select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, { seller }, "Video uploaded"));
  }
);

// DELETE - Remove a certification document
router.delete(
  "/me/certifications/:certId",
  authMiddleware,
  roleMiddleware(["seller"]),
  deleteCertificationDoc
);

// PUT - Update WhatsApp number
router.put(
  "/me/whatsapp",
  authMiddleware,
  roleMiddleware(["seller"]),
  updateWhatsappNumber
);

// PUT - Toggle WhatsApp visibility on profile
router.put(
  "/me/whatsapp/toggle",
  authMiddleware,
  roleMiddleware(["seller"]),
  toggleWhatsappVisibility
);

// PUT - Update requirement alerts preferences
router.put(
  "/me/requirement-alerts",
  authMiddleware,
  roleMiddleware(["seller"]),
  updateRequirementAlerts
);

// GET - Get public seller profile (no auth required)
router.get("/:sellerId", getSellerProfile);

// GET - Get seller reviews with pagination
router.get("/:sellerId/reviews", getSellerReviews);

// POST - Post review for seller (Auth required, Buyer only)
router.post(
  "/:sellerId/reviews",
  authMiddleware,
  roleMiddleware(["buyer"]),
  postSellerReview
);

// PUT - Mark review as helpful (Auth required)
router.put(
  "/reviews/:reviewId/helpful",
  authMiddleware,
  markReviewHelpful
);

// GET - Get seller's trust score (public)
router.get("/:sellerId/trust-score", getTrustScore);

export default router;

