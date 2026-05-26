import express from "express";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../controllers/authController.js";
import {
  updateProfile,
  changePassword,
  deleteAccount,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getNotificationSettings,
  updateNotificationSettings,
  getLoginSessions,
  logoutSession,
  get2FAStatus,
  enable2FA,
  disable2FA,
  getPaymentMethods,
  deletePaymentMethod,
  getWalletBalance,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

// =============================================
// PROFILE MANAGEMENT
// =============================================
router.put("/profile", updateProfile);
router.post("/change-password", changePassword);
router.post("/delete-account", deleteAccount);

// =============================================
// ADDRESS MANAGEMENT
// =============================================
router.get("/addresses", getAddresses);
router.post("/addresses", addAddress);
router.put("/addresses/:id", updateAddress);
router.delete("/addresses/:id", deleteAddress);
router.put("/addresses/:id/default", setDefaultAddress);

// =============================================
// NOTIFICATION SETTINGS
// =============================================
router.get("/notification-settings", getNotificationSettings);
router.put("/notification-settings", updateNotificationSettings);

// Legacy endpoints (keep for backward compatibility)
router.get("/notification-preferences", getNotificationPreferences);
router.put("/notification-preferences", updateNotificationPreferences);

// =============================================
// SECURITY & 2FA
// =============================================
router.get("/login-sessions", getLoginSessions);
router.post("/logout-session/:sessionId", logoutSession);
router.get("/2fa-status", get2FAStatus);
router.post("/enable-2fa", enable2FA);
router.post("/disable-2fa", disable2FA);

// =============================================
// PAYMENT METHODS
// =============================================
router.get("/payment-methods", getPaymentMethods);
router.delete("/payment-methods/:methodId", deletePaymentMethod);

// =============================================
// WALLET
// =============================================
router.get("/wallet", getWalletBalance);

export default router;
