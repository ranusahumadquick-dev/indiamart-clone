import mongoose from "mongoose";

const sampleOrderSchema = new mongoose.Schema(
  {
    // Stage 6 - Sample Order
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    negotiation: { type: mongoose.Schema.Types.ObjectId, ref: "Negotiation" },

    // Sample details
    quantity: { type: Number, required: true }, // 5-20 units
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },

    // Quality Assessment
    qualityAssessment: {
      // Physical quality test
      passedQualityCheck: Boolean,
      defectRate: Number, // percentage
      defectDescription: String,

      // Packaging & Labeling
      packagingOK: Boolean,
      labelingOK: Boolean,
      packagingNotes: String,

      // Overall rating
      rating: { type: Number, min: 1, max: 5 },
      notes: String,
      submittedAt: Date,
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    // Documents
    images: [
      { url: String, type: String }, // quality check photos
    ],

    // Status
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "quality_check_pending", "approved", "rejected"],
      default: "pending",
    },

    // Tracking
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date,

    // Decision
    supplierApproved: { type: Boolean, default: false }, // Selected for bulk order
    feedbackGiven: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("SampleOrder", sampleOrderSchema);
