import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Product from "../models/Product.js";
import Inquiry from "../models/Inquiry.js";
import Order from "../models/Order.js";
import BuyRequirement from "../models/BuyRequirement.js";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Safely cast any value to a Mongoose ObjectId */
function toObjectId(id) {
  return new mongoose.Types.ObjectId(id.toString());
}

/** Build {YYYY-MM-DD → {received, responded}} map from Inquiry aggregate */
async function dailyInquiryMap(sellerId, startDate, endDate) {
  const rows = await Inquiry.aggregate([
    {
      $match: {
        seller: toObjectId(sellerId),
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        received: { $sum: 1 },
        responded: {
          $sum: { $cond: [{ $in: ["$status", ["replied", "closed"]] }, 1, 0] },
        },
        quotationsSent: {
          $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$quotations", []] } }, 0] }, 1, 0] },
        },
      },
    },
  ]);
  const map = {};
  for (const r of rows) map[r._id] = r;
  return map;
}

/** Build {YYYY-MM-DD → {orders, revenue}} map from Order aggregate */
async function dailyOrderMap(sellerId, startDate, endDate) {
  const rows = await Order.aggregate([
    {
      $match: {
        seller: toObjectId(sellerId),
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $nin: ["cancelled", "refunded"] },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        orders: { $sum: 1 },
        revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] } },
      },
    },
  ]);
  const map = {};
  for (const r of rows) map[r._id] = r;
  return map;
}

/** Fill every date in range from a map, zero-filling missing dates */
function buildDailySeries(startDate, endDate, inqMap, ordMap) {
  const series = [];
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (cur <= end) {
    const key = cur.toISOString().split("T")[0];
    const label = cur.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const inq = inqMap[key] || {};
    const ord = ordMap[key] || {};
    series.push({
      date: key,
      label,
      inquiriesReceived: inq.received || 0,
      inquiriesResponded: inq.responded || 0,
      quotationsSent: inq.quotationsSent || 0,
      orders: ord.orders || 0,
      revenue: ord.revenue || 0,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return series;
}

// ─── All-time summary aggregation ───────────────────────────────────────────

async function allTimeSummary(sellerId) {
  const sid = toObjectId(sellerId);

  const [inqAgg, ordAgg, rfqAgg, productCount] = await Promise.all([
    // Inquiries: total + responded + quotations generated + avg response time
    Inquiry.aggregate([
      { $match: { seller: sid } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          responded: { $sum: { $cond: [{ $in: ["$status", ["replied", "closed"]] }, 1, 0] } },
          withQuote: {
            $sum: {
              $cond: [{ $gt: [{ $size: { $ifNull: ["$quotations", []] } }, 0] }, 1, 0],
            },
          },
          totalRespMs: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$repliedAt", null] }, { $ne: ["$createdAt", null] }] },
                { $subtract: ["$repliedAt", "$createdAt"] },
                0,
              ],
            },
          },
          countRespMs: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$repliedAt", null] }, { $ne: ["$createdAt", null] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    // Orders: total + revenue from paid orders
    Order.aggregate([
      { $match: { seller: sid, status: { $nin: ["cancelled", "refunded"] } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] } },
        },
      },
    ]),

    // RFQ responses: BuyRequirements where this seller responded
    BuyRequirement.countDocuments({ "responses.supplier": sid }),

    // Product listings
    Product.countDocuments({ seller: sid, isActive: true }),
  ]);

  const inq = inqAgg[0] || {};
  const ord = ordAgg[0] || {};

  const totalInquiries = inq.total || 0;
  const responded = inq.responded || 0;
  const withQuote = inq.withQuote || 0;
  const totalOrders = ord.totalOrders || 0;
  const totalRevenue = ord.totalRevenue || 0;
  const avgResponseTimeMin = inq.countRespMs > 0
    ? Math.round((inq.totalRespMs / inq.countRespMs) / 60000)
    : 0;
  const responseRate = totalInquiries > 0 ? +((responded / totalInquiries) * 100).toFixed(1) : 0;
  const conversionRate = totalInquiries > 0 ? +((totalOrders / totalInquiries) * 100).toFixed(1) : 0;

  return {
    totalInquiries,
    totalQuotes: withQuote + rfqAgg,
    totalOrders,
    totalRevenue,
    avgResponseTime: avgResponseTimeMin,
    responseRate,
    conversionRate,
    productCount,
    hasData: totalInquiries > 0 || totalOrders > 0 || rfqAgg > 0,
  };
}

