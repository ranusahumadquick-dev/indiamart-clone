import User from "../models/User.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import Inquiry from "../models/Inquiry.js";
import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ========================================
// GET ALL SELLERS — Public directory
// GET /api/sellers?search=&category=&page=&limit=
// ========================================
export const getSellers = asyncHandler(async (req, res) => {
  const { search, category, verified, hasGST, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { role: "seller", profileCompleted: true };
  if (search) {
    filter.$or = [
      { companyName: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
      { businessType: { $regex: search, $options: "i" } },
      { businessDescription: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { state: { $regex: search, $options: "i" } },
    ];
  }
  if (category) filter.businessType = { $regex: category, $options: "i" };
  if (verified === "true") filter.isVerified = true;
  if (hasGST === "true") filter.gstNumber = { $exists: true, $ne: "" };

  const [sellers, total] = await Promise.all([
    User.find(filter)
      .select("name companyName avatar businessType businessDescription city state isVerified isEmailVerified isPhoneVerified gstNumber yearEstablished avgResponseTime replyCount")
      .sort({ isVerified: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  // Attach product count per seller
  const sellerIds = sellers.map((s) => s._id);
  const productCounts = await Product.aggregate([
    { $match: { seller: { $in: sellerIds }, isActive: true } },
    { $group: { _id: "$seller", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(productCounts.map(({ _id, count }) => [_id.toString(), count]));

  const result = sellers.map((s) => {
    const obj = s.toObject();
    return {
      ...obj,
      productCount: countMap[s._id.toString()] || 0,
      hasGST: !!(obj.gstNumber),
      gstNumber: undefined, // never expose actual GST number in listing
    };
  });

  return res.status(200).json(
    new ApiResponse(200, { sellers: result, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, "Sellers fetched")
  );
});

// ========================================
// REQUEST VERIFICATION
// POST /api/sellers/request-verification
// Auth: Seller only
// ========================================
export const requestVerification = asyncHandler(async (req, res) => {
  const seller = await User.findById(req.user._id);

  if (!seller) throw new ApiError(404, "Seller not found");
  if (seller.isVerified) throw new ApiError(400, "Your account is already verified");
  if (seller.verificationRequested) {
    throw new ApiError(400, "Verification request already submitted. Admin will review it soon.");
  }
  if (!seller.profileCompleted) {
    throw new ApiError(400, "Please complete your seller profile before requesting verification");
  }

  const { note } = req.body;

  seller.verificationRequested = true;
  seller.verificationRequestedAt = new Date();
  if (note) seller.verificationNote = note;
  await seller.save();

  return res.status(200).json(
    new ApiResponse(200, { verificationRequested: true }, "Verification request submitted successfully. Admin will review within 2-3 business days.")
  );
});

// ========================================
// SELLER PROFILE CONTROLLERS
// ========================================

// ========================================
// PROFILE COMPLETENESS SCORE
// ========================================
function computeProfileScore(user) {
  let score = 0;
  if (user.companyName)        score += 10;
  if (user.businessType)       score += 8;
  if (user.businessDescription && user.businessDescription.length >= 50) score += 12;
  if (user.businessLogo)       score += 8;
  if (user.city && user.state) score += 6;
  if (user.gstNumber)          score += 8;
  if (user.yearEstablished)    score += 4;
  if (user.website)            score += 4;
  if (user.mainProducts?.length > 0) score += 10;
  if (user.annualTurnover)     score += 6;
  if (user.employeeCount)      score += 6;
  if (user.exportCapability)   score += 4;
  if (user.productionCapacity) score += 4;
  if (user.certifications?.length > 0 || user.certificationDocs?.length > 0) score += 6;
  if (user.paymentTerms?.length > 0)   score += 4;
  const anyLink = user.socialLinks?.linkedin || user.socialLinks?.facebook || user.socialLinks?.instagram;
  if (anyLink) score += 4;
  if (user.companyVideo) score += 6;
  if (user.phone) score += 6;
  return Math.min(score, 100);
}

/**
 * GET My Seller Profile
 * GET /api/sellers/me
 * Auth: Required (Seller only)
 */
export const getMySellerProfile = asyncHandler(async (req, res) => {
  const seller = await User.findById(req.user._id).select("-password -refreshToken");
  if (!seller) throw new ApiError(404, "Seller not found");
  const profileScore = computeProfileScore(seller);
  return res.status(200).json(
    new ApiResponse(200, { seller, profileScore }, "Profile fetched")
  );
});

/**
 * Update My Seller Profile
 * PUT /api/sellers/me
 * Auth: Required (Seller only)
 */
export const updateMySellerProfile = asyncHandler(async (req, res) => {
  const ALLOWED = [
    "companyName", "businessType", "businessDescription", "businessLogo",
    "website", "city", "state", "pincode", "yearEstablished", "gstNumber",
    "annualTurnover", "employeeCount", "exportCapability", "mainProducts",
    "certifications", "socialLinks", "paymentTerms", "minOrderValue",
    "productionCapacity", "exportCountries", "tradeShows",
    "companyVideo", "virtualTourUrl",
  ];

  const update = {};
  ALLOWED.forEach((key) => {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  });

  if (Object.keys(update).length === 0) throw new ApiError(400, "No valid fields to update");

  const seller = await User.findByIdAndUpdate(
    req.user._id,
    { ...update, profileCompleted: true },
    { returnDocument: 'after', runValidators: true }
  ).select("-password -refreshToken");

  const profileScore = computeProfileScore(seller);
  return res.status(200).json(
    new ApiResponse(200, { seller, profileScore }, "Profile updated successfully")
  );
});

/**
 * Complete Seller Profile (initial setup)
 * POST /api/sellers/complete-profile
 * Auth: Required (Seller only)
 */
export const completeSellerProfile = asyncHandler(async (req, res) => {
  const {
    companyName, gstNumber, businessType, businessDescription, businessLogo,
    website, city, state, pincode, yearEstablished,
    annualTurnover, employeeCount, exportCapability, mainProducts,
    certifications, socialLinks, paymentTerms, minOrderValue, productionCapacity,
  } = req.body;

  if (!companyName || !businessType || !businessDescription) {
    throw new ApiError(400, "Company name, business type, and description are required");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      companyName, gstNumber, businessType, businessDescription, businessLogo,
      website, city, state, pincode,
      yearEstablished: yearEstablished ? Number(yearEstablished) : undefined,
      annualTurnover, employeeCount, exportCapability,
      mainProducts: mainProducts || [],
      certifications: certifications || [],
      socialLinks: socialLinks || {},
      paymentTerms: paymentTerms || [],
      minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      productionCapacity,
      profileCompleted: true,
    },
    { returnDocument: 'after', runValidators: true }
  ).select("-password -refreshToken");

  const profileScore = computeProfileScore(updatedUser);
  return res.status(200).json(
    new ApiResponse(200, { seller: updatedUser, profileScore }, "Profile completed successfully")
  );
});

/**
 * Get Public Seller Profile
 * GET /api/sellers/:sellerId
 * Returns: seller info, all products, average rating, total reviews
 */
export const getSellerProfile = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;

  // Get seller info
  const seller = await User.findById(sellerId)
    .select("-password -refreshToken -emailVerificationToken -passwordResetToken")
    .lean();

  if (!seller || seller.role !== "seller") {
    throw new ApiError(404, "Seller not found");
  }

  // Get all products by this seller (approved only)
  const products = await Product.find({
    seller: sellerId,
    status: "approved",
  })
    .select("name slug price comparePrice images category subCategory averageRating stock minOrderQuantity city state")
    .populate("category", "name")
    .lean();

  // Get all reviews for this seller
  const reviews = await Review.find({
    seller: sellerId,
    status: "approved",
  })
    .populate("buyer", "name avatar")
    .lean();

  // Calculate average rating
  let averageRating = 0;
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    averageRating = (totalRating / reviews.length).toFixed(1);
  }

  return res.status(200).json(
    new ApiResponse(200, {
      seller: {
        ...seller,
        averageRating,
        totalReviews: reviews.length,
        totalProducts: products.length,
      },
      products,
      reviews,
    }, "Seller profile fetched successfully")
  );
});

/**
 * Get Seller Reviews
 * GET /api/sellers/:sellerId/reviews
 */
export const getSellerReviews = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Check if seller exists
  const seller = await User.findById(sellerId);
  if (!seller || seller.role !== "seller") {
    throw new ApiError(404, "Seller not found");
  }

  const skip = (page - 1) * limit;

  // Get reviews with pagination
  const reviews = await Review.find({
    seller: sellerId,
    status: "approved",
  })
    .populate("buyer", "name avatar")
    .populate("product", "name slug")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const totalReviews = await Review.countDocuments({
    seller: sellerId,
    status: "approved",
  });

  // Calculate average rating
  const allReviews = await Review.find({
    seller: sellerId,
    status: "approved",
  }).lean();

  let averageRating = 0;
  if (allReviews.length > 0) {
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    averageRating = (totalRating / allReviews.length).toFixed(1);
  }

  return res.status(200).json(
    new ApiResponse(200, {
      reviews,
      averageRating,
      totalReviews,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReviews / limit),
    }, "Reviews fetched successfully")
  );
});

/**
 * Post Review for Seller
 * POST /api/sellers/:sellerId/reviews
 * Body: rating, title, comment, productQuality, deliveryExperience, communication
 * Auth: Required (Buyer only)
 */
export const postSellerReview = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const { rating, title, comment, productQuality, deliveryExperience, communication, product } = req.body;

  // Validate
  if (!rating || !comment) {
    throw new ApiError(400, "Rating and comment are required");
  }

  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  // Check if seller exists
  const seller = await User.findById(sellerId);
  if (!seller || seller.role !== "seller") {
    throw new ApiError(404, "Seller not found");
  }

  // Check if buyer already reviewed this seller (optional: prevent duplicate reviews)
  const existingReview = await Review.findOne({
    seller: sellerId,
    buyer: req.user._id,
    product: product || null,
  });

  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this seller for this product");
  }

  // Create review
  const newReview = await Review.create({
    seller: sellerId,
    buyer: req.user._id,
    product: product || null,
    rating,
    title,
    comment,
    productQuality,
    deliveryExperience,
    communication,
  });

  // Populate buyer info
  const review = await Review.findById(newReview._id)
    .populate("buyer", "name avatar")
    .lean();

  return res.status(201).json(
    new ApiResponse(201, review, "Review posted successfully")
  );
});

/**
 * Mark Review as Helpful
 * PUT /api/reviews/:reviewId/helpful
 * Auth: Required
 */
// ========================================
// SELLER ANALYTICS — Dashboard charts data
// GET /api/sellers/analytics
// ========================================
export const getSellerAnalytics = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  const now = new Date();

  // Last 7 days range
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Last 30 days range
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    topProducts,
    inquiriesPerDay,
    totalViewsResult,
    conversionResult,
  ] = await Promise.allSettled([
    // Top 5 products by views
    Product.find({ seller: sellerId, isActive: true })
      .sort({ views: -1 })
      .limit(5)
      .select("name views inquiryCount images price status"),

    // Inquiries per day over last 7 days
    Inquiry.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Total views across all products
    Product.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
      { $group: { _id: null, totalViews: { $sum: "$views" }, totalInquiries: { $sum: "$inquiryCount" } } },
    ]),

    // Monthly inquiry count for last 30 days
    Inquiry.countDocuments({
      seller: sellerId,
      createdAt: { $gte: thirtyDaysAgo },
    }),
  ]);

  // Build last-7-days labels
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const inquiryMap = {};
  if (inquiriesPerDay.status === "fulfilled") {
    inquiriesPerDay.value.forEach((r) => { inquiryMap[r._id] = r.count; });
  }

  const inquiryTrend = days.map((d) => ({
    date: d,
    label: new Date(d).toLocaleDateString("en-IN", { weekday: "short" }),
    value: inquiryMap[d] || 0,
  }));

  const totals = totalViewsResult.status === "fulfilled" ? totalViewsResult.value[0] : null;

  return res.status(200).json(
    new ApiResponse(200, {
      topProducts: topProducts.status === "fulfilled" ? topProducts.value : [],
      inquiryTrend,
      totalViews: totals?.totalViews || 0,
      totalInquiries: totals?.totalInquiries || 0,
      monthlyInquiries: conversionResult.status === "fulfilled" ? conversionResult.value : 0,
      conversionRate: totals?.totalViews
        ? ((totals.totalInquiries / totals.totalViews) * 100).toFixed(1)
        : "0.0",
    }, "Analytics fetched")
  );
});

