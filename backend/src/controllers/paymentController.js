import crypto from "crypto";
import Razorpay from "razorpay";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Payment from "../models/Payment.js";
import Subscription from "../models/Subscription.js";
import { SubscriptionPlan } from "../models/SubscriptionPlan.js";
import User from "../models/User.js";
import { generateSellerInvoice } from "../utils/invoiceGenerator.js";
import { htmlToPdf } from "../utils/pdfGenerator.js";
import { invoiceEmailTemplate } from "../templates/invoiceEmail.js";
import { sendEmail } from "../utils/sendEmail.js";
import { checkAndDowngradeExpiredSubscriptions } from "../jobs/subscriptionExpiryJob.js";

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "your_razorpay_key_id_here") {
    throw new ApiError(503, "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// POST /api/payments/create-order
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, paymentFor = "product", metadata = {} } = req.body;

  if (!amount || amount <= 0) {
    throw new ApiError(400, "Valid amount is required");
  }

  const razorpay = getRazorpay();

  const receipt = `rcpt_${Date.now()}_${req.user._id.toString().slice(-6)}`;
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(amount * 100), // paise
    currency: "INR",
    receipt,
    notes: { userId: req.user._id.toString(), paymentFor, ...metadata },
  });

  // Save pending payment record
  const payment = await Payment.create({
    razorpayOrderId: razorpayOrder.id,
    userId: req.user._id,
    amount,
    currency: "INR",
    paymentFor,
    status: "pending",
    metadata,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      orderId: razorpayOrder.id,
      paymentId: payment._id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    }, "Order created")
  );
});

// POST /api/payments/verify-payment/:id
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const { id: paymentDbId } = req.params;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(400, "razorpayOrderId, razorpayPaymentId and razorpaySignature are required");
  }

  // HMAC-SHA256 verification
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    throw new ApiError(400, "Payment verification failed — invalid signature");
  }

  const payment = await Payment.findById(paymentDbId);
  if (!payment) throw new ApiError(404, "Payment record not found");

  await payment.markCompleted(razorpayPaymentId, razorpaySignature);

  // Generate invoice for subscription payments
  if (payment.paymentFor === "subscription") {
    try {
      const user = await User.findById(payment.userId);
      const subscription = await Subscription.findOne({
        paymentId: payment._id,
        planFor: "seller"
      }).populate("plan");

      if (user && subscription && subscription.plan) {
        // Generate invoice number
        const invoiceNumber = await Payment.generateInvoiceNumber();

        // Generate invoice HTML
        const invoiceHtml = generateSellerInvoice(payment, user, subscription, subscription.plan);

        // Convert HTML to PDF
        const pdfResult = await htmlToPdf(invoiceHtml, invoiceNumber);

        // Update payment with invoice details
        payment.invoiceNumber = invoiceNumber;
        payment.invoiceUrl = pdfResult.url;
        payment.invoiceGeneratedAt = new Date();
        await payment.save();

        // Send invoice email
        const emailHtml = invoiceEmailTemplate(user, payment, subscription.plan, subscription, pdfResult.url);
        await sendEmail({
          to: user.email,
          subject: `Your IndiaMart Invoice - ${invoiceNumber}`,
          html: emailHtml
        });

        payment.invoiceSentAt = new Date();
        await payment.save();

        console.log(`Invoice ${invoiceNumber} generated and sent to ${user.email}`);
      }
    } catch (err) {
      console.error("Invoice generation error:", err);
      // Don't fail payment verification if invoice generation fails
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { verified: true, payment }, "Payment verified successfully")
  );
});

// GET /api/payments/history
const getPaymentHistory = asyncHandler(async (req, res) => {
  const { status, paymentFor, page = 1, limit = 10 } = req.query;
  const filter = { userId: req.user._id };
  if (status) filter.status = status;
  if (paymentFor) filter.paymentFor = paymentFor;

  const skip = (Number(page) - 1) * Number(limit);
  const [payments, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { payments, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, "Payment history fetched")
  );
});

// GET /api/payments/plans?planFor=seller|buyer
const getSubscriptionPlans = asyncHandler(async (req, res) => {
  const { planFor } = req.query;
  const filter = { isActive: true };
  if (planFor) filter.planFor = planFor;
  else filter.planFor = "seller"; // default: seller plans
  const plans = await SubscriptionPlan.find(filter).sort({ sortOrder: 1 });
  return res.status(200).json(new ApiResponse(200, { plans }, "Plans fetched"));
});

