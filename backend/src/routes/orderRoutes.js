import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getBuyerOrders, getBuyerOrderById, reorder } from "../controllers/orderController.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/buyer", getBuyerOrders);
router.get("/buyer/:id", getBuyerOrderById);
router.post("/:id/reorder", reorder);

export default router;
