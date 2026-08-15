import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// GET /wishlist — Get all saved products for the logged-in user
export const getWishlist = asyncHandler(async (req, res) => {
  const { collection } = req.query;
  const filter = { user: req.user._id };
  if (collection && collection !== "All") filter.collectionName = collection;

  const items = await Wishlist.find(filter)
    .sort({ createdAt: -1 })
    .populate({
      path: "product",
      select: "name price comparePrice images seller city state companyName averageRating numReviews minOrderQuantity priceUnit isVerified category isActive",
    });

  const active = items.filter((i) => i.product && i.product.isActive !== false);

  return res.status(200).json(new ApiResponse(200, active, "Wishlist fetched"));
});

// POST /wishlist/:productId — Add product to wishlist
export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  // upsert — silently succeed if already exists
  await Wishlist.findOneAndUpdate(
    { user: req.user._id, product: productId },
    { user: req.user._id, product: productId },
    { upsert: true, returnDocument: 'after' }
  );

  return res.status(200).json(new ApiResponse(200, {}, "Added to wishlist"));
});

// DELETE /wishlist/:productId — Remove product from wishlist
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  await Wishlist.findOneAndDelete({ user: req.user._id, product: productId });

  return res.status(200).json(new ApiResponse(200, {}, "Removed from wishlist"));
});

// GET /wishlist/check/:productId — Check if a product is in wishlist
export const checkWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const item = await Wishlist.findOne({ user: req.user._id, product: productId });

  return res.status(200).json(new ApiResponse(200, { saved: !!item }, "Checked"));
});

// DELETE /wishlist — Clear entire wishlist
export const clearWishlist = asyncHandler(async (req, res) => {
  await Wishlist.deleteMany({ user: req.user._id });

  return res.status(200).json(new ApiResponse(200, {}, "Wishlist cleared"));
});

// PATCH /wishlist/:itemId/note — Update note on a wishlist item
export const updateWishlistNote = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { note, collectionName } = req.body;

  const item = await Wishlist.findOne({ _id: itemId, user: req.user._id });
  if (!item) throw new ApiError(404, "Wishlist item not found");

  if (note !== undefined) item.note = note.slice(0, 500);
  if (collectionName !== undefined) item.collectionName = collectionName.trim().slice(0, 50) || "All";
  await item.save();

  return res.status(200).json(new ApiResponse(200, item, "Updated"));
});

// GET /wishlist/collections — Distinct collection names for this user
export const getWishlistCollections = asyncHandler(async (req, res) => {
  const cols = await Wishlist.distinct("collectionName", { user: req.user._id });
  return res.status(200).json(new ApiResponse(200, cols.filter(Boolean), "Collections fetched"));
});