// GET /api/payments/buyer-plans
const getBuyerPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find({ isActive: true, planFor: "buyer" }).sort({ sortOrder: 1 });
  return res.status(200).json(new ApiResponse(200, { plans }, "Buyer plans fetched"));
});

// GET /api/payments/subscription?planFor=seller|buyer
const getActiveSubscription = asyncHandler(async (req, res) => {
  const { planFor } = req.query;
  const q = { userId: req.user._id, status: "active", endDate: { $gt: new Date() } };
  if (planFor) q.planFor = planFor;
  const sub = await Subscription.findOne(q).populate("plan").lean({ virtuals: true });
  return res.status(200).json(new ApiResponse(200, { subscription: sub }, "Subscription fetched"));
});

// GET /api/payments/buyer-subscription
const getBuyerSubscription = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({
    userId: req.user._id,
    planFor: "buyer",
    status: "active",
    endDate: { $gt: new Date() },
  }).populate("plan").lean({ virtuals: true });
  return res.status(200).json(new ApiResponse(200, { subscription: sub }, "Buyer subscription fetched"));
});

// POST /api/payments/subscribe-buyer
// Body: { planId } — for free plan: activates immediately; for paid: create razorpay order
const subscribeToBuyerPlan = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  if (!planId) throw new ApiError(400, "planId is required");

  const plan = await SubscriptionPlan.findById(planId);
  if (!plan || plan.planFor !== "buyer") throw new ApiError(404, "Buyer plan not found");

  // Cancel any existing buyer subscription
  await Subscription.updateMany(
    { userId: req.user._id, planFor: "buyer", status: "active" },
    { $set: { status: "cancelled", cancelledAt: new Date() } }
  );

  if (plan.price === 0) {
    // Free plan — activate immediately
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    const sub = await Subscription.create({
      userId: req.user._id,
      plan: plan._id,
      name: plan.name,
      price: 0,
      duration: plan.duration,
      planFor: "buyer",
      features: plan.features,
      status: "active",
      startDate,
      endDate,
    });

    return res.status(201).json(new ApiResponse(201, { subscription: sub }, "Free plan activated"));
  }

  // Paid plan — create Razorpay order
  const razorpay = getRazorpay();
  const receipt = `buyer_${Date.now()}_${req.user._id.toString().slice(-6)}`;
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(plan.price * 100),
    currency: "INR",
    receipt,
    notes: { userId: req.user._id.toString(), paymentFor: "buyer_subscription", planId: plan._id.toString() },
  });

  const payment = await Payment.create({
    razorpayOrderId: razorpayOrder.id,
    userId: req.user._id,
    amount: plan.price,
    currency: "INR",
    paymentFor: "buyer_subscription",
    status: "pending",
    metadata: { planId: plan._id, planName: plan.name },
  });

  return res.status(200).json(new ApiResponse(200, {
    orderId: razorpayOrder.id,
    paymentId: payment._id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: process.env.RAZORPAY_KEY_ID,
    plan: { _id: plan._id, name: plan.name, price: plan.price },
  }, "Payment order created"));
});

// POST /api/payments/verify-buyer-payment
const verifyBuyerPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId, planId } = req.body;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    throw new ApiError(400, "Payment verification failed — invalid signature");
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, "Payment record not found");
  await payment.markCompleted(razorpayPaymentId, razorpaySignature);

  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.duration);

  const sub = await Subscription.create({
    userId: req.user._id,
    plan: plan._id,
    name: plan.name,
    price: plan.price,
    duration: plan.duration,
    planFor: "buyer",
    features: plan.features,
    status: "active",
    startDate,
    endDate,
    paymentId: payment._id,
  });

  return res.status(200).json(new ApiResponse(200, { subscription: sub, payment }, "Subscription activated"));
});

