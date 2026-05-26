import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";

// =============================================
// ⭐ CREATE REVIEW — Buyer writes a review
// =============================================
const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, title, comment } = req.body;

  if (!rating || !comment) {
    throw new ApiError(400, "Rating and comment are required");
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    user: req.user._id,
    product: productId,
  });

  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this product");
  }

  const review = await Review.create({
    user: req.user._id,
    userName: req.user.name,
    product: productId,
    rating,
    title,
    comment,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, review, "Review added successfully"));
});

// =============================================
// 📋 GET PRODUCT REVIEWS — Public
// =============================================
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  const [reviews, totalReviews] = await Promise.all([
    Review.find({ product: productId, isActive: true })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    Review.countDocuments({ product: productId, isActive: true }),
  ]);

  const pagination = getPaginationMeta(totalReviews, currentPage, pageLimit);

  return res.status(200).json(
    new ApiResponse(200, { reviews, pagination }, "Reviews fetched successfully")
  );
});

// =============================================
// ✏️ UPDATE REVIEW — Reviewer updates their review
// =============================================
const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, title, comment } = req.body;

  const review = await Review.findOne({ _id: id, user: req.user._id });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  review.rating = rating || review.rating;
  review.title = title || review.title;
  review.comment = comment || review.comment;

  await review.save();

  return res
    .status(200)
    .json(new ApiResponse(200, review, "Review updated successfully"));
});

// =============================================
// 🗑️ DELETE REVIEW — Reviewer deletes their review
// =============================================
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findOne({ _id: id, user: req.user._id });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  await review.remove();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Review deleted successfully"));
});

// =============================================
// 💬 CREATE REPLY — Seller replies to review
// =============================================
const createReply = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Reply content is required");
  }

  const review = await Review.findById(reviewId).populate("product");

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Check if user is the product owner (seller)
  if (review.product.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the product seller can reply to reviews");
  }

  // Add reply to replies array
  review.replies.push({
    _id: new mongoose.Types.ObjectId(),
    seller: req.user._id,
    sellerName: req.user.name,
    content: content.trim(),
    isVerified: req.user.isVerified || false,
  });

  review.replyCount = review.replies.length;
  await review.save();

  // Create notification for review author
  await Notification.create({
    user: review.user,
    type: "review_reply",
    title: `${req.user.name || "Seller"} replied to your review`,
    message: `Seller replied: "${content.substring(0, 50)}..."`,
    relatedTo: {
      model: "Review",
      id: reviewId,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, review, "Reply added successfully"));
});

// =============================================
// ✏️ UPDATE REPLY — Seller updates their reply
// =============================================
const updateReply = asyncHandler(async (req, res) => {
  const { reviewId, replyId } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Reply content is required");
  }

  const review = await Review.findById(reviewId).populate("product");

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  const reply = review.replies.id(replyId);

  if (!reply) {
    throw new ApiError(404, "Reply not found");
  }

  // Check if user is the one who created the reply
  if (reply.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only edit your own replies");
  }

  reply.content = content.trim();
  await review.save();

  return res
    .status(200)
    .json(new ApiResponse(200, review, "Reply updated successfully"));
});

// =============================================
// 🗑️ DELETE REPLY — Seller deletes their reply
// =============================================
const deleteReply = asyncHandler(async (req, res) => {
  const { reviewId, replyId } = req.params;

  const review = await Review.findById(reviewId).populate("product");

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  const reply = review.replies.id(replyId);

  if (!reply) {
    throw new ApiError(404, "Reply not found");
  }

  // Check if user is the one who created the reply
  if (reply.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own replies");
  }

  review.replies.id(replyId).deleteOne();
  review.replyCount = review.replies.length;
  await review.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Reply deleted successfully"));
});

export { createReview, getProductReviews, updateReview, deleteReview, createReply, updateReply, deleteReply };
