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
    .populate("product", "name price image");

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
      .populate("product", "name price image");
  }

  return res.status(200).json(new ApiResponse(200, conversation, "Conversation fetched/created"));
});

// =============================================
// 📨 GET CONVERSATIONS LIST
// =============================================
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { role = "buyer", search, status = "active" } = req.query;

  const query = role === "buyer" ? { buyer: userId } : { seller: userId };
  
  if (status === "all") {
    query.status = { $ne: "closed" };
  } else {
    query.status = status || "active";
  }

  if (search) {
    // Search in conversation subject or last message
    query.$or = [
      { subject: { $regex: search, $options: "i" } },
      { lastMessage: { $regex: search, $options: "i" } },
    ];
  }

  const conversations = await Conversation.find(query)
    .populate(
      role === "buyer" ? "seller" : "buyer",
      "name email avatar companyName isVerified"
    )
    .populate("product", "name image price")
    .populate("lastMessageBy", "name avatar")
    .sort({ lastMessageTime: -1 })
    .limit(100);

  const unreadCount = await Conversation.countDocuments({
    ...query,
    [role === "buyer" ? "buyerUnreadCount" : "sellerUnreadCount"]: { $gt: 0 },
  });

  return res.status(200).json(
    new ApiResponse(200, { conversations, unreadCount }, "Conversations fetched")
  );
});

// =============================================
// 💬 GET CONVERSATION DETAILS
// =============================================
const getConversationDetails = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findById(conversationId)
    .populate("buyer", "name email avatar companyName isVerified")
    .populate("seller", "name email avatar companyName isVerified")
    .populate("product", "name price image description")
    .populate("lastMessageBy", "name avatar");

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  return res.status(200).json(
    new ApiResponse(200, conversation, "Conversation details fetched")
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
    .populate("sender", "name avatar role")
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

  // Verify user is participant
  const isParticipant =
    senderId.toString() === conversation.buyer.toString() ||
    senderId.toString() === conversation.seller.toString();
  
  if (!isParticipant) {
    throw new ApiError(403, "You are not a participant in this conversation");
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    text: text?.trim() || "",
    attachments: attachments || [],
    messageType: messageType || "text",
    quoteData: messageType === "quote_request" ? quoteData : undefined,
    replyTo: replyToId || null,
  });

  // Update conversation
  const senderIsBuyer = senderId.toString() === conversation.buyer.toString();
  const updateData = {
    lastMessage: text?.substring(0, 100) || (attachments?.length > 0 ? "📎 Attachment(s)" : ""),
    lastMessageTime: new Date(),
    lastMessageBy: senderId,
    messageCount: conversation.messageCount + 1,
  };

  // Increment unread count for recipient
  if (senderIsBuyer) {
    updateData.sellerUnreadCount = (conversation.sellerUnreadCount || 0) + 1;
  } else {
    updateData.buyerUnreadCount = (conversation.buyerUnreadCount || 0) + 1;
  }

  await Conversation.findByIdAndUpdate(conversationId, updateData);

  const populatedMessage = await Message.findById(message._id).populate("sender", "name avatar role");

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
    { new: true }
  );

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  return res.status(200).json(new ApiResponse(200, conversation, "Conversation archived"));
});

// =============================================
// 🏠 UNARCHIVE CONVERSATION
// =============================================
const unarchiveConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findByIdAndUpdate(
    conversationId,
    { status: "active" },
    { new: true }
  );

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  return res.status(200).json(new ApiResponse(200, conversation, "Conversation restored"));
});

// =============================================
// 🚫 CLOSE CONVERSATION
// =============================================
const closeConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findByIdAndUpdate(
    conversationId,
    { status: "closed" },
    { new: true }
  );

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  return res.status(200).json(new ApiResponse(200, conversation, "Conversation closed"));
});

// =============================================
// ✏️ EDIT MESSAGE
// =============================================
const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;

  if (!text || text.trim().length === 0) {
    throw new ApiError(400, "Message text is required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only edit your own messages");
  }

  message.text = text.trim();
  message.isEdited = true;
  await message.save();

  const populatedMessage = await Message.findById(messageId).populate("sender", "name avatar role");

  return res.status(200).json(new ApiResponse(200, populatedMessage, "Message updated"));
});

// =============================================
// 🗑️ DELETE MESSAGE
// =============================================
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.sender.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  await Message.findByIdAndDelete(messageId);

  return res.status(200).json(new ApiResponse(200, null, "Message deleted"));
});

// =============================================
// 🔍 SEARCH CONVERSATIONS
// =============================================
const searchConversations = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const userId = req.user._id;
  const { role = "buyer" } = req.query;

  if (!query || query.trim().length === 0) {
    throw new ApiError(400, "Search query is required");
  }

  const searchQuery = role === "buyer" ? { buyer: userId } : { seller: userId };
  searchQuery.$or = [
    { subject: { $regex: query, $options: "i" } },
    { lastMessage: { $regex: query, $options: "i" } },
  ];

  const conversations = await Conversation.find(searchQuery)
    .populate(
      role === "buyer" ? "seller" : "buyer",
      "name email avatar companyName"
    )
    .populate("product", "name image price")
    .limit(20);

  return res.status(200).json(
    new ApiResponse(200, conversations, "Search results fetched")
  );
});

// =============================================
// 📊 GET CHAT STATISTICS
// =============================================
const getChatStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { role = "buyer" } = req.query;

  const query = role === "buyer" ? { buyer: userId } : { seller: userId };

  const totalConversations = await Conversation.countDocuments(query);
  const activeConversations = await Conversation.countDocuments({
    ...query,
    status: "active",
  });
  const archivedConversations = await Conversation.countDocuments({
    ...query,
    status: "archived",
  });
  const unreadConversations = await Conversation.countDocuments({
    ...query,
    [role === "buyer" ? "buyerUnreadCount" : "sellerUnreadCount"]: { $gt: 0 },
  });

  const stats = {
    total: totalConversations,
    active: activeConversations,
    archived: archivedConversations,
    unread: unreadConversations,
  };

  return res.status(200).json(
    new ApiResponse(200, stats, "Chat statistics fetched")
  );
});

export {
  getOrCreateConversation,
  getConversations,
  getConversationDetails,
  getMessages,
  sendMessage,
  markAsRead,
  archiveConversation,
  unarchiveConversation,
  closeConversation,
  editMessage,
  deleteMessage,
  searchConversations,
  getChatStats,
};

