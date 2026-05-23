import express from "express";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// =============================================
// PROTECTED ROUTES — Auth required
// =============================================

// GET notification preferences
router.get("/notification-preferences", authMiddleware, getNotificationPreferences);

// PUT update notification preferences
router.put("/notification-preferences", authMiddleware, updateNotificationPreferences);

export default router;