// POST /api/payments/subscribe-seller
// Subscribe seller to plan (free or paid)
const subscribeSellerToPlan = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  if (!planId) throw new ApiError(400, "planId is required");

  const plan = await SubscriptionPlan.findById(planId);
  if (!plan || plan.planFor !== "seller") throw new ApiError(404, "Seller plan not found");

  // Cancel any existing seller subscription
  await Subscription.updateMany(
    { userId: req.user._id, planFor: "seller", status: "active" },
    { $set: { status: "cancelled", cancelledAt: new Date() } }
  );

  if (plan.price === 0) {
    // Free plan — activate immediately
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    const sub = await Subscription.create({
      userId: req.user._id,
      plan: plan._id,
      planFor: "seller",
      status: "active",
      startDate,
      endDate,
      autoRereturnDocument: 'before'
    });

    return res.status(201).json(new ApiResponse(201, { subscription: sub }, "Free plan activated"));
  }

  // Paid plan — create Razorpay order
  const razorpay = getRazorpay();
  const receipt = `seller_${Date.now()}_${req.user._id.toString().slice(-6)}`;
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(plan.price * 100),
    currency: "INR",
    receipt,
    notes: { userId: req.user._id.toString(), paymentFor: "subscription", planId: plan._id.toString() },
  });

  const payment = await Payment.create({
    razorpayOrderId: razorpayOrder.id,
    userId: req.user._id,
    amount: plan.price,
    currency: "INR",
    paymentFor: "subscription",
    status: "pending",
    metadata: { planId: plan._id, planName: plan.name }
  });

  return res.status(200).json(new ApiResponse(200, {
    orderId: razorpayOrder.id,
    paymentId: payment._id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: process.env.RAZORPAY_KEY_ID,
    plan: { _id: plan._id, name: plan.name, price: plan.price }
  }, "Payment order created"));
});

// POST /api/payments/verify-seller-payment
// Verify seller subscription payment and activate subscription
const verifySellerPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId, planId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !paymentId || !planId) {
    throw new ApiError(400, "All payment details are required");
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    throw new ApiError(400, "Payment verification failed");
  }

  // Mark payment as completed
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, "Payment record not found");
  await payment.markCompleted(razorpayPaymentId, razorpaySignature);

  // Get plan details
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");

  // Create subscription
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.duration);

  const sub = await Subscription.create({
    userId: req.user._id,
    plan: plan._id,
    planFor: "seller",
    status: "active",
    startDate,
    endDate,
    paymentId: payment._id,
    autoRereturnDocument: 'after'
  });

  return res.status(201).json(new ApiResponse(201, { subscription: sub, payment }, "Subscription activated"));
});

// POST /api/payments/cancel-subscription
const cancelSubscription = asyncHandler(async (req, res) => {
  const { planFor } = req.body;
  const q = { userId: req.user._id, status: "active" };
  if (planFor) q.planFor = planFor;
  const subscription = await Subscription.findOne(q);
  if (!subscription) throw new ApiError(404, "No active subscription found");
  subscription.status = "cancelled";
  subscription.cancelledAt = new Date();
  subscription.autoRenew = false;
  await subscription.save();
  return res.status(200).json(new ApiResponse(200, {}, "Subscription cancelled"));
});

// GET /api/payments/invoices — List all invoices for user
const getInvoices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    Payment.find({
      userId: req.user._id,
      invoiceNumber: { $exists: true, $ne: null },
      status: "completed"
    })
      .sort({ invoiceGeneratedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Payment.countDocuments({
      userId: req.user._id,
      invoiceNumber: { $exists: true, $ne: null },
      status: "completed"
    })
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      invoices: payments,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    }, "Invoices fetched")
  );
});

// GET /api/payments/invoice/:paymentId — Download invoice PDF
const downloadInvoice = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findOne({
    _id: paymentId,
    userId: req.user._id,
    invoiceNumber: { $exists: true, $ne: null }
  });

  if (!payment) throw new ApiError(404, "Invoice not found");
  if (!payment.invoiceUrl) throw new ApiError(400, "Invoice file not available");

  // In production, generate on-the-fly or serve from S3
  // For now, assume invoiceUrl is a local path or relative URL
  const filePath = payment.invoiceUrl;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${payment.invoiceNumber}.pdf"`);

  // If invoiceUrl is a file path, read and send it
  try {
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile(filePath);
    res.send(fileContent);
  } catch (err) {
    // If it's a URL, redirect or handle differently
    res.redirect(filePath);
  }
});

// POST /api/payments/resend-invoice/:paymentId — Resend invoice email
const resendInvoiceEmail = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findOne({
    _id: paymentId,
    userId: req.user._id,
    invoiceNumber: { $exists: true, $ne: null }
  });

  if (!payment) throw new ApiError(404, "Invoice not found");

  const user = await User.findById(payment.userId);
  if (!user) throw new ApiError(404, "User not found");

  const subscription = await Subscription.findOne({
    paymentId: payment._id
  }).populate("plan");

  if (!subscription) throw new ApiError(404, "Subscription not found");

  // Resend invoice email
  try {
    const emailHtml = invoiceEmailTemplate(user, payment, subscription.plan, subscription, payment.invoiceUrl);
    await sendEmail({
      to: user.email,
      subject: `Your IndiaMart Invoice - ${payment.invoiceNumber}`,
      html: emailHtml
    });

    payment.invoiceSentAt = new Date();
    await payment.save();

    return res.status(200).json(
      new ApiResponse(200, {}, "Invoice email sent successfully")
    );
  } catch (err) {
    throw new ApiError(500, "Failed to send invoice email");
  }
});