// ─── Period summary aggregation ─────────────────────────────────────────────

async function periodSummary(sellerId, startDate, endDate) {
  const sid = toObjectId(sellerId);

  const [inqAgg, ordAgg, rfqAgg] = await Promise.all([
    Inquiry.aggregate([
      { $match: { seller: sid, createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          responded: { $sum: { $cond: [{ $in: ["$status", ["replied", "closed"]] }, 1, 0] } },
          withQuote: {
            $sum: {
              $cond: [{ $gt: [{ $size: { $ifNull: ["$quotations", []] } }, 0] }, 1, 0],
            },
          },
        },
      },
    ]),
    Order.aggregate([
      { $match: { seller: sid, createdAt: { $gte: startDate, $lte: endDate }, status: { $nin: ["cancelled", "refunded"] } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] } },
        },
      },
    ]),
    BuyRequirement.countDocuments({
      "responses.supplier": sid,
      updatedAt: { $gte: startDate, $lte: endDate },
    }),
  ]);

  const inq = inqAgg[0] || {};
  const ord = ordAgg[0] || {};
  return {
    inquiries: inq.total || 0,
    responded: inq.responded || 0,
    quotes: (inq.withQuote || 0) + rfqAgg,
    orders: ord.totalOrders || 0,
    revenue: ord.totalRevenue || 0,
    hasPeriodData: (inq.total || 0) > 0 || (ord.totalOrders || 0) > 0 || rfqAgg > 0,
  };
}

// ─── Controller ─────────────────────────────────────────────────────────────

/**
 * GET /api/analytics/seller/dashboard?days=7|14|30|60|90
 *
 * Returns:
 *   allTime  — KPI card totals (since the beginning)
 *   period   — totals for the selected day range
 *   daily    — per-day chart series for the selected range
 */
export const getSellerDashboard = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 365);

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  console.log(`[Analytics] seller=${sellerId} days=${days} range=${startDate.toISOString().split("T")[0]} → ${endDate.toISOString().split("T")[0]}`);

  // Run all aggregations in parallel
  const [allTime, period, inqMap, ordMap] = await Promise.all([
    allTimeSummary(sellerId),
    periodSummary(sellerId, startDate, endDate),
    dailyInquiryMap(sellerId, startDate, endDate),
    dailyOrderMap(sellerId, startDate, endDate),
  ]);

  const daily = buildDailySeries(startDate, endDate, inqMap, ordMap);

  console.log(`[Analytics] allTime: inq=${allTime.totalInquiries} orders=${allTime.totalOrders} rev=₹${allTime.totalRevenue} products=${allTime.productCount}`);
  console.log(`[Analytics] period(${days}d): inq=${period.inquiries} orders=${period.orders} rev=₹${period.revenue}`);

  return res.status(200).json(
    new ApiResponse(200, {
      allTime,    // use for KPI cards — always shows true totals
      period,     // use for "this period" subtexts
      daily,      // use for charts
      periodDays: days,
      periodStart: startDate.toISOString().split("T")[0],
      periodEnd: endDate.toISOString().split("T")[0],
    }, "Seller dashboard analytics fetched")
  );
});

/**
 * GET /api/analytics/seller/range
 */
export const getSellerAnalyticsRange = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) throw new ApiError(400, "startDate and endDate are required");

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const [inqMap, ordMap, period] = await Promise.all([
    dailyInquiryMap(req.user._id, start, end),
    dailyOrderMap(req.user._id, start, end),
    periodSummary(req.user._id, start, end),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { period, daily: buildDailySeries(start, end, inqMap, ordMap) }, "Range analytics fetched")
  );
});

