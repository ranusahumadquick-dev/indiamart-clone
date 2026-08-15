import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

// Track user online status
const onlineUsers = new Map(); // userId -> { socketId, conversations: [] }

const socketHandler = (io) => {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userName = decoded.name;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✓ User connected: ${socket.userId} (${socket.userName})`);

    // =============================================
    // 👤 USER PRESENCE & STATUS
    // =============================================

    // Mark user as online
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, { socketId: socket.id, conversations: [] });
    } else {
      const userData = onlineUsers.get(socket.userId);
      userData.socketId = socket.id;
      onlineUsers.set(socket.userId, userData);
    }

    // Notify all users about user coming online
    io.emit("user:online", {
      userId: socket.userId,
      userName: socket.userName,
      timestamp: new Date(),
    });

    // Join personal room (for direct notifications)
    socket.join(`user:${socket.userId}`);

    // =============================================
    // 💬 CONVERSATION ROOMS
    // =============================================
    socket.on("join_conversation", async ({ conversationId }, callback) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return callback?.({ error: "Conversation not found" });
        }

        // Verify user is participant
        const isBuyer = socket.userId.toString() === conversation.buyer.toString();
        const isSeller = socket.userId.toString() === conversation.seller.toString();
        if (!isBuyer && !isSeller) {
          return callback?.({ error: "Not authorized to join this conversation" });
        }

        socket.join(`conv:${conversationId}`);

        // Track active conversation
        const userData = onlineUsers.get(socket.userId) || { socketId: socket.id, conversations: [] };
        if (!userData.conversations.includes(conversationId)) {
          userData.conversations.push(conversationId);
          onlineUsers.set(socket.userId, userData);
        }

        // Notify other participant that user is online in this conversation
        const otherUserId = isBuyer ? conversation.seller : conversation.buyer;
        io.to(`user:${otherUserId}`).emit("user:conversation_online", {
          conversationId,
          userId: socket.userId,
          timestamp: new Date(),
        });

        console.log(`✓ User ${socket.userId} joined conversation ${conversationId}`);
        callback?.({ success: true });
      } catch (err) {
        console.error("Join conversation error:", err);
        callback?.({ error: err.message });
      }
    });

    socket.on("leave_conversation", ({ conversationId }, callback) => {
      try {
        socket.leave(`conv:${conversationId}`);

        // Remove from tracking
        const userData = onlineUsers.get(socket.userId);
        if (userData) {
          userData.conversations = userData.conversations.filter((cId) => cId !== conversationId);
          onlineUsers.set(socket.userId, userData);
        }

        // Notify other participant
        socket.to(`conv:${conversationId}`).emit("user:conversation_offline", {
          conversationId,
          userId: socket.userId,
          timestamp: new Date(),
        });

        callback?.({ success: true });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // =============================================
    // 📤 SEND MESSAGE
    // =============================================
    socket.on("send_message", async ({ conversationId, text, attachments, messageType }, callback) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return callback?.({ error: "Conversation not found" });

        // Check if user is participant
        const isBuyer = socket.userId.toString() === conversation.buyer.toString();
        const isSeller = socket.userId.toString() === conversation.seller.toString();
        if (!isBuyer && !isSeller) return callback?.({ error: "Not authorized" });

        // Validate message
        if ((!text || text.trim().length === 0) && (!attachments || attachments.length === 0)) {
          return callback?.({ error: "Message cannot be empty" });
        }

        // Create message
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          text: text?.trim() || "",
          attachments: attachments || [],
          messageType: messageType || "text",
        });

        const populated = await message.populate("sender", "name avatar role");

        // Update conversation
        const updateData = {
          lastMessage: text?.substring(0, 100) || (attachments?.length > 0 ? "📎 Sent attachment(s)" : ""),
          lastMessageTime: new Date(),
          lastMessageBy: socket.userId,
          messageCount: conversation.messageCount + 1,
        };

        if (isBuyer) {
          updateData.sellerUnreadCount = (conversation.sellerUnreadCount || 0) + 1;
        } else {
          updateData.buyerUnreadCount = (conversation.buyerUnreadCount || 0) + 1;
        }

        await Conversation.findByIdAndUpdate(conversationId, updateData);

        // Broadcast message to conversation room
        io.to(`conv:${conversationId}`).emit("message:new", {
          message: populated,
          conversationId,
          timestamp: new Date(),
        });

        // Notify other participant
        const otherUserId = isBuyer ? conversation.seller : conversation.buyer;
        io.to(`user:${otherUserId}`).emit("conversation:updated", {
          conversationId,
          lastMessage: text?.substring(0, 100) || "📎 Attachment",
          lastMessageTime: new Date(),
          unreadCount: isBuyer ? conversation.sellerUnreadCount + 1 : conversation.buyerUnreadCount + 1,
        });

        callback?.({ success: true, message: populated });
      } catch (err) {
        console.error("Message error:", err);
        callback?.({ error: err.message });
      }
    });

    // =============================================
    // ✅ MARK MESSAGES AS READ
    // =============================================
    socket.on("messages:read", async ({ conversationId }, callback) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return callback?.({ error: "Conversation not found" });

        const isBuyer = socket.userId.toString() === conversation.buyer.toString();
        const readField = isBuyer ? "buyerReadAt" : "sellerReadAt";
        const unreadField = isBuyer ? "buyerUnreadCount" : "sellerUnreadCount";

        await Message.updateMany(
          { conversation: conversationId, sender: { $ne: socket.userId }, isRead: false },
          { isRead: true, readAt: new Date() }
        );

        await Conversation.findByIdAndUpdate(conversationId, {
          [readField]: new Date(),
          [unreadField]: 0,
        });

        io.to(`conv:${conversationId}`).emit("messages:read", {
          conversationId,
          userId: socket.userId,
          timestamp: new Date(),
        });

        callback?.({ success: true });
      } catch (err) {
        console.error("Read error:", err);
        callback?.({ error: err.message });
      }
    });

    // =============================================
    // ✏️ TYPING INDICATOR
    // =============================================
    socket.on("typing", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("user:typing", {
        userId: socket.userId,
        conversationId,
        timestamp: new Date(),
      });
    });

    socket.on("stop_typing", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("user:stop_typing", {
        userId: socket.userId,
        conversationId,
        timestamp: new Date(),
      });
    });

    // =============================================
    // 😊 MESSAGE REACTIONS
    // =============================================
    socket.on("add_reaction", async ({ messageId, emoji }, callback) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return callback?.({ error: "Message not found" });

        const existingReaction = message.reactions?.find(
          (r) => r.emoji === emoji && r.userId.toString() === socket.userId
        );

        if (!existingReaction) {
          message.reactions = message.reactions || [];
          message.reactions.push({ emoji, userId: socket.userId });
          await message.save();
        }

        const conversation = message.conversation;
        io.to(`conv:${conversation}`).emit("reaction:added", {
          messageId,
          emoji,
          userId: socket.userId,
          timestamp: new Date(),
        });

        callback?.({ success: true });
      } catch (err) {
        console.error("Reaction error:", err);
        callback?.({ error: err.message });
      }
    });

    socket.on("remove_reaction", async ({ messageId, emoji }, callback) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return callback?.({ error: "Message not found" });

        message.reactions = (message.reactions || []).filter(
          (r) => !(r.emoji === emoji && r.userId.toString() === socket.userId)
        );
        await message.save();

        const conversation = message.conversation;
        io.to(`conv:${conversation}`).emit("reaction:removed", {
          messageId,
          emoji,
          userId: socket.userId,
          timestamp: new Date(),
        });

        callback?.({ success: true });
      } catch (err) {
        console.error("Remove reaction error:", err);
        callback?.({ error: err.message });
      }
    });

    // =============================================
    // 🗑️ DELETE MESSAGE
    // =============================================
    socket.on("delete_message", async ({ messageId }, callback) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return callback?.({ error: "Message not found" });

        // Check if user is sender
        if (message.sender.toString() !== socket.userId) {
          return callback?.({ error: "Not authorized to delete this message" });
        }

        await Message.findByIdAndDelete(messageId);

        const conversation = message.conversation;
        io.to(`conv:${conversation}`).emit("message:deleted", {
          messageId,
          conversationId: conversation,
          userId: socket.userId,
          timestamp: new Date(),
        });

        callback?.({ success: true });
      } catch (err) {
        console.error("Delete error:", err);
        callback?.({ error: err.message });
      }
    });

    // =============================================
    // ✏️ EDIT MESSAGE
    // =============================================
    socket.on("edit_message", async ({ messageId, text }, callback) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return callback?.({ error: "Message not found" });

        // Check if user is sender
        if (message.sender.toString() !== socket.userId) {
          return callback?.({ error: "Not authorized to edit this message" });
        }

        message.text = text?.trim();
        message.isEdited = true;
        await message.save();

        const populated = await Message.findById(messageId).populate("sender", "name avatar role");

        const conversation = message.conversation;
        io.to(`conv:${conversation}`).emit("message:edited", {
          messageId,
          message: populated,
          conversationId: conversation,
          timestamp: new Date(),
        });

        callback?.({ success: true, message: populated });
      } catch (err) {
        console.error("Edit error:", err);
        callback?.({ error: err.message });
      }
    });

    // =============================================
    // 🔌 DISCONNECT
    // =============================================
    socket.on("disconnect", () => {
      console.log(`✗ User disconnected: ${socket.userId}`);

      // Remove from tracking
      const userData = onlineUsers.get(socket.userId);
      if (userData && userData.socketId === socket.id) {
        onlineUsers.delete(socket.userId);

        // Notify all users about user going offline
        io.emit("user:offline", {
          userId: socket.userId,
          timestamp: new Date(),
        });
      }
    });

    // =============================================
    // 💔 ERROR HANDLING
    // =============================================
    socket.on("error", (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });
};

export default socketHandler;
