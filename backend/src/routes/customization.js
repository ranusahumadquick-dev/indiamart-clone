import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  createCustomizationRequest,
  getBuyerCustomizations,
  getCustomizationById,
  updateCustomizationStatus,
  deleteCustomization,
} from "../controllers/customizationController.js";
import { customizationUpload, handleMulterError } from "../middleware/multer.js";

const router = express.Router();

// Create customization request with file uploads
// Handles: 1 logo file + multiple attachment files + form fields
router.post(
  "/",
  auth,
  (req, res, next) => {
    customizationUpload.fields([
      { name: "logo", maxCount: 1 },
      { name: "attachment", maxCount: 10 }
    ])(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
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
