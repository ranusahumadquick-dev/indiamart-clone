/**
 * OTP Controller — Production (MSG91)
 * OTP is NEVER returned in any API response.
 */
import crypto from "crypto";
import jwt from "jsonwebtoken";
import OtpSession from "../models/OtpSession.js";
import User from "../models/User.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendOTPSMS } from "../services/smsService.js";
import { sendOTPEmail } from "../services/emailService.js";
import { generateAccessToken } from "../utils/generateToken.js";

const OTP_EXPIRY_MIN      = 10;
const RESEND_COOLDOWN_SEC = 60;
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

  // Reject before burning an SMS — this number already has an account
  const existingUser = await User.findOne({ phone: raw });
  if (existingUser) {
    throw new ApiError(409, "User already exists with this mobile number. Please login instead.");
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

  const smsConfigured = result.code !== "NOT_CONFIGURED";
  const devMode = !smsConfigured;

  // Always save OTP to DB regardless of SMS delivery
  await OtpSession.deleteMany({ phone: raw, isVerified: false });
  await OtpSession.create({
    phone:       raw,
    otp,
    expiresAt:   new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000),
    resendCount: (prev?.resendCount || 0) + 1,
    lastSentAt:  new Date(),
    provider:    devMode ? "dev" : "msg91",
  });

  if (!result.success && smsConfigured) {
    // SMS provider configured but delivery failed — real error
    throw new ApiError(503, result.message || "SMS delivery failed. Try again.");
  }

  console.log(`[OTP] ${devMode ? "DEV MODE" : "SMS sent"} — +91${raw} → OTP: ${otp}`);

  return res.status(200).json(
    new ApiResponse(200, {
      phone:       mask(raw),
      expiresIn:   OTP_EXPIRY_MIN * 60,
      resendAfter: RESEND_COOLDOWN_SEC,
      // Show OTP on screen only when SMS not configured (dev/demo)
      ...(devMode && { devOtp: otp, devNote: "SMS not configured — use this OTP" }),
    }, devMode
      ? `OTP generated (SMS not configured)`
      : `OTP sent to your mobile number`
    )
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

  // Find or create user
  let user = await User.findOne({ phone: raw });

  if (!user && email) {
    const cleanEmail = email.toLowerCase().trim();
    const existingByEmail = await User.findOne({ email: cleanEmail });
    if (existingByEmail) {
      await OtpSession.findByIdAndDelete(session._id);
      throw new ApiError(409, "User already exists with this email. Please login instead.");
    }
  }

  if (!user) {
    if (name && role) {
      user = await User.create({
        name: name.trim(), phone: raw,
        email: email?.toLowerCase().trim(),
        role: role || "buyer",
        companyName: companyName?.trim(),
        isMobileVerified: true,
      });
      await OtpSession.findByIdAndDelete(session._id);
    } else {
      // Pre-signup phone check (e.g. auth/register's own phone-verify step) —
      // no account exists yet to persist "verified" onto. Mark the session
      // itself verified (instead of deleting it) so registerUser can pick up
      // this confirmation a few steps later and mark the new account
      // isMobileVerified:true at creation, instead of losing the fact this
      // phone was already proven right after the OTP check completes.
      await OtpSession.findByIdAndUpdate(session._id, { isVerified: true });
      return res.status(200).json(
        new ApiResponse(200, { verified: true, phone: raw }, "Mobile verified")
      );
    }
  } else if (name && role) {
    // A signup attempt (name + role supplied) hit an already-registered phone —
    // reject instead of silently logging the caller into the existing account.
    await OtpSession.findByIdAndDelete(session._id);
    throw new ApiError(409, "User already exists with this mobile number. Please login instead.");
  } else {
    if (!user.isMobileVerified) {
      await User.findByIdAndUpdate(user._id, { isMobileVerified: true });
    }
    await OtpSession.findByIdAndDelete(session._id);
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

  const smsConfigured = result.code !== "NOT_CONFIGURED";
  const devMode = !smsConfigured;

  if (!result.success && smsConfigured) {
    throw new ApiError(503, result.message || "SMS failed. Try again.");
  }

  await OtpSession.deleteMany({ phone: raw, isVerified: false });
  await OtpSession.create({
    phone:       raw,
    otp,
    expiresAt:   new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000),
    resendCount: (prev?.resendCount || 0) + 1,
    lastSentAt:  new Date(),
    provider:    devMode ? "dev" : "msg91",
  });

  console.log(`[OTP] ${devMode ? "DEV MODE resend" : "SMS resent"} — +91${raw} → OTP: ${otp}`);

  return res.status(200).json(
    new ApiResponse(200, {
      phone:       mask(raw),
      expiresIn:   OTP_EXPIRY_MIN * 60,
      resendAfter: RESEND_COOLDOWN_SEC,
      ...(devMode && { devOtp: otp, devNote: "SMS not configured — use this OTP" }),
    }, devMode ? "OTP generated (SMS not configured)" : "OTP resent successfully")
  );
});

