/**
 * OTP Controller — Production (MSG91)
 * OTP is NEVER returned in any API response.
 */
import crypto from "crypto";
import OtpSession from "../models/OtpSession.js";
import User from "../models/User.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendOTPSMS } from "../services/smsService.js";
import { sendOTPEmail } from "../services/emailService.js";
import { generateAccessToken } from "../utils/generateToken.js";

const OTP_EXPIRY_MIN      = 5;
const RESEND_COOLDOWN_SEC = 30;
const MAX_VERIFY_ATTEMPTS = 3;

function makeOTP() {
  return String(crypto.randomInt(100000, 999999));
}

function validIndianMobile(phone) {
  return /^[6-9]\d{9}$/.test(String(phone));
}

function mask(phone) {
  const p = String(phone);
  return `+91 XXXXXX${p.slice(-4)}`;
}

// ═══════════════════════════════════════════════════
// POST /api/otp/send-mobile
// ═══════════════════════════════════════════════════
export const sendMobileOTP = asyncHandler(async (req, res) => {
  const raw = String(req.body.phone || "").replace(/\D/g, "");

  if (!raw) throw new ApiError(400, "Mobile number is required");
  if (!validIndianMobile(raw)) {
    throw new ApiError(400, "Please enter a valid 10-digit Indian mobile number");
  }

  // Cooldown check
  const prev = await OtpSession.findOne({ phone: raw, isVerified: false })
    .sort({ createdAt: -1 });

  if (prev) {
    const elapsed = (Date.now() - prev.lastSentAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SEC) {
      throw new ApiError(429,
        `Wait ${Math.ceil(RESEND_COOLDOWN_SEC - elapsed)} seconds before requesting a new OTP`);
    }
    if ((prev.resendCount || 0) >= 5) {
      throw new ApiError(429, "Maximum OTP requests exceeded. Try again after 1 hour.");
    }
  }

  const otp    = makeOTP();
  const result = await sendOTPSMS(raw, otp);

  if (!result.success) {
    // Return exact MSG91 error — never expose OTP
    throw new ApiError(503, result.message || "SMS delivery failed. Try again.");
  }

  // Save to MongoDB — OTP never leaves the server
  await OtpSession.deleteMany({ phone: raw, isVerified: false });
  await OtpSession.create({
    phone:       raw,
    otp,
    expiresAt:   new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000),
    resendCount: (prev?.resendCount || 0) + 1,
    lastSentAt:  new Date(),
    provider:    "msg91",
  });

  return res.status(200).json(
    new ApiResponse(200, {
      phone:       mask(raw),
      expiresIn:   OTP_EXPIRY_MIN * 60,
      resendAfter: RESEND_COOLDOWN_SEC,
    }, `OTP sent to your mobile number`)
  );
});

// ═══════════════════════════════════════════════════
// POST /api/otp/verify-mobile
// ═══════════════════════════════════════════════════
export const verifyMobileOTP = asyncHandler(async (req, res) => {
  const raw     = String(req.body.phone || "").replace(/\D/g, "");
  const entered = String(req.body.otp   || "").trim();
  const { name, email, role, companyName } = req.body;

  if (!raw || !entered) throw new ApiError(400, "Mobile number and OTP are required");
  if (!validIndianMobile(raw)) throw new ApiError(400, "Invalid mobile number");
  if (!/^\d{6}$/.test(entered)) throw new ApiError(400, "OTP must be 6 digits");

  const session = await OtpSession
    .findOne({ phone: raw, isVerified: false })
    .sort({ createdAt: -1 });

  if (!session) throw new ApiError(400, "OTP not found. Please request a new OTP.");
  if (new Date() > session.expiresAt) {
    await OtpSession.findByIdAndDelete(session._id);
    throw new ApiError(400, "OTP expired. Please request a new one.");
  }
  if (session.attempts >= MAX_VERIFY_ATTEMPTS) {
    await OtpSession.findByIdAndDelete(session._id);
    throw new ApiError(429, "Too many incorrect attempts. Request a new OTP.");
  }

  // Timing-safe compare
  const a = Buffer.from(String(session.otp));
  const b = Buffer.from(entered);
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!match) {
    const attempts = session.attempts + 1;
    await OtpSession.findByIdAndUpdate(session._id, { $inc: { attempts: 1 } });
    const left = MAX_VERIFY_ATTEMPTS - attempts;
    if (left <= 0) {
      await OtpSession.findByIdAndDelete(session._id);
      throw new ApiError(429, "Too many incorrect attempts. Request a new OTP.");
    }
    throw new ApiError(400, `Invalid OTP. ${left} attempt${left === 1 ? "" : "s"} remaining.`);
  }

  await OtpSession.findByIdAndDelete(session._id);

  // Find or create user
  let user = await User.findOne({ phone: raw });

  if (!user) {
    if (name && role) {
      user = await User.create({
        name: name.trim(), phone: raw,
        email: email?.toLowerCase().trim(),
        role: role || "buyer",
        companyName: companyName?.trim(),
        isMobileVerified: true,
      });
    } else {
      // Seller flow — account created at /register-seller step
      return res.status(200).json(
        new ApiResponse(200, { verified: true, phone: raw }, "Mobile verified")
      );
    }
  } else {
    if (!user.isMobileVerified) {
      await User.findByIdAndUpdate(user._id, { isMobileVerified: true });
    }
  }

  const token   = generateAccessToken({ id: user._id, role: user.role });
  const userObj = await User.findById(user._id).select("-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(200, { accessToken: token, token, user: userObj }, "Verified successfully")
  );
});

