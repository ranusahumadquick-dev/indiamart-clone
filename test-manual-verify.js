import mongoose from "mongoose";
import dotenv from "dotenv";
import SampleRequest from "./backend/src/models/SampleRequest.js";
import Order from "./backend/src/models/Order.js";
import Payment from "./backend/src/models/Payment.js";
import crypto from "crypto";

dotenv.config({ path: "./backend/.env" });

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get a paid sample that's missing an order
    const sample = await SampleRequest.findOne({ paymentStatus: "paid" })
      .populate("product", "name images");
    
    if (!sample) {
      console.log("❌ No paid samples found");
      process.exit(1);
    }

    console.log("📋 Sample found:");
    console.log("   ID:", sample._id);
    console.log("   Seller:", sample.seller);
    console.log("   Buyer:", sample.buyer);
    console.log("   Product:", sample.product);
    console.log("   Product._id:", sample.product._id);
    console.log("   Product.name:", sample.product.name);
    console.log("   Product.images:", sample.product.images);
    console.log("");

    // Check if order exists
    const existingOrder = await Order.findOne({ sampleRequest: sample._id });
    console.log("📦 Existing order:", existingOrder ? existingOrder._id : "NONE");
    console.log("");

    // Try to create the order
    console.log("🔄 Attempting to create order...");
    try {
      const order = await Order.create({
        buyer: sample.buyer,
        seller: sample.seller,
        sampleRequest: sample._id,
        items: [{
          product: sample.product._id,
          name: sample.product.name,
          image: sample.product.images?.[0]?.url || "",
          qty: sample.quantity,
          unitPrice: sample.unitPrice,
          total: sample.totalAmount,
        }],
        totalAmount: sample.totalAmount,
        status: "confirmed",
        paymentId: sample.paymentId,
        paymentStatus: "paid",
        shippingAddress: sample.shippingAddress,
      });

      console.log("✅ Order created successfully:");
      console.log("   Order ID:", order._id);
      console.log("   Order Seller ID:", order.seller);
      console.log("   Order Status:", order.status);
    } catch (err) {
      console.error("❌ Order creation failed:");
      console.error("   Error:", err.message);
      console.error("   Stack:", err.stack);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
