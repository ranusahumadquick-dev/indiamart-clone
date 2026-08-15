import express from 'express';
import {
  getAllBrands,
  getBrandById,
  getMyBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/brandController.js';
import auth from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { brandUpload } from '../middleware/multer.js';

const router = express.Router();

router.get('/my', auth, roleMiddleware(['seller', 'admin']), getMyBrands);
router.get('/', getAllBrands);
router.get('/:id', getBrandById);
router.post('/', auth, roleMiddleware(['seller', 'admin']), brandUpload.single('logo'), createBrand);
router.put('/:id', auth, roleMiddleware(['seller', 'admin']), brandUpload.single('logo'), updateBrand);
router.delete('/:id', auth, roleMiddleware(['seller', 'admin']), deleteBrand);

export default router;
