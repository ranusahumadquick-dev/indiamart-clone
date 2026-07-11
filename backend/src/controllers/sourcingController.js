import SourcingRequest from "../models/SourcingRequest.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";

// POST /api/sourcing-requests — buyer submits a sourcing brief
export const createSourcingRequest = asyncHandler(async (req, res) => {
  const {
    title, description, category, quantity, unit,
    targetPrice, budget, timeline, urgency,
    preferredLocation, certificationRequired, additionalNotes,
  } = req.body;

  if (!title) throw new ApiError(400, "Title is required");

  const request = await SourcingRequest.create({
    buyer: req.user._id,
    title, description, category,
    quantity: quantity ? Number(quantity) : undefined,
    unit: unit || "Piece",
    targetPrice: targetPrice ? Number(targetPrice) : undefined,
    budget: budget ? Number(budget) : undefined,
    timeline: timeline || "Flexible",
    urgency: urgency || "medium",
    preferredLocation, certificationRequired, additionalNotes,
  });

  return res.status(201).json(new ApiResponse(201, request, "Sourcing request submitted"));
});

// GET /api/sourcing-requests/my — buyer's sourcing requests
export const getMySourcingRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = { buyer: req.user._id };
  if (status) filter.status = status;

  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  const [requests, total] = await Promise.all([
    SourcingRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean(),
    SourcingRequest.countDocuments(filter),
  ]);

  const pagination = getPaginationMeta(total, currentPage, pageLimit);

  return res.status(200).json(
    new ApiResponse(200, { requests, pagination }, "Sourcing requests fetched")
  );
});

// GET /api/sourcing-requests/:id — single request
export const getSourcingRequestById = asyncHandler(async (req, res) => {
  const request = await SourcingRequest.findById(req.params.id).populate("buyer", "name companyName email");
  if (!request) throw new ApiError(404, "Sourcing request not found");
  if (request.buyer._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Not authorized");
  }
  return res.status(200).json(new ApiResponse(200, request, "Sourcing request fetched"));
});

// PUT /api/sourcing-requests/:id/cancel — buyer cancels
export const cancelSourcingRequest = asyncHandler(async (req, res) => {
  const request = await SourcingRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, "Not found");
  if (request.buyer.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized");
  if (!["open", "in_progress"].includes(request.status)) throw new ApiError(400, "Cannot cancel at this stage");

  request.status = "cancelled";
  await request.save();

  return res.status(200).json(new ApiResponse(200, request, "Request cancelled"));
});

// PUT /api/sourcing-requests/:id — admin/AM updates status, adds note, shortlisted suppliers
export const updateSourcingRequest = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") throw new ApiError(403, "Admin only");

  const { status, managerNote, shortlistedSuppliers } = req.body;
  const request = await SourcingRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, "Not found");

  if (status) request.status = status;
  if (managerNote !== undefined) request.managerNote = managerNote;
  if (shortlistedSuppliers) request.shortlistedSuppliers = shortlistedSuppliers;
  if (status === "resolved") request.resolvedAt = new Date();

  await request.save();
  return res.status(200).json(new ApiResponse(200, request, "Updated"));
});
