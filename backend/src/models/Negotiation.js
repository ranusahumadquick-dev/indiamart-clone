import mongoose from "mongoose";

const negotiationSchema = new mongoose.Schema(
  {
    // Stage 5 - Negotiation
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

    // Negotiation details
    requestedQuantity: { type: Number, required: true },
    requestedPrice: Number,
    offeredPrice: Number,
    moq: { type: Number, default: null }, // Minimum Order Quantity
    bulkDiscounts: [
      { quantity: Number, discount: Number }, // e.g., {quantity: 1000, discount: 10} = 10% off for 1000+ units
    ],
    paymentTerms: {
      advance: { type: Number, default: 30 }, // 30% advance
      milestone: { type: Number, default: 0 },
      credit: { type: Number, default: 0 }, // credit days
    },

    // Messages/History
    messages: [
      {
        from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: String,
        attachment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ["pending", "negotiating", "agreed", "rejected", "expired"],
      default: "pending",
    },

    // Next step
    proceedToSample: { type: Boolean, default: false },
    sampleOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "SampleOrder" },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Negotiation", negotiationSchema);
