import mongoose from "mongoose";

const productAnalyticsSchema = new mongoose.Schema(
  {
    // --- Product Reference ---
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // --- Date Reference ---
    date: {
      type: Date,
      required: true,
      index: true,
    },

    // --- View Metrics ---
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueVisitors: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- Inquiry Metrics ---
    inquiries: {
      type: Number,
      default: 0,
      min: 0,
    },
    inquiriesConverted: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- Sample Requests ---
    sampleRequests: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- Comparison Metrics ---
    compareAdds: {
      type: Number,
      default: 0,
      min: 0,
    },
    wishlistAdds: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- Derived Metrics ---
    clickThroughRate: {
      type: Number,
      default: 0, // percentage
      min: 0,
    },
    inquiryRate: {
      type: Number,
      default: 0, // percentage (inquiries / views)
      min: 0,
    },
    conversionRate: {
      type: Number,
      default: 0, // percentage (inquiries converted / inquiries)
      min: 0,
    },

    // --- Performance Score ---
    performanceScore: {
      type: Number,
      default: 0, // 0-100
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for product + date
productAnalyticsSchema.index({ product: 1, date: 1 }, { unique: true });

// Index for seller analytics queries
productAnalyticsSchema.index({ seller: 1, date: -1 });

// Index for product performance queries
productAnalyticsSchema.index({ product: 1, date: -1 });

const ProductAnalytics = mongoose.model("ProductAnalytics", productAnalyticsSchema);
export default ProductAnalytics;
