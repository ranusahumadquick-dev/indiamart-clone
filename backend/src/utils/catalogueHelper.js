// =============================================
// 📄 CATALOGUE HELPER — Handle PDF uploads
// =============================================

export const validatePdfFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file type
  if (file.mimetype !== 'application/pdf') {
    return { valid: false, error: 'Only PDF files are allowed' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  return { valid: true };
};

export const generateCatalogueUrl = (file) => {
  if (!file) return null;

  // If using Cloudinary or similar
  // return file.path;

  // For local file upload
  return {
    url: `/uploads/catalogues/${file.filename}`,
    fileName: file.originalname,
    uploadedAt: new Date(),
  };
};

export const createCatalogueObject = (file) => {
  if (!file) return null;

  return {
    url: `/uploads/catalogues/${file.filename}`,
    fileName: file.originalname,
    uploadedAt: new Date(),
  };
};

export default {
  validatePdfFile,
  generateCatalogueUrl,
  createCatalogueObject,
};