/**
 * Add Certification Document
 * POST /api/sellers/me/certifications
 * Body (multipart): name, issuingBody, certNumber, issuedDate, expiryDate + file: certificate
 */
export const addCertificationDoc = asyncHandler(async (req, res) => {
  const { name, issuingBody, certNumber, issuedDate, expiryDate } = req.body;

  if (!name) throw new ApiError(400, "Certification name is required");

  const docEntry = {
    name,
    issuingBody: issuingBody || "",
    certNumber:  certNumber  || "",
    issuedDate:  issuedDate  ? new Date(issuedDate)  : undefined,
    expiryDate:  expiryDate  ? new Date(expiryDate)  : undefined,
    imageUrl:    "",
    publicId:    "",
    fileType:    "image",
    isAdminVerified: false,
  };

  if (req.file) {
    docEntry.imageUrl = req.file.path;
    docEntry.publicId = req.file.filename;
    docEntry.fileType = req.file.mimetype === "application/pdf" ? "pdf" : "image";
  }

  const seller = await User.findByIdAndUpdate(
    req.user._id,
    { $push: { certificationDocs: docEntry } },
    { returnDocument: 'after', runValidators: true }
  ).select("-password -refreshToken");

  const profileScore = computeProfileScore(seller);
  return res.status(201).json(
    new ApiResponse(201, { seller, profileScore }, "Certification added successfully")
  );
});

