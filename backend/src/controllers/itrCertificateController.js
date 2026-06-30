/**
 * ITR Certificate Controller
 * Handles CRUD operations for seller ITR certificates
 */
import ItrCertificate from "../models/ItrCertificate.js";
import User from "../models/User.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// ═══════════════════════════════════════════════════════
// POST /api/itr-certificates
// Upload a new ITR certificate
// ═══════════════════════════════════════════════════════
export const uploadITRCertificate = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  if (!req.file) {
    throw new ApiError(400, "ITR document file is required");
  }

  const {
    assessmentYear,
    financialYear,
    itrType,
    acknowledgementNumber,
    filingDate,
    totalIncome,
    totalTaxPaid,
    turnoverGrossReceipt,
    validUntil,
  } = req.body;

  // Validation
  if (!assessmentYear) throw new ApiError(400, "Assessment Year is required");
  if (!financialYear) throw new ApiError(400, "Financial Year is required");

  // Check for duplicate acknowledgement number
  if (acknowledgementNumber) {
    const existing = await ItrCertificate.findOne({
      acknowledgementNumber,
      sellerId,
      isActive: true,
    });
    if (existing) {
      throw new ApiError(409, "ITR with this acknowledgement number already exists");
    }
  }

  // Check for duplicate assessment year
  const existingYear = await ItrCertificate.findOne({
    sellerId,
    assessmentYear,
    isActive: true,
  });
  if (existingYear) {
    throw new ApiError(409, `ITR for Assessment Year ${assessmentYear} already exists`);
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const documentUrl = `${backendUrl}/uploads/seller-docs/${req.file.filename}`;
  const documentType = req.file.mimetype === "application/pdf" ? "pdf" : "image";

  const certificate = await ItrCertificate.create({
    sellerId,
    assessmentYear,
    financialYear,
    itrType: itrType || "ITR-4",
    acknowledgementNumber: acknowledgementNumber || "",
    filingDate: filingDate ? new Date(filingDate) : undefined,
    totalIncome: totalIncome ? Number(totalIncome) : undefined,
    totalTaxPaid: totalTaxPaid ? Number(totalTaxPaid) : undefined,
    turnoverGrossReceipt: turnoverGrossReceipt ? Number(turnoverGrossReceipt) : undefined,
    documentUrl,
    documentType,
    validUntil: validUntil ? new Date(validUntil) : undefined,
    status: "pending",
  });

  // Also update seller docs with latest ITR
  await User.findByIdAndUpdate(sellerId, {
    "sellerDocs.itr": documentUrl,
    "sellerDocs.uploadedAt": new Date(),
  });

  return res.status(201).json(
    new ApiResponse(201, certificate, "ITR Certificate uploaded successfully. Verification will take 3-5 business days.")
  );
});

// ═══════════════════════════════════════════════════════
// GET /api/itr-certificates
// Get all ITR certificates for the logged-in seller
// ═══════════════════════════════════════════════════════
export const getMyITRCertificates = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter = { sellerId: req.user._id, isActive: true };

  if (status && status !== "all") {
    filter.status = status;
  }

  const certificates = await ItrCertificate.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await ItrCertificate.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(200, {
      certificates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    }, "ITR Certificates fetched")
  );
});

// ═══════════════════════════════════════════════════════
// GET /api/itr-certificates/:id
// Get a single ITR certificate by ID
// ═══════════════════════════════════════════════════════
export const getITRCertificateById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const certificate = await ItrCertificate.findOne({
    _id: id,
    sellerId: req.user._id,
    isActive: true,
  });

  if (!certificate) {
    throw new ApiError(404, "ITR Certificate not found");
  }

  return res.status(200).json(
    new ApiResponse(200, certificate, "ITR Certificate fetched")
  );
});

