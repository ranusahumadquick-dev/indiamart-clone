import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import app from "./app.js";
import { seedDefaultPlans } from "./models/SubscriptionPlan.js";
import { seedCategories } from "./utils/seedCategories.js";
import socketHandler from "./socket/socketHandler.js";
import { initializeReminderJob } from "./jobs/inquiryReminderJob.js";
import { initializeFeaturedExpiryJob } from "./jobs/featuredProductExpiryJob.js";
import { scheduleExpiryJob } from "./jobs/subscriptionExpiryJob.js";

dotenv.config();

connectDB();

const initializeSubscriptionPlans = async () => {
  try {
    await seedDefaultPlans();
    console.log("✅ Subscription plans initialized");
  } catch (error) {
    console.error("❌ Error initializing subscription plans:", error);
  }
};

initializeSubscriptionPlans();
seedCategories();
initializeReminderJob();
initializeFeaturedExpiryJob();
scheduleExpiryJob();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

socketHandler(io);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`🚀 Server Running On Port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}/api/health`);
  console.log(`🔌 Socket.io enabled`);
});
