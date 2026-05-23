import express from "express";
import {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  archiveConversation,
  editMessage,
} from "../controllers/chatController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadFiles } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// =============================================
// 🔒 ALL ROUTES REQUIRE AUTHENTICATION
// =============================================

// Get conversations list for user
router.get("/conversations", authMiddleware, getConversations);

// Get or create conversation with seller
router.post("/conversations", authMiddleware, getOrCreateConversation);

// Get messages in a conversation
router.get("/conversations/:conversationId/messages", authMiddleware, getMessages);

// Send message
router.post(
  "/conversations/:conversationId/messages",
  authMiddleware,
  uploadFiles,
  sendMessage
);

// Mark messages as read
router.put("/conversations/:conversationId/read", authMiddleware, markAsRead);

// Archive conversation
router.put("/conversations/:conversationId/archive", authMiddleware, archiveConversation);

// Edit message
router.put("/messages/:messageId", authMiddleware, editMessage);

export default router;
