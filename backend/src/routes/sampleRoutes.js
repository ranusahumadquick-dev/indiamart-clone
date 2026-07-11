import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createSampleRequest,
  getBuyerSamples,
  getSellerSamples,
  acceptSample,
  rejectSample,
  shipSample,
  confirmDelivery,
  paySample,
  verifySamplePayment,
} from "../controllers/sampleController.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/", createSampleRequest);
router.get("/buyer", getBuyerSamples);
router.get("/seller", getSellerSamples);
router.put("/:id/accept", acceptSample);
router.put("/:id/reject", rejectSample);
router.put("/:id/ship", shipSample);
router.put("/:id/deliver", confirmDelivery);
router.post("/:id/pay", paySample);
router.post("/:id/verify-pay", verifySamplePayment);

export default router;