// POST /api/payments/cron/downgrade-expired — Manual trigger for subscription expiry check (Admin only)
const triggerSubscriptionExpiryCheck = asyncHandler(async (req, res) => {
  // Only allow admin users
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Only admins can trigger this endpoint");
  }

  try {
    await checkAndDowngradeExpiredSubscriptions();
    return res.status(200).json(
      new ApiResponse(200, {}, "Subscription expiry check completed successfully")
    );
  } catch (err) {
    throw new ApiError(500, "Error during expiry check: " + err.message);
  }
});

// ═══════════════════════════════════════════════════════════
// PRODUCT CHECKOUT PAYMENT APIs
// ═══════════════════════════════════════════════════════════

// POST /api/payments/checkout
export const createCheckoutOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, couponCode, paymentMethod = "razorpay" } = req.body;
  if (!items?.length) throw new ApiError(400, "Items are required");

  const Product = (await import("../models/Product.js")).default;
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId).populate("seller", "name");
    if (!product) throw new ApiError(404, `Product ${item.productId} not found`);
    const qty = item.quantity || 1;
    const unitPrice = product.price;
    subtotal += unitPrice * qty;
    orderItems.push({ product: product._id, name: product.name, image: product.images?.[0]?.url || "", qty, unitPrice, total: unitPrice * qty, seller: product.seller?._id });
  }

  const gstAmount = Math.round(subtotal * 0.18);
  const shippingCharge = subtotal >= 5000 ? 0 : 99;

  let discount = 0;
  let couponApplied = null;
  if (couponCode) {
    const code = couponCode.toUpperCase();
    if (code === "SAVE10") { discount = Math.round(subtotal * 0.10); couponApplied = "SAVE10"; }
    else if (code === "FLAT500" && subtotal >= 2000) { discount = 500; couponApplied = "FLAT500"; }
    else if (code === "SAVE5") { discount = Math.round(subtotal * 0.05); couponApplied = "SAVE5"; }
  }

  const totalAmount = subtotal + gstAmount + shippingCharge - discount;
  if (totalAmount <= 0) throw new ApiError(400, "Invalid order amount");

  const razorpay = getRazorpay();
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100),
    currency: "INR",
    receipt: `order_${Date.now()}_${req.user._id.toString().slice(-6)}`,
    notes: { userId: req.user._id.toString(), paymentFor: "product" },
  });

  const payment = await Payment.create({
    razorpayOrderId: razorpayOrder.id,
    userId: req.user._id,
    amount: totalAmount,
    currency: "INR",
    paymentFor: "product",
    status: "pending",
    paymentMethod,
    metadata: { subtotal, gstAmount, shippingCharge, discount, couponApplied, items: orderItems, shippingAddress },
  });

  return res.status(200).json(new ApiResponse(200, {
    orderId: razorpayOrder.id,
    paymentId: payment._id,
    amount: razorpayOrder.amount,
    currency: "INR",
    key: process.env.RAZORPAY_KEY_ID,
    breakdown: { subtotal, gstAmount, shippingCharge, discount, couponApplied, totalAmount },
  }, "Checkout order created"));
});

// POST /api/payments/verify-checkout
export const verifyCheckoutPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

  const expectedSig = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
  if (expectedSig !== razorpaySignature) throw new ApiError(400, "Payment verification failed");

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");

  payment.status = "completed";
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.completedAt = new Date();
  payment.invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  await payment.save();

  const Order = (await import("../models/Order.js")).default;
  const meta = payment.metadata || {};
  const orderItems = (meta.items || []).map(i => ({
    product: i.product, name: i.name, image: i.image, qty: i.qty, unitPrice: i.unitPrice, total: i.total,
  }));

  const order = await Order.create({
    buyer: req.user._id,
    seller: meta.items?.[0]?.seller,
    items: orderItems,
    totalAmount: payment.amount,
    paymentId: payment._id,
    paymentStatus: "paid",
    status: "confirmed",
    shippingAddress: meta.shippingAddress || {},
  });

  return res.status(200).json(new ApiResponse(200, { payment, order }, "Payment verified & order placed"));
});

