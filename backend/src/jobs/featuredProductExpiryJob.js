import cron from "node-cron";
import Product from "../models/Product.js";

/**
 * Auto-expire featured products when featuredUntil date passes
 * Runs every hour at :00 minutes
 */
export const initializeFeaturedExpiryJob = () => {
  const job = cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();

      // Find all featured products with expired featuredUntil date
      const result = await Product.updateMany(
        {
          isFeatured: true,
          featuredUntil: { $lt: now },
        },
        {
          isFeatured: false,
          featuredUntil: null,
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`[Featured Product Expiry Job] Expired ${result.modifiedCount} featured products`);
      }
    } catch (error) {
      console.error("[Featured Product Expiry Job] Error:", error);
    }
  });

  console.log("[Featured Product Expiry Job] Initialized - runs hourly");
  return job;
};

/**
 * Helper function to check if a product's featured listing is expired
 */
export const isFeaturedExpired = (product) => {
  if (!product.isFeatured || !product.featuredUntil) {
    return false;
  }
  return new Date(product.featuredUntil) < new Date();
};

export default { initializeFeaturedExpiryJob, isFeaturedExpired };
