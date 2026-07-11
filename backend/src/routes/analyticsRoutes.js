import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getSellerDashboard,
  getSellerAnalyticsRange,
  getProductPerformance,
  getTopProducts,
  getProfileViewAnalytics,
  getInquiryMetrics,
  getCompetitorInsights,
} from "../controllers/analyticsController.js";

const router = express.Router();

// All routes require authentication and seller role
router.use(authMiddleware, roleMiddleware(["seller"]));

// Seller Dashboard Analytics
router.get("/seller/dashboard", getSellerDashboard);

// Seller Analytics for Date Range
router.get("/seller/range", getSellerAnalyticsRange);

// Profile View Analytics
router.get("/seller/profile", getProfileViewAnalytics);

// Inquiry & Quote Metrics
router.get("/seller/inquiries", getInquiryMetrics);

// Top Performing Products
router.get("/seller/top-products", getTopProducts);

// Product Performance Analytics
router.get("/product/:productId", getProductPerformance);

// Competitor Insights
router.get("/seller/competitors", getCompetitorInsights);

export default router;
