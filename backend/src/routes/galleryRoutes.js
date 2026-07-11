import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { uploadGalleryImages } from "../middleware/uploadMiddleware.js";
import {
  getSellerGallery,
  uploadGalleryImages as uploadGalleryImagesController,
  updateGalleryImage,
  deleteGalleryImage,
  reorderGalleryImages,
} from "../controllers/galleryController.js";

const router = express.Router();

// Public
router.get("/:sellerId", getSellerGallery);

// Seller only
router.post(
  "/upload",
  authMiddleware,
  roleMiddleware(["seller"]),
  uploadGalleryImages,
  uploadGalleryImagesController
);

router.patch(
  "/reorder",
  authMiddleware,
  roleMiddleware(["seller"]),
  reorderGalleryImages
);

router.patch(
  "/:imageId",
  authMiddleware,
  roleMiddleware(["seller"]),
  updateGalleryImage
);

router.delete(
  "/:imageId",
  authMiddleware,
  roleMiddleware(["seller"]),
  deleteGalleryImage
);

export default router;
