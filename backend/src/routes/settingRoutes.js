import express from "express";
import {
  getMsg91Config,
  getAllSettings,
  updateMsg91Settings,
  verifyMsg91Token,
  getAdminSettings,
  updateGeneralSettings,
  updateSellerSettings,
  updatePlan,
  updateSettingsGroup,
} from "../controllers/settingController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();
const admin  = [authMiddleware, roleMiddleware(["admin"])];

// ── Public ─────────────────────────────────────────────────────────────────
router.get ("/msg91-config",    getMsg91Config);
router.post("/verify-otp-token",verifyMsg91Token);

// ── Admin only ──────────────────────────────────────────────────────────────
router.get ("/",                ...admin, getAdminSettings);
router.post("/msg91",           ...admin, updateMsg91Settings);
router.post("/general",         ...admin, updateGeneralSettings);
router.post("/seller",          ...admin, updateSellerSettings);
router.patch("/plans/:planId",      ...admin, updatePlan);
router.post ("/group/:group",       ...admin, updateSettingsGroup);

export default router;
