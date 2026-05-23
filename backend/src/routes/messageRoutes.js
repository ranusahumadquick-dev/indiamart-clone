import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getConversations,
  getMessages,
  startConversation,
  sendMessage,
  markAsRead,
} from "../controllers/messageController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/conversations", getConversations);
router.post("/conversations", startConversation);
router.get("/conversations/:id", getMessages);
router.post("/conversations/:id", sendMessage);
router.put("/conversations/:id/read", markAsRead);

export default router;
