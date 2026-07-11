import express from "express";
import {
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
} from "../controllers/chatController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadProductImages } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// =============================================
// 🔒 ALL ROUTES REQUIRE AUTHENTICATION
// =============================================
router.use(authMiddleware);

// =============================================
// 💬 CONVERSATIONS
// =============================================

// Get conversations list for user
router.get("/conversations", getConversations);

// Get conversation details
router.get("/conversations/:conversationId", getConversationDetails);

// Get or create conversation with seller
router.post("/conversations", getOrCreateConversation);

// Archive conversation
router.put("/conversations/:conversationId/archive", archiveConversation);

// Unarchive conversation
router.put("/conversations/:conversationId/unarchive", unarchiveConversation);

// Close conversation
router.put("/conversations/:conversationId/close", closeConversation);

// Search conversations
router.get("/search", searchConversations);

// Get chat statistics
router.get("/stats/summary", getChatStats);

// =============================================
// 💭 MESSAGES
// =============================================

// Get messages in a conversation
router.get("/conversations/:conversationId/messages", getMessages);

// Send message
router.post("/conversations/:conversationId/messages", sendMessage);

// Mark messages as read
router.put("/conversations/:conversationId/read", markAsRead);

// Edit message
router.put("/messages/:messageId", editMessage);

// Delete message
router.delete("/messages/:messageId", deleteMessage);

// =============================================
// 📎 FILE UPLOADS
// =============================================

// Upload attachments (separate from message for reliability)
router.post(
  "/upload-attachments",
  uploadProductImages,
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new Error("No files uploaded");
    }

    const attachments = req.files.map((file) => ({
      url: file.path,
      type: file.mimetype.startsWith("image/") ? "image" : "file",
      fileName: file.originalname,
    }));

    return res.status(200).json(
      new ApiResponse(200, { attachments }, "Files uploaded successfully")
    );
  })
);

export default router;
