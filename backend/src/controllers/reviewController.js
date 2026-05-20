import Review from "../models/Review.js";
import Product from "../models/Product.js";
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

export { createReview, getProductReviews, updateReview, deleteReview };
