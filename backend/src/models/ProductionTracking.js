import mongoose from "mongoose";

const productionTrackingSchema = new mongoose.Schema(
  {
    // Stage 9 - Production Tracking
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Production Status
    currentStage: {
      type: String,
      enum: ["raw_materials", "production", "quality_check", "packing", "dispatch", "shipped"],
      default: "raw_materials",
    },

    // Progress Updates
    updates: [
      {
        stage: String,
        percentage: { type: Number, default: 0 }, // 0-100%
        description: String,
        image: String,
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    // Key Dates
    expectedDispatchDate: Date,
    actualDispatchDate: Date,

    // Shipping Details
    trackingNumber: String,
    courierName: String,
    courierLink: String,

    // Status
    status: {
      type: String,
      enum: ["in_production", "ready_to_ship", "shipped", "delayed"],
      default: "in_production",
    },

    // Communication
    lastUpdateDate: Date,
    contactMethod: {
      // How to reach supplier
      whatsapp: String,
      phone: String,
      email: String,
    },

    notes: String,

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("ProductionTracking", productionTrackingSchema);
