import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

// =============================================
// Route Imports
// =============================================
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import buyRequirementRoutes from "./routes/buyRequirementRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import sampleRoutes from "./routes/sampleRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import priceAlertRoutes from "./routes/priceAlertRoutes.js";
import sourcingRoutes from "./routes/sourcingRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import customizationRoutes from "./routes/customization.js";
import serviceRoutes from "./routes/serviceRoutes.js";

// =============================================
// Middleware Imports
// =============================================
import errorHandler from "./middleware/errorHandler.js";
import { handleMulterError } from "./middleware/multer.js";

const app = express();

// =============================================
// SECURITY MIDDLEWARE
// =============================================

// Helmet — Sets security HTTP headers with CSP allowing frontend to load images
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// =============================================
// GLOBAL MIDDLEWARE
// =============================================

// CORS — Allow frontend to communicate with backend
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization", "Origin", "X-Requested-With"],
    exposedHeaders: ["Content-Length", "X-JSON-Response"],
    maxAge: 86400,
  })
);

// Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie Parser
app.use(cookieParser());

// Serve static files
app.use(express.static("public"));

// Serve uploaded files with CORS headers
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsPath = path.join(__dirname, "../uploads");

console.log("📁 [Static Files] Uploads directory:", uploadsPath);

// Add CORS headers specifically for uploaded files
app.use("/uploads", (req, res, next) => {
  // Remove restrictive CSP headers
  res.removeHeader("Content-Security-Policy");

  // Set CORS headers for image requests
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin");

  // Cache control for images
  res.setHeader("Cache-Control", "public, max-age=86400");

  // Ensure proper content type
  if (req.path.endsWith('.jpg') || req.path.endsWith('.jpeg')) {
    res.setHeader("Content-Type", "image/jpeg");
  } else if (req.path.endsWith('.png')) {
    res.setHeader("Content-Type", "image/png");
  } else if (req.path.endsWith('.webp')) {
    res.setHeader("Content-Type", "image/webp");
  }

  // Debug logging
  console.log("🖼️  [Static] GET", req.method, req.path);
  console.log("   Origin:", origin);

  // Handle OPTIONS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ [Static] OPTIONS request handled");
    return res.sendStatus(200);
  }

  next();
});

// Serve static files from uploads directory
app.use("/uploads", express.static(uploadsPath, {
  index: false,
  redirect: false,
  setHeaders: (res, filePath) => {
    // Re-apply CORS headers for static middleware
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Vary", "Origin");
    console.log("✅ [Static] Serving file:", filePath);
  }
}));

// =============================================
// IMAGE PROXY ROUTE — Serve images without CSP
// =============================================
app.get("/api/image-proxy", (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "URL parameter required" });
  }

  // Security: only allow local uploads
  if (!url.includes("/uploads/products/")) {
    return res.status(403).json({ error: "Only uploads allowed" });
  }

  // Remove CSP header and serve file
  res.removeHeader("Content-Security-Policy");
  res.setHeader("Access-Control-Allow-Origin", process.env.CLIENT_URL || "http://localhost:3000");

  const filename = url.split("/").pop();
  const filepath = path.join(__dirname, "../uploads/products/", filename);
  res.sendFile(filepath, (err) => {
    if (err) res.status(404).json({ error: "Image not found" });
  });
});

// =============================================
// API HEALTH CHECK — before rate limiter
// =============================================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "✅ IndiaMart Clone API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Rate Limiting — skipped in development (evaluated per-request so dotenv is loaded by then)
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 1000,
  skip: () => process.env.NODE_ENV === "development",
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// =============================================
// API ROUTES
// =============================================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/buy-requirements", buyRequirementRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/samples", sampleRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/price-alerts", priceAlertRoutes);
app.use("/api/sourcing-requests", sourcingRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/customizations", customizationRoutes);
app.use("/api/services", serviceRoutes);

// =============================================
// 404 HANDLER — Route not found
// =============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =============================================
// MULTER ERROR HANDLER — Before global error handler
// =============================================
app.use(handleMulterError);

// =============================================
// GLOBAL ERROR HANDLER — Must be last middleware
// =============================================
app.use(errorHandler);

export default app;
