import mongoose from "mongoose";

const sellerAnalyticsSchema = new mongoose.Schema(
  {
    // --- Seller Reference ---
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

    // --- Profile Metrics ---
    profileViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueProfileVisitors: {
      type: Number,
      default: 0,
      min: 0,
    },
    profileClickThroughs: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- Inquiry Metrics ---
    inquiriesReceived: {
      type: Number,
      default: 0,
      min: 0,
    },
    inquiriesResponded: {
      type: Number,
      default: 0,
      min: 0,
    },
    avgResponseTime: {
      type: Number,
      default: 0, // in minutes
      min: 0,
    },

    // --- Quote Metrics ---
    quotesGenerated: {
      type: Number,
      default: 0,
      min: 0,
    },
    quotesAccepted: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- Order/Revenue Metrics ---
    ordersPlaced: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
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

    // --- Derived Metrics ---
    conversionRate: {
      type: Number,
      default: 0, // percentage
      min: 0,
      max: 100,
    },
    responseRate: {
      type: Number,
      default: 0, // percentage
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for seller + date
sellerAnalyticsSchema.index({ seller: 1, date: 1 }, { unique: true });

// Index for date range queries
sellerAnalyticsSchema.index({ seller: 1, date: -1 });

const SellerAnalytics = mongoose.model("SellerAnalytics", sellerAnalyticsSchema);
export default SellerAnalytics;
