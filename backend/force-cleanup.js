import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected");

    const db = mongoose.connection.db;
    const buyerId = "6a14078ca64a3dd07bf09d89";
    const sellerId = "6a14078ca64a3dd07bf09d8a";

    // Delete all samples for this buyer-seller pair
    const sampleResult = await db.collection("samplerequests").deleteMany({
      buyer: new mongoose.Types.ObjectId(buyerId),
      seller: new mongoose.Types.ObjectId(sellerId)
    });

    console.log(`Deleted ${sampleResult.deletedCount} samples`);

    // Delete all orders for this buyer-seller pair
    const orderResult = await db.collection("orders").deleteMany({
      buyer: new mongoose.Types.ObjectId(buyerId),
      seller: new mongoose.Types.ObjectId(sellerId)
    });

    console.log(`Deleted ${orderResult.deletedCount} orders`);

    console.log("✅ Force cleanup complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
