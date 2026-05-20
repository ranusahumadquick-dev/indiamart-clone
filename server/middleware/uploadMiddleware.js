// Import required dependencies
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const path = require('path');

/**
 * Upload Middleware for File Handling
 * Handles image uploads to Cloudinary with proper validation
 */

/**
 * Configure Cloudinary Storage
 * Uses Cloudinary for file storage with proper settings
 */
const storage = cloudinary.createCloudinaryStorage('bazaarconnect');

/**
 * File Filter Function
 * Validates file types and sizes
 * @param {Object} req - Express request object
 * @param {Object} file - File object
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    const error = new Error('File too large. Maximum size is 5MB.');
    error.code = 'FILE_TOO_LARGE';
    return cb(error, false);
  }
  
  // Check file dimensions for images
  if (file.mimetype.startsWith('image/')) {
    const image = new Image();
    image.src = file.buffer;
    
    image.onload = () => {
      // Check image dimensions (minimum 200x200, maximum 4000x4000)
      if (image.width < 200 || image.height < 200) {
        const error = new Error('Image dimensions too small. Minimum 200x200 pixels required.');
        error.code = 'IMAGE_TOO_SMALL';
        return cb(error, false);
      }
      
      if (image.width > 4000 || image.height > 4000) {
        const error = new Error('Image dimensions too large. Maximum 4000x4000 pixels allowed.');
        error.code = 'IMAGE_TOO_LARGE';
        return cb(error, false);
      }
      
      cb(null, true);
    };
    
    image.onerror = () => {
      const error = new Error('Invalid image file.');
      error.code = 'INVALID_IMAGE';
      cb(error, false);
    };
  } else {
    cb(null, true);
  }
};

/**
 * Single Image Upload Middleware
 * @param {String} fieldName - Field name for the file upload
 * @param {Object} options - Additional options
 * @returns {Function} - Multer middleware function
 */
const uploadSingle = (fieldName = 'image', options = {}) => {
  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1
    },
    ...options
  }).single(fieldName);
};

/**
 * Multiple Images Upload Middleware
 * @param {String} fieldName - Field name for the file upload
 * @param {Number} maxCount - Maximum number of files
 * @param {Object} options - Additional options
 * @returns {Function} - Multer middleware function
 */
const uploadMultiple = (fieldName = 'images', maxCount = 5, options = {}) => {
  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB per file
      files: maxCount
    },
    ...options
  }).array(fieldName, maxCount);
};

/**
 * Profile Picture Upload Middleware
 * Special handler for profile pictures with specific constraints
 */
const uploadProfilePicture = () => {
  return multer({
    storage: cloudinary.uploadProfile,
    fileFilter: (req, file, cb) => {
      // Only profile picture constraints
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Only JPEG and PNG images are allowed for profile pictures.'), false);
      }
      
      // Profile pictures have stricter size limits (2MB)
      if (file.size > 2 * 1024 * 1024) {
        return cb(new Error('Profile picture must be less than 2MB.'), false);
      }
      
      cb(null, true);
    },
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB
      files: 1
    }
  }).single('profilePicture');
};

/**
 * Document Upload Middleware
 * Handles documents like invoices, certificates, etc.
 */
const uploadDocument = (fieldName = 'document', maxCount = 3, options = {}) => {
  return multer({
    storage: cloudinary.createCloudinaryStorage('bazaarconnect/documents', maxCount),
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Only PDF, DOC, DOCX, and image files are allowed.'), false);
      }
      
      // Documents can be up to 10MB
      if (file.size > 10 * 1024 * 1024) {
        return cb(new Error('Document size must be less than 10MB.'), false);
      }
      
      cb(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: maxCount
    },
    ...options
  }).array(fieldName, maxCount);
};

/**
 * Bulk Upload Middleware
 * Handles multiple file uploads with validation
 */
