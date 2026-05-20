import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // --- Basic Info ---
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    // --- Pricing ---
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    comparePrice: {
      type: Number,
      min: [0, "Compare price cannot be negative"],
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR"],
    },
    priceUnit: {
      type: String,
      default: "Piece",
      enum: ["Piece", "Kg", "Meter", "Liter", "Box", "Packet", "Ton", "Set"],
    },

    // --- Category ---
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    // --- Images ---
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String }, // Cloudinary public ID for deletion
      },
    ],

    // --- Seller ---
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller is required"],
    },
    companyName: { type: String },

    // --- Product Details ---
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    specifications: [
      {
        key: { type: String, required: true }, // e.g. "Weight", "Color"
        value: { type: String, required: true }, // e.g. "5kg", "Red"
      },
    ],
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: [1, "Minimum order quantity must be at least 1"],
    },
    maxOrderQuantity: {
      type: Number,
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },

    // --- Location ---
    city: { type: String, trim: true },
    state: { type: String, trim: true },

    // --- Stats ---
    views: { type: Number, default: 0 },
    inquiryCount: { type: Number, default: 0 },

    // --- Ratings ---
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },

    // --- Status & Flags ---
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "approved",
    },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
  }
);

// ========================================
// INDEXES — For fast queries
// ========================================

// Text index for full-text search
productSchema.index({
  name: "text",
  description: "text",
  tags: "text",
});

// slug already indexed via unique: true

// Compound indexes for filtered queries
productSchema.index({ category: 1, price: 1 });
productSchema.index({ category: 1, city: 1 });
productSchema.index({ seller: 1, isActive: 1 });

// Single field indexes
productSchema.index({ averageRating: -1 });
productSchema.index({ views: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ city: 1 });
productSchema.index({ isFeatured: -1 });

// ========================================
// HOOKS
// ========================================

// Auto-generate slug from name
productSchema.pre("save", function () {
  if (this.isModified("name")) {
    const timestamp = Date.now().toString(36);
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .substring(0, 80) +
      "-" +
      timestamp;
  }
});

// ========================================
// VIRTUALS
// ========================================

// Calculate discount percentage
productSchema.virtual("discountPercent").get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

productSchema.set("toObject", { virtuals: true });
productSchema.set("toJSON", { virtuals: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
