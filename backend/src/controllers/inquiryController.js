import Inquiry from "../models/Inquiry.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import { sendEmail } from "../utils/sendEmail.js";
import { createNotification } from "./notificationController.js";

// =============================================
// 📩 CREATE INQUIRY — Buyer sends inquiry
// =============================================
const createInquiry = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { message, quantityRequired, preferredDeliveryLocation, subject } =
    req.body;

  if (!message) {
    throw new ApiError(400, "Message is required");
  }

  // Find the product to get seller info
  const product = await Product.findById(productId).populate(
    "seller",
    "name email"
  );

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const inquiry = await Inquiry.create({
    buyer: req.user._id,
    buyerName: req.user.name,
    buyerEmail: req.user.email,
    buyerPhone: req.user.phone,
    product: productId,
    seller: product.seller._id,
    subject,
    message,
    quantityRequired,
    preferredDeliveryLocation,
  });

  // Increment inquiry count on product
  await Product.findByIdAndUpdate(productId, { $inc: { inquiryCount: 1 } });

  // Send email notification to seller (best-effort)
  try {
    const sellerEmail = product.seller?.email;
    if (sellerEmail) {
      const productLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/products/${product.slug || product._id}`;
      const html = `
        <p>Hi ${product.seller?.name || "Seller"},</p>
        <p>You have received a new inquiry for your product <strong>${product.name}</strong>.</p>
        <p><strong>From:</strong> ${req.user.name} (${req.user.email} / ${req.user.phone})</p>
        <p><strong>Message:</strong><br/>${message}</p>
        <p><a href="${productLink}">View product</a> | <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/seller/inbox">View inbox</a></p>
      `;

      await sendEmail({
        to: sellerEmail,
        subject: `New enquiry for ${product.name}`,
        html,
      });
    }
  } catch (err) {
    console.warn("Failed to send inquiry notification email:", err?.message || err);
  }

  return res
    .status(201)
    .json(new ApiResponse(201, inquiry, "Inquiry sent successfully"));
});

// =============================================
// 📥 GET SELLER INQUIRIES — Seller sees all inquiries
// =============================================
const getSellerInquiries = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filters = { seller: req.user._id };
  if (status) filters.status = status;

  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  const [inquiries, totalInquiries] = await Promise.all([
    Inquiry.find(filters)
      .populate("product", "name images price")
      .populate("buyer", "name email phone avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    Inquiry.countDocuments(filters),
  ]);

  const pagination = getPaginationMeta(
    totalInquiries,
    currentPage,
    pageLimit
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      { inquiries, pagination },
      "Inquiries fetched successfully"
    )
  );
});

// =============================================
// 📤 GET BUYER INQUIRIES — Buyer sees their inquiries
// =============================================
const getBuyerInquiries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;

  const baseFilter = { buyer: req.user._id };

  // Status filter
  if (status && status !== "all") baseFilter.status = status;

  // Search filter — match product name or seller company name via populate
  // We'll do in-memory filter if search provided (simple approach for small datasets)
  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  const [inquiries, totalInquiries, stats] = await Promise.all([
    Inquiry.find(baseFilter)
      .populate("product", "name images price")
      .populate("seller", "name companyName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    Inquiry.countDocuments(baseFilter),
    // Stats counts across all statuses
    Inquiry.aggregate([
      { $match: { buyer: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  // Apply search client-side after populate
  let filtered = inquiries;
  if (search) {
    const q = search.toLowerCase();
    filtered = inquiries.filter(
      (inq) =>
        inq.product?.name?.toLowerCase().includes(q) ||
        inq.seller?.companyName?.toLowerCase().includes(q) ||
        inq.seller?.name?.toLowerCase().includes(q) ||
        inq.message?.toLowerCase().includes(q)
    );
  }

  // Build stats map
  const statsMap = { all: 0, new: 0, read: 0, replied: 0, closed: 0 };
  stats.forEach(({ _id, count }) => {
    if (_id) statsMap[_id] = count;
    statsMap.all += count;
  });

  const pagination = getPaginationMeta(totalInquiries, currentPage, pageLimit);

  return res.status(200).json(
    new ApiResponse(
      200,
      { inquiries: filtered, pagination, stats: statsMap },
      "Your inquiries fetched successfully"
    )
  );
});

// =============================================
// 🔒 CLOSE INQUIRY — Buyer marks inquiry as closed
// =============================================
const closeInquiry = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const inquiry = await Inquiry.findOne({ _id: id, buyer: req.user._id });
  if (!inquiry) throw new ApiError(404, "Inquiry not found");

  if (inquiry.status === "closed") {
    throw new ApiError(400, "Inquiry is already closed");
  }

  inquiry.status = "closed";
  await inquiry.save();

  return res.status(200).json(new ApiResponse(200, inquiry, "Inquiry closed"));
});

// =============================================
// 💬 REPLY TO INQUIRY — Seller replies
// =============================================
const replyToInquiry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sellerReply } = req.body;

  if (!sellerReply) {
    throw new ApiError(400, "Reply message is required");
  }

  const inquiry = await Inquiry.findOne({
    _id: id,
    seller: req.user._id,
  });

  if (!inquiry) {
    throw new ApiError(404, "Inquiry not found");
  }

  inquiry.sellerReply = sellerReply;
  inquiry.status = "replied";
  inquiry.repliedAt = new Date();
  await inquiry.save();

  // Update seller's average response time (best-effort)
  try {
    const responseMinutes = Math.round((inquiry.repliedAt - inquiry.createdAt) / 60000);
    const seller = await User.findById(req.user._id);
    if (seller) {
      const existing = seller.avgResponseTime || 0;
      const count = seller.replyCount || 0;
      seller.avgResponseTime = Math.round((existing * count + responseMinutes) / (count + 1));
      seller.replyCount = count + 1;
      await seller.save({ validateBeforeSave: false });
    }
  } catch { /* non-critical */ }

  const inquiryLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/buyer/inquiries`;
  const sellerName = req.user.companyName || req.user.name;

  // In-app notification to buyer
  await createNotification({
    userId: inquiry.buyer,
    type: "inquiry_reply",
    title: "Seller replied to your inquiry",
    message: `${sellerName} replied: "${sellerReply.slice(0, 80)}${sellerReply.length > 80 ? "…" : ""}"`,
    link: "/buyer/inquiries",
  });

  // Email notification to buyer (best-effort)
  try {
    if (inquiry.buyerEmail) {
      await sendEmail({
        to: inquiry.buyerEmail,
        subject: `Reply to your inquiry — ${inquiry.subject || "product inquiry"}`,
        html: `
          <p>Hi ${inquiry.buyerName || "there"},</p>
          <p><strong>${sellerName}</strong> has replied to your inquiry about <strong>${inquiry.subject || "a product"}</strong>.</p>
          <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555;">${sellerReply}</blockquote>
          <p><a href="${inquiryLink}" style="color:#1a56db;">View your inquiries →</a></p>
          <p style="color:#999;font-size:12px;">IndiaMart B2B Marketplace</p>
        `,
      });
    }
  } catch (err) {
    console.warn("Failed to send inquiry reply email:", err?.message);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, inquiry, "Reply sent successfully"));
});

