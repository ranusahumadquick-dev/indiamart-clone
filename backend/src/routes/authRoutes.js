import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// =============================================
// PUBLIC ROUTES — No auth required
// =============================================
router.post("/register", registerUser);
router.post("/login", loginUser);

// =============================================
// PROTECTED ROUTES — Auth required
// =============================================
router.get("/me", authMiddleware, getMe);
// Alias for frontend compatibility
router.get("/profile", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateProfile);
router.post("/change-password", authMiddleware, changePassword);
router.put("/update-avatar", authMiddleware, uploadAvatar, async (req, res) => {
  const { default: User } = await import("../models/User.js");
  const { default: ApiResponse } = await import("../utils/ApiResponse.js");
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  const user = await User.findByIdAndUpdate(
    req.user._id, { avatar: req.file.path }, { new: true }
  ).select("-password -refreshToken");
  return res.status(200).json(new ApiResponse(200, user, "Avatar updated"));
});

export default router;
