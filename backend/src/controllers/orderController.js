import SampleRequest from "../models/SampleRequest.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";

// =============================================
// 📊 SELLER ORDERS — View orders they received
// =============================================

// GET /api/orders/seller — Seller's received orders
export const getSellerOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  console.log("🔍 [getSellerOrders] Logged-in seller ID:", req.user._id);

  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  // Build filter for seller
  const filter = { seller: req.user._id };
  if (status) filter.status = status;

  console.log("🔍 [getSellerOrders] Filter:", filter);

  const [orders, totalOrders] = await Promise.all([
    Order.find(filter)
      .populate("buyer", "name companyName businessLogo email phone city state")
      .populate("items.product", "name images price category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  console.log(`✅ [getSellerOrders] Found ${orders.length} orders for seller`);
  console.log("📦 Orders:", JSON.stringify(orders, null, 2));

  const pagination = getPaginationMeta(totalOrders, currentPage, pageLimit);

  return res.status(200).json(
    new ApiResponse(200, { orders, pagination }, `Fetched ${orders.length} seller orders`)
  );
});

// GET /api/orders/seller/:id — Single seller order detail
export const getSellerOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log("🔍 [getSellerOrderById] Seller ID:", req.user._id, "Order ID:", id);

  const order = await Order.findOne({ _id: id, seller: req.user._id })
    .populate("buyer", "name companyName email phone city state businessLogo isVerified")
    .populate("items.product", "name images price category description");

  if (!order) {
    console.log("❌ [getSellerOrderById] Order not found");
    throw new ApiError(404, "Order not found");
  }

  console.log("✅ [getSellerOrderById] Order found:", order._id);

  return res.status(200).json(new ApiResponse(200, order, "Order fetched"));
});

// PUT /api/orders/seller/:id/status — Update order status + tracking info
export const updateSellerOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, sellerNote, courier, trackingNumber } = req.body;

  if (status && !["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  console.log(`🔍 [updateOrderStatus] Order: ${id}, Status: ${status}, Courier: ${courier}, Tracking: ${trackingNumber}`);

  const order = await Order.findOne({ _id: id, seller: req.user._id });
  if (!order) {
    throw new ApiError(404, "Order not found or not yours");
  }

  // Update status if provided
  if (status) order.status = status;

  // Update seller notes if provided
  if (sellerNote !== undefined) order.sellerNote = sellerNote;

  // Update tracking info if provided
  if (courier || trackingNumber) {
    order.trackingInfo = {
      ...order.trackingInfo,
      ...(courier && { courier }),
      ...(trackingNumber && { trackingNumber }),
    };
  }

  await order.save();

  const populatedOrder = await order.populate([
    { path: "buyer", select: "name email phone companyName" },
    { path: "items.product", select: "name images price" },
  ]);

  console.log(`✅ [updateOrderStatus] Order ${id} updated - Status: ${status}, Tracking: ${trackingNumber}`);

  return res.status(200).json(new ApiResponse(200, populatedOrder, "Order updated successfully"));
});

// =============================================
// 👤 BUYER ORDERS — View orders they placed
// =============================================

// GET /api/orders/buyer — buyer's order history (delivered sample requests + orders)
export const getBuyerOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  console.log(`🔍 [getBuyerOrders] Buyer: ${req.user._id}, Status filter: ${status || "none"}`);

  const sampleFilter = { buyer: req.user._id };
  if (status) sampleFilter.status = status;

  console.log(`📋 [getBuyerOrders] Filter:`, JSON.stringify(sampleFilter));

  const [samples, total] = await Promise.all([
    SampleRequest.find(sampleFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .populate("product", "name images price unit category")
      .populate("seller", "name companyName businessLogo city state isVerified phone email")
      .lean(),
    SampleRequest.countDocuments(sampleFilter),
  ]);

  console.log(`✅ [getBuyerOrders] Found ${samples.length} samples (total: ${total})`);

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
  console.log(`📤 [getBuyerOrders] Returning ${orders.length} orders`);

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

// POST /api/orders/:id/cancel — Buyer cancels pending order
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  console.log(`🔍 [cancelOrder] Buyer ${req.user._id} canceling order ${id}`);

  const order = await SampleRequest.findOne({ _id: id, buyer: req.user._id });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only allow cancellation of pending orders
  if (order.status !== "pending") {
    throw new ApiError(400, `Cannot cancel ${order.status} order. Only pending orders can be cancelled.`);
  }

  order.status = "cancelled";
  order.buyerNote = reason || order.buyerNote;

  await order.save();

  console.log(`✅ [cancelOrder] Order ${id} cancelled by buyer`);

  return res.status(200).json(new ApiResponse(200, order, "Order cancelled successfully"));
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