/**
 * GET /api/analytics/product/:productId
 */
export const getProductPerformance = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product || product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to view this product analytics");
  }
  const days = parseInt(req.query.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [total, period] = await Promise.all([
    Inquiry.countDocuments({ product: product._id }),
    Inquiry.countDocuments({ product: product._id, createdAt: { $gte: startDate } }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { productId, allTimeInquiries: total, periodInquiries: period, days }, "Product analytics fetched")
  );
});

/**
 * GET /api/analytics/seller/top-products
 */
export const getTopProducts = asyncHandler(async (req, res) => {
  const { limit = 10, days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const topProducts = await Inquiry.aggregate([
    {
      $match: {
        seller: toObjectId(req.user._id),
        product: { $ne: null },
        createdAt: { $gte: startDate },
      },
    },
    { $group: { _id: "$product", inquiries: { $sum: 1 } } },
    { $sort: { inquiries: -1 } },
    { $limit: parseInt(limit) },
    { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, productId: "$_id", name: "$product.name", inquiries: 1 } },
  ]);

  return res.status(200).json(new ApiResponse(200, topProducts, "Top products fetched"));
});

/**
 * GET /api/analytics/seller/profile
 */
export const getProfileViewAnalytics = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, { summary: { totalViews: 0 }, daily: [] }, "Profile analytics fetched")
  );
});

/**
 * GET /api/analytics/seller/inquiries
 */
export const getInquiryMetrics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const agg = await Inquiry.aggregate([
    { $match: { seller: toObjectId(req.user._id), createdAt: { $gte: startDate } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const metrics = { totalInquiries: 0, respondedInquiries: 0, pendingInquiries: 0, responseRate: 0 };
  for (const g of agg) {
    metrics.totalInquiries += g.count;
    if (g._id === "replied" || g._id === "closed") metrics.respondedInquiries += g.count;
    if (g._id === "new" || g._id === "read") metrics.pendingInquiries += g.count;
  }
  if (metrics.totalInquiries > 0)
    metrics.responseRate = +((metrics.respondedInquiries / metrics.totalInquiries) * 100).toFixed(1);

  return res.status(200).json(new ApiResponse(200, metrics, "Inquiry metrics fetched"));
});

/**
 * GET /api/analytics/seller/competitors
 */
export const getCompetitorInsights = asyncHandler(async (req, res) => {
  const seller = req.user;
  const sellerProducts = await Product.find({ seller: seller._id }).select("category").lean();
  const catIds = [...new Set(sellerProducts.map((p) => p.category?.toString()).filter(Boolean))];

  if (!catIds.length) {
    return res.status(200).json(new ApiResponse(200, { competitors: [], yourMetrics: {} }, "No products"));
  }

  const [topSellers, myMetrics] = await Promise.all([
    Product.aggregate([
      { $match: { category: { $in: catIds.map(toObjectId) }, status: "approved", isActive: true, seller: { $ne: seller._id } } },
      { $group: { _id: "$seller", productCount: { $sum: 1 }, avgRating: { $avg: "$averageRating" } } },
      { $sort: { productCount: -1, avgRating: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "sellerInfo" } },
    ]),
    Product.aggregate([
      { $match: { seller: toObjectId(seller._id), status: "approved", isActive: true } },
      { $group: { _id: null, productCount: { $sum: 1 }, avgRating: { $avg: "$averageRating" } } },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      yourMetrics: myMetrics[0] || { productCount: 0, avgRating: 0 },
      competitors: topSellers.map((c, i) => ({
        rank: i + 1,
        seller: c.sellerInfo[0],
        metrics: { productCount: c.productCount, avgRating: +(c.avgRating || 0).toFixed(2) },
      })),
    }, "Competitor insights fetched")
  );
});
