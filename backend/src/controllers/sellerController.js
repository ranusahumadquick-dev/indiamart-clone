import User from "../models/User.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ========================================
// SELLER PROFILE CONTROLLERS
// ========================================

/**
 * Complete Seller Profile
 * POST /api/sellers/complete-profile
 * Body: companyName, gstNumber, businessType, businessDescription, businessLogo, website, city, state, pincode
 * Auth: Required (Seller only)
 */
export const completeSellerProfile = asyncHandler(async (req, res) => {
  const { companyName, gstNumber, businessType, businessDescription, businessLogo, website, city, state, pincode } = req.body;

  // Validate required fields
  if (!companyName || !businessType || !businessDescription) {
    throw new ApiError(400, "Company name, business type, and description are required");
  }

  // Update user profile
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      companyName,
      gstNumber,
      businessType,
      businessDescription,
      businessLogo,
      website,
      city,
      state,
      pincode,
      profileCompleted: true, // Mark profile as completed
    },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(200, updatedUser, "Profile completed successfully")
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
