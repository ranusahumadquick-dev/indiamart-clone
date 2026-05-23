import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "inquiry_reply",
        "inquiry_reminder",
        "quotation_generated",
        "sample_status",
        "requirement_response",
        "product_approved",
        "product_rejected",
        "order_update",
        "general",
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    link: { type: String, trim: true },
    isRead: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
