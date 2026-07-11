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
// Temporarily disabled due to rate limiter issues
// import {
//   otpSendLimiter,
//   otpVerifyLimiter,
//   otpResendLimiter,
// } from "../middleware/otpRateLimiter.js";

const router = express.Router();

// ── Primary routes ─────────────────────────────────────────────────────────
// Temporarily disabled due to IPv6 rate limiter issue
// router.post("/send-otp",   otpSendLimiter,   sendOTP);
// router.post("/verify-otp", otpVerifyLimiter, verifyOTP);
// router.post("/resend-otp", otpResendLimiter, resendOTP);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

// ── Seller complete registration ───────────────────────────────────────────
router.post("/register-seller", registerSeller);

// ── Legacy routes ──────────────────────────────────────────────────────────
// Temporarily disabled due to IPv6 rate limiter issue
// router.post("/send-mobile",   otpSendLimiter,   sendMobileOTP);
// router.post("/verify-mobile", otpVerifyLimiter, verifyMobileOTP);
router.post("/send-mobile", sendMobileOTP);
router.post("/verify-mobile", verifyMobileOTP);
router.post("/send-email",    sendEmailOTP);
router.post("/verify-email",  verifyEmailOTP);

export default router;
