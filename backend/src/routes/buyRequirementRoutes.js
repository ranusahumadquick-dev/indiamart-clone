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
  boostBuyRequirement,
  getMyInvitations,
  inviteMoreSellers,
} from "../controllers/buyRequirementController.js";

const router = express.Router();

// ========================================
// PUBLIC ROUTES
// ========================================
// GET all active buy requirements (marketplace)
router.get("/", getBuyRequirements);

// ========================================
// STATIC SEGMENT ROUTES — must be before /:requirementId to avoid param conflict
// ========================================
// GET seller's private invitations
router.get("/seller/invitations", authMiddleware, roleMiddleware(["seller"]), getMyInvitations);

// GET my buy requirements
router.get("/user/my-requirements", authMiddleware, getMyBuyRequirements);

// GET specific buy requirement
router.get("/:requirementId", getBuyRequirementById);

// ========================================
// BUYER ROUTES (Auth required)
// ========================================
// POST create new buy requirement
router.post("/", authMiddleware, roleMiddleware(["buyer"]), createBuyRequirement);

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

// POST boost buy requirement — Priority Response Pro
router.post(
  "/:requirementId/boost",
  authMiddleware,
  roleMiddleware(["buyer"]),
  boostBuyRequirement
);

// POST invite more sellers to private requirement
router.post(
  "/:requirementId/invite",
  authMiddleware,
  roleMiddleware(["buyer"]),
  inviteMoreSellers
);

export default router;
