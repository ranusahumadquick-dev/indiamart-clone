import express from "express";
import {
  sendOTP,
  verifyOTP,
  resendOTP,
  sendEmailOTP,
  verifyEmailOTP,
  sendMobileOTP,
  verifyMobileOTP,
  registerSeller,
} from "../controllers/otpController.js";
import {
  otpSendLimiter,
  otpVerifyLimiter,
  otpResendLimiter,
} from "../middleware/otpRateLimiter.js";

const router = express.Router();

// ── Primary routes ─────────────────────────────────────────────────────────
router.post("/send-otp",   otpSendLimiter,   sendOTP);
router.post("/verify-otp", otpVerifyLimiter, verifyOTP);
router.post("/resend-otp", otpResendLimiter, resendOTP);

// ── Seller complete registration ───────────────────────────────────────────
router.post("/register-seller", registerSeller);

// ── Legacy routes ──────────────────────────────────────────────────────────
router.post("/send-mobile",   otpSendLimiter,   sendMobileOTP);
router.post("/verify-mobile", otpVerifyLimiter, verifyMobileOTP);
router.post("/send-email",    sendEmailOTP);
router.post("/verify-email",  verifyEmailOTP);

export default router;
