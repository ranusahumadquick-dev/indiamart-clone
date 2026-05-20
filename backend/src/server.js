import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";
import { seedDefaultPlans } from "./models/SubscriptionPlan.js";

dotenv.config();

connectDB();

// Initialize subscription plans on startup
const initializeSubscriptionPlans = async () => {
  try {
    await seedDefaultPlans();
    console.log('✅ Subscription plans initialized');
  } catch (error) {
    console.error('❌ Error initializing subscription plans:', error);
  }
};

initializeSubscriptionPlans();

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server Running On Port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}/api/health`);
});