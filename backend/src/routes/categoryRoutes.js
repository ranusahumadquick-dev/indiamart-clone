import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryTree,
  getCategoryById,
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
// Single route that handles both ID and slug lookups
router.get("/:idOrSlug", async (req, res, next) => {
  const { idOrSlug } = req.params;
  // Check if it looks like a MongoDB ObjectId (24 hex chars)
  const isObjectId = /^[a-f0-9]{24}$/i.test(idOrSlug);

  if (isObjectId) {
    req.params.id = idOrSlug;
    return getCategoryById(req, res, next);
  } else {
    req.params.slug = idOrSlug;
    return getCategoryBySlug(req, res, next);
  }
});

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
