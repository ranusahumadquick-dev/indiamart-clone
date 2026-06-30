import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  verifyGST,
  uploadDocs,
  getMyStatus,
  adminListSellers,
  adminApproveSeller,
  adminRejectSeller,
} from "../controllers/sellerVerifyController.js";

const router = express.Router();

// ── Multer for seller documents ───────────────────────────────────────────────
const uploadDir = "uploads/seller-docs";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

const docUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
}).fields([
  { name: "itr",           maxCount: 1 },
  { name: "caCertificate", maxCount: 1 },
  { name: "bankStatement", maxCount: 1 },
]);

// ── Seller routes ─────────────────────────────────────────────────────────────
router.post("/gst",          verifyGST);                              // public (or optionally authed)
router.post("/upload-docs",  docUpload, uploadDocs);  // auth optional — registration flow may not have token yet
router.get( "/status",       authMiddleware, getMyStatus);            // seller only

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get(   "/admin/list",              authMiddleware, roleMiddleware(["admin"]), adminListSellers);
router.patch( "/admin/:sellerId/approve", authMiddleware, roleMiddleware(["admin"]), adminApproveSeller);
router.patch( "/admin/:sellerId/reject",  authMiddleware, roleMiddleware(["admin"]), adminRejectSeller);

export default router;
