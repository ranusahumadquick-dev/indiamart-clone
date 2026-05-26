import mongoose from "mongoose";
import dotenv from "dotenv";
import SampleRequest from "./src/models/SampleRequest.js";
import Order from "./src/models/Order.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected");

    const buyerId = "6a14078ca64a3dd07bf09d89";
    const sellerId = "6a14078ca64a3dd07bf09d8a";

    // Find and delete orders first
    const orders = await Order.deleteMany({
      buyer: buyerId,
      seller: sellerId
    });
    console.log(`Deleted ${orders.deletedCount} orders`);

    // Then delete samples
    const samples = await SampleRequest.deleteMany({
      buyer: buyerId,
      seller: sellerId
    });
    console.log(`Deleted ${samples.deletedCount} samples`);

    console.log("✅ Cleanup complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
