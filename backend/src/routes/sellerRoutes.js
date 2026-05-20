import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  completeSellerProfile,
  getSellerProfile,
  getSellerReviews,
  postSellerReview,
  markReviewHelpful,
} from "../controllers/sellerController.js";

const router = express.Router();

// ========================================
// SELLER PROFILE ROUTES
// ========================================

// POST - Seller completes their profile (Auth required, Seller only)
router.post(
  "/complete-profile",
  authMiddleware,
  roleMiddleware(["seller"]),
  completeSellerProfile
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

export default router;
