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
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadProductImages } from "../middleware/uploadMiddleware.js";

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
  sendMessage
);

// Upload attachments (separate from message for reliability)
router.post(
  "/upload-attachments",
  authMiddleware,
  uploadProductImages,
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new Error("No files uploaded");
    }

    const attachments = req.files.map(file => ({
      url: file.path,
      type: file.mimetype.startsWith('image/') ? 'image' : 'file',
      fileName: file.originalname
    }));

    return res.status(200).json(
      new ApiResponse(200, { attachments }, "Files uploaded successfully")
    );
  })
);

// Mark messages as read
router.put("/conversations/:conversationId/read", authMiddleware, markAsRead);

// Archive conversation
router.put("/conversations/:conversationId/archive", authMiddleware, archiveConversation);

// Edit message
router.put("/messages/:messageId", authMiddleware, editMessage);

export default router;
