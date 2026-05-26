import mongoose from "mongoose";

const supplierReviewSchema = new mongoose.Schema(
  {
    // Stage 11 - Supplier Review & Relationship
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },

    // Ratings
    ratings: {
      quality: { type: Number, min: 1, max: 5, required: true }, // Product quality
      communication: { type: Number, min: 1, max: 5, required: true }, // Response time, updates
      pricing: { type: Number, min: 1, max: 5, required: true }, // Value for money
      delivery: { type: Number, min: 1, max: 5, required: true }, // On-time delivery
      packaging: { type: Number, min: 1, max: 5, required: true }, // Packaging quality
    },

    // Overall rating (average)
    overallRating: Number,

    // Review Text
    reviewTitle: String,
    reviewText: String,
    wouldRecommend: { type: Boolean, default: false },

    // Highlights
    positives: [String], // e.g., "Good quality", "Fast delivery", "Responsive support"
    negatives: [String], // e.g., "Packaging could be better", "Takes time to respond"

    // Images
    photos: [String], // Photos of products received

    // Status
    isVerifiedBuyer: { type: Boolean, default: true },
    helpfulCount: { type: Number, default: 0 },

    // Visibility
    published: { type: Boolean, default: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("SupplierReview", supplierReviewSchema);