// ═══════════════════════════════════════════════════════
// PATCH /api/itr-certificates/:id
// Update an existing ITR certificate
// ═══════════════════════════════════════════════════════
export const updateITRCertificate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sellerId = req.user._id;

  const certificate = await ItrCertificate.findOne({
    _id: id,
    sellerId,
    isActive: true,
  });

  if (!certificate) {
    throw new ApiError(404, "ITR Certificate not found");
  }

  if (certificate.status === "verified") {
    throw new ApiError(400, "Cannot update a verified ITR Certificate");
  }

  const {
    assessmentYear,
    financialYear,
    itrType,
    acknowledgementNumber,
    filingDate,
    totalIncome,
    totalTaxPaid,
    turnoverGrossReceipt,
    validUntil,
  } = req.body;

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

  const updateData = {};
  if (assessmentYear) updateData.assessmentYear = assessmentYear;
  if (financialYear) updateData.financialYear = financialYear;
  if (itrType) updateData.itrType = itrType;
  if (acknowledgementNumber) updateData.acknowledgementNumber = acknowledgementNumber;
  if (filingDate) updateData.filingDate = new Date(filingDate);
  if (totalIncome !== undefined) updateData.totalIncome = Number(totalIncome);
  if (totalTaxPaid !== undefined) updateData.totalTaxPaid = Number(totalTaxPaid);
  if (turnoverGrossReceipt !== undefined) updateData.turnoverGrossReceipt = Number(turnoverGrossReceipt);
  if (validUntil) updateData.validUntil = new Date(validUntil);

  // If new file uploaded
  if (req.file) {
    updateData.documentUrl = `${backendUrl}/uploads/seller-docs/${req.file.filename}`;
    updateData.documentType = req.file.mimetype === "application/pdf" ? "pdf" : "image";
    updateData.status = "pending"; // Reset status on re-upload
  }

  const updated = await ItrCertificate.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json(
    new ApiResponse(200, updated, "ITR Certificate updated successfully")
  );
});

// ═══════════════════════════════════════════════════════
// DELETE /api/itr-certificates/:id
// Soft-delete an ITR certificate
// ═══════════════════════════════════════════════════════
export const deleteITRCertificate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sellerId = req.user._id;

  const certificate = await ItrCertificate.findOne({
    _id: id,
    sellerId,
    isActive: true,
  });

  if (!certificate) {
    throw new ApiError(404, "ITR Certificate not found");
  }

  if (certificate.status === "verified") {
    throw new ApiError(400, "Cannot delete a verified ITR Certificate");
  }

  certificate.isActive = false;
  certificate.status = "expired";
  await certificate.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "ITR Certificate deleted successfully")
  );
});

// ═══════════════════════════════════════════════════════
// GET /api/itr-certificates/admin/all
// Admin: Get all ITR certificates across all sellers
// ═══════════════════════════════════════════════════════
export const adminGetAllITRCertificates = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, sellerId } = req.query;
  const filter = { isActive: true };

  if (status && status !== "all") filter.status = status;
  if (sellerId) filter.sellerId = sellerId;

  const certificates = await ItrCertificate.find(filter)
    .populate("sellerId", "name email phone companyName gstNumber")
    .populate("verifiedBy", "name email")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await ItrCertificate.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(200, {
      certificates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    }, "All ITR Certificates fetched (Admin)")
  );
});

// ═══════════════════════════════════════════════════════
// PATCH /api/itr-certificates/admin/:id/verify
// Admin: Verify or reject an ITR certificate
// ═══════════════════════════════════════════════════════
export const adminVerifyITRCertificate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user._id;
  const { action, rejectionReason, adminNotes } = req.body;

  if (!["verify", "reject"].includes(action)) {
    throw new ApiError(400, "Action must be 'verify' or 'reject'");
  }

  const certificate = await ItrCertificate.findById(id);

  if (!certificate) {
    throw new ApiError(404, "ITR Certificate not found");
  }

  certificate.status = action === "verify" ? "verified" : "rejected";
  certificate.verifiedBy = adminId;
  certificate.verifiedAt = new Date();

  if (action === "reject" && rejectionReason) {
    certificate.rejectionReason = rejectionReason;
  }
  if (adminNotes) {
    certificate.adminNotes = adminNotes;
  }

  await certificate.save();

  // If verified, also update seller docs
  if (action === "verify") {
    await User.findByIdAndUpdate(certificate.sellerId, {
      "sellerDocs.itr": certificate.documentUrl,
      "sellerDocs.uploadedAt": new Date(),
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      certificate,
      action === "verify"
        ? "ITR Certificate verified successfully ✅"
        : "ITR Certificate rejected ❌"
    )
  );
});

// ═══════════════════════════════════════════════════════
// GET /api/itr-certificates/stats
// Get ITR certificate stats for a seller
// ═══════════════════════════════════════════════════════
export const getITRStats = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  const stats = await ItrCertificate.aggregate([
    { $match: { sellerId: sellerId, isActive: true } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        underReview: { $sum: { $cond: [{ $eq: ["$status", "under_review"] }, 1, 0] } },
        verified: { $sum: { $cond: [{ $eq: ["$status", "verified"] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
        latestYear: { $max: "$assessmentYear" },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, stats[0] || { total: 0, pending: 0, underReview: 0, verified: 0, rejected: 0 }, "ITR Stats fetched")
  );
});
