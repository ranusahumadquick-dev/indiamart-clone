import Inquiry from "../models/Inquiry.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import { sendEmail } from "../utils/sendEmail.js";
import { createNotification } from "./notificationController.js";
import { generateQuotationPDF } from "../utils/quotationGenerator.js";
import cloudinary from "../config/cloudinary.js";

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

  // Send email notification to seller (best-effort, respects preferences)
  try {
    const sellerEmail = product.seller?.email;
    if (sellerEmail) {
      const seller = await User.findById(product.seller._id).select("notificationPreferences");
      const prefs = seller?.notificationPreferences;
      const shouldSendEmail = prefs?.inquiryAlerts !== false && prefs?.channels?.email !== false;

      if (shouldSendEmail) {
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

  // Email notification to buyer (best-effort, respects preferences)
  try {
    if (inquiry.buyerEmail) {
      const buyer = await User.findById(inquiry.buyer).select("notificationPreferences");
      const prefs = buyer?.notificationPreferences;
      const shouldSendEmail = prefs?.replyNotifications !== false && prefs?.channels?.email !== false;

      if (shouldSendEmail) {
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

      // Email seller (respects notification preferences)
      try {
        if (product.seller?.email) {
          const seller = await User.findById(product.seller._id).select("notificationPreferences");
          const prefs = seller?.notificationPreferences;
          const shouldSendEmail = prefs?.inquiryAlerts !== false && prefs?.channels?.email !== false;

          if (shouldSendEmail) {
            await sendEmail({
              to: product.seller.email,
              subject: `New bulk inquiry for ${product.name}`,
              html: `<p>Hi ${product.seller.name},</p><p>${req.user.name} sent a bulk inquiry for <strong>${product.name}</strong>:<br/>${message}</p><p><a href="${process.env.CLIENT_URL || "http://localhost:3000"}/seller/inbox">View in inbox →</a></p>`,
            });
          }
        }
      } catch { /* non-critical */ }

      return inq;
    })
  );

  return res.status(201).json(
    new ApiResponse(201, { inquiries, count: inquiries.length }, `Bulk inquiry sent to ${inquiries.length} seller(s)`)
  );
});

// =============================================
// 📝 QUICK REPLY TEMPLATES
// =============================================
const createTemplate = asyncHandler(async (req, res) => {
  const { title, content, category } = req.body;
  const sellerId = req.user._id;

  if (!title || !content) {
    throw new ApiError(400, "Title and content are required");
  }

  // Add template to seller's responseTemplates array
  const user = await User.findByIdAndUpdate(
    sellerId,
    { $push: { responseTemplates: { title, content, category: category || "general" } } },
    { new: true, select: "responseTemplates" }
  );

  return res.status(201).json(
    new ApiResponse(201, user.responseTemplates, "Template created successfully")
  );
});

const getTemplates = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const sellerId = req.user._id;

  const user = await User.findById(sellerId).select("responseTemplates");
  let templates = user?.responseTemplates || [];

  if (category) {
    templates = templates.filter((t) => t.category === category);
  }

  // Sort: pinned first, then by usage count
  templates.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
    return b.usageCount - a.usageCount;
  });

  return res.status(200).json(
    new ApiResponse(200, templates, "Templates retrieved successfully")
  );
});

const updateTemplate = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const { title, content, category } = req.body;
  const sellerId = req.user._id;

  const user = await User.findByIdAndUpdate(
    sellerId,
    {
      $set: {
        "responseTemplates.$[elem].title": title,
        "responseTemplates.$[elem].content": content,
        "responseTemplates.$[elem].category": category,
      },
    },
    {
      arrayFilters: [{ "elem._id": templateId }],
      new: true,
      select: "responseTemplates",
    }
  );

  if (!user) {
    throw new ApiError(404, "Template not found");
  }

  return res.status(200).json(
    new ApiResponse(200, user.responseTemplates, "Template updated successfully")
  );
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const sellerId = req.user._id;

  const user = await User.findByIdAndUpdate(
    sellerId,
    { $pull: { responseTemplates: { _id: templateId } } },
    { new: true, select: "responseTemplates" }
  );

  if (!user) {
    throw new ApiError(404, "Template not found");
  }

  return res.status(200).json(
    new ApiResponse(200, user.responseTemplates, "Template deleted successfully")
  );
});

const pinTemplate = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const sellerId = req.user._id;

  // Get current pinned state and toggle it
  const user = await User.findById(sellerId).select("responseTemplates");
  const template = user?.responseTemplates?.find((t) => t._id.toString() === templateId);

  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  const updatedUser = await User.findByIdAndUpdate(
    sellerId,
    {
      $set: {
        "responseTemplates.$[elem].isPinned": !template.isPinned,
      },
    },
    {
      arrayFilters: [{ "elem._id": templateId }],
      new: true,
      select: "responseTemplates",
    }
  );

  return res.status(200).json(
    new ApiResponse(200, updatedUser.responseTemplates, "Template pin status updated")
  );
});

