import mongoose from "mongoose";
import { INQUIRY_STATUS_ENUM } from "../constants/inquiryStatus.js";

const inquirySchema = new mongoose.Schema(
  {
    // --- Who sent the inquiry ---
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer is required"],
    },
    buyerName: {
      type: String,
      required: [true, "Buyer name is required"],
      trim: true,
    },
    buyerEmail: {
      type: String,
      required: [true, "Buyer email is required"],
      lowercase: true,
    },
    buyerPhone: {
      type: String,
      required: [true, "Buyer phone is required"],
    },

    // --- Which product is the inquiry about ---
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller is required"],
    },

    // --- Inquiry Details ---
    subject: {
      type: String,
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    quantityRequired: {
      type: Number,
      min: [1, "Quantity must be at least 1"],
    },
    preferredDeliveryLocation: { type: String, trim: true },

    // --- Status ---
    status: {
      type: String,
      enum: {
        values: INQUIRY_STATUS_ENUM,
        message: "Invalid inquiry status",
      },
      default: "new",
    },

    // --- Seller Reply ---
    sellerReply: { type: String, trim: true },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

// ========================================
// INDEXES
// ========================================
inquirySchema.index({ buyer: 1, createdAt: -1 });
inquirySchema.index({ seller: 1, status: 1 });
inquirySchema.index({ product: 1 });
inquirySchema.index({ status: 1 });

const Inquiry = mongoose.model("Inquiry", inquirySchema);
export default Inquiry;
