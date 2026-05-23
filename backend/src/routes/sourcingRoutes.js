import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createSourcingRequest,
  getMySourcingRequests,
  getSourcingRequestById,
  cancelSourcingRequest,
  updateSourcingRequest,
} from "../controllers/sourcingController.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/", createSourcingRequest);
router.get("/my", getMySourcingRequests);
router.get("/:id", getSourcingRequestById);
router.put("/:id/cancel", cancelSourcingRequest);
router.put("/:id", updateSourcingRequest);

export default router;
