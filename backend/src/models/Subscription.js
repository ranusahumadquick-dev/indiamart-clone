import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubscriptionPlan",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  planFor: { type: String, enum: ["seller", "buyer", "both"], default: "seller" },
  features: [{ type: String }],
  status: {
    type: String,
    enum: ["active", "inactive", "cancelled", "expired"],
    default: "active",
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  cancelledAt: { type: Date },
  autoRenew: { type: Boolean, default: true },
  renewalDate: { type: Date },
}, { timestamps: true });

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ userId: 1, planFor: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ plan: 1 });

subscriptionSchema.virtual("daysRemaining").get(function () {
  const diff = new Date(this.endDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

subscriptionSchema.virtual("isExpired").get(function () {
  return new Date() > new Date(this.endDate);
});

subscriptionSchema.virtual("isExpiringSoon").get(function () {
  const diff = new Date(this.endDate) - new Date();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
});

subscriptionSchema.methods.isValid = function () {
  return this.status === "active" && !this.isExpired;
};

subscriptionSchema.statics.findActiveSubscription = function (userId, planFor = null) {
  const q = { userId, status: "active" };
  if (planFor) q.planFor = planFor;
  return this.findOne(q);
};

export default mongoose.model("Subscription", subscriptionSchema);
