import mongoose from "mongoose";

const supplierRelationshipSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Relationship Status
    isFavorite: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },

    // Repeat Buyer Benefits
    repeatBuyerStatus: {
      isRepeatBuyer: { type: Boolean, default: false },
      totalOrders: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      averageOrderValue: Number,
    },

    // Negotiated Rates (for repeat orders)
    negotiatedRates: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        negotiatedPrice: Number,
        moq: Number,
        bulkDiscounts: [
          { quantity: Number, discount: Number },
        ],
        validFrom: Date,
        validUntil: Date,
      },
    ],

    // Communication Preferences
    preferredContactMethod: {
      type: String,
      enum: ["whatsapp", "phone", "email", "platform"],
      default: "platform",
    },
    contactDetails: {
      whatsapp: String,
      phone: String,
      email: String,
    },

    // Performance Metrics
    onTimeDelivery: Number, // percentage
    qualityScore: Number, // 1-5
    responseTime: Number, // average hours

    // History
    firstOrderDate: Date,
    lastOrderDate: Date,
    lastInteractionDate: Date,

    // Notes
    buyerNotes: String, // Private notes about this supplier

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("SupplierRelationship", supplierRelationshipSchema);
