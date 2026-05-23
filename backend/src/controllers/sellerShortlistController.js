import SellerShortlist from "../models/SellerShortlist.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const SELLER_SELECT = "name companyName businessLogo businessDescription city state isVerified averageRating totalReviews role";

// GET /wishlist/sellers — list all shortlisted suppliers
export const getSellerShortlist = asyncHandler(async (req, res) => {
  const { collection } = req.query;
  const filter = { user: req.user._id };
  if (collection && collection !== "All") filter.collectionName = collection;

  const items = await SellerShortlist.find(filter)
    .sort({ createdAt: -1 })
    .populate({ path: "seller", select: SELLER_SELECT });

  const active = items.filter((i) => i.seller && i.seller.role === "seller");

  return res.status(200).json(new ApiResponse(200, active, "Seller shortlist fetched"));
});

// POST /wishlist/sellers/:sellerId — add a seller
export const addSellerToShortlist = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;

  const seller = await User.findOne({ _id: sellerId, role: "seller" });
  if (!seller) throw new ApiError(404, "Seller not found");
  if (sellerId === req.user._id.toString()) throw new ApiError(400, "Cannot shortlist yourself");

  await SellerShortlist.findOneAndUpdate(
    { user: req.user._id, seller: sellerId },
    { user: req.user._id, seller: sellerId },
    { upsert: true, returnDocument: "after" }
  );

  return res.status(200).json(new ApiResponse(200, {}, "Seller saved to shortlist"));
});

// DELETE /wishlist/sellers/:sellerId — remove a seller
export const removeSellerFromShortlist = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  await SellerShortlist.findOneAndDelete({ user: req.user._id, seller: sellerId });
  return res.status(200).json(new ApiResponse(200, {}, "Seller removed from shortlist"));
});

// GET /wishlist/sellers/check/:sellerId — is this seller saved?
export const checkSellerShortlist = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const item = await SellerShortlist.findOne({ user: req.user._id, seller: sellerId });
  return res.status(200).json(new ApiResponse(200, { saved: !!item }, "Checked"));
});

// DELETE /wishlist/sellers — clear all saved sellers
export const clearSellerShortlist = asyncHandler(async (req, res) => {
  await SellerShortlist.deleteMany({ user: req.user._id });
  return res.status(200).json(new ApiResponse(200, {}, "Seller shortlist cleared"));
});

// GET /wishlist/sellers/collections — distinct collection names
export const getSellerShortlistCollections = asyncHandler(async (req, res) => {
  const cols = await SellerShortlist.distinct("collectionName", { user: req.user._id });
  return res.status(200).json(new ApiResponse(200, cols.filter(Boolean), "Collections fetched"));
});

// PATCH /wishlist/sellers/:itemId/note — update note or collection on a saved seller
export const updateSellerShortlistNote = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { note, collectionName } = req.body;

  const item = await SellerShortlist.findOne({ _id: itemId, user: req.user._id });
  if (!item) throw new ApiError(404, "Shortlist item not found");

  if (note !== undefined) item.note = note.slice(0, 500);
  if (collectionName !== undefined) item.collectionName = collectionName.trim().slice(0, 50) || "All";
  await item.save();

  return res.status(200).json(new ApiResponse(200, item, "Updated"));
});
