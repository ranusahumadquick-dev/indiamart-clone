import express from 'express';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getProviderServices,
  getMyServices,
  recordInquiry,
  getServicesByCategory,
  searchServices,
} from '../controllers/serviceController.js';
import auth from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { serviceUpload } from '../middleware/multer.js';

const router = express.Router();

// ============================================
// IMPORTANT: More specific routes FIRST
// ============================================

// Protected routes with specific paths (BEFORE /:id)
router.get(
  '/dashboard/my-services',
  auth,
  roleMiddleware(['seller']),
  getMyServices
); // Get current user's services

// Public routes with specific paths (BEFORE /:id)
router.get('/search', searchServices); // Search services
router.get('/category/:category', getServicesByCategory); // Get by category
router.get('/provider/:providerId', getProviderServices); // Get provider's services

// Creation route
router.post(
  '/',
  auth,
  roleMiddleware(['seller']),
  serviceUpload.array('images', 5),
  createService
); // Create service

// Generic routes (AFTER specific ones)
router.get('/', getAllServices); // Get all services with filters

// By ID routes (LAST)
router.get('/:id', getServiceById); // Get single service

router.put(
  '/:id',
  auth,
  roleMiddleware(['seller']),
  serviceUpload.array('images', 5),
  updateService
); // Update service

router.delete(
  '/:id',
  auth,
  roleMiddleware(['seller']),
  deleteService
); // Delete service

router.post('/:id/inquiry', auth, recordInquiry); // Record inquiry

export default router;
