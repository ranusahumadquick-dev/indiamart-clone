import User from "../models/User.js";
import Address from "../models/Address.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// =============================================
// PROFILE MANAGEMENT
// =============================================

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, language } = req.body;
  const userId = req.user._id;

  const user = await User.findByIdAndUpdate(
    userId,
    { name, phone, language },
    { returnDocument: 'after', runValidators: true }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "Profile updated successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) throw new ApiError(401, "Current password is incorrect");

  user.password = newPassword;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await User.findByIdAndDelete(userId);

  return res.status(200).json(new ApiResponse(200, {}, "Account deleted successfully"));
});

// =============================================
// ADDRESS MANAGEMENT
// =============================================

export const getAddresses = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const addresses = await Address.find({ user: userId }).sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, { addresses }, "Addresses fetched"));
});

export const addAddress = asyncHandler(async (req, res) => {
  const { type, street, city, state, pincode } = req.body;
  const userId = req.user._id;

  if (!street || !city || !state || !pincode) {
    throw new ApiError(400, "All fields are required");
  }

  // If first address, set as default
  const existingCount = await Address.countDocuments({ user: userId });
  const isDefault = existingCount === 0;

  const address = await Address.create({
    user: userId,
    type,
    street,
    city,
    state,
    pincode,
    isDefault,
  });

  return res.status(201).json(new ApiResponse(201, address, "Address added successfully"));
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, street, city, state, pincode } = req.body;
  const userId = req.user._id;

  const address = await Address.findOne({ _id: id, user: userId });
  if (!address) throw new ApiError(404, "Address not found");

  Object.assign(address, { type, street, city, state, pincode });
  await address.save();

  return res.status(200).json(new ApiResponse(200, address, "Address updated successfully"));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const address = await Address.findOne({ _id: id, user: userId });
  if (!address) throw new ApiError(404, "Address not found");

  // Don't allow deleting if it's the only address
  const count = await Address.countDocuments({ user: userId });
  if (count === 1) {
    throw new ApiError(400, "Cannot delete your only address");
  }

  await Address.findByIdAndDelete(id);

  return res.status(200).json(new ApiResponse(200, {}, "Address deleted successfully"));
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const address = await Address.findOne({ _id: id, user: userId });
  if (!address) throw new ApiError(404, "Address not found");

  // Unset all other defaults
  await Address.updateMany({ user: userId }, { isDefault: false });

  // Set this one as default
  address.isDefault = true;
  await address.save();

  return res.status(200).json(new ApiResponse(200, address, "Default address updated"));
});

// =============================================
// NOTIFICATION SETTINGS
// =============================================

export const getNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).select(
    "notificationSettings.emailAlerts notificationSettings.whatsappAlerts notificationSettings.smsAlerts " +
    "notificationSettings.orderUpdates notificationSettings.priceDrops notificationSettings.newQuotes " +
    "notificationSettings.inquiryReplies notificationSettings.sellerMessages notificationSettings.weeklyDigest"
  );

  const settings = user?.notificationSettings || {
    emailAlerts: true,
    whatsappAlerts: false,
    smsAlerts: false,
    orderUpdates: true,
    priceDrops: true,
    newQuotes: true,
    inquiryReplies: true,
    sellerMessages: true,
    weeklyDigest: false,
  };

  return res.status(200).json(new ApiResponse(200, { settings }, "Notification settings fetched"));
});

export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const settings = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { notificationSettings: settings },
    { returnDocument: 'after' }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, { settings: user.notificationSettings }, "Settings updated"));
});

// =============================================
// SECURITY & 2FA
// =============================================

export const getLoginSessions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const currentToken = req.headers.authorization?.split(" ")[1];

  // Mock implementation - in production, track actual sessions
  const sessions = [
    {
      _id: "session-1",
      deviceName: "Chrome on Windows",
      ipAddress: "192.168.1.1",
      lastActive: new Date(),
      isCurrent: true,
    },
    {
      _id: "session-2",
      deviceName: "Safari on iPhone",
      ipAddress: "192.168.1.2",
      lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isCurrent: false,
    },
  ];

  return res.status(200).json(new ApiResponse(200, { sessions }, "Login sessions fetched"));
});

export const logoutSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  // Mock implementation - in production, invalidate session
  return res.status(200).json(new ApiResponse(200, {}, "Session logged out successfully"));
});

export const get2FAStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).select("twoFactorEnabled");

  return res.status(200).json(new ApiResponse(200, { enabled: user?.twoFactorEnabled || false }, "2FA status fetched"));
});

export const enable2FA = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findByIdAndUpdate(
    userId,
    { twoFactorEnabled: true },
    { returnDocument: 'after' }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, { enabled: true }, "2FA enabled"));
});

export const disable2FA = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findByIdAndUpdate(
    userId,
    { twoFactorEnabled: false },
    { returnDocument: 'after' }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, { enabled: false }, "2FA disabled"));
});

// =============================================
// PAYMENT METHODS
// =============================================

export const getPaymentMethods = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Mock implementation - integrate with payment service
  const methods = [
    {
      _id: "pm-1",
      type: "card",
      last4: "4242",
      isDefault: true,
    },
  ];

  return res.status(200).json(new ApiResponse(200, { methods }, "Payment methods fetched"));
});

export const deletePaymentMethod = asyncHandler(async (req, res) => {
  const { methodId } = req.params;

  return res.status(200).json(new ApiResponse(200, {}, "Payment method deleted"));
});

// =============================================
// WALLET
// =============================================

export const getWalletBalance = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).select("walletBalance");

  return res.status(200).json(new ApiResponse(200, { balance: user?.walletBalance || 0 }, "Wallet balance fetched"));
});

