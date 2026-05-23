import mongoose from "mongoose";

const sampleRequestSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, "Unit price cannot be negative"],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    buyerNote: { type: String, maxlength: 500 },
    sellerNote: { type: String, maxlength: 500 },
    rejectionReason: { type: String, maxlength: 500 },
    trackingNumber: { type: String },
    courierName: { type: String },
    estimatedDelivery: { type: Date },
  },
  { timestamps: true }
);

sampleRequestSchema.index({ buyer: 1, createdAt: -1 });
sampleRequestSchema.index({ seller: 1, status: 1 });
sampleRequestSchema.index({ product: 1 });

const SampleRequest = mongoose.model("SampleRequest", sampleRequestSchema);
export default SampleRequest;
