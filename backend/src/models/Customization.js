import mongoose from "mongoose";

const customizationSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product ID is required"],
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Seller ID is required"],
    index: true,
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Buyer ID is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
    minlength: [10, "Message must be at least 10 characters"],
  },
  oemRequirement: {
    type: String,
    enum: ["", "logo", "design", "packaging", "full"],
    default: "",
  },
  packagingRequirement: {
    type: String,
    default: "",
    trim: true,
  },
  logoUrl: {
    type: String,
    default: null,
  },
  attachmentUrls: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "cancelled"],
    default: "pending",
  },
  sellerNotes: {
    type: String,
    default: "",
  },
  estimatedDelivery: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Customization", customizationSchema);
