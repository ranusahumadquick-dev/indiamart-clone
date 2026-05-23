import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    attachments: [
      {
        url: { type: String },
        name: { type: String },
        type: { type: String },
      },
    ],
    type: {
      type: String,
      enum: ["text", "quote", "sample_request", "system"],
      default: "text",
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
