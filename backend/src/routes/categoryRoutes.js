import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryTree,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// =============================================
// 🔓 PUBLIC ROUTES
// =============================================
router.get("/tree", getCategoryTree);
router.get("/", getAllCategories);
router.get("/:slug", getCategoryBySlug);

// =============================================
// 🔒 ADMIN ROUTES
// =============================================
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createCategory
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateCategory
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteCategory
);

export default router;
