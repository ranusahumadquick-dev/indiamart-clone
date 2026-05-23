import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createRazorpayOrder,
  verifyPayment,
  getPaymentHistory,
  getSubscriptionPlans,
  getBuyerPlans,
  getActiveSubscription,
  getBuyerSubscription,
  subscribeToBuyerPlan,
  verifyBuyerPayment,
  cancelSubscription,
} from "../controllers/paymentController.js";

const router = express.Router();

// Public
router.get("/plans", getSubscriptionPlans);
router.get("/buyer-plans", getBuyerPlans);

// Auth required
router.use(authMiddleware);

router.post("/create-order", createRazorpayOrder);
router.post("/verify-payment/:id", verifyPayment);
router.get("/history", getPaymentHistory);
router.get("/subscription", getActiveSubscription);
router.get("/buyer-subscription", getBuyerSubscription);
router.post("/subscribe-buyer", subscribeToBuyerPlan);
router.post("/verify-buyer-payment", verifyBuyerPayment);
router.post("/cancel-subscription", cancelSubscription);

export default router;
