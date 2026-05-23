import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

const socketHandler = (io) => {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✓ User connected: ${socket.userId}`);

    // Join personal room (for direct notifications)
    socket.join(`user:${socket.userId}`);

    // =============================================
    // 💬 CONVERSATION ROOMS
    // =============================================
    socket.on("join_conversation", (conversationId) => {
      socket.join(`conv:${conversationId}`);
      console.log(`✓ User ${socket.userId} joined conversation ${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    // =============================================
    // 📤 SEND MESSAGE
    // =============================================
    socket.on("send_message", async ({ conversationId, text }, callback) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return callback?.({ error: "Conversation not found" });

        // Check if user is participant
        const isBuyer = socket.userId.toString() === conversation.buyer.toString();
        const isSeller = socket.userId.toString() === conversation.seller.toString();
        if (!isBuyer && !isSeller) return callback?.({ error: "Not authorized" });

        // Create message
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          text: text || "",
          messageType: "text",
        });

        const populated = await message.populate("sender", "name avatar");

        // Update conversation
        const updateData = {
          lastMessage: text?.substring(0, 100),
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
        });

        // Notify other participant
        const otherUserId = isBuyer ? conversation.seller : conversation.buyer;
        io.to(`user:${otherUserId}`).emit("conversation:updated", {
          conversationId,
          lastMessage: text?.substring(0, 100),
          lastMessageTime: new Date(),
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
        if (!conversation) return;

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
        });

        callback?.({ success: true });
      } catch (err) {
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
      });
    });

    socket.on("stop_typing", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("user:stop_typing", {
        userId: socket.userId,
        conversationId,
      });
    });

    // =============================================
    // 🔌 DISCONNECT
    // =============================================
    socket.on("disconnect", () => {
      console.log(`✗ User disconnected: ${socket.userId}`);
    });
  });
};

export default socketHandler;
