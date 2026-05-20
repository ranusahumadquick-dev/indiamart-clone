import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

/**
 * Configure Cloudinary storage for file uploads
 */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "indiamart/products",
    allowedFormats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});

/**
 * Multer upload middleware for product images
 */
export const uploadProductImages = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 5, // Max 5 images per product
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WebP images are allowed"), false);
    }
  },
}).array("images", 5);

/**
 * Multer upload middleware for profile/avatar images
 */
export const uploadAvatar = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "indiamart/avatars",
      allowedFormats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 300, height: 300, crop: "fill" }],
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WebP images are allowed"), false);
    }
  },
}).single("avatar");

export default { uploadProductImages, uploadAvatar };
