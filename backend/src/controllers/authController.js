import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateAccessToken } from "../utils/generateToken.js";

// =============================================
// REGISTER — Create a new user account
// =============================================
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !password || !role) {
    throw new ApiError(400, "name, email, phone, password and role are required");
  }

  // Check if email already exists
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(400, "Email already registered");
  }

  // Create user (password will be hashed by model pre-save)
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password,
    role,
  });

  const token = generateAccessToken({ id: user._id, role: user.role });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  // include accessToken for frontend compatibility
  return res.status(201).json(new ApiResponse(201, { accessToken: token, token, user: createdUser }, "User registered"));
});

// LOGIN — Authenticate existing user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.isActive === false) {
    throw new ApiError(403, "Your account has been deactivated. Contact support.");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = generateAccessToken({ id: user._id, role: user.role });
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const safeUser = await User.findById(user._id).select("-password -refreshToken");
  // include accessToken for frontend compatibility
  return res.status(200).json(new ApiResponse(200, { accessToken: token, token, user: safeUser }, "Logged in"));
});

// GET /me — return logged in user
const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by authMiddleware
  const user = await User.findById(req.user._id).select("-password -refreshToken");
  if (!user) throw new ApiError(404, "User not found");

  // Optionally populate subscription if model exists
  let subscription = null;
  try {
    // lazy require to avoid hard dependency
    // eslint-disable-next-line global-require
    const Subscription = (await import("../models/Subscription.js")).default;
    subscription = await Subscription.findOne({ user: user._id }) || null;
  } catch (e) {
    // ignore if model not present
  }

  return res.status(200).json(new ApiResponse(200, { user, subscription }, "Profile fetched"));
});

// UPDATE PROFILE — name, phone, businessName, businessDescription, city, state, pincode, gstNumber, logo
const updateProfile = asyncHandler(async (req, res) => {
  const fields = [
    "name",
    "phone",
    "businessName",
    "businessDescription",
    "city",
    "state",
    "pincode",
    "gstNumber",
  ];

  const update = {};
  fields.forEach((f) => {
    if (req.body[f] !== undefined) update[f] = req.body[f];
  });

  // handle logo upload — may be provided as req.file or req.body.logo
  if (req.file && req.file.path) {
    update.logo = req.file.path;
  } else if (req.body.logo) {
    update.logo = req.body.logo;
  }

  const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select(
    "-password -refreshToken"
  );

  return res.status(200).json(new ApiResponse(200, user, "Profile updated"));
});

// CHANGE PASSWORD — verify current password and set new one
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, "currentPassword and newPassword are required");

  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw new ApiError(401, "Current password is incorrect");

  user.password = newPassword;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "Password changed"));
});

export { registerUser, loginUser, getMe, updateProfile, changePassword };
