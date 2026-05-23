import User from "../models/User.js";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import SellerAnalytics from "../models/SellerAnalytics.js";

/**
 * Calculate comprehensive trust score for a seller (0-5.0)
 * Components:
 * 1. Verification (0-1.5): Platform verified, GST, email, phone
 * 2. Response Metrics (0-1.5): Response rate + response time
 * 3. Reviews & Ratings (0-1.5): Average rating + review count
 * 4. Activity (0-0.5): Number of products and sales
 */
export async function calculateTrustScore(sellerId) {
  const seller = await User.findById(sellerId);

  if (!seller) {
    return null;
  }

  let score = 0;
  const components = {
    verification: 0,
    responseMetrics: 0,
    ratings: 0,
    activity: 0,
  };

  // ===== 1. VERIFICATION COMPONENT (max 1.5) =====
  if (seller.isVerified) score += 0.8, components.verification += 0.8;
  if (seller.gstNumber) score += 0.4, components.verification += 0.4;

  // Email and phone verification (assume from verification process)
  if (seller.emails?.verified) score += 0.15, components.verification += 0.15;
  if (seller.phone?.verified) score += 0.15, components.verification += 0.15;

  // Cap at 1.5
  components.verification = Math.min(components.verification, 1.5);
  score = Math.min(score, 1.5);

  // ===== 2. RESPONSE METRICS COMPONENT (max 1.5) =====
  try {
    // Get latest analytics for seller
    const analytics = await SellerAnalytics.findOne({ seller: sellerId })
      .sort({ date: -1 })
      .limit(1);

    let responseScore = 0;

    if (analytics) {
      // Response Rate (0-0.8)
      const responseRate = analytics.responseRate || 0;
      if (responseRate >= 90) responseScore += 0.8;
      else if (responseRate >= 75) responseScore += 0.6;
      else if (responseRate >= 50) responseScore += 0.4;

      // Response Time in minutes (0-0.7)
      const avgResponseTime = analytics.avgResponseTime || 0;
      if (avgResponseTime < 120) responseScore += 0.7; // < 2 hours
      else if (avgResponseTime < 1440) responseScore += 0.5; // < 24 hours
      else if (avgResponseTime < 4320) responseScore += 0.3; // < 3 days
      // else 0 points for > 3 days
    }

    responseScore = Math.min(responseScore, 1.5);
    components.responseMetrics = responseScore;
    score += responseScore;
  } catch (err) {
    console.error("Error calculating response metrics:", err);
  }

  // ===== 3. REVIEWS & RATINGS COMPONENT (max 1.5) =====
  try {
    // Get products by seller
    const sellerProducts = await Product.find({ seller: sellerId });
    const productIds = sellerProducts.map(p => p._id);

    if (productIds.length > 0) {
      // Get reviews for all seller's products
      const reviews = await Review.find({
        product: { $in: productIds },
        isActive: true,
      });

      let ratingScore = 0;

      if (reviews.length > 0) {
        // Calculate average rating
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = totalRating / reviews.length;

        // Rating component (0-1.0)
        if (avgRating >= 4.5) ratingScore += 1.0;
        else if (avgRating >= 4.0) ratingScore += 0.75;
        else if (avgRating >= 3.5) ratingScore += 0.5;
        // else 0 points for < 3.5

        // Review count component (0-0.5)
        const reviewCount = reviews.length;
        if (reviewCount >= 50) ratingScore += 0.3;
        else if (reviewCount >= 10) ratingScore += 0.15;
        else if (reviewCount >= 1) ratingScore += 0.05;
      }

      ratingScore = Math.min(ratingScore, 1.5);
      components.ratings = ratingScore;
      score += ratingScore;
    }
  } catch (err) {
    console.error("Error calculating ratings:", err);
  }

  // ===== 4. ACTIVITY COMPONENT (max 0.5) =====
  try {
    const productCount = await Product.countDocuments({ seller: sellerId });

    if (productCount >= 10) components.activity += 0.25;

    // TODO: Add sales/orders count when available
    components.activity += 0.25; // Provisional for active seller

    components.activity = Math.min(components.activity, 0.5);
    score += components.activity;
  } catch (err) {
    console.error("Error calculating activity:", err);
  }

  // Final score capped at 5.0
  score = Math.min(Math.round(score * 10) / 10, 5.0);

  // Determine trust level
  let trustLevel = "Unverified";
  if (score >= 4.5) trustLevel = "Highly Trusted";
  else if (score >= 4.0) trustLevel = "Very Trusted";
  else if (score >= 3.0) trustLevel = "Trusted";
  else if (score >= 2.0) trustLevel = "Verified";

  // Generate badges
  const badges = [];
  if (seller.isVerified) badges.push("verified");
  if (seller.gstNumber) badges.push("gst_verified");
  if (components.responseMetrics >= 1.0) badges.push("responsive");
  if (components.ratings >= 1.0) badges.push("highly_rated");

  return {
    trustScore: score,
    trustLevel,
    components,
    badges,
  };
}

/**
 * Update trust score for a seller in the database
 */
export async function updateSellerTrustScore(sellerId) {
  const scoreData = await calculateTrustScore(sellerId);

  if (scoreData) {
    await User.findByIdAndUpdate(sellerId, {
      trustScore: {
        overall: scoreData.trustScore,
        verification: scoreData.components.verification,
        responseMetrics: scoreData.components.responseMetrics,
        ratings: scoreData.components.ratings,
        activity: scoreData.components.activity,
        lastUpdatedAt: new Date(),
      },
    });
  }

  return scoreData;
}

/**
 * Batch update trust scores for all sellers
 */
export async function updateAllTrustScores() {
  const sellers = await User.find({ role: "seller" }).select("_id");

  for (const seller of sellers) {
    await updateSellerTrustScore(seller._id);
  }

  return sellers.length;
}
