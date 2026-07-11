import mongoose from "mongoose";

const purchaseOrderSchema = new mongoose.Schema(
  {
    // Stage 7 - Purchase Order
    poNumber: { type: String, unique: true, required: true }, // PO-2026-001, etc.
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Order Details
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        productName: String,
        specifications: String,
        quantity: { type: Number, required: true },
        unitPrice: Number,
        total: Number,
      },
    ],

    // Pricing
    subtotal: Number,
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    // Delivery & Payment Terms
    deliveryDate: { type: Date, required: true },
    paymentTerms: {
      advance: { type: Number, default: 30 }, // 30% = ₹X amount
      advanceAmount: Number,
      milestone: { type: Number, default: 0 }, // % after certain condition
      creditDays: { type: Number, default: 0 }, // days for payment
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "cancelled"],
      default: "draft",
    },

    // Documents
    poDocument: String, // PDF/file URL
    proformaInvoice: String, // PI from seller
    signatures: {
      buyerSigned: { type: Boolean, default: false },
      buyerSignedAt: Date,
      sellerSigned: { type: Boolean, default: false },
      sellerSignedAt: Date,
    },

    // Notes
    specialInstructions: String,

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("PurchaseOrder", purchaseOrderSchema);
