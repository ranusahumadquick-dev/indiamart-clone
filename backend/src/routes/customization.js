import express from "express";
import auth from "../middleware/auth.js";
import {
  createCustomizationRequest,
  getBuyerCustomizations,
  getCustomizationById,
  updateCustomizationStatus,
  deleteCustomization,
} from "../controllers/customizationController.js";
import { customizationUpload } from "../middleware/multer.js";

const router = express.Router();

// Create customization request with file upload
router.post(
  "/",
  auth,
  customizationUpload.single("logo"),
  createCustomizationRequest
);

// Get buyer's customization requests
router.get("/", auth, getBuyerCustomizations);

// Get single customization request by ID
router.get("/:id", auth, getCustomizationById);

// Update customization status (admin/seller only)
router.patch("/:id", auth, updateCustomizationStatus);

// Delete customization request
router.delete("/:id", auth, deleteCustomization);

export default router;
