import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../services/emailService.js";

// =============================================
// POST /api/auth/forgot-password
// =============================================
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(404, "No account found with this email address.");
  }

  // Generate secure random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  user.passwordResetToken = resetToken;
  user.passwordResetExpiry = resetExpiry;
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const resetLink = `${clientUrl}/auth/reset-password/${resetToken}`;

  // Send email
  const result = await sendPasswordResetEmail(user.email, user.name, resetLink);

  if (!result.sent && process.env.NODE_ENV === "production") {
    // Rollback token on email failure in production
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, "Failed to send reset email. Please try again.");
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "Password reset link has been sent to your email address.")
  );
});

// =============================================
// POST /api/auth/reset-password/:token
// =============================================
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) throw new ApiError(400, "Reset token is required");
  if (!password) throw new ApiError(400, "New password is required");

  // Password strength validation
  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (!strongPassword.test(password)) {
    throw new ApiError(400, "Password must be at least 8 characters with uppercase, lowercase, number, and special character");
  }

  // Find user with valid non-expired token
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpiry: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    throw new ApiError(400, "Reset link has expired. Please request a new password reset link.");
  }

  // Update password (pre-save hook will hash it)
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Password has been reset successfully. You can now login with your new password.")
  );
});

// Legacy alias — kept for old /api/password-reset/request route
export const requestPasswordReset = forgotPassword;
