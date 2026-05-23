import SampleRequest from "../models/SampleRequest.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { createNotification } from "./notificationController.js";

// POST /api/samples — buyer creates sample request
const createSampleRequest = asyncHandler(async (req, res) => {
  const { productId, quantity, shippingAddress, buyerNote } = req.body;

  if (!productId || !quantity || !shippingAddress) {
    throw new ApiError(400, "productId, quantity and shippingAddress are required");
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, "Product not found");

  // Use sample-specific price if set, otherwise fall back to regular price
  const unitPrice = product.allowSamples && product.samplePrice ? product.samplePrice : product.price;
  const minQty = product.allowSamples && product.sampleMinQty ? product.sampleMinQty : (product.minOrderQuantity || 1);
  const maxQty = product.allowSamples && product.sampleMaxQty ? product.sampleMaxQty : 10000;

  if (quantity < minQty || quantity > maxQty) {
    throw new ApiError(400, `Quantity must be between ${minQty} and ${maxQty}`);
  }

  const totalAmount = unitPrice * quantity;

  // Auto-create a conversation between buyer and seller for this sample
  const conversation = await Conversation.create({
    participants: [req.user._id, product.seller],
    product: product._id,
    type: "sample",
    lastMessage: `Sample request for ${quantity} unit(s) of ${product.name}`,
    lastMessageAt: new Date(),
    unreadCount: { [product.seller.toString()]: 1 },
  });

  // System message in conversation
  await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: `I would like to order ${quantity} unit(s) of "${product.name}" at ₹${unitPrice}/unit.${buyerNote ? ` Note: ${buyerNote}` : ""}`,
    type: "sample_request",
    readBy: [req.user._id],
  });

  const sampleRequest = await SampleRequest.create({
    buyer: req.user._id,
    seller: product.seller,
    product: product._id,
    quantity,
    unitPrice,
    totalAmount,
    shippingAddress,
    buyerNote,
    conversation: conversation._id,
  });

  const populated = await SampleRequest.findById(sampleRequest._id)
    .populate("product", "name images samplePrice sampleLeadTime")
    .populate("seller", "name companyName")
    .populate("conversation");

  return res.status(201).json(new ApiResponse(201, populated, "Sample request created"));
});

// GET /api/samples/buyer — buyer's sample requests
const getBuyerSamples = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = { buyer: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [samples, total] = await Promise.all([
    SampleRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("product", "name images samplePrice sampleLeadTime allowSamples")
      .populate("seller", "name companyName isVerified"),
    SampleRequest.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { samples, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, "Buyer samples fetched")
  );
});

// GET /api/samples/seller — seller's incoming sample requests
const getSellerSamples = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = { seller: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [samples, total] = await Promise.all([
    SampleRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("product", "name images samplePrice")
      .populate("buyer", "name email phone"),
    SampleRequest.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { samples, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, "Seller samples fetched")
  );
});

