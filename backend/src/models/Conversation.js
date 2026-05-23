import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    type: {
      type: String,
      enum: ["inquiry", "sample", "general"],
      default: "general",
    },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    // unreadCount keyed by userId string
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