// =============================================
// 📖 MARK AS READ — Seller opens inquiry
// =============================================
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const inquiry = await Inquiry.findOne({
    _id: id,
    seller: req.user._id,
  });

  if (!inquiry) {
    throw new ApiError(404, "Inquiry not found");
  }

  if (inquiry.status === "new") {
    inquiry.status = "read";
    await inquiry.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, inquiry, "Inquiry marked as read"));
});

// =============================================
// 📦 BULK INQUIRY — Send same message to multiple sellers
// =============================================
const createBulkInquiry = asyncHandler(async (req, res) => {
  const { productIds, message, subject, quantityRequired } = req.body;

  if (!productIds?.length || !message) {
    throw new ApiError(400, "productIds array and message are required");
  }
  if (productIds.length > 10) {
    throw new ApiError(400, "Cannot send bulk inquiry to more than 10 products at once");
  }

  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  }).populate("seller", "name email");

  if (products.length === 0) throw new ApiError(404, "No valid products found");

  const inquiries = await Promise.all(
    products.map(async (product) => {
      const inq = await Inquiry.create({
        buyer: req.user._id,
        buyerName: req.user.name,
        buyerEmail: req.user.email,
        buyerPhone: req.user.phone,
        product: product._id,
        seller: product.seller._id,
        subject: subject || `Bulk inquiry for ${product.name}`,
        message,
        quantityRequired,
      });
      await Product.findByIdAndUpdate(product._id, { $inc: { inquiryCount: 1 } });

      // Email seller
      try {
        if (product.seller?.email) {
          await sendEmail({
            to: product.seller.email,
            subject: `New bulk inquiry for ${product.name}`,
            html: `<p>Hi ${product.seller.name},</p><p>${req.user.name} sent a bulk inquiry for <strong>${product.name}</strong>:<br/>${message}</p><p><a href="${process.env.CLIENT_URL || "http://localhost:3000"}/seller/inbox">View in inbox →</a></p>`,
          });
        }
      } catch { /* non-critical */ }

      return inq;
    })
  );

  return res.status(201).json(
    new ApiResponse(201, { inquiries, count: inquiries.length }, `Bulk inquiry sent to ${inquiries.length} seller(s)`)
  );
});

export {
  createInquiry,
  createBulkInquiry,
  getSellerInquiries,
  getBuyerInquiries,
  replyToInquiry,
  markAsRead,
  closeInquiry,
};
