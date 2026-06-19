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

// Public routes
router.get('/search', searchServices); // Search services
router.get('/category/:category', getServicesByCategory); // Get by category
router.get('/', getAllServices); // Get all services with filters
router.get('/:id', getServiceById); // Get single service

// Provider routes (public)
router.get('/provider/:providerId', getProviderServices); // Get provider's services

// Protected routes (require authentication)
router.post(
  '/',
  auth,
  roleMiddleware(['seller']),
  serviceUpload.array('images', 5),
  createService
); // Create service

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

// Get current user's services
router.get(
  '/dashboard/my-services',
  auth,
  roleMiddleware(['seller']),
  getMyServices
);

// Record inquiry
router.post('/:id/inquiry', auth, recordInquiry);

export default router;