/**
 * Delete Certification Document
 * DELETE /api/sellers/me/certifications/:certId
 */
export const deleteCertificationDoc = asyncHandler(async (req, res) => {
  const { certId } = req.params;

  const seller = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { certificationDocs: { _id: certId } } },
    { returnDocument: 'after' }
  ).select("-password -refreshToken");

  if (!seller) throw new ApiError(404, "Seller not found");

  const profileScore = computeProfileScore(seller);
  return res.status(200).json(
    new ApiResponse(200, { seller, profileScore }, "Certification deleted")
  );
});

export const markReviewHelpful = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Check if already marked as helpful
  if (review.helpfulBy.includes(req.user._id)) {
    // Remove helpful vote
    review.helpfulBy = review.helpfulBy.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    review.helpfulCount -= 1;
  } else {
    // Add helpful vote
    review.helpfulBy.push(req.user._id);
    review.helpfulCount += 1;
  }

  await review.save();

  return res.status(200).json(
    new ApiResponse(200, review, "Review helpful status updated")
  );
});

/**
 * Update WhatsApp Number
 * PUT /api/sellers/me/whatsapp
 * Auth: Required (Seller only)
 * Body: { number }
 */
export const updateWhatsappNumber = asyncHandler(async (req, res) => {
  const { number } = req.body;

  if (!number || typeof number !== "string") {
    throw new ApiError(400, "Valid WhatsApp number is required");
  }

  const seller = await User.findByIdAndUpdate(
    req.user._id,
    {
      "whatsapp.number": number.trim(),
      "whatsapp.isVerified": false, // Reset verification when number changes
    },
    { returnDocument: 'after', runValidators: true }
  ).select("-password -refreshToken");

  if (!seller) throw new ApiError(404, "Seller not found");

  return res.status(200).json(
    new ApiResponse(200, seller.whatsapp, "WhatsApp number updated successfully")
  );
});

