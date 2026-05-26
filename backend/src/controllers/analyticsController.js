import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  getSellerAnalytics,
  getProductAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getTopPerformingProducts,
} from "../utils/analyticsService.js";
import Product from "../models/Product.js";
import Inquiry from "../models/Inquiry.js";
import SellerAnalytics from "../models/SellerAnalytics.js";
import ProductAnalytics from "../models/ProductAnalytics.js";

/**
 * Get Seller Dashboard Analytics
 * GET /api/analytics/seller/dashboard
 * Shows overall statistics
 */
export const getSellerDashboard = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const { days = 30 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const analytics = await getSellerAnalytics(sellerId, startDate, new Date());

  return res.status(200).json(
    new ApiResponse(200, analytics, "Seller dashboard analytics fetched")
  );
});

/**
 * Get Seller Analytics for Date Range
 * GET /api/analytics/seller/range
 */
export const getSellerAnalyticsRange = asyncHandler(async (req, res) => {
  const { startDate, endDate, period = "daily" } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError(400, "startDate and endDate are required");
  }

  let analytics;

  if (period === "weekly") {
    analytics = await getWeeklyAnalytics(req.user._id, startDate, endDate);
  } else if (period === "monthly") {
    const year = new Date(startDate).getFullYear();
    analytics = await getMonthlyAnalytics(req.user._id, year);
  } else {
    analytics = await getSellerAnalytics(req.user._id, startDate, endDate);
  }

  return res.status(200).json(
    new ApiResponse(200, { analytics, period }, "Analytics fetched")
  );
});

/**
 * Get Product Performance Analytics
 * GET /api/analytics/product/:productId
 */
export const getProductPerformance = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { days = 30 } = req.query;

  // Verify product ownership
  const product = await Product.findById(productId);
  if (!product || product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to view this product analytics");
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const analytics = await getProductAnalytics(productId, startDate, new Date());

  return res.status(200).json(
    new ApiResponse(200, analytics, "Product analytics fetched")
  );
});

/**
 * Get Top Performing Products
 * GET /api/analytics/seller/top-products
 */
export const getTopProducts = asyncHandler(async (req, res) => {
  const { limit = 10, days = 30 } = req.query;

  const topProducts = await getTopPerformingProducts(
    req.user._id,
    parseInt(limit),
    parseInt(days)
  );

  return res.status(200).json(
    new ApiResponse(200, topProducts, "Top products fetched")
  );
});

/**
 * Get Seller Profile View Analytics
 * GET /api/analytics/seller/profile
 */
export const getProfileViewAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError(400, "startDate and endDate are required");
  }

  const analytics = await SellerAnalytics.find({
    seller: req.user._id,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  })
    .select("date profileViews uniqueProfileVisitors profileClickThroughs")
    .sort({ date: 1 });

  // Calculate summary
  const summary = {
    totalViews: 0,
    totalVisitors: 0,
    totalClicks: 0,
    avgViewsPerDay: 0,
    peakDay: null,
    peakViews: 0,
  };

  analytics.forEach(day => {
    summary.totalViews += day.profileViews || 0;
    summary.totalVisitors += day.uniqueProfileVisitors || 0;
    summary.totalClicks += day.profileClickThroughs || 0;

    if ((day.profileViews || 0) > summary.peakViews) {
      summary.peakViews = day.profileViews || 0;
      summary.peakDay = day.date;
    }
  });

  if (analytics.length > 0) {
    summary.avgViewsPerDay = Math.round(summary.totalViews / analytics.length);
  }

  return res.status(200).json(
    new ApiResponse(200, { summary, daily: analytics }, "Profile analytics fetched")
  );
});

/**
 * Get Inquiry & Quote Metrics
 * GET /api/analytics/seller/inquiries
 */
