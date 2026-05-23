import BuyRequirement from "../models/BuyRequirement.js";
import Category from "../models/Category.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";

// ========================================
// POST BUY REQUIREMENT CONTROLLERS
// ========================================

/**
 * Create Buy Requirement
 * POST /api/buy-requirements
 * Auth: Required (Buyers only)
 */
export const createBuyRequirement = asyncHandler(async (req, res) => {
  const {
    productName,
    categoryId,
    subCategoryId,
    description,
    quantityRequired,
    unit,
    budgetMin,
    budgetMax,
    deliveryLocation,
    deliveryTimeline,
    isPrivate,
    invitedSellers,
    privateNote,
  } = req.body;

  // Validate required fields
  if (!productName || !categoryId || !quantityRequired) {
    throw new ApiError(400, "Product name, category, and quantity are required");
  }

  if (isPrivate && (!invitedSellers || invitedSellers.length === 0)) {
    throw new ApiError(400, "Private requirements must invite at least one seller");
  }

  // Verify category exists
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Create buy requirement
  const buyRequirement = await BuyRequirement.create({
    buyer: req.user._id,
    productName,
    category: categoryId,
    subCategory: subCategoryId || null,
    description,
    quantityRequired,
    unit: unit || "Piece",
    budgetMin,
    budgetMax,
    deliveryLocation,
    deliveryTimeline: deliveryTimeline || "Flexible",
    isPrivate: !!isPrivate,
    isPublic: !isPrivate,
    invitedSellers: isPrivate ? (invitedSellers || []) : [],
    privateNote: isPrivate ? privateNote : undefined,
  });

  // Populate references
  const populatedReq = await BuyRequirement.findById(buyRequirement._id)
    .populate("buyer", "name companyName email phone")
    .populate("category", "name")
    .populate("subCategory", "name");

  return res.status(201).json(
    new ApiResponse(201, populatedReq, "Buy requirement posted successfully")
  );
});

/**
 * Get All Active Buy Requirements
 * GET /api/buy-requirements
 * Filters: category, city, status, deliveryTimeline
 * Public endpoint (no auth required)
 */
