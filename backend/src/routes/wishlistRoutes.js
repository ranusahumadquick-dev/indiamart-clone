import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  clearWishlist,
  updateWishlistNote,
  getWishlistCollections,
} from "../controllers/wishlistController.js";
import {
  getSellerShortlist,
  addSellerToShortlist,
  removeSellerFromShortlist,
  checkSellerShortlist,
  clearSellerShortlist,
  getSellerShortlistCollections,
  updateSellerShortlistNote,
} from "../controllers/sellerShortlistController.js";

const router = Router();

router.use(authMiddleware);

// ── Product wishlist ─────────────────────────────────────────────────
router.get("/collections", getWishlistCollections);
router.get("/check/:productId", checkWishlist);
router.get("/", getWishlist);
router.delete("/", clearWishlist);
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);
router.patch("/:itemId/note", updateWishlistNote);

// ── Seller shortlist ─────────────────────────────────────────────────
router.get("/sellers/collections", getSellerShortlistCollections);
router.get("/sellers/check/:sellerId", checkSellerShortlist);
router.get("/sellers", getSellerShortlist);
router.delete("/sellers", clearSellerShortlist);
router.post("/sellers/:sellerId", addSellerToShortlist);
router.delete("/sellers/:sellerId", removeSellerFromShortlist);
router.patch("/sellers/:itemId/note", updateSellerShortlistNote);

export default router;
