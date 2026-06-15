import multer from "multer";
import path from "path";
import fs from "fs";

// ────────────────────────────────────────────────────────────────────────────
// ENSURE UPLOAD DIRECTORIES EXIST
// ────────────────────────────────────────────────────────────────────────────

const uploadDirs = [
  path.join(__dirname, "../../uploads/products"),
  path.join(__dirname, "../../uploads/customizations"),
  path.join(__dirname, "../../uploads/profiles"),
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

// ────────────────────────────────────────────────────────────────────────────
// MULTER INSTANCES
// ────────────────────────────────────────────────────────────────────────────

// Product image uploads
export const productUpload = multer({
  storage: productStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
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
