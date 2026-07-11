import express from "express";
import {
  requestPasswordReset,
  resetPassword,
} from "../controllers/passwordResetController.js";

const router = express.Router();

// =============================================
// PUBLIC ROUTES — No auth required
// =============================================

// Request password reset (sends reset link)
router.post("/request", requestPasswordReset);

// Reset password using token
router.post("/reset", resetPassword);

export default router;