// ═══════════════════════════════════════════════════
// POST /api/otp/register-seller
// ═══════════════════════════════════════════════════
export const registerSeller = asyncHandler(async (req, res) => {
  const { phone, name, email, password, companyName, gstNumber, city, state, pincode, products } = req.body;

  if (!phone || !name) throw new ApiError(400, "Phone and name are required");

  const raw        = String(phone).replace(/\D/g, "");
  const cleanEmail = email?.toLowerCase().trim();
  const emailToUse = cleanEmail || `seller_${raw}@indiamart.in`;

  const existing = await User.findOne({
    $or: [{ phone: raw }, ...(cleanEmail ? [{ email: cleanEmail }] : [])],
  });

  // Block duplicate signup regardless of the existing account's role —
  // an existing seller/buyer with this phone or email must not be silently
  // converted or overwritten by a fresh seller registration.
  if (existing) {
    throw new ApiError(409, "User already exists with this phone number or email. Please login instead.");
  }

  const imported = await import("crypto");

  const user = await User.create({
    name:             name.trim(),
    phone:            raw,
    email:            emailToUse,
    password:         password || imported.default.randomBytes(16).toString("hex"),
    role:             "seller",
    companyName:      companyName?.trim(),
    gstNumber:        gstNumber?.trim().toUpperCase(),
    city:             city?.trim(),
    state:            state?.trim(),
    pincode:          pincode?.trim(),
    isMobileVerified: true,
    profileCompleted: true,
  });

  // Save registration products to Product collection (best-effort, don't fail registration)
  if (Array.isArray(products) && products.length > 0) {
    try {
      const Product = (await import("../models/Product.js")).default;
      const Category = (await import("../models/Category.js")).default;

      // Find a default category for uncategorized products
      const defaultCategory = await Category.findOne({}).select("_id").lean();
      if (!defaultCategory) {
        console.warn("⚠️ [registerSeller] No categories found — skipping product save");
      } else {
        const productDocs = products
          .filter((p) => p.name?.trim())
          .map((p) => {
            const name = p.name.trim();
            const slug = name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "")
              .substring(0, 80) + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
            return {
              name,
              slug,
              description:      name,
              price:            1,
              priceUnit:        "Piece",
              seller:           user._id,
              companyName:      user.companyName || companyName?.trim(),
              city:             user.city || city?.trim(),
              state:            user.state || state?.trim(),
              category:         defaultCategory._id,
              status:           "pending",
              isActive:         true,
              minOrderQuantity: 1,
              images:           [],
            };
          });

        if (productDocs.length > 0) {
          await Product.insertMany(productDocs, { ordered: true });
          console.log(`✅ [registerSeller] Saved ${productDocs.length} products for seller ${user._id}`);
        }
      }
    } catch (err) {
      console.error("⚠️ [registerSeller] Product save failed (non-fatal):", err.message);
    }
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

  // If the caller is already logged in (e.g. a seller re-verifying their own
  // business email mid-registration), don't flag their own account as a dupe.
  let selfId = null;
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  if (token) {
    try {
      selfId = jwt.verify(token, process.env.JWT_SECRET).id;
    } catch { /* not authenticated / expired — treat as a public call */ }
  }

  // Reject before burning an email send — this address already has an account
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    ...(selfId ? { _id: { $ne: selfId } } : {}),
  });
  if (existingUser) {
    throw new ApiError(409, "User already exists with this email. Please login instead.");
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
  const devMode = !!result.dev;

  await OtpSession.deleteMany({ phone: key, isVerified: false });
  await OtpSession.create({
    phone: key, otp,
    expiresAt:   new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000),
    resendCount: (prev?.resendCount || 0) + 1,
    lastSentAt:  new Date(), provider: devMode ? "dev" : "gmail",
  });

  if (!result.sent && !devMode) {
    // Real SMTP configured but delivery failed — genuine error
    throw new ApiError(503, "Failed to send OTP email. Please check your email address and try again.");
  }

  console.log(`[OTP] ${devMode ? "DEV MODE" : "Email sent"} — ${email} → OTP: ${otp}`);

  return res.status(200).json(
    new ApiResponse(200, {
      expiresIn: OTP_EXPIRY_MIN * 60,
      resendAfter: RESEND_COOLDOWN_SEC,
      // Show OTP on screen only when SMTP not configured (dev/demo)
      ...(devMode && { devOtp: otp, devNote: "Email SMTP not configured — use this OTP" }),
    }, devMode
      ? "OTP generated (SMTP not configured)"
      : "OTP sent successfully to your email."
    )
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

  // If the caller is logged in, persist the verification onto their account —
  // otherwise this confirmation was never saved anywhere and the account
  // permanently shows "Email Verification: Pending" regardless of this check.
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  if (token) {
    try {
      const selfId = jwt.verify(token, process.env.JWT_SECRET).id;
      await User.findByIdAndUpdate(selfId, { isEmailVerified: true });
    } catch { /* not authenticated / expired — nothing to persist */ }
  }

  return res.status(200).json(new ApiResponse(200, { verified: true }, "Email verified"));
});

// Aliases
export const sendOTP   = sendMobileOTP;
export const verifyOTP = verifyMobileOTP;
