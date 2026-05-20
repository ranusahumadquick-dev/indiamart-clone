import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // --- Who wrote the review ---
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    userName: { type: String, required: true },

    // --- Which product is reviewed ---
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },

    // --- Review Content ---
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    images: [{ type: String }], // Review images

    // --- Helpfulness ---
    helpfulVotes: { type: Number, default: 0 },
    votedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        isHelpful: { type: Boolean },
      },
    ],

    // --- Status ---
    isActive: { type: Boolean, default: true },
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ========================================
// INDEXES
// ========================================
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, product: 1 }); // One review per user per product

// ========================================
// HOOKS — Update product average rating
// ========================================
reviewSchema.post("save", async function () {
  const Product = mongoose.model("Product");

  const stats = await Review.aggregate([
    { $match: { product: this.product, isActive: true } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await Product.findByIdAndUpdate(this.product, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
});

// Also update on remove
reviewSchema.post("remove", async function () {
  const Product = mongoose.model("Product");

  const stats = await Review.aggregate([
    { $match: { product: this.product, isActive: true } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await Product.findByIdAndUpdate(this.product, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
});

const Review = mongoose.model("Review", reviewSchema);
export default Review;