/**
 * Toggle WhatsApp Visibility on Profile
 * PUT /api/sellers/me/whatsapp/toggle
 * Auth: Required (Seller only)
 * Body: { displayOnProfile }
 */
export const toggleWhatsappVisibility = asyncHandler(async (req, res) => {
  const { displayOnProfile } = req.body;

  if (typeof displayOnProfile !== "boolean") {
    throw new ApiError(400, "displayOnProfile must be a boolean");
  }

  const seller = await User.findByIdAndUpdate(
    req.user._id,
    { "whatsapp.displayOnProfile": displayOnProfile },
    { returnDocument: 'after' }
  ).select("-password -refreshToken");

  if (!seller) throw new ApiError(404, "Seller not found");

  return res.status(200).json(
    new ApiResponse(200, { displayOnProfile: seller.whatsapp.displayOnProfile }, "WhatsApp visibility updated")
  );
});

/**
 * Update Requirement Alerts Preferences
 * PUT /api/sellers/me/requirement-alerts
 * Auth: Required (Seller only)
 * Body: { enabled, categories, minBudget, maxBudget, preferredLocations }
 */
export const updateRequirementAlerts = asyncHandler(async (req, res) => {
  const { enabled, categories, minBudget, maxBudget, preferredLocations } = req.body;

  const update = {};
  if (enabled !== undefined) update["requirementAlerts.enabled"] = enabled;
  if (categories !== undefined) update["requirementAlerts.categories"] = categories;
  if (minBudget !== undefined) update["requirementAlerts.minBudget"] = minBudget;
  if (maxBudget !== undefined) update["requirementAlerts.maxBudget"] = maxBudget;
  if (preferredLocations !== undefined) update["requirementAlerts.preferredLocations"] = preferredLocations;

  if (Object.keys(update).length === 0) {
    throw new ApiError(400, "No valid fields to update");
  }

  const seller = await User.findByIdAndUpdate(
    req.user._id,
    update,
    { returnDocument: 'after', runValidators: true }
  ).select("-password -refreshToken");

  if (!seller) throw new ApiError(404, "Seller not found");

  return res.status(200).json(
    new ApiResponse(200, seller.requirementAlerts, "Requirement alerts updated successfully")
  );
});

