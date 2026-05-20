import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  createBuyRequirement,
  getBuyRequirements,
  getBuyRequirementById,
  getMyBuyRequirements,
  updateBuyRequirement,
  deleteBuyRequirement,
  respondToBuyRequirement,
  closeBuyRequirement,
} from "../controllers/buyRequirementController.js";

const router = express.Router();

// ========================================
// PUBLIC ROUTES
// ========================================
// GET all active buy requirements (marketplace)
router.get("/", getBuyRequirements);

// GET specific buy requirement
router.get("/:requirementId", getBuyRequirementById);

// ========================================
// BUYER ROUTES (Auth required)
// ========================================
// POST create new buy requirement
router.post("/", authMiddleware, roleMiddleware(["buyer"]), createBuyRequirement);

// GET my buy requirements
router.get("/user/my-requirements", authMiddleware, getMyBuyRequirements);

// PUT update buy requirement
router.put("/:requirementId", authMiddleware, updateBuyRequirement);

// DELETE buy requirement
router.delete("/:requirementId", authMiddleware, deleteBuyRequirement);

// ========================================
// SELLER ROUTES (Auth required, Seller role)
// ========================================
// POST respond to buy requirement
router.post(
  "/:requirementId/respond",
  authMiddleware,
  roleMiddleware(["seller"]),
  respondToBuyRequirement
);

// ========================================
// BUYER ROUTES (Closing requirements)
// ========================================
// PUT close buy requirement (select supplier)
router.put(
  "/:requirementId/close",
  authMiddleware,
  roleMiddleware(["buyer"]),
  closeBuyRequirement
);

export default router;
