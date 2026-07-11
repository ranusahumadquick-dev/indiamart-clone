import mongoose from "mongoose";

const shortlistedSupplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    companyName: { type: String },
    contact: { type: String },
    city: { type: String },
    quotedPrice: { type: Number },
    priceUnit: { type: String },
    note: { type: String },
    productUrl: { type: String },
  },
  { _id: false }
);

const sourcingRequestSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // --- What they need ---
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: { type: String, trim: true },
    quantity: { type: Number, min: 1 },
    unit: {
      type: String,
      enum: ["Piece", "Kg", "Ton", "Meter", "Liter", "Box", "Set", "Packet", "Other"],
      default: "Piece",
    },
    targetPrice: { type: Number, min: 0 },
    budget: { type: Number, min: 0 },

    // --- Requirements ---
    timeline: {
      type: String,
      enum: ["ASAP", "Within 1 week", "Within 1 month", "1–3 months", "Flexible"],
      default: "Flexible",
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    preferredLocation: { type: String, trim: true },
    certificationRequired: { type: String, trim: true },
    additionalNotes: { type: String, maxlength: 1000 },

    // --- Status ---
    status: {
      type: String,
      enum: ["open", "in_progress", "shortlisted", "resolved", "cancelled"],
      default: "open",
    },

    // --- Account Manager Response ---
    managerNote: { type: String, maxlength: 2000 },
    shortlistedSuppliers: [shortlistedSupplierSchema],
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

sourcingRequestSchema.index({ buyer: 1, createdAt: -1 });
sourcingRequestSchema.index({ status: 1, createdAt: -1 });

const SourcingRequest = mongoose.model("SourcingRequest", sourcingRequestSchema);
export default SourcingRequest;
