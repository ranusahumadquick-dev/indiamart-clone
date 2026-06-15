import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  createCustomizationRequest,
  getBuyerCustomizations,
  getCustomizationById,
  updateCustomizationStatus,
  deleteCustomization,
} from "../controllers/customizationController.js";
import { customizationUpload } from "../middleware/multer.js";

const router = express.Router();

// Create customization request with file uploads
router.post(
  "/",
  auth,
  customizationUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "attachment", maxCount: 10 }
  ]),
  createCustomizationRequest
);

// Error handler for multer
router.use((err, req, res, next) => {
  if (err && err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: "INVALID_FILE_TYPE",
    });
  }

  if (err && err.code === "FILE_TOO_LARGE") {
    return res.status(400).json({
      success: false,
      message: "File size exceeds 5MB limit",
      error: "FILE_TOO_LARGE",
    });
  }

  if (err && err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      success: false,
      message: "Too many files uploaded",
      error: "LIMIT_FILE_COUNT",
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload failed",
      error: err.code || "UPLOAD_ERROR",
    });
  }

  next();
});

// Get buyer's customization requests
router.get("/", auth, getBuyerCustomizations);

// Get single customization request by ID
router.get("/:id", auth, getCustomizationById);

// Update customization status (admin/seller only)
router.patch("/:id", auth, updateCustomizationStatus);

// Delete customization request
router.delete("/:id", auth, deleteCustomization);

export default router;
