import SellerAnalytics from "../models/SellerAnalytics.js";
import ProductAnalytics from "../models/ProductAnalytics.js";

/**
 * Get seller analytics for a date range
 */
export const getSellerAnalytics = async (sellerId, startDate, endDate) => {
  try {
    const analytics = await SellerAnalytics.find({
      seller: sellerId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ date: 1 });

    // Calculate aggregated metrics
    const aggregated = {
      totalProfileViews: 0,
      totalProfileVisitors: 0,
      totalInquiries: 0,
      totalQuotes: 0,
      totalRevenue: 0,
      totalOrders: 0,
      avgResponseTime: 0,
      avgConversionRate: 0,
      avgResponseRate: 0,
      daily: analytics,
    };

    if (analytics.length === 0) {
      return aggregated;
    }

    analytics.forEach(day => {
      aggregated.totalProfileViews += day.profileViews || 0;
      aggregated.totalProfileVisitors += day.uniqueProfileVisitors || 0;
      aggregated.totalInquiries += day.inquiriesReceived || 0;
      aggregated.totalQuotes += day.quotesGenerated || 0;
      aggregated.totalRevenue += day.totalRevenue || 0;
      aggregated.totalOrders += day.ordersPlaced || 0;
      aggregated.avgResponseTime += day.avgResponseTime || 0;
      aggregated.avgConversionRate += day.conversionRate || 0;
      aggregated.avgResponseRate += day.responseRate || 0;
    });

    const daysCount = analytics.length;
    aggregated.avgResponseTime = Math.round(aggregated.avgResponseTime / daysCount);
    aggregated.avgConversionRate = (aggregated.avgConversionRate / daysCount).toFixed(2);
    aggregated.avgResponseRate = (aggregated.avgResponseRate / daysCount).toFixed(2);

    return aggregated;
  } catch (error) {
    console.error("Error getting seller analytics:", error);
    throw error;
  }
};

/**
 * Get product analytics for a date range
 */
export const getProductAnalytics = async (productId, startDate, endDate) => {
  try {
    const analytics = await ProductAnalytics.find({
      product: productId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ date: 1 });

    const aggregated = {
      totalViews: 0,
      totalClicks: 0,
      totalInquiries: 0,
      totalSampleRequests: 0,
      totalCompareAdds: 0,
      totalWishlistAdds: 0,
      avgClickThroughRate: 0,
      avgInquiryRate: 0,
      avgConversionRate: 0,
      avgPerformanceScore: 0,
      daily: analytics,
    };

    if (analytics.length === 0) {
      return aggregated;
    }

    analytics.forEach(day => {
      aggregated.totalViews += day.views || 0;
      aggregated.totalClicks += day.clicks || 0;
      aggregated.totalInquiries += day.inquiries || 0;
      aggregated.totalSampleRequests += day.sampleRequests || 0;
      aggregated.totalCompareAdds += day.compareAdds || 0;
      aggregated.totalWishlistAdds += day.wishlistAdds || 0;
      aggregated.avgClickThroughRate += day.clickThroughRate || 0;
      aggregated.avgInquiryRate += day.inquiryRate || 0;
      aggregated.avgConversionRate += day.conversionRate || 0;
      aggregated.avgPerformanceScore += day.performanceScore || 0;
    });

    const daysCount = analytics.length;
    aggregated.avgClickThroughRate = (aggregated.avgClickThroughRate / daysCount).toFixed(2);
    aggregated.avgInquiryRate = (aggregated.avgInquiryRate / daysCount).toFixed(2);
    aggregated.avgConversionRate = (aggregated.avgConversionRate / daysCount).toFixed(2);
    aggregated.avgPerformanceScore = Math.round(aggregated.avgPerformanceScore / daysCount);

    return aggregated;
  } catch (error) {
    console.error("Error getting product analytics:", error);
    throw error;
  }
};

/**
 * Get weekly aggregated analytics
 */
export const getWeeklyAnalytics = async (sellerId, startDate, endDate) => {
  try {
    const pipeline = [
      {
        $match: {
          seller: sellerId,
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            week: { $week: "$date" },
          },
          profileViews: { $sum: "$profileViews" },
          uniqueVisitors: { $sum: "$uniqueProfileVisitors" },
          inquiries: { $sum: "$inquiriesReceived" },
          quotes: { $sum: "$quotesGenerated" },
          revenue: { $sum: "$totalRevenue" },
          orders: { $sum: "$ordersPlaced" },
          avgResponseTime: { $avg: "$avgResponseTime" },
          avgConversionRate: { $avg: "$conversionRate" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.week": 1 },
      },
    ];

    const weekly = await SellerAnalytics.aggregate(pipeline);
    return weekly;
  } catch (error) {
    console.error("Error getting weekly analytics:", error);
    throw error;
  }
};

/**
 * Get monthly aggregated analytics
 */
export const getMonthlyAnalytics = async (sellerId, year) => {
  try {
    const pipeline = [
      {
        $match: {
          seller: sellerId,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          profileViews: { $sum: "$profileViews" },
          uniqueVisitors: { $sum: "$uniqueProfileVisitors" },
          inquiries: { $sum: "$inquiriesReceived" },
          quotes: { $sum: "$quotesGenerated" },
          revenue: { $sum: "$totalRevenue" },
          orders: { $sum: "$ordersPlaced" },
          avgResponseTime: { $avg: "$avgResponseTime" },
          avgConversionRate: { $avg: "$conversionRate" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ];

    const monthly = await SellerAnalytics.aggregate(pipeline);
    return monthly;
  } catch (error) {
    console.error("Error getting monthly analytics:", error);
    throw error;
  }
};

/**
 * Get top performing products
 */
export const getTopPerformingProducts = async (sellerId, limit = 10, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          seller: sellerId,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$product",
          totalViews: { $sum: "$views" },
          totalClicks: { $sum: "$clicks" },
          totalInquiries: { $sum: "$inquiries" },
          avgClickThroughRate: { $avg: "$clickThroughRate" },
          avgInquiryRate: { $avg: "$inquiryRate" },
          avgConversionRate: { $avg: "$conversionRate" },
          avgPerformanceScore: { $avg: "$performanceScore" },
        },
      },
      {
        $sort: { avgPerformanceScore: -1 },
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
    ];

    const topProducts = await ProductAnalytics.aggregate(pipeline);
    return topProducts;
  } catch (error) {
    console.error("Error getting top performing products:", error);
    throw error;
  }
};

export default {
  getSellerAnalytics,
  getProductAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getTopPerformingProducts,
};
