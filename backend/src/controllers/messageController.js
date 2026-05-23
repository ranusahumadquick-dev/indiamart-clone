import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// GET /api/messages/conversations — list user's conversations
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
    isActive: true,
  })
    .sort({ lastMessageAt: -1 })
    .populate("participants", "name avatar role companyName")
    .populate("product", "name images");

  // Attach unread count for current user
  const result = conversations.map((c) => ({
    ...c.toObject(),
    myUnread: c.unreadCount?.get?.(req.user._id.toString()) || 0,
  }));

  return res.status(200).json(new ApiResponse(200, result, "Conversations fetched"));
});

// GET /api/messages/conversations/:id — get messages in a conversation
const getMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const conversation = await Conversation.findById(id);
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
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
  await Conversation.findByIdAndUpdate(id, {
    $set: { [`unreadCount.${req.user._id}`]: 0 },
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
    participants: { $all: [req.user._id, sellerId] },
    ...(productId ? { product: productId } : {}),
    isActive: true,
  });

  let conversation = existing;
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, sellerId],
      ...(productId ? { product: productId } : {}),
      type: "general",
      lastMessage: message,
      lastMessageAt: new Date(),
      unreadCount: { [sellerId]: 1 },
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

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) throw new ApiError(403, "Not authorized");

  const message = await Message.create({
    conversation: id,
    sender: req.user._id,
    text,
    type,
    readBy: [req.user._id],
  });

  // Update conversation lastMessage + increment unread for other participants
  const otherParticipants = conversation.participants.filter(
    (p) => p.toString() !== req.user._id.toString()
  );
  const unreadInc = {};
  otherParticipants.forEach((p) => { unreadInc[`unreadCount.${p}`] = 1; });

  await Conversation.findByIdAndUpdate(id, {
    lastMessage: text,
    lastMessageAt: new Date(),
    $inc: unreadInc,
  });

  const populated = await message.populate("sender", "name avatar role");

  return res.status(201).json(new ApiResponse(201, populated, "Message sent"));
});

// PUT /api/messages/conversations/:id/read — mark conversation as read
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Message.updateMany(
    { conversation: id, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );
  await Conversation.findByIdAndUpdate(id, {
    $set: { [`unreadCount.${req.user._id}`]: 0 },
  });
  return res.status(200).json(new ApiResponse(200, {}, "Marked as read"));
});

export { getConversations, getMessages, startConversation, sendMessage, markAsRead };