// PUT /api/samples/:id/accept — seller accepts
const acceptSample = asyncHandler(async (req, res) => {
  const sample = await SampleRequest.findById(req.params.id).populate("buyer", "name email").populate("product", "name");
  if (!sample) throw new ApiError(404, "Sample request not found");
  if (sample.seller.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized");
  if (sample.status !== "pending") throw new ApiError(400, `Cannot accept a ${sample.status} request`);

  sample.status = "accepted";
  sample.sellerNote = req.body.sellerNote || "";
  await sample.save();

  // Notify buyer via conversation
  if (sample.conversation) {
    await Message.create({
      conversation: sample.conversation,
      sender: req.user._id,
      text: `Your sample request has been accepted! Please proceed to payment.${sample.sellerNote ? ` Note: ${sample.sellerNote}` : ""}`,
      type: "system",
      readBy: [req.user._id],
    });
    await Conversation.findByIdAndUpdate(sample.conversation, {
      lastMessage: "Sample request accepted — proceed to payment",
      lastMessageAt: new Date(),
      $inc: { [`unreadCount.${sample.buyer._id || sample.buyer}`]: 1 },
    });
  }

  const buyerName = sample.buyer?.name || "there";
  const productName = sample.product?.name || "the product";
  const sellerName = req.user.companyName || req.user.name;
  const samplesLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/buyer/samples`;

  await createNotification({
    userId: sample.buyer._id || sample.buyer,
    type: "sample_status",
    title: "Sample request accepted!",
    message: `${sellerName} accepted your sample request for ${productName}. Proceed to payment.`,
    link: "/buyer/samples",
  });

  try {
    if (sample.buyer?.email) {
      await sendEmail({
        to: sample.buyer.email,
        subject: `Your sample request was accepted — ${productName}`,
        html: `
          <p>Hi ${buyerName},</p>
          <p><strong>${sellerName}</strong> has accepted your sample request for <strong>${productName}</strong>.</p>
          ${sample.sellerNote ? `<p>Seller note: ${sample.sellerNote}</p>` : ""}
          <p>Please proceed to payment to get your samples shipped.</p>
          <p><a href="${samplesLink}" style="color:#1a56db;">View your sample requests →</a></p>
        `,
      });
    }
  } catch { /* non-critical */ }

  return res.status(200).json(new ApiResponse(200, sample, "Sample request accepted"));
});

// PUT /api/samples/:id/reject — seller rejects
const rejectSample = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  const sample = await SampleRequest.findById(req.params.id).populate("buyer", "name email").populate("product", "name");
  if (!sample) throw new ApiError(404, "Sample request not found");
  if (sample.seller.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized");
  if (sample.status !== "pending") throw new ApiError(400, `Cannot reject a ${sample.status} request`);

  sample.status = "rejected";
  sample.rejectionReason = rejectionReason || "";
  await sample.save();

  if (sample.conversation) {
    await Message.create({
      conversation: sample.conversation,
      sender: req.user._id,
      text: `Sorry, your sample request has been declined.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
      type: "system",
      readBy: [req.user._id],
    });
  }

  const buyerName = sample.buyer?.name || "there";
  const productName = sample.product?.name || "the product";
  const sellerName = req.user.companyName || req.user.name;

  await createNotification({
    userId: sample.buyer._id || sample.buyer,
    type: "sample_status",
    title: "Sample request declined",
    message: `${sellerName} declined your sample request for ${productName}.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
    link: "/buyer/samples",
  });

  try {
    if (sample.buyer?.email) {
      await sendEmail({
        to: sample.buyer.email,
        subject: `Sample request declined — ${productName}`,
        html: `
          <p>Hi ${buyerName},</p>
          <p>Unfortunately, <strong>${sellerName}</strong> has declined your sample request for <strong>${productName}</strong>.</p>
          ${rejectionReason ? `<p>Reason: ${rejectionReason}</p>` : ""}
          <p>You can browse other suppliers for similar products.</p>
          <p><a href="${process.env.CLIENT_URL || "http://localhost:3000"}/products" style="color:#1a56db;">Browse products →</a></p>
        `,
      });
    }
  } catch { /* non-critical */ }

  return res.status(200).json(new ApiResponse(200, sample, "Sample request rejected"));
});

// PUT /api/samples/:id/ship — seller marks shipped
const shipSample = asyncHandler(async (req, res) => {
  const { trackingNumber, courierName, estimatedDelivery } = req.body;
  if (!trackingNumber || !courierName) throw new ApiError(400, "trackingNumber and courierName are required");

  const sample = await SampleRequest.findById(req.params.id).populate("buyer", "name email").populate("product", "name");
  if (!sample) throw new ApiError(404, "Sample request not found");
  if (sample.seller.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized");
  if (sample.status !== "accepted" || sample.paymentStatus !== "paid") {
    throw new ApiError(400, "Sample must be accepted and paid before shipping");
  }

  sample.status = "shipped";
  sample.trackingNumber = trackingNumber;
  sample.courierName = courierName;
  if (estimatedDelivery) sample.estimatedDelivery = new Date(estimatedDelivery);
  await sample.save();

  if (sample.conversation) {
    await Message.create({
      conversation: sample.conversation,
      sender: req.user._id,
      text: `Your sample has been shipped! Tracking: ${trackingNumber} via ${courierName}.`,
      type: "system",
      readBy: [req.user._id],
    });
  }

  const buyerName = sample.buyer?.name || "there";
  const productName = sample.product?.name || "your product";
  const sellerName = req.user.companyName || req.user.name;

  await createNotification({
    userId: sample.buyer._id || sample.buyer,
    type: "sample_status",
    title: "Your sample has been shipped!",
    message: `${sellerName} shipped your sample of ${productName}. Tracking: ${trackingNumber} via ${courierName}.`,
    link: "/buyer/samples",
  });

  try {
    if (sample.buyer?.email) {
      const eta = estimatedDelivery
        ? `Expected delivery: ${new Date(estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
        : "";
      await sendEmail({
        to: sample.buyer.email,
        subject: `Your sample has been shipped — ${productName}`,
        html: `
          <p>Hi ${buyerName},</p>
          <p>Great news! <strong>${sellerName}</strong> has shipped your sample of <strong>${productName}</strong>.</p>
          <p><strong>Tracking number:</strong> ${trackingNumber}<br/>
          <strong>Courier:</strong> ${courierName}<br/>
          ${eta}</p>
          <p><a href="${process.env.CLIENT_URL || "http://localhost:3000"}/buyer/samples" style="color:#1a56db;">Track your sample →</a></p>
        `,
      });
    }
  } catch { /* non-critical */ }

  return res.status(200).json(new ApiResponse(200, sample, "Sample marked as shipped"));
});

