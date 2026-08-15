import mongoose from "mongoose";

const itrCertificateSchema = new mongoose.Schema(
  {
    // ── Seller Reference ──
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller ID is required"],
      index: true,
    },

    // ── ITR Details ──
    assessmentYear: {
      type: String,
      required: [true, "Assessment Year is required"],
      trim: true,
      // e.g. "2025-26"
    },
    financialYear: {
      type: String,
      required: [true, "Financial Year is required"],
      trim: true,
      // e.g. "2024-25"
    },
    itrType: {
      type: String,
      enum: ["ITR-1", "ITR-2", "ITR-3", "ITR-4", "ITR-5", "ITR-6", "ITR-7"],
      default: "ITR-4",
    },
    acknowledgementNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    filingDate: {
      type: Date,
    },
    totalIncome: {
      type: Number,
      min: [0, "Total income cannot be negative"],
    },
    totalTaxPaid: {
      type: Number,
      min: [0, "Total tax paid cannot be negative"],
    },
    turnoverGrossReceipt: {
      type: Number,
      min: [0, "Turnover/Gross Receipt cannot be negative"],
    },

    // ── Document ──
    documentUrl: {
      type: String,
      required: [true, "ITR document is required"],
    },
    documentType: {
      type: String,
      enum: ["pdf", "image"],
      default: "pdf",
    },

    // ── Verification ──
    status: {
      type: String,
      enum: ["pending", "under_review", "verified", "rejected", "expired"],
      default: "pending",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },

    // ── Expiry ──
    validUntil: {
      type: Date,
    },

    // ── Metadata ──
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ──
itrCertificateSchema.index({ sellerId: 1, assessmentYear: 1 });
itrCertificateSchema.index({ sellerId: 1, status: 1 });
itrCertificateSchema.index({ acknowledgementNumber: 1 });

export default mongoose.model("ItrCertificate", itrCertificateSchema);
