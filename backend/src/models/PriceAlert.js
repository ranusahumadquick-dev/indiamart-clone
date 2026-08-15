import mongoose from "mongoose";

const priceAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    alertType: { type: String, enum: ["price", "stock"], default: "price" },
    // Price alert fields
    targetPrice: { type: Number, min: 0 },
    currentPriceAtAlert: { type: Number },
    // Stock alert fields
    notifyWhenInStock: { type: Boolean, default: false },
    // Status
    isActive: { type: Boolean, default: true },
    triggeredAt: { type: Date },
  },
  { timestamps: true }
);

priceAlertSchema.index({ user: 1, isActive: 1 });
priceAlertSchema.index({ product: 1, alertType: 1, isActive: 1 });
priceAlertSchema.index({ user: 1, product: 1, alertType: 1 });

const PriceAlert = mongoose.model("PriceAlert", priceAlertSchema);
export default PriceAlert;
