import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createRazorpayOrder, verifyPayment } from "../controllers/paymentController.js";
const router = express.Router();

// Public subscription endpoint (frontend expects this route)
router.get('/subscription', (req, res) => {
  res.status(200).json({ success: true, data: null });
});

// All other payment routes require authentication
router.use(authMiddleware);

// Payment routes
router.post('/create-order', createRazorpayOrder);
router.post('/verify-payment/:id', verifyPayment);

// Placeholder subscription and payment history routes - implement these in paymentController when ready
router.post('/subscription/payment', (req, res) => {
  res.status(501).json(new ApiError(501, "Subscription payment endpoint not implemented yet"));
});

router.post('/subscription/verify-payment/:id', (req, res) => {
  res.status(501).json(new ApiError(501, "Subscription payment verification endpoint not implemented yet"));
});

router.get('/history', (req, res) => {
  res.status(501).json(new ApiError(501, "Payment history endpoint not implemented yet"));
});

// (previous subscription route removed in favor of public stub above)

router.post('/cancel-subscription', (req, res) => {
  res.status(501).json(new ApiError(501, "Cancel subscription endpoint not implemented yet"));
});

router.get('/plans', (req, res) => {
  res.status(501).json(new ApiError(501, "Subscription plans endpoint not implemented yet"));
});

export default router;