export const getInquiryMetrics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  // Get inquiries data
  const inquiries = await Inquiry.aggregate([
    {
      $match: {
        seller: req.user._id,
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          status: "$status",
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        },
        count: { $sum: 1 },
        avgResponseTime: { $avg: "$responseTime" },
      },
    },
    {
      $sort: { "_id.date": 1 },
    },
  ]);

  // Calculate metrics
  const metrics = {
    totalInquiries: 0,
    respondedInquiries: 0,
    pendingInquiries: 0,
    responseRate: 0,
    avgResponseTime: 0,
    daily: {},
  };

  inquiries.forEach(inquiry => {
    const date = inquiry._id.date;
    if (!metrics.daily[date]) {
      metrics.daily[date] = { new: 0, responded: 0, pending: 0 };
    }

    if (inquiry._id.status === "responded") {
      metrics.respondedInquiries += inquiry.count;
      metrics.daily[date].responded = inquiry.count;
      metrics.avgResponseTime += inquiry.avgResponseTime || 0;
    } else if (inquiry._id.status === "pending") {
      metrics.pendingInquiries += inquiry.count;
      metrics.daily[date].pending = inquiry.count;
    } else {
      metrics.daily[date].new = inquiry.count;
    }

    metrics.totalInquiries += inquiry.count;
  });

  if (metrics.totalInquiries > 0) {
    metrics.responseRate = (
      (metrics.respondedInquiries / metrics.totalInquiries) *
      100
    ).toFixed(2);
  }

  return res.status(200).json(
    new ApiResponse(200, metrics, "Inquiry metrics fetched")
  );
});

/**
 * Get Competitor Insights
 * GET /api/analytics/seller/competitors
 */
export const getCompetitorInsights = asyncHandler(async (req, res) => {
  const seller = req.user;

  // Get seller's main product categories
  const sellerProducts = await Product.find({ seller: seller._id }).select("category").lean();
  const sellerCategories = [...new Set(sellerProducts.map(p => p.category.toString()))];

  if (sellerCategories.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, { competitors: [], ranking: {} }, "No products to compare")
    );
  }

  // Find top sellers in same categories
  const topSellers = await Product.aggregate([
    {
      $match: {
        category: { $in: sellerCategories.map(c => mongoose.Types.ObjectId(c)) },
        status: "approved",
        isActive: true,
        seller: { $ne: seller._id },
      },
    },
    {
      $group: {
        _id: "$seller",
        productCount: { $sum: 1 },
        avgRating: { $avg: "$averageRating" },
        totalReviews: { $sum: "$totalReviews" },
      },
    },
    {
      $sort: { productCount: -1, avgRating: -1 },
    },
    {
      $limit: 5,
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "sellerInfo",
      },
    },
  ]);

  // Get current seller's metrics for comparison
  const currentSellerMetrics = await Product.aggregate([
    {
      $match: {
        seller: seller._id,
        status: "approved",
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        productCount: { $sum: 1 },
        avgRating: { $avg: "$averageRating" },
        totalReviews: { $sum: "$totalReviews" },
      },
    },
  ]);

  // Calculate ranking
  const sellerData = currentSellerMetrics[0] || {
    productCount: 0,
    avgRating: 0,
    totalReviews: 0,
  };

  const competitorsList = topSellers.map((comp, index) => ({
    rank: index + 1,
    seller: comp.sellerInfo[0],
    metrics: {
      productCount: comp.productCount,
      avgRating: comp.avgRating?.toFixed(2) || 0,
      totalReviews: comp.totalReviews,
    },
  }));

  // Calculate ranking position
  const sellerRankingPosition = competitorsList.findIndex(
    c => c.seller._id.toString() === seller._id.toString()
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        yourMetrics: sellerData,
        competitors: competitorsList,
        categoryCount: sellerCategories.length,
        rankingPosition:
          sellerRankingPosition === -1
            ? competitorsList.length + 1
            : sellerRankingPosition + 1,
      },
      "Competitor insights fetched"
    )
  );
});

