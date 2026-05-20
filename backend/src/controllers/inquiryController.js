import Inquiry from "../models/Inquiry.js";
import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import { sendEmail } from "../utils/sendEmail.js";

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
  const { page = 1, limit = 20 } = req.query;

  const { skip, limit: pageLimit, currentPage } = getPagination(page, limit);

  const [inquiries, totalInquiries] = await Promise.all([
    Inquiry.find({ buyer: req.user._id })
      .populate("product", "name images price")
      .populate("seller", "name companyName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    Inquiry.countDocuments({ buyer: req.user._id }),
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
      "Your inquiries fetched successfully"
    )
  );
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

  // Notify buyer via email (best-effort)
  try {
    const buyerEmail = inquiry.buyerEmail;
    if (buyerEmail) {
      const inquiryLink = `${process.env.CLIENT_URL || "http://localhost:3000"}/buyer/inquiries`;
      const html = `
        <p>Hi ${inquiry.buyerName || 'Buyer'},</p>
        <p>Your inquiry about <strong>${inquiry.subject || 'a product'}</strong> has received a reply from the seller.</p>
        <p><strong>Seller reply:</strong><br/>${sellerReply}</p>
        <p><a href="${inquiryLink}">View your inquiries</a></p>
      `;

      await sendEmail({
        to: buyerEmail,
        subject: `Reply to your inquiry`,
        html,
      });
    }
  } catch (err) {
    console.warn("Failed to send reply notification email:", err?.message || err);
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

export {
  createInquiry,
  getSellerInquiries,
  getBuyerInquiries,
  replyToInquiry,
  markAsRead,
};
