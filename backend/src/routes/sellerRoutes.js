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
// IMPORTANT FIX
// Specific routes MUST come before "/:sellerId"
// ========================================

// ========================================
// SELLER DIRECTORY — Public listing
// ========================================
router.get("/", getSellers);

// ========================================
// SELLER PROFILE ROUTES
// ========================================

// GET - Seller analytics
router.get(
  "/analytics",
  authMiddleware,
  roleMiddleware(["seller"]),
  getSellerAnalytics
);

// GET - Get own seller profile
router.get(
  "/me",
  authMiddleware,
  roleMiddleware(["seller"]),
  getMySellerProfile
);

// ✅ FIXED ROUTE
router.get(
  "/me/quota-status",
  authMiddleware,
  roleMiddleware(["seller"]),
  getSellerQuotaStatus
);

// PUT - Update own seller profile
router.put(
  "/me",
  authMiddleware,
  roleMiddleware(["seller"]),
  updateMySellerProfile
);

// POST - Complete profile
router.post(
  "/complete-profile",
  authMiddleware,
  roleMiddleware(["seller"]),
  completeSellerProfile
);

// POST - Request verification
router.post(
  "/request-verification",
  authMiddleware,
  roleMiddleware(["seller"]),
  requestVerification
);

// POST - Add certification
router.post(
  "/me/certifications",
  authMiddleware,
  roleMiddleware(["seller"]),
  uploadCertificate,
  addCertificationDoc
);

// POST - Upload video
router.post(
  "/me/video",
  authMiddleware,
  roleMiddleware(["seller"]),
  uploadVideo,
  async (req, res) => {
    const { default: User } = await import("../models/User.js");
    const { default: ApiResponse } = await import("../utils/ApiResponse.js");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No video uploaded",
      });
    }

    const seller = await User.findByIdAndUpdate(
      req.user._id,
      { companyVideo: req.file.path },
      { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
      new ApiResponse(200, { seller }, "Video uploaded")
    );
  }
);

// DELETE - Certification
router.delete(
  "/me/certifications/:certId",
  authMiddleware,
  roleMiddleware(["seller"]),
  deleteCertificationDoc
);

// PUT - WhatsApp update
router.put(
  "/me/whatsapp",
  authMiddleware,
  roleMiddleware(["seller"]),
  updateWhatsappNumber
);

// PUT - WhatsApp toggle
router.put(
  "/me/whatsapp/toggle",
  authMiddleware,
  roleMiddleware(["seller"]),
  toggleWhatsappVisibility
);

// PUT - Requirement alerts
router.put(
  "/me/requirement-alerts",
  authMiddleware,
  roleMiddleware(["seller"]),
  updateRequirementAlerts
);

// ========================================
// REVIEW ROUTES
// ========================================

// PUT - Helpful review
router.put(
  "/reviews/:reviewId/helpful",
  authMiddleware,
  markReviewHelpful
);

// ========================================
// PUBLIC SELLER ROUTES
// KEEP THESE LAST
// ========================================

// GET - Seller reviews
router.get("/:sellerId/reviews", getSellerReviews);

// POST - Add review
router.post(
  "/:sellerId/reviews",
  authMiddleware,
  roleMiddleware(["buyer"]),
  postSellerReview
);

// GET - Trust score
router.get("/:sellerId/trust-score", getTrustScore);

// GET - Seller profile
router.get("/:sellerId", getSellerProfile);

export default router;