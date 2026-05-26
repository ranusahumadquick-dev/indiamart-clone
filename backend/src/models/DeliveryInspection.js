import mongoose from "mongoose";

const deliveryInspectionSchema = new mongoose.Schema(
  {
    // Stage 10 - Delivery Inspection
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Delivery Date
    deliveryDate: { type: Date, default: Date.now },

    // Quality Inspection
    inspection: {
      // Quantity Check
      quantityReceived: Number,
      quantityExpected: Number,
      quantityMatches: Boolean,

      // Quality Check
      qualityOK: Boolean,
      defectsFound: Boolean,
      defectDescription: String,

      // Packaging Check
      packagingOK: Boolean,
      packagingNotes: String,

      // Overall Status
      acceptedFull: { type: Boolean, default: false },
      acceptedPartial: { type: Boolean, default: false },
      rejected: { type: Boolean, default: false },
    },

    // Documentation
    // Video proof
    videoProof: String, // Video URL of delivery unboxing
    photos: [String], // defects, packaging, overall

    // PO vs Delivery Comparison
    poMatchStatus: {
      specifications: { match: Boolean, notes: String },
      quantity: { match: Boolean, notes: String },
      quality: { match: Boolean, notes: String },
      packaging: { match: Boolean, notes: String },
    },

    // Defect Claims
    defectClaim: {
      filed: { type: Boolean, default: false },
      description: String,
      images: [String],
      requestedAction: {
        type: String,
        enum: ["replacement", "refund", "price_deduction"],
      },
      claimedAmount: Number,
    },

    // Resolution
    resolution: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", "partial"],
      },
      action: String, // "sent replacement", "refund processed", "price adjusted"
      resolvedDate: Date,
      notes: String,
    },

    // Inspector Details
    inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    inspectionDate: { type: Date, default: Date.now },

    status: {
      type: String,
      enum: ["pending_inspection", "inspected", "accepted", "rejected", "claim_filed"],
      default: "pending_inspection",
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("DeliveryInspection", deliveryInspectionSchema);
