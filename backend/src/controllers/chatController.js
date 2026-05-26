import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// =============================================
// 💬 GET OR CREATE CONVERSATION
// =============================================
const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { sellerId, productId } = req.body;
  const buyerId = req.user._id;

  if (!sellerId) {
    throw new ApiError(400, "Seller ID is required");
  }

  let conversation = await Conversation.findOne({
    buyer: buyerId,
    seller: sellerId,
    product: productId || null,
  })
    .populate("buyer", "name email avatar")
    .populate("seller", "name email avatar companyName")
    .populate("product", "name price");

  if (!conversation) {
    conversation = await Conversation.create({
      buyer: buyerId,
      seller: sellerId,
      product: productId || null,
      status: "active",
    });

    conversation = await Conversation.findById(conversation._id)
      .populate("buyer", "name email avatar")
      .populate("seller", "name email avatar companyName")
      .populate("product", "name price");
  }

  return res.status(200).json(new ApiResponse(200, conversation, "Conversation fetched/created"));
});

// =============================================
// 📨 GET CONVERSATIONS LIST
// =============================================
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { role = "buyer" } = req.query;

  const query = role === "buyer" ? { buyer: userId } : { seller: userId };
  query.status = { $ne: "closed" };

  const conversations = await Conversation.find(query)
    .populate(
      role === "buyer" ? "seller" : "buyer",
      "name email avatar companyName"
    )
    .populate("product", "name image price")
    .sort({ lastMessageTime: -1 })
    .limit(50);

  const unreadCount = await Conversation.countDocuments({
    ...query,
    [role === "buyer" ? "buyerUnreadCount" : "sellerUnreadCount"]: { $gt: 0 },
  });

  return res.status(200).json(
    new ApiResponse(200, { conversations, unreadCount }, "Conversations fetched")
  );
});

// =============================================
// 💭 GET MESSAGES IN CONVERSATION
// =============================================
const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 30 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const messages = await Message.find({ conversation: conversationId })
    .populate("sender", "name avatar")
    .populate("replyTo")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const totalMessages = await Message.countDocuments({ conversation: conversationId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        messages: messages.reverse(),
        pagination: {
          total: totalMessages,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalMessages / Number(limit)),
        },
      },
      "Messages fetched"
    )
  );
});

// =============================================
// 📤 SEND MESSAGE
// =============================================
const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { text, messageType, quoteData, replyToId, attachments } = req.body;
  const senderId = req.user._id;

  // Text is required unless attachments are provided
  if ((!text || text.trim().length === 0) && (!attachments || attachments.length === 0)) {
    throw new ApiError(400, "Message text or attachments are required");
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    text: text || "",
    attachments: attachments || [],
    messageType: messageType || "text",
    quoteData: messageType === "quote_request" ? quoteData : undefined,
    replyTo: replyToId || null,
  });

  // Update conversation
  const senderIsBuyer = senderId.toString() === conversation.buyer.toString();
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: text?.substring(0, 100) || "📎 attachment(s)",
    lastMessageTime: new Date(),
    lastMessageBy: senderId,
    messageCount: conversation.messageCount + 1,
    [senderIsBuyer ? "sellerUnreadCount" : "buyerUnreadCount"]:
      (senderIsBuyer ? conversation.sellerUnreadCount : conversation.buyerUnreadCount) + 1,
  });

  const populatedMessage = await Message.findById(message._id).populate("sender", "name avatar");

  return res.status(201).json(new ApiResponse(201, populatedMessage, "Message sent"));
});

// =============================================
// ✅ MARK MESSAGES AS READ
// =============================================
const markAsRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  const isReadField =
    userId.toString() === conversation.buyer.toString() ? "buyerReadAt" : "sellerReadAt";
  const unreadField =
    userId.toString() === conversation.buyer.toString()
      ? "buyerUnreadCount"
      : "sellerUnreadCount";

  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  await Conversation.findByIdAndUpdate(conversationId, {
    [isReadField]: new Date(),
    [unreadField]: 0,
  });

  return res.status(200).json(new ApiResponse(200, null, "Messages marked as read"));
});

// =============================================
// 🏠 ARCHIVE CONVERSATION
// =============================================
const archiveConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findByIdAndUpdate(
    conversationId,
    { status: "archived" },
    { returnDocument: 'after' }
  );

  return res.status(200).json(new ApiResponse(200, conversation, "Conversation archived"));
});

// =============================================
// ✏️ EDIT MESSAGE
// =============================================
const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only edit your own messages");
  }

  message.text = text;
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  const populatedMessage = await Message.findById(messageId).populate("sender", "name avatar");

  return res.status(200).json(new ApiResponse(200, populatedMessage, "Message updated"));
});

export {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  archiveConversation,
  editMessage,
};