export const getBuyRequirements = asyncHandler(async (req, res) => {
  const {
    categoryId,
    city,
    status = "active",
    deliveryTimeline,
    page = 1,
    limit = 20,
  } = req.query;

  // Build filters
  const filters = { isPublic: true };
  if (status) filters.status = status;
  if (categoryId) filters.category = categoryId;
  if (city) filters["deliveryLocation.city"] = new RegExp(city, "i");
  if (deliveryTimeline) filters.deliveryTimeline = deliveryTimeline;

  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  // Auto-expire priority: treat isPriority as false if past expiry
  const now = new Date();

  // Get buy requirements — active priority items first, then by date
  const [buyRequirements, totalCount] = await Promise.all([
    BuyRequirement.find(filters)
      .populate("buyer", "name companyName email phone city state")
      .populate("category", "name")
      .populate("subCategory", "name")
      .sort({ isPriority: -1, priorityExpiresAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean(),
    BuyRequirement.countDocuments(filters),
  ]);

  // Mark expired priorities as false in response (don't write to DB on every read)
  buyRequirements.forEach((r) => {
    if (r.isPriority && r.priorityExpiresAt && new Date(r.priorityExpiresAt) < now) {
      r.isPriority = false;
    }
  });

  const pagination = getPaginationMeta(totalCount, currentPage, pageLimit);

  return res.status(200).json(
    new ApiResponse(
      200,
      { buyRequirements, pagination },
      "Buy requirements fetched successfully"
    )
  );
});

/**
 * Get Single Buy Requirement
 * GET /api/buy-requirements/:requirementId
 */
export const getBuyRequirementById = asyncHandler(async (req, res) => {
  const { requirementId } = req.params;

  const buyRequirement = await BuyRequirement.findById(requirementId)
    .populate("buyer", "name companyName email phone city state")
    .populate("category", "name")
    .populate("subCategory", "name")
    .populate("responses.supplier", "name companyName email city state isVerified businessType yearEstablished averageRating numReviews");

  if (!buyRequirement) {
    throw new ApiError(404, "Buy requirement not found");
  }

  return res.status(200).json(
    new ApiResponse(200, buyRequirement, "Buy requirement fetched successfully")
  );
});

/**
 * Get Buyer's Buy Requirements
 * GET /api/buy-requirements/user/my-requirements
 * Auth: Required (Buyers only)
 */
export const getMyBuyRequirements = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filters = { buyer: req.user._id };
  if (status) filters.status = status;

  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  const [buyRequirements, totalCount] = await Promise.all([
    BuyRequirement.find(filters)
      .populate("category", "name")
      .populate("subCategory", "name")
      .populate("responses.supplier", "name companyName email")
      .populate("selectedSupplier", "name companyName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    BuyRequirement.countDocuments(filters),
  ]);

  const pagination = getPaginationMeta(totalCount, currentPage, pageLimit);

  return res.status(200).json(
    new ApiResponse(
      200,
      { buyRequirements, pagination },
      "Your buy requirements fetched successfully"
    )
  );
});

/**
 * Update Buy Requirement
 * PUT /api/buy-requirements/:requirementId
 * Auth: Required (Only buyer who created it)
 */
export const updateBuyRequirement = asyncHandler(async (req, res) => {
  const { requirementId } = req.params;
  const updates = req.body;

  const buyRequirement = await BuyRequirement.findById(requirementId);

  if (!buyRequirement) {
    throw new ApiError(404, "Buy requirement not found");
  }

  if (buyRequirement.buyer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only update your own requirements");
  }

  // Only allow certain fields to be updated
  const allowedUpdates = [
    "productName",
    "description",
    "quantityRequired",
    "unit",
    "budgetMin",
    "budgetMax",
    "deliveryTimeline",
    "status",
  ];

  allowedUpdates.forEach(field => {
    if (updates[field]) buyRequirement[field] = updates[field];
  });

  await buyRequirement.save();

  return res.status(200).json(
    new ApiResponse(200, buyRequirement, "Buy requirement updated successfully")
  );
});

/**
 * Delete Buy Requirement
 * DELETE /api/buy-requirements/:requirementId
 * Auth: Required (Only buyer who created it)
 */
export const deleteBuyRequirement = asyncHandler(async (req, res) => {
  const { requirementId } = req.params;

  const buyRequirement = await BuyRequirement.findById(requirementId);

  if (!buyRequirement) {
    throw new ApiError(404, "Buy requirement not found");
  }

  if (buyRequirement.buyer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own requirements");
  }

  await BuyRequirement.findByIdAndDelete(requirementId);

  return res.status(200).json(
    new ApiResponse(200, null, "Buy requirement deleted successfully")
  );
});

/**
 * Respond to Buy Requirement
 * POST /api/buy-requirements/:requirementId/respond
 * Auth: Required (Sellers only)
 * Body: message, quotedPrice
 */
export const respondToBuyRequirement = asyncHandler(async (req, res) => {
  const { requirementId } = req.params;
  const { message, quotedPrice, moq, deliveryDays, validityDays } = req.body;

  if (!message) {
    throw new ApiError(400, "Response message is required");
  }

  const buyRequirement = await BuyRequirement.findById(requirementId);

  if (!buyRequirement) {
    throw new ApiError(404, "Buy requirement not found");
  }

  // Private requirements: only invited sellers can respond
  if (buyRequirement.isPrivate) {
    const isInvited = buyRequirement.invitedSellers.some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (!isInvited) throw new ApiError(403, "You are not invited to respond to this requirement");
  }

  // Check if seller already responded
  const alreadyResponded = buyRequirement.responses.some(
    r => r.supplier.toString() === req.user._id.toString()
  );

  if (alreadyResponded) {
    throw new ApiError(400, "You have already responded to this requirement");
  }

  // Add response with full quote details
  buyRequirement.responses.push({
    supplier: req.user._id,
    message,
    quotedPrice: quotedPrice ? Number(quotedPrice) : undefined,
    moq: moq ? Number(moq) : undefined,
    deliveryDays: deliveryDays ? Number(deliveryDays) : undefined,
    validityDays: validityDays ? Number(validityDays) : 7,
  });

  await buyRequirement.save();

  // Populate with rich supplier data for comparison
  const updated = await BuyRequirement.findById(requirementId)
    .populate("responses.supplier", "name companyName email city state isVerified businessType yearEstablished averageRating numReviews");

  return res.status(200).json(
    new ApiResponse(200, updated, "Response submitted successfully")
  );
});

/**
 * Boost Buy Requirement — Priority Response Pro
 * POST /api/buy-requirements/:requirementId/boost
 * Auth: Required (Only buyer who created it)
 * Body: { duration? } — duration in days (default 7)
 */
export const boostBuyRequirement = asyncHandler(async (req, res) => {
  const { requirementId } = req.params;
  const { duration = 7 } = req.body;

  const buyRequirement = await BuyRequirement.findById(requirementId);

  if (!buyRequirement) {
    throw new ApiError(404, "Buy requirement not found");
  }

  if (buyRequirement.buyer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only boost your own requirements");
  }

  if (buyRequirement.status !== "active") {
    throw new ApiError(400, "Only active requirements can be boosted");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + Number(duration) * 24 * 60 * 60 * 1000);

  buyRequirement.isPriority = true;
  buyRequirement.priorityBoostedAt = now;
  buyRequirement.priorityExpiresAt = expiresAt;
  await buyRequirement.save();

  return res.status(200).json(
    new ApiResponse(200, buyRequirement, `Requirement boosted for ${duration} days!`)
  );
});

/**
 * Close Buy Requirement (Buyer selects a supplier)
 * PUT /api/buy-requirements/:requirementId/close
 * Auth: Required (Only buyer who created it)
 * Body: selectedSupplierId
 */
export const closeBuyRequirement = asyncHandler(async (req, res) => {
  const { requirementId } = req.params;
  const { selectedSupplierId } = req.body;

  if (!selectedSupplierId) {
    throw new ApiError(400, "Selected supplier ID is required");
  }

  const buyRequirement = await BuyRequirement.findById(requirementId);

  if (!buyRequirement) {
    throw new ApiError(404, "Buy requirement not found");
  }

  if (buyRequirement.buyer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only close your own requirements");
  }

  // Verify the supplier has responded
  const hasResponded = buyRequirement.responses.some(
    r => r.supplier.toString() === selectedSupplierId
  );

  if (!hasResponded) {
    throw new ApiError(400, "Selected supplier has not responded");
  }

  buyRequirement.selectedSupplier = selectedSupplierId;
  buyRequirement.status = "fulfilled";
  await buyRequirement.save();

  const updated = await BuyRequirement.findById(requirementId)
    .populate("selectedSupplier", "name companyName email");

  return res.status(200).json(
    new ApiResponse(200, updated, "Buy requirement closed successfully")
  );
});

/**
 * Get Private Requirements Invited To (Seller)
 * GET /api/buy-requirements/seller/invitations
 * Auth: Required (Seller role)
 */
export const getMyInvitations = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  const filter = { isPrivate: true, invitedSellers: req.user._id };
  if (status) filter.status = status;

  const [requirements, total] = await Promise.all([
    BuyRequirement.find(filter)
      .populate("buyer", "name companyName email phone city state")
      .populate("category", "name")
      .populate("responses.supplier", "name companyName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean(),
    BuyRequirement.countDocuments(filter),
  ]);

  const pagination = getPaginationMeta(total, currentPage, pageLimit);
  return res.status(200).json(
    new ApiResponse(200, { requirements, pagination }, "Private invitations fetched")
  );
});

/**
 * Invite Additional Sellers to a Private Requirement
 * POST /api/buy-requirements/:requirementId/invite
 * Auth: Required (Only buyer who created it)
 * Body: { sellerIds: [...] }
 */
export const inviteMoreSellers = asyncHandler(async (req, res) => {
  const { requirementId } = req.params;
  const { sellerIds } = req.body;

  if (!sellerIds || sellerIds.length === 0) {
    throw new ApiError(400, "Provide at least one seller ID");
  }

  const req_ = await BuyRequirement.findById(requirementId);
  if (!req_) throw new ApiError(404, "Requirement not found");
  if (req_.buyer.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized");
  if (!req_.isPrivate) throw new ApiError(400, "This requirement is not private");

  // Merge without duplicates
  const existing = req_.invitedSellers.map((id) => id.toString());
  const newOnes = sellerIds.filter((id) => !existing.includes(id));
  req_.invitedSellers.push(...newOnes);
  await req_.save();

  const updated = await BuyRequirement.findById(requirementId)
    .populate("invitedSellers", "name companyName email city isVerified");

  return res.status(200).json(
    new ApiResponse(200, updated, `${newOnes.length} seller(s) invited`)
  );
});
