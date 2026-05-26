import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Configure local disk storage for file uploads
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const productDir = path.join(uploadsDir, "products");

    // ✅ Create folder if doesn't exist
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
      console.log("📁 [Multer] Created uploads/products folder");
    }

    console.log("📤 [Multer] Saving image to:", productDir);
    cb(null, productDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log("✅ [Multer] Generated filename:", filename);
    cb(null, filename);
  },
});

/**
 * Multer upload middleware for product images
 */
export const uploadProductImages = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    console.log("🔍 [Multer] Checking file:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: `${(file.size / 1024).toFixed(2)}KB`,
    });

    if (allowedTypes.includes(file.mimetype)) {
      console.log("✅ [Multer] File type accepted:", file.mimetype);
      cb(null, true);
    } else {
      console.error("❌ [Multer] Invalid file type:", file.mimetype);
      cb(new Error("Only JPG, PNG, and WebP images are allowed"), false);
    }
  },
}).any();

/**
 * Multer upload middleware for profile/avatar images
 */
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const avatarDir = path.join(uploadsDir, "avatars");
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
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
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const videoDir = path.join(uploadsDir, "videos");
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }
    cb(null, videoDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowed = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/avi"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only MP4, MOV, WebM, AVI allowed"), false);
  },
}).single("video");

const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const certDir = path.join(uploadsDir, "certifications");
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }
    cb(null, certDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadCertificate = multer({
  storage: certificateStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only JPG, PNG, WebP, or PDF allowed"), false);
  },
}).single("certificate");

export default { uploadProductImages, uploadAvatar, uploadCertificate };
