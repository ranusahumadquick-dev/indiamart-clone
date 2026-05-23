import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getDashboard,
  getProducts,
  approveProduct,
  rejectProduct,
  getUsers,
  updateUserStatus,
  verifyUser,
  deleteUser,
  getCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authMiddleware, roleMiddleware("admin"));

// Dashboard
router.get("/dashboard", getDashboard);

// Product management
router.get("/products", getProducts);
router.patch("/products/:id/approve", approveProduct);
router.patch("/products/:id/reject", rejectProduct);

// User management
router.get("/users", getUsers);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/verify", verifyUser);
router.delete("/users/:id", deleteUser);

// Category management
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.patch("/categories/:id/status", toggleCategoryStatus);
router.delete("/categories/:id", deleteCategory);

export default router;
