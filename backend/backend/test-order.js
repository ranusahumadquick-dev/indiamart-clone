import mongoose from "mongoose";
import dotenv from "dotenv";
import SampleRequest from "./src/models/SampleRequest.js";
import Order from "./src/models/Order.js";
import Product from "./src/models/Product.js";

dotenv.config();

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
    console.log("   Sample ID:", sample._id);
    console.log("   Seller ID:", sample.seller);
    console.log("   Buyer ID:", sample.buyer);
    console.log("   Product name:", sample.product?.name);
    console.log("   Product images:", sample.product?.images?.length ?? 0);
    console.log("   Total Amount:", sample.totalAmount);
    console.log("");

    // Check if order exists
    const existingOrder = await Order.findOne({ sampleRequest: sample._id });
    console.log("📦 Existing order:", existingOrder ? "EXISTS" : "MISSING");
    console.log("");

    if (!existingOrder) {
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

        console.log("✅ Order created successfully!");
        console.log("   Order ID:", order._id);
        console.log("   Seller ID:", order.seller);
      } catch (err) {
        console.error("❌ Order creation failed:");
        console.error("   Error:", err.message);
        if (err.errors) {
          Object.keys(err.errors).forEach(key => {
            console.error("   -", key, ":", err.errors[key].message);
          });
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
