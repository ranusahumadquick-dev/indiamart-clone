import mongoose from "mongoose";

const buyRequirementSchema = new mongoose.Schema(
  {
    // --- Who posted the requirement ---
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer is required"],
    },

    // --- Requirement Details ---
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    quantityRequired: {
      type: Number,
      min: [1, "Quantity must be at least 1"],
      required: [true, "Quantity is required"],
    },

    unit: {
      type: String,
      enum: ["Piece", "Kg", "Meter", "Liter", "Box", "Packet", "Ton", "Set"],
      default: "Piece",
    },

    // --- Budget & Location ---
    budgetMin: { type: Number },
    budgetMax: { type: Number },

    deliveryLocation: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },

    deliveryTimeline: {
      type: String,
      enum: ["Urgent", "1-2 weeks", "1 month", "Flexible"],
      default: "Flexible",
    },

    // --- Status ---
    status: {
      type: String,
      enum: ["active", "closed", "fulfilled"],
      default: "active",
    },

    // --- Responses from Suppliers ---
    responses: [
      {
        supplier: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: String,
        quotedPrice: Number,
        moq: Number,           // Minimum Order Quantity supplier can fulfill
        deliveryDays: Number,  // Estimated delivery in days
        validityDays: Number,  // Quote valid for X days from respondedAt
        respondedAt: { type: Date, default: Date.now },
      },
    ],

    // --- Selected Supplier (after closing requirement) ---
    selectedSupplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // --- Visibility ---
    isPublic: { type: Boolean, default: true },

    // --- Private Requirement Pro ---
    isPrivate: { type: Boolean, default: false },
    invitedSellers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    privateNote: { type: String, maxlength: 500 }, // confidential note to invited sellers

    // --- Priority Response Pro ---
    isPriority: { type: Boolean, default: false },
    priorityBoostedAt: { type: Date },
    priorityExpiresAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
buyRequirementSchema.index({ buyer: 1, createdAt: -1 });
buyRequirementSchema.index({ category: 1, status: 1 });
buyRequirementSchema.index({ "deliveryLocation.city": 1 });
buyRequirementSchema.index({ status: 1 });
buyRequirementSchema.index({ isPriority: -1, createdAt: -1 });
buyRequirementSchema.index({ invitedSellers: 1, isPrivate: 1 });
buyRequirementSchema.index({ createdAt: -1 });

const BuyRequirement = mongoose.model("BuyRequirement", buyRequirementSchema);
export default BuyRequirement;
