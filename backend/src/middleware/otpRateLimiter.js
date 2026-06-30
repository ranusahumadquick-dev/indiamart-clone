import rateLimit from "express-rate-limit";

// Max 5 OTP send requests per phone per hour
export const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => `otp_send_${req.body?.phone || req.ip}`,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again after 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.body?.phone,
});

// Max 10 verify attempts per IP per 15 minutes
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `otp_verify_${req.body?.phone || req.ip}`,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Max 3 resends per phone per 30 minutes
export const otpResendLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => `otp_resend_${req.body?.phone || req.ip}`,
  message: {
    success: false,
    message: "Maximum resend limit reached. Please wait 30 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
