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

import { getSellerCustomizations } from "../controllers/customizationController.js";

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

// GET - Seller customization requests
router.get(
  "/customizations",
  authMiddleware,
  roleMiddleware(["seller"]),
  getSellerCustomizations
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

// POST - Upload multiple video files (with optional per-file titles as JSON array)
router.post(
  "/me/video",
  authMiddleware,
  roleMiddleware(["seller"]),
  uploadVideo,
  async (req, res) => {
    const { default: User } = await import("../models/User.js");
    const { default: ApiResponse } = await import("../utils/ApiResponse.js");

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No video uploaded" });
    }

    // Titles are sent as a JSON array string: titles=["My Factory Tour","Demo"]
    let titles = [];
    try { titles = JSON.parse(req.body.titles || "[]"); } catch { titles = []; }

    const newEntries = req.files.map((f, i) => ({
      url:   `/uploads/videos/${f.filename}`,
      title: (titles[i] || "").trim(),
    }));

    const seller = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { uploadedVideos: { $each: newEntries } } },
      { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
      new ApiResponse(200, { seller, uploadedEntries: newEntries }, "Videos uploaded")
    );
  }
);

// DELETE - Remove a specific uploaded video by URL
router.delete(
  "/me/video",
  authMiddleware,
  roleMiddleware(["seller"]),
  async (req, res) => {
    const { default: User } = await import("../models/User.js");
    const { default: ApiResponse } = await import("../utils/ApiResponse.js");
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: "URL required" });
    const seller = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { uploadedVideos: { url } } },
      { new: true }
    ).select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, { seller }, "Video removed"));
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