// POST /api/payments/retry/:paymentId
export const retryPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.paymentId, userId: req.user._id, status: "failed" });
  if (!payment) throw new ApiError(404, "Failed payment not found");

  const razorpay = getRazorpay();
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(payment.amount * 100),
    currency: "INR",
    receipt: `retry_${Date.now()}`,
    notes: { paymentFor: payment.paymentFor },
  });

  payment.razorpayOrderId = razorpayOrder.id;
  payment.status = "pending";
  await payment.save();

  return res.status(200).json(new ApiResponse(200, {
    orderId: razorpayOrder.id, paymentId: payment._id,
    amount: razorpayOrder.amount, currency: "INR", key: process.env.RAZORPAY_KEY_ID,
  }, "Retry order created"));
});

// GET /api/payments/my-transactions
export const getMyTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const filter = { userId: req.user._id };
  if (status) filter.status = status;

  const [payments, total, stats] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Payment.countDocuments(filter),
    Payment.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } },
    ]),
  ]);

  return res.status(200).json(new ApiResponse(200, {
    payments, total, page: Number(page), pages: Math.ceil(total / Number(limit)), stats,
  }, "Transactions fetched"));
});

// GET /api/payments/seller/dashboard
export const getSellerPaymentDashboard = asyncHandler(async (req, res) => {
  const Order = (await import("../models/Order.js")).default;
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now - 180 * 24 * 60 * 60 * 1000);

  const [totalOrders, recentOrders, monthlyRevenue, statusBreakdown, chartData] = await Promise.all([
    Order.countDocuments({ seller: req.user._id }),
    Order.find({ seller: req.user._id }).sort({ createdAt: -1 }).limit(10).populate("buyer", "name email").lean(),
    Order.aggregate([
      { $match: { seller: req.user._id, paymentStatus: "paid", createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { seller: req.user._id } },
      { $group: { _id: "$paymentStatus", count: { $sum: 1 }, total: { $sum: "$totalAmount" } } },
    ]),
    Order.aggregate([
      { $match: { seller: req.user._id, paymentStatus: "paid", createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  return res.status(200).json(new ApiResponse(200, {
    totalOrders, recentOrders, chartData,
    monthlyRevenue: monthlyRevenue[0]?.total || 0,
    monthlyOrders: monthlyRevenue[0]?.count || 0,
    statusBreakdown,
  }, "Dashboard fetched"));
});

// GET /api/payments/seller/orders
export const getSellerOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, paymentStatus } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const Order = (await import("../models/Order.js")).default;

  const filter = { seller: req.user._id };
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate("buyer", "name email phone").populate("paymentId").lean(),
    Order.countDocuments(filter),
  ]);

  return res.status(200).json(new ApiResponse(200, {
    orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)),
  }, "Orders fetched"));
});

// GET /api/payments/admin/all
export const adminGetAllPayments = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") throw new ApiError(403, "Admin only");
  const { page = 1, limit = 15, status, paymentFor, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (status) filter.status = status;
  if (paymentFor) filter.paymentFor = paymentFor;

  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  const [payments, total, stats, totalRevenueArr, revenueChart] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate("userId", "name email role").lean(),
    Payment.countDocuments(filter),
    Payment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } }]),
    Payment.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Payment.aggregate([
      { $match: { status: "completed", createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  let filteredPayments = payments;
  if (search) {
    const s = search.toLowerCase();
    filteredPayments = payments.filter(p =>
      p.userId?.name?.toLowerCase().includes(s) ||
      p.userId?.email?.toLowerCase().includes(s) ||
      p.razorpayPaymentId?.includes(s) ||
      p.invoiceNumber?.includes(s)
    );
  }

  return res.status(200).json(new ApiResponse(200, {
    payments: filteredPayments, total, page: Number(page), pages: Math.ceil(total / Number(limit)),
    stats, totalRevenue: totalRevenueArr[0]?.total || 0, revenueChart,
  }, "Admin payments fetched"));
});

// POST /api/payments/admin/refund/:paymentId
export const adminProcessRefund = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") throw new ApiError(403, "Admin only");
  const payment = await Payment.findById(req.params.paymentId);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.status !== "completed") throw new ApiError(400, "Only completed payments can be refunded");

  payment.status = "refunded";
  await payment.save();

  return res.status(200).json(new ApiResponse(200, { payment }, "Payment refunded"));
});

export {
  createRazorpayOrder, verifyPayment, getPaymentHistory,
  getSubscriptionPlans, getBuyerPlans,
  getActiveSubscription, getBuyerSubscription,
  subscribeToBuyerPlan, verifyBuyerPayment,
  subscribeSellerToPlan, verifySellerPayment,
  cancelSubscription, getInvoices, downloadInvoice, resendInvoiceEmail,
  triggerSubscriptionExpiryCheck,
};

