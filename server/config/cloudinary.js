// Import Cloudinary
const cloudinary = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

/**
 * Configure Cloudinary for image upload
 * Uses credentials from environment variables
 */
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Force HTTPS URLs
    timeout: 60000 // 60 second timeout for upload operations
  });
  
  console.log('Cloudinary configured successfully');
  
  return cloudinary;
};

/**
 * Create Cloudinary storage for Multer
 * @param {string} folder - Folder name in Cloudinary
 * @param {number} maxCount - Maximum number of files allowed
 */
const createCloudinaryStorage = (folder = 'bazaarconnect', maxCount = 5) => {
  const cloudinaryInstance = configureCloudinary();
  
  return new CloudinaryStorage({
    cloudinary: cloudinaryInstance,
    params: {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      transformation: [
        {
          quality: 'auto',
          fetch_format: 'auto'
        },
        {
          width: 1000,
          height: 1000,
          crop: 'limit' // Limit to maximum dimensions but maintain aspect ratio
        }
      ]
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: maxCount
    }
  });
};

/**
 * Single image upload middleware
 */
const uploadSingle = createCloudinaryStorage('bazaarconnect/products', 1);

/**
 * Multiple images upload middleware
 */
const uploadMultiple = createCloudinaryStorage('bazaarconnect/products', 5);

/**
 * Profile picture upload middleware
 */
const uploadProfile = createCloudinaryStorage('bazaarconnect/profiles', 1);

module.exports = {
  configureCloudinary,
  createCloudinaryStorage,
  uploadSingle,
  uploadMultiple,
  uploadProfile,
  cloudinary: configureCloudinary()
};