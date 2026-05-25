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
  subscribeSellerToPlan,
  verifySellerPayment,
  cancelSubscription,
  getInvoices,
  downloadInvoice,
  resendInvoiceEmail,
  triggerSubscriptionExpiryCheck,
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
router.post("/subscribe-seller", subscribeSellerToPlan);
router.post("/verify-seller-payment", verifySellerPayment);
router.post("/cancel-subscription", cancelSubscription);

// Invoice endpoints
router.get("/invoices", getInvoices);
router.get("/invoice/:paymentId", downloadInvoice);
router.post("/resend-invoice/:paymentId", resendInvoiceEmail);

// Admin/Cron endpoints
router.post("/cron/downgrade-expired", triggerSubscriptionExpiryCheck);

export default router;
