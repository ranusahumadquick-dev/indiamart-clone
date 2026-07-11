import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ────────────────────────────────────────────────────────────────────────────
// ENSURE UPLOAD DIRECTORIES EXIST
// ────────────────────────────────────────────────────────────────────────────

const uploadDirs = [
  path.join(__dirname, "../../uploads/products"),
  path.join(__dirname, "../../uploads/customizations"),
  path.join(__dirname, "../../uploads/profiles"),
  path.join(__dirname, "../../uploads/services"),
  path.join(__dirname, "../../uploads/brands"),
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// FILE FILTER CONFIGURATIONS
// ────────────────────────────────────────────────────────────────────────────

const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: PNG, JPG, JPEG, WebP`));
  }
};

const customizationFileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/pdf",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: PNG, JPG, PDF`));
  }
};

// ────────────────────────────────────────────────────────────────────────────
// STORAGE CONFIGURATIONS
// ────────────────────────────────────────────────────────────────────────────

// Product images storage
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/products"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// Customization uploads storage
const customizationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/customizations"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// Profile pictures storage
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/profiles"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// Brand logo storage
const brandStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/brands"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// Service images storage
const serviceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../uploads/services");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// ────────────────────────────────────────────────────────────────────────────
// MULTER INSTANCES
// ────────────────────────────────────────────────────────────────────────────

// File filter that allows images AND videos
const productMediaFilter = (req, file, cb) => {
  const allowedImages = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  const allowedVideos = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
  if ([...allowedImages, ...allowedVideos].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: PNG, JPG, WebP, MP4, WebM, MOV, AVI"));
  }
};

// Product image uploads (images only)
export const productUpload = multer({
  storage: productStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Product media uploads (images + video)
export const productMediaUpload = multer({
  storage: productStorage,
  fileFilter: productMediaFilter,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB — no practical limit
});

// Customization uploads (logo and attachments)
export const customizationUpload = multer({
  storage: customizationStorage,
  fileFilter: customizationFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
});

// Profile picture uploads
export const profileUpload = multer({
  storage: profileStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Service images uploads
export const serviceUpload = multer({
  storage: serviceStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
});

// Brand logo upload
export const brandUpload = multer({
  storage: brandStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// ────────────────────────────────────────────────────────────────────────────
// ERROR HANDLING MIDDLEWARE
// ────────────────────────────────────────────────────────────────────────────

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "FILE_TOO_LARGE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 5MB limit",
        error: "FILE_TOO_LARGE",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files uploaded",
        error: "LIMIT_FILE_COUNT",
      });
    }
  }

  if (err && err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: "INVALID_FILE_TYPE",
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload failed",
      error: "UPLOAD_ERROR",
    });
  }

  next();
};
