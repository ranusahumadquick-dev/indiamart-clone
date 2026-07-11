import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  uploadITRCertificate,
  getMyITRCertificates,
  getITRCertificateById,
  updateITRCertificate,
  deleteITRCertificate,
  adminGetAllITRCertificates,
  adminVerifyITRCertificate,
  getITRStats,
} from "../controllers/itrCertificateController.js";

const router = express.Router();

// ── Multer for ITR documents ────────────────────────────────────────────────
const uploadDir = "uploads/seller-docs";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `ITR-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

const itrUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: PDF, JPG, JPEG, PNG"));
    }
  },
});

// ── Seller Routes ───────────────────────────────────────────────────────────
router.post("/", authMiddleware, roleMiddleware(["seller"]), itrUpload.single("document"), uploadITRCertificate);
router.get("/stats", authMiddleware, roleMiddleware(["seller"]), getITRStats);
router.get("/", authMiddleware, roleMiddleware(["seller"]), getMyITRCertificates);
router.get("/:id", authMiddleware, roleMiddleware(["seller"]), getITRCertificateById);
router.patch("/:id", authMiddleware, roleMiddleware(["seller"]), itrUpload.single("document"), updateITRCertificate);
router.delete("/:id", authMiddleware, roleMiddleware(["seller"]), deleteITRCertificate);

// ── Admin Routes ────────────────────────────────────────────────────────────
router.get("/admin/all", authMiddleware, roleMiddleware(["admin"]), adminGetAllITRCertificates);
router.patch("/admin/:id/verify", authMiddleware, roleMiddleware(["admin"]), adminVerifyITRCertificate);

export default router;