// ========================================
// GET TRUST SCORE — Get seller's trust metrics
// GET /api/sellers/:sellerId/trust-score
// ========================================
export const getTrustScore = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;

  const seller = await User.findById(sellerId).select("trustScore isVerified gstNumber name companyName");

  if (!seller) {
    throw new ApiError(404, "Seller not found");
  }

  // Import the service
  const { calculateTrustScore } = await import("../utils/trustScoreService.js");

  const scoreData = await calculateTrustScore(sellerId);

  return res.status(200).json(
    new ApiResponse(200, {
      trustScore: scoreData.trustScore,
      trustLevel: scoreData.trustLevel,
      components: scoreData.components,
      badges: scoreData.badges,
    }, "Trust score retrieved successfully")
  );
});

/**
 * Get Seller Quota Status
 * GET /api/sellers/me/quota-status
 * Auth: Required (Seller only)
 * Returns: Current usage vs limits for products, daily inquiries, featured listings
 */
export const getSellerQuotaStatus = asyncHandler(async (req, res) => {
  const { default: Subscription } = await import("../models/Subscription.js");
  const { SubscriptionPlan } = await import("../models/SubscriptionPlan.js");

  const sellerId = req.user._id;

  // Get active subscription or default to Free plan
  let subscription = await Subscription.findOne({
    userId: sellerId,
    planFor: "seller",
    status: "active"
  }).populate("plan");

  let plan = null;
  let subscriptionData = null;

  if (subscription && !subscription.isExpired) {
    plan = subscription.plan;
    subscriptionData = {
      name: subscription.name,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      daysRemaining: subscription.daysRemaining,
    };
  } else {
    // Default to Free Plan
    plan = await SubscriptionPlan.findOne({ name: "Free Plan" });
    if (!plan) {
      throw new ApiError(500, "Default Free Plan not found");
    }
  }

  const limits = plan.limits;

  // Count current products
  const productCount = await Product.countDocuments({
    seller: sellerId,
    isActive: true,
  });

  // Count featured listings
  const featuredCount = await Product.countDocuments({
    seller: sellerId,
    isFeatured: true,
    isActive: true,
  });

  // Count inquiries sent today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const inquiriesCount = await Inquiry.countDocuments({
    seller: sellerId,
    createdAt: { $gte: todayStart, $lte: todayEnd },
  });

  // Helper function to calculate percentage and status
  const calculateQuota = (used, limit) => {
    if (limit === -1) {
      // Unlimited
      return {
        used,
        limit: "∞",
        percentage: 0,
        isUnlimited: true,
        status: "ok",
      };
    }

    const percentage = Math.round((used / limit) * 100);
    let status = "ok";
    if (percentage >= 90) status = "critical";
    else if (percentage >= 70) status = "warning";

    return {
      used,
      limit,
      percentage,
      isUnlimited: false,
      status,
    };
  };

  const quotaStatus = {
    subscription: subscriptionData,
    quotas: {
      products: calculateQuota(productCount, limits.maxProducts),
      inquiriesPerDay: calculateQuota(inquiriesCount, limits.maxInquiriesPerDay),
      featuredListings: calculateQuota(
        featuredCount,
        limits.featuredListings || 0
      ),
    },
    features: {
      prioritySupport: limits.prioritySupport || false,
      analytics: limits.analytics || false,
    },
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      quotaStatus,
      "Seller quota status retrieved successfully"
    )
  );
});


