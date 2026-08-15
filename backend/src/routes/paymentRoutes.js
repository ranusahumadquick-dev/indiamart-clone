import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  createRazorpayOrder, verifyPayment, getPaymentHistory,
  getSubscriptionPlans, getBuyerPlans,
  getActiveSubscription, getBuyerSubscription,
  subscribeToBuyerPlan, verifyBuyerPayment,
  subscribeSellerToPlan, verifySellerPayment,
  cancelSubscription, getInvoices, downloadInvoice, resendInvoiceEmail,
  triggerSubscriptionExpiryCheck,
  createCheckoutOrder, verifyCheckoutPayment, retryPayment, getMyTransactions,
  getSellerPaymentDashboard, getSellerOrders,
  adminGetAllPayments, adminProcessRefund,
} from "../controllers/paymentController.js";

const router = express.Router();
const admin = [authMiddleware, roleMiddleware(["admin"])];
const seller = [authMiddleware, roleMiddleware(["seller", "admin"])];

// Public
router.get("/plans", getSubscriptionPlans);
router.get("/buyer-plans", getBuyerPlans);

// Auth required (all roles)
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

// Cron
router.post("/cron/downgrade-expired", triggerSubscriptionExpiryCheck);

// Checkout (buyer)
router.post("/checkout", createCheckoutOrder);
router.post("/verify-checkout", verifyCheckoutPayment);
router.post("/retry/:paymentId", retryPayment);
router.get("/my-transactions", getMyTransactions);

// Seller payment dashboard
router.get("/seller/dashboard", ...seller, getSellerPaymentDashboard);
router.get("/seller/orders", ...seller, getSellerOrders);

// Admin payment management
router.get("/admin/all", ...admin, adminGetAllPayments);
router.post("/admin/refund/:paymentId", ...admin, adminProcessRefund);

export default router;
