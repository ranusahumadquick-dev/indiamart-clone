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

/**
 * Multer upload middleware for certification documents (images + PDF)
 */
/**
 * Multer upload middleware for company video (mp4/mov/webm, up to 100MB)
 */
export const uploadVideo = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "indiamart/videos",
      resource_type: "video",
      allowedFormats: ["mp4", "mov", "webm", "avi"],
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowed = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/avi"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only MP4, MOV, WebM, AVI allowed"), false);
  },
}).single("video");

export const uploadCertificate = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "indiamart/certifications",
      allowedFormats: ["jpg", "jpeg", "png", "webp", "pdf"],
      resource_type: "auto",
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only JPG, PNG, WebP, or PDF allowed"), false);
  },
}).single("certificate");

export default { uploadProductImages, uploadAvatar, uploadCertificate };