// =============================================
// 📊 QUOTATION BUILDER
// =============================================
const generateQuotation = asyncHandler(async (req, res) => {
  const { inquiryId } = req.params;
  const { deliveryDate, paymentTerms, notes, validUntil } = req.body;

  const inquiry = await Inquiry.findOne({
    _id: inquiryId,
    seller: req.user._id,
  })
    .populate("product", "name price")
    .populate("buyer", "name email companyName");

  if (!inquiry) {
    throw new ApiError(404, "Inquiry not found");
  }

  const seller = req.user;
  const buyer = inquiry.buyer;

  const pdfBuffer = await generateQuotationPDF({
    inquiryId: inquiry._id,
    sellerName: seller.name,
    sellerEmail: seller.email,
    sellerPhone: seller.phone,
    sellerCompany: seller.companyName,
    buyerName: buyer.name,
    buyerCompany: buyer.companyName,
    productName: inquiry.product.name,
    quantity: inquiry.quantityRequired || 1,
    unitPrice: inquiry.product.price || 0,
    deliveryDate,
    paymentTerms,
    notes,
    validUntil,
  });

  let pdfUrl;
  try {
    const dataUri = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      resource_type: "raw",
      folder: "indiamart/quotations",
      public_id: `quotation-${inquiry._id}-${Date.now()}`,
      use_filename: true,
    });

    pdfUrl = uploadResult.secure_url;
  } catch (err) {
    console.error("Failed to upload quotation PDF:", err);
    throw new ApiError(500, "Failed to generate quotation PDF");
  }

  const quotation = {
    generatedBy: req.user._id,
    pdfUrl,
    deliveryDate,
    paymentTerms,
    notes,
    expiresAt: validUntil,
    status: "pending",
  };

  inquiry.quotations.push(quotation);
  await inquiry.save();

  // In-app notification to buyer
  await createNotification({
    userId: inquiry.buyer,
    type: "quotation_generated",
    title: "New quotation received",
    message: `${seller.companyName || seller.name} sent you a quotation for ${inquiry.product.name}`,
    link: `/buyer/inquiries/${inquiry._id}`,
  });

  // Email notification to buyer
  try {
    const buyer = await User.findById(inquiry.buyer).select("notificationPreferences");
    const prefs = buyer?.notificationPreferences;
    const shouldSendEmail = prefs?.quotationAlerts !== false && prefs?.channels?.email !== false;

    if (shouldSendEmail && inquiry.buyerEmail) {
      await sendEmail({
        to: inquiry.buyerEmail,
        subject: `Quotation received from ${seller.companyName || seller.name}`,
        html: `
          <p>Hi ${inquiry.buyerName},</p>
          <p><strong>${seller.companyName || seller.name}</strong> has sent you a quotation for <strong>${inquiry.product.name}</strong>.</p>
          <p>
            <strong>Quote Details:</strong><br/>
            Quantity: ${inquiry.quantityRequired || 1} units<br/>
            Unit Price: ₹${inquiry.product.price || 0}<br/>
            Total: ₹${((inquiry.quantityRequired || 1) * (inquiry.product.price || 0)).toFixed(2)}
          </p>
          ${deliveryDate ? `<p>Estimated Delivery: ${new Date(deliveryDate).toLocaleDateString()}</p>` : ""}
          ${paymentTerms ? `<p>Payment Terms: ${paymentTerms}</p>` : ""}
          <p><a href="${process.env.CLIENT_URL || "http://localhost:3000"}/buyer/inquiries/${inquiry._id}" style="color:#1a56db;">View Full Quotation →</a></p>
        `,
      });
    }
  } catch (err) {
    console.warn("Failed to send quotation email:", err?.message);
  }

  return res.status(201).json(
    new ApiResponse(201, quotation, "Quotation generated and sent successfully")
  );
});

const getQuotations = asyncHandler(async (req, res) => {
  const { inquiryId } = req.params;

  const inquiry = await Inquiry.findById(inquiryId).select("quotations");

  if (!inquiry) {
    throw new ApiError(404, "Inquiry not found");
  }

  return res.status(200).json(
    new ApiResponse(200, inquiry.quotations || [], "Quotations retrieved successfully")
  );
});

const updateQuotation = asyncHandler(async (req, res) => {
  const { inquiryId, quotationId } = req.params;
  const { deliveryDate, paymentTerms, notes, status } = req.body;

  const inquiry = await Inquiry.findOne({
    _id: inquiryId,
    seller: req.user._id,
  });

  if (!inquiry) {
    throw new ApiError(404, "Inquiry not found");
  }

  const quotation = inquiry.quotations.find((q) => q._id.toString() === quotationId);

  if (!quotation) {
    throw new ApiError(404, "Quotation not found");
  }

  if (deliveryDate) quotation.deliveryDate = deliveryDate;
  if (paymentTerms) quotation.paymentTerms = paymentTerms;
  if (notes !== undefined) quotation.notes = notes;
  if (status) quotation.status = status;
  if (status === "accepted") quotation.acceptedAt = new Date();

  await inquiry.save();

  return res.status(200).json(
    new ApiResponse(200, quotation, "Quotation updated successfully")
  );
});

const deleteQuotation = asyncHandler(async (req, res) => {
  const { inquiryId, quotationId } = req.params;

  const inquiry = await Inquiry.findOne({
    _id: inquiryId,
    seller: req.user._id,
  });

  if (!inquiry) {
    throw new ApiError(404, "Inquiry not found");
  }

  const quotationIndex = inquiry.quotations.findIndex(
    (q) => q._id.toString() === quotationId
  );

  if (quotationIndex === -1) {
    throw new ApiError(404, "Quotation not found");
  }

  inquiry.quotations.splice(quotationIndex, 1);
  await inquiry.save();

  return res.status(200).json(
    new ApiResponse(200, null, "Quotation deleted successfully")
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
  createTemplate,
  getTemplates,
  updateTemplate,
  deleteTemplate,
  pinTemplate,
  generateQuotation,
  getQuotations,
  updateQuotation,
  deleteQuotation,
};
