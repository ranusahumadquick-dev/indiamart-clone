import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

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

// =============================================
// Middleware Imports
// =============================================
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// =============================================
// SECURITY MIDDLEWARE
// =============================================

// Helmet — Sets security HTTP headers
app.use(helmet());

// =============================================
// GLOBAL MIDDLEWARE
// =============================================

// CORS — Allow frontend to communicate with backend
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie Parser
app.use(cookieParser());

// Serve static files
app.use(express.static("public"));

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
// GLOBAL ERROR HANDLER — Must be last middleware
// =============================================
app.use(errorHandler);

export default app;
