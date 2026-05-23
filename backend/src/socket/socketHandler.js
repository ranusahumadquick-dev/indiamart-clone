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
    // Join personal room (for direct notifications)
    socket.join(`user:${socket.userId}`);

    // Join a conversation room
    socket.on("join_conversation", (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    // Leave a conversation room
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Send a message
    socket.on("send_message", async ({ conversationId, text, type = "text" }, callback) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return callback?.({ error: "Conversation not found" });

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === socket.userId
        );
        if (!isParticipant) return callback?.({ error: "Not authorized" });

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          text,
          type,
          readBy: [socket.userId],
        });

        const populated = await message.populate("sender", "name avatar role");

        // Update conversation
        const otherParticipants = conversation.participants.filter(
          (p) => p.toString() !== socket.userId
        );
        const unreadInc = {};
        otherParticipants.forEach((p) => { unreadInc[`unreadCount.${p}`] = 1; });
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: text,
          lastMessageAt: new Date(),
          $inc: unreadInc,
        });

        // Emit to all in conversation room
        io.to(`conv:${conversationId}`).emit("new_message", populated);

        // Notify other participants in their personal rooms
        otherParticipants.forEach((p) => {
          io.to(`user:${p}`).emit("conversation_updated", {
            conversationId,
            lastMessage: text,
            lastMessageAt: new Date(),
          });
        });

        callback?.({ success: true, message: populated });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // Typing indicator
    socket.on("typing", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("user_typing", {
        userId: socket.userId,
        conversationId,
      });
    });

    socket.on("stop_typing", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("user_stop_typing", {
        userId: socket.userId,
        conversationId,
      });
    });

    socket.on("disconnect", () => {
      // cleanup handled by socket.io automatically
    });
  });
};

export default socketHandler;
