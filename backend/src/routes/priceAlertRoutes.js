import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createAlert,
  getMyAlerts,
  deleteAlert,
  deleteProductAlerts,
  checkAlert,
} from "../controllers/priceAlertController.js";

const router = Router();
router.use(authMiddleware);

router.get("/", getMyAlerts);
router.post("/", createAlert);
router.get("/check/:productId", checkAlert);
router.delete("/product/:productId", deleteProductAlerts);
router.delete("/:id", deleteAlert);

export default router;
