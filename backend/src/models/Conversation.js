import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // --- Participants ---
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

    // --- Product (if inquiry about specific product) ---
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    // --- Conversation Info ---
    subject: {
      type: String,
      trim: true,
    },
    lastMessage: {
      type: String,
      trim: true,
    },
    lastMessageTime: {
      type: Date,
    },
    lastMessageBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // --- Message Count ---
    messageCount: {
      type: Number,
      default: 0,
    },

    // --- Status ---
    status: {
      type: String,
      enum: ["active", "archived", "closed"],
      default: "active",
    },

    // --- Read Status (for notifications) ---
    buyerUnreadCount: {
      type: Number,
      default: 0,
    },
    sellerUnreadCount: {
      type: Number,
      default: 0,
    },
    buyerReadAt: {
      type: Date,
    },
    sellerReadAt: {
      type: Date,
    },

    // --- Typing Indicators ---
    buyerTyping: {
      type: Boolean,
      default: false,
    },
    sellerTyping: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
conversationSchema.index({ buyer: 1, seller: 1, product: 1 }, { unique: true });
conversationSchema.index({ buyer: 1, status: 1 });
conversationSchema.index({ seller: 1, status: 1 });
conversationSchema.index({ lastMessageTime: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