const uploadBulk = (fieldName = 'files', maxCount = 10, options = {}) => {
  return multer({
    storage: cloudinary.createCloudinaryStorage('bazaarconnect/bulk', maxCount),
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'application/pdf'
      ];
      
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Only JPEG, PNG, WebP images and PDF files are allowed.'), false);
      }
      
      // Bulk uploads have a limit of 5MB per file
      if (file.size > 5 * 1024 * 1024) {
        return cb(new Error('Each file must be less than 5MB.'), false);
      }
      
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB per file
      files: maxCount
    },
    ...options
  }).array(fieldName, maxCount);
};

/**
 * Image Optimization Middleware
 * Optimizes uploaded images before storage
 */
const optimizeImage = (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  try {
    // Apply Cloudinary transformations
    const transformations = {
      quality: 'auto',
      fetch_format: 'auto',
      width: 1000,
      height: 1000,
      crop: 'limit',
      gravity: 'auto'
    };
    
    req.file.transformations = transformations;
    next();
    
  } catch (error) {
    console.error('Image optimization error:', error);
    return next(error);
  }
};

/**
 * Upload Validation Middleware
 * Validates upload request before processing
 */
const validateUpload = (req, res, next) => {
  try {
    // Check if files are being uploaded
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.'
      });
    }
    
    // Check request size for file uploads
    const contentLength = parseInt(req.get('Content-Length'));
    const maxSize = 50 * 1024 * 1024; // 50MB total request size
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        message: 'Request too large. Maximum size is 50MB.'
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Upload validation error:', error);
    return next(error);
  }
};

/**
 * Error Handling Middleware for Uploads
 * Handles specific upload errors
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    // Multer-specific errors
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum number of files exceeded.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field in file upload.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + error.message
        });
    }
  }
  
  if (error) {
    // Custom file filter errors
    switch (error.code) {
      case 'INVALID_FILE_TYPE':
        return res.status(400).json({
          success: false,
          message: error.message
        });
      case 'FILE_TOO_LARGE':
        return res.status(400).json({
          success: false,
          message: error.message
        });
      case 'IMAGE_TOO_SMALL':
        return res.status(400).json({
          success: false,
          message: error.message
        });
      case 'IMAGE_TOO_LARGE':
        return res.status(400).json({
          success: false,
          message: error.message
        });
      case 'INVALID_IMAGE':
        return res.status(400).json({
          success: false,
          message: error.message
        });
      default:
        return res.status(500).json({
          success: false,
          message: 'Upload processing error.'
        });
    }
  }
  
  next();
};

/**
 * File Information Helper
 * Extracts useful information from uploaded files
 */
const getFileInfo = (file) => {
  if (!file) return null;
  
  return {
    originalname: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    url: file.url,
    public_id: file.public_id,
    format: file.format,
    width: file.width,
    height: file.height,
    duration: file.duration,
    created_at: file.created_at
  };
};

/**
 * Batch File Information
 * Extracts information from multiple files
 */
const getBatchFileInfo = (files) => {
  if (!files || !Array.isArray(files)) return [];
  
  return files.map(file => getFileInfo(file));
};

/**
 * Cleanup Old Files
 * Removes old files from Cloudinary (cleanup function)
 */
const cleanupOldFiles = async (publicIds, daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    // This would typically be run as a scheduled job
    // For now, it's a placeholder function
    
    console.log('Cleanup function called for files older than', daysOld, 'days');
    
    // In a real implementation, you would:
    // 1. Query your database for files older than cutoffDate
    // 2. Use Cloudinary API to delete them
    // 3. Update your database records
    
    return { deleted: 0, errors: 0 };
    
  } catch (error) {
    console.error('Cleanup error:', error);
    throw error;
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadProfilePicture,
  uploadDocument,
  uploadBulk,
  optimizeImage,
  validateUpload,
  handleUploadError,
  getFileInfo,
  getBatchFileInfo,
  cleanupOldFiles,
  fileFilter,
  storage
};