import SampleRequest from "../models/SampleRequest.js";
import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";

// GET /api/orders/buyer — buyer's order history (delivered sample requests + orders)
export const getBuyerOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  const sampleFilter = { buyer: req.user._id };
  if (status) sampleFilter.status = status;

  const [samples, total] = await Promise.all([
    SampleRequest.find(sampleFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .populate("product", "name images price unit category")
      .populate("seller", "name companyName businessLogo city state isVerified")
      .lean(),
    SampleRequest.countDocuments(sampleFilter),
  ]);

  const orders = samples.map((s) => ({
    _id: s._id,
    type: "sample",
    product: s.product,
    seller: s.seller,
    quantity: s.quantity,
    unitPrice: s.unitPrice,
    totalAmount: s.totalAmount,
    shippingAddress: s.shippingAddress,
    status: s.status,
    paymentStatus: s.paymentStatus,
    trackingNumber: s.trackingNumber,
    courierName: s.courierName,
    estimatedDelivery: s.estimatedDelivery,
    buyerNote: s.buyerNote,
    createdAt: s.createdAt,
  }));

  const pagination = getPaginationMeta(total, currentPage, pageLimit);
  return res.status(200).json(new ApiResponse(200, { orders, pagination }, "Orders fetched"));
});

// GET /api/orders/buyer/:id — single order detail
export const getBuyerOrderById = asyncHandler(async (req, res) => {
  const sample = await SampleRequest.findOne({ _id: req.params.id, buyer: req.user._id })
    .populate("product", "name images price unit category description")
    .populate("seller", "name companyName businessLogo city state isVerified phone email");

  if (!sample) throw new ApiError(404, "Order not found");
  return res.status(200).json(new ApiResponse(200, sample, "Order fetched"));
});

// POST /api/orders/:id/reorder — one-click repeat from a past sample order
export const reorder = asyncHandler(async (req, res) => {
  const original = await SampleRequest.findOne({ _id: req.params.id, buyer: req.user._id })
    .populate("product", "name images price allowSamples samplePrice sampleMinQty sampleMaxQty");

  if (!original) throw new ApiError(404, "Original order not found");
  if (!original.product) throw new ApiError(400, "Product no longer available");

  const { shippingAddress: overrideAddress, quantity: overrideQty, buyerNote } = req.body;

  const qty = overrideQty ? Number(overrideQty) : original.quantity;
  const unitPrice = original.unitPrice;
  const totalAmount = qty * unitPrice;
  const shippingAddress = overrideAddress || original.shippingAddress;

  const newRequest = await SampleRequest.create({
    buyer: req.user._id,
    seller: original.seller,
    product: original.product._id,
    quantity: qty,
    unitPrice,
    totalAmount,
    shippingAddress,
    buyerNote: buyerNote || original.buyerNote,
    status: "pending",
    paymentStatus: "pending",
  });

  const populated = await newRequest.populate([
    { path: "product", select: "name images price unit" },
    { path: "seller", select: "name companyName city state" },
  ]);

  return res.status(201).json(new ApiResponse(201, populated, "Reorder placed successfully"));
});
