import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // --- Conversation Reference ---
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    // --- Sender ---
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // --- Message Content ---
    text: {
      type: String,
      trim: true,
    },

    // --- Attachments (images, files, etc) ---
    attachments: [
      {
        url: { type: String, required: true },
        fileName: { type: String },
        type: {
          type: String,
          enum: ["image", "file", "quote"],
          default: "file",
        },
      },
    ],

    // --- Message Type ---
    messageType: {
      type: String,
      enum: ["text", "product_inquiry", "quote_request", "order_update"],
      default: "text",
    },

    // --- Quote/Inquiry Data (optional) ---
    quoteData: {
      quantity: { type: Number },
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      requestedPrice: { type: Number },
      message: { type: String },
    },

    // --- Read Status ---
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },

    // --- Reactions (emoji reactions) ---
    reactions: [
      {
        emoji: String,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    // --- Reply To (threading) ---
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    // --- Editing ---
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isRead: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
