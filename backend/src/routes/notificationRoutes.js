import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} from "../controllers/notificationController.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/read-all", markAllAsRead);
router.delete("/", clearNotifications);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
