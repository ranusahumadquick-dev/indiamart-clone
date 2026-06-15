import fs from "fs";
import path from "path";

/**
 * Image Handler Utility
 * Validates, processes, and manages product images
 */

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const PLACEHOLDER_URL = "/placeholder-product.png";

/**
 * Process uploaded image files
 * @param {Array} files - Array of uploaded files from multer
 * @param {String} backendUrl - Backend URL for image serving
 * @returns {Array} Processed image objects
 */
export const processUploadedImages = (files = [], backendUrl = "http://localhost:8000") => {
  if (!files || files.length === 0) {
    console.log("⚠️ [Image] No files uploaded");
    return [];
  }

  console.log("📦 [Image] Processing", files.length, "files");
  console.log("   Backend URL:", backendUrl);

  const processedImages = files.map((file) => {
    try {
      // Validate file
      if (!file || !file.path) {
        console.warn("⚠️ [Image] Invalid file object:", file);
        return null;
      }

      console.log("📄 [Image] File details:");
      console.log("   Original name:", file.originalname);
      console.log("   Filename (saved as):", file.filename);
      console.log("   File path:", file.path);
      console.log("   MIME type:", file.mimetype);
      console.log("   Size:", `${(file.size / 1024).toFixed(2)}KB`);

      // Convert Windows/Unix path to URL path
      const relativePath = file.path
        .replace(/\\/g, "/")
        .split("/uploads/")[1];

      if (!relativePath) {
        console.warn("⚠️ [Image] Could not extract relative path from:", file.path);
        return null;
      }

      const url = `${backendUrl}/uploads/${relativePath}`;

      console.log("✅ [Image] URL generated:", url);

      return {
        url,
        type: 'image',
        publicId: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        originalName: file.originalname,
        uploadedAt: new Date(),
      };
    } catch (err) {
      console.error("❌ [Image] Processing error:", err.message);
      return null;
    }
  });

  const validImages = processedImages.filter((img) => img !== null);
  console.log("✅ [Image] Processed successfully:", validImages.length, "images");

  return validImages;
};

/**
 * Validate image file before upload
 * @param {Object} file - File object from multer
 * @returns {Object} { valid: Boolean, error: String }
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid image type. Allowed: JPG, PNG, WebP. Got: ${file.mimetype}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Max: 5MB, Got: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return { valid: true };
};

/**
 * Get fallback image URL
 * @returns {String} Placeholder image URL
 */
export const getFallbackImageUrl = () => {
  return PLACEHOLDER_URL;
};

/**
 * Verify image file exists on disk
 * @param {String} filePath - Full file path
 * @returns {Boolean}
 */
export const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    console.error("❌ [Image] File check error:", err.message);
    return false;
  }
};

/**
 * Delete image file from disk
 * @param {String} filePath - Full file path
 * @returns {Boolean} Success status
 */
export const deleteImageFile = (filePath) => {
  try {
    if (fileExists(filePath)) {
      fs.unlinkSync(filePath);
      console.log("✅ [Image] Deleted:", filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error("❌ [Image] Delete error:", err.message);
    return false;
  }
};

/**
 * Get image metadata
 * @param {String} filePath - Full file path
 * @returns {Object} File stats
 */
export const getImageMetadata = (filePath) => {
  try {
    if (!fileExists(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      created: stats.birthtimeMs,
      modified: stats.mtimeMs,
      sizeKB: (stats.size / 1024).toFixed(2),
    };
  } catch (err) {
    console.error("❌ [Image] Metadata error:", err.message);
    return null;
  }
};

/**
 * Validate and sanitize image URLs from database
 * @param {Array} images - Array of image objects from DB
 * @returns {Array} Validated images with fallback URLs
 */
export const validateDatabaseImages = (images = []) => {
  if (!Array.isArray(images)) {
    console.warn("⚠️ [Image] Images is not an array:", typeof images);
    return [];
  }

  return images
    .map((img) => {
      if (!img || !img.url) {
        console.warn("⚠️ [Image] Invalid image object:", img);
        return null;
      }

      // Ensure URL is properly formatted
      const url = typeof img.url === "string" ? img.url : "";

      if (!url) {
        console.warn("⚠️ [Image] Empty URL");
        return null;
      }

      return {
        ...img,
        url: url,
        fallback: PLACEHOLDER_URL,
      };
    })
    .filter((img) => img !== null);
};

/**
 * Get public image URLs for API response
 * @param {Array} images - Array of image objects
 * @returns {Array} Sanitized images for API response
 */
export const getPublicImageUrls = (images = []) => {
  const validated = validateDatabaseImages(images);

  if (validated.length === 0) {
    console.log("⚠️ [Image] No valid images, using fallback");
    return [
      {
        url: PLACEHOLDER_URL,
        isFallback: true,
      },
    ];
  }

  return validated.map((img) => ({
    url: img.url || PLACEHOLDER_URL,
    publicId: img.publicId || null,
    size: img.size || null,
    mimetype: img.mimetype || null,
  }));
};

/**
 * Log image operation for debugging
 * @param {String} operation - Operation name (upload, delete, etc.)
 * @param {Object} details - Operation details
 */
export const logImageOperation = (operation, details) => {
  const timestamp = new Date().toISOString();
  console.log(
    `📸 [${timestamp}] ${operation.toUpperCase()}:`,
    JSON.stringify(details, null, 2)
  );
};

export default {
  processUploadedImages,
  validateImageFile,
  getFallbackImageUrl,
  fileExists,
  deleteImageFile,
  getImageMetadata,
  validateDatabaseImages,
  getPublicImageUrls,
  logImageOperation,
};
