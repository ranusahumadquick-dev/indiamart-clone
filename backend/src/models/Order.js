import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sampleRequest: { type: mongoose.Schema.Types.ObjectId, ref: "SampleRequest" },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
    },
    shippingAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String, default: "India" },
    },
    trackingInfo: {
      trackingNumber: { type: String },
      courier: { type: String },
      estimatedDelivery: { type: Date },
    },
    buyerNote: { type: String, maxlength: 500 },
    sellerNote: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ sampleRequest: 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