// ═══════════════════════════════════════════════════
// POST /api/otp/resend-otp
// ═══════════════════════════════════════════════════
export const resendOTP = asyncHandler(async (req, res) => {
  const raw = String(req.body.phone || "").replace(/\D/g, "");
  if (!raw || !validIndianMobile(raw)) {
    throw new ApiError(400, "Valid 10-digit mobile number required");
  }

  const prev = await OtpSession
    .findOne({ phone: raw, isVerified: false })
    .sort({ createdAt: -1 });

  if (prev) {
    const elapsed = (Date.now() - prev.lastSentAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SEC) {
      throw new ApiError(429,
        `Wait ${Math.ceil(RESEND_COOLDOWN_SEC - elapsed)} seconds before resending`);
    }
    if ((prev.resendCount || 0) >= 5) {
      throw new ApiError(429, "Maximum OTP resend limit reached.");
    }
  }

  const otp    = makeOTP();
  const result = await sendOTPSMS(raw, otp);
  if (!result.success) throw new ApiError(503, result.message || "SMS failed. Try again.");

  await OtpSession.deleteMany({ phone: raw, isVerified: false });
  await OtpSession.create({
    phone:       raw,
    otp,
    expiresAt:   new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000),
    resendCount: (prev?.resendCount || 0) + 1,
    lastSentAt:  new Date(),
    provider:    "msg91",
  });

  return res.status(200).json(
    new ApiResponse(200, {
      phone:       mask(raw),
      expiresIn:   OTP_EXPIRY_MIN * 60,
      resendAfter: RESEND_COOLDOWN_SEC,
    }, "OTP resent successfully")
  );
});

// ═══════════════════════════════════════════════════
// POST /api/otp/register-seller
// ═══════════════════════════════════════════════════
export const registerSeller = asyncHandler(async (req, res) => {
  const { phone, name, email, companyName, gstNumber, city, state } = req.body;

  if (!phone || !name) throw new ApiError(400, "Phone and name are required");

  const raw        = String(phone).replace(/\D/g, "");
  const cleanEmail = email?.toLowerCase().trim();
  const emailToUse = cleanEmail || `seller_${raw}@indiamart.in`;

  let user = await User.findOne({
    $or: [{ phone: raw }, ...(cleanEmail ? [{ email: cleanEmail }] : [])],
  });

  const imported = await import("crypto");

  if (!user) {
    user = await User.create({
      name:             name.trim(),
      phone:            raw,
      email:            emailToUse,
      password:         imported.default.randomBytes(16).toString("hex"),
      role:             "seller",
      companyName:      companyName?.trim(),
      gstNumber:        gstNumber?.trim().toUpperCase(),
      city:             city?.trim(),
      state:            state?.trim(),
      isMobileVerified: true,
      profileCompleted: true,
    });
  } else {
    user.role             = "seller";
    user.name             = name.trim() || user.name;
    user.companyName      = companyName?.trim() || user.companyName;
    user.gstNumber        = gstNumber?.trim().toUpperCase() || user.gstNumber;
    user.city             = city?.trim() || user.city;
    user.state            = state?.trim() || user.state;
    user.isMobileVerified = true;
    user.profileCompleted = true;
    if (!user.phone) user.phone = raw;
    await user.save();
  }

  const token   = generateAccessToken({ id: user._id, role: user.role });
  const userObj = await User.findById(user._id).select("-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(200, { accessToken: token, token, user: userObj },
      "Seller registered successfully")
  );
});

// ── Email OTP ───────────────────────────────────────
export const sendEmailOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Valid email required");
  }
  const key  = `email:${email.toLowerCase()}`;
  const prev = await OtpSession.findOne({ phone: key, isVerified: false }).sort({ createdAt: -1 });
  if (prev) {
    const elapsed = (Date.now() - prev.lastSentAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SEC) {
      throw new ApiError(429, `Wait ${Math.ceil(RESEND_COOLDOWN_SEC - elapsed)} seconds`);
    }
  }
  const otp    = makeOTP();
  const result = await sendOTPEmail(email, otp);
  await OtpSession.deleteMany({ phone: key, isVerified: false });
  await OtpSession.create({
    phone: key, otp,
    expiresAt:   new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000),
    resendCount: (prev?.resendCount || 0) + 1,
    lastSentAt:  new Date(), provider: "msg91",
  });
  const isDev = process.env.NODE_ENV !== "production";
  return res.status(200).json(
    new ApiResponse(200, {
      expiresIn: 300,
      emailSent: result.sent,
      // Dev mode only: return OTP so frontend can show it when Gmail not configured
      ...(isDev && !result.sent && { __dev_otp: otp }),
    },
    result.sent ? `OTP sent to ${email}` : "Gmail not configured — OTP shown on screen (dev mode)")
  );
});

export const verifyEmailOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "Email and OTP required");
  const key     = `email:${email.toLowerCase()}`;
  const session = await OtpSession.findOne({ phone: key, isVerified: false }).sort({ createdAt: -1 });
  if (!session)          throw new ApiError(400, "OTP not found. Request a new one.");
  if (new Date() > session.expiresAt) {
    await OtpSession.findByIdAndDelete(session._id);
    throw new ApiError(400, "OTP expired.");
  }
  if (session.attempts >= MAX_VERIFY_ATTEMPTS) {
    await OtpSession.findByIdAndDelete(session._id);
    throw new ApiError(429, "Too many attempts.");
  }
  if (String(session.otp) !== String(otp).trim()) {
    await OtpSession.findByIdAndUpdate(session._id, { $inc: { attempts: 1 } });
    throw new ApiError(400, "Invalid OTP.");
  }
  await OtpSession.findByIdAndDelete(session._id);
  return res.status(200).json(new ApiResponse(200, { verified: true }, "Email verified"));
});

// Aliases
export const sendOTP   = sendMobileOTP;
export const verifyOTP = verifyMobileOTP;