// PUT /api/samples/:id/deliver — buyer confirms delivery
const confirmDelivery = asyncHandler(async (req, res) => {
  const sample = await SampleRequest.findById(req.params.id);
  if (!sample) throw new ApiError(404, "Sample request not found");
  if (sample.buyer.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized");
  if (sample.status !== "shipped") throw new ApiError(400, "Sample must be shipped first");

  sample.status = "delivered";
  await sample.save();

  return res.status(200).json(new ApiResponse(200, sample, "Delivery confirmed"));
});

// POST /api/samples/:id/pay — buyer pays for accepted sample
const paySample = asyncHandler(async (req, res) => {
  const sample = await SampleRequest.findById(req.params.id).populate("product", "name images");
  if (!sample) throw new ApiError(404, "Sample request not found");
  if (sample.buyer.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized");
  if (sample.status !== "accepted") throw new ApiError(400, "Sample must be accepted before payment");
  if (sample.paymentStatus === "paid") throw new ApiError(400, "Sample already paid");

  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "your_razorpay_key_id_here") {
    throw new ApiError(503, "Payment gateway not configured");
  }

  const { default: Razorpay } = await import("razorpay");
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const receipt = `sample_${sample._id.toString().slice(-8)}_${Date.now().toString(36)}`;
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(sample.totalAmount * 100),
    currency: "INR",
    receipt,
    notes: { sampleRequestId: sample._id.toString(), userId: req.user._id.toString() },
  });

  const payment = await Payment.create({
    razorpayOrderId: razorpayOrder.id,
    userId: req.user._id,
    amount: sample.totalAmount,
    currency: "INR",
    paymentFor: "product",
    status: "pending",
    metadata: { sampleRequestId: sample._id.toString() },
  });

  sample.paymentId = payment._id;
  await sample.save();

  return res.status(200).json(
    new ApiResponse(200, {
      orderId: razorpayOrder.id,
      paymentId: payment._id,
      amount: razorpayOrder.amount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      sampleRequest: sample,
    }, "Payment order created")
  );
});

// POST /api/samples/:id/verify-pay — verify payment + auto-create Order
const verifySamplePayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const sample = await SampleRequest.findById(req.params.id).populate("product", "name images");
  if (!sample) throw new ApiError(404, "Sample request not found");
  if (sample.buyer.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized");

  const crypto = await import("crypto");
  const expectedSig = crypto.default
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSig !== razorpaySignature) throw new ApiError(400, "Payment verification failed");

  const payment = await Payment.findById(sample.paymentId);
  if (payment) await payment.markCompleted(razorpayPaymentId, razorpaySignature);

  sample.paymentStatus = "paid";
  await sample.save();

  // Auto-create Order from sample
  const order = await Order.create({
    buyer: sample.buyer,
    seller: sample.seller,
    sampleRequest: sample._id,
    items: [{
      product: sample.product._id,
      name: sample.product.name,
      image: sample.product.images?.[0]?.url || "",
      qty: sample.quantity,
      unitPrice: sample.unitPrice,
      total: sample.totalAmount,
    }],
    totalAmount: sample.totalAmount,
    status: "confirmed",
    paymentId: sample.paymentId,
    paymentStatus: "paid",
    shippingAddress: sample.shippingAddress,
  });

  return res.status(200).json(new ApiResponse(200, { sample, order }, "Payment verified and order created"));
});

export {
  createSampleRequest,
  getBuyerSamples,
  getSellerSamples,
  acceptSample,
  rejectSample,
  shipSample,
  confirmDelivery,
  paySample,
  verifySamplePayment,
};
