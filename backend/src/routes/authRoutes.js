import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

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

export default router;
