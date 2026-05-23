import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// GET /api/messages/conversations — list user's conversations
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    $or: [
      { buyer: req.user._id },
      { seller: req.user._id }
    ],
    status: { $ne: "closed" }
  })
    .sort({ lastMessageTime: -1 })
    .populate("buyer", "name avatar role companyName")
    .populate("seller", "name avatar role companyName")
    .populate("product", "name images");

  // Attach unread count for current user
  const result = conversations.map((c) => {
    const isBuyer = c.buyer._id.toString() === req.user._id.toString();
    return {
      ...c.toObject(),
      myUnread: isBuyer ? c.buyerUnreadCount || 0 : c.sellerUnreadCount || 0,
    };
  });

  return res.status(200).json(new ApiResponse(200, result, "Conversations fetched"));
});

// GET /api/messages/conversations/:id — get messages in a conversation
const getMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const conversation = await Conversation.findById(id);
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const isParticipant =
    conversation.buyer.toString() === req.user._id.toString() ||
    conversation.seller.toString() === req.user._id.toString();
  if (!isParticipant) throw new ApiError(403, "Not authorized");

  const skip = (Number(page) - 1) * Number(limit);
  const [messages, total] = await Promise.all([
    Message.find({ conversation: id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("sender", "name avatar role"),
    Message.countDocuments({ conversation: id }),
  ]);

  // Mark as read for current user
  await Message.updateMany(
    { conversation: id, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );
  // Reset unread count
  const isBuyer = conversation.buyer.toString() === req.user._id.toString();
  const unreadField = isBuyer ? "buyerUnreadCount" : "sellerUnreadCount";
  const readAtField = isBuyer ? "buyerReadAt" : "sellerReadAt";

  await Conversation.findByIdAndUpdate(id, {
    $set: { [unreadField]: 0, [readAtField]: new Date() },
  });

  return res.status(200).json(
    new ApiResponse(200, { messages, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, "Messages fetched")
  );
});

// POST /api/messages/conversations — start a new conversation
const startConversation = asyncHandler(async (req, res) => {
  const { sellerId, productId, message } = req.body;
  if (!sellerId || !message) throw new ApiError(400, "sellerId and message are required");

  // Check for existing conversation between these two about this product
  const existing = await Conversation.findOne({
    buyer: req.user._id,
    seller: sellerId,
    ...(productId ? { product: productId } : {}),
    status: { $ne: "closed" },
  });

  let conversation = existing;
  if (!conversation) {
    conversation = await Conversation.create({
      buyer: req.user._id,
      seller: sellerId,
      ...(productId ? { product: productId } : {}),
      lastMessage: message,
      lastMessageTime: new Date(),
      sellerUnreadCount: 1,
    });
  }

  const msg = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: message,
    type: "text",
    readBy: [req.user._id],
  });

  if (existing) {
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: message,
      lastMessageAt: new Date(),
      $inc: { [`unreadCount.${sellerId}`]: 1 },
    });
  }

  const populated = await msg.populate("sender", "name avatar role");

  return res.status(201).json(
    new ApiResponse(201, { conversation, message: populated }, "Conversation started")
  );
});

// POST /api/messages/conversations/:id — send a message
const sendMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text, type = "text" } = req.body;
  if (!text) throw new ApiError(400, "Message text is required");

  const conversation = await Conversation.findById(id);
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const isParticipant =
    conversation.buyer.toString() === req.user._id.toString() ||
    conversation.seller.toString() === req.user._id.toString();
  if (!isParticipant) throw new ApiError(403, "Not authorized");

  const message = await Message.create({
    conversation: id,
    sender: req.user._id,
    text,
    type,
    readBy: [req.user._id],
  });

  // Update conversation lastMessage + increment unread for other participant
  const isBuyer = conversation.buyer.toString() === req.user._id.toString();
  const updateData = {
    lastMessage: text,
    lastMessageTime: new Date(),
    lastMessageBy: req.user._id,
  };
  if (isBuyer) {
    updateData.$inc = { sellerUnreadCount: 1 };
  } else {
    updateData.$inc = { buyerUnreadCount: 1 };
  }

  await Conversation.findByIdAndUpdate(id, updateData);

  const populated = await message.populate("sender", "name avatar role");

  return res.status(201).json(new ApiResponse(201, populated, "Message sent"));
});

// PUT /api/messages/conversations/:id/read — mark conversation as read
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const conversation = await Conversation.findById(id);
  if (!conversation) throw new ApiError(404, "Conversation not found");

  await Message.updateMany(
    { conversation: id, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );

  const isBuyer = conversation.buyer.toString() === req.user._id.toString();
  const unreadField = isBuyer ? "buyerUnreadCount" : "sellerUnreadCount";
  const readAtField = isBuyer ? "buyerReadAt" : "sellerReadAt";

  await Conversation.findByIdAndUpdate(id, {
    $set: { [unreadField]: 0, [readAtField]: new Date() },
  });
  return res.status(200).json(new ApiResponse(200, {}, "Marked as read"));
});

export { getConversations, getMessages, startConversation, sendMessage, markAsRead };
