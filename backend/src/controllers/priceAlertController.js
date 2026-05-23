import PriceAlert from "../models/PriceAlert.js";
import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "./notificationController.js";
import { sendEmail } from "../utils/sendEmail.js";

// POST /price-alerts — create or update a price OR stock alert
export const createAlert = asyncHandler(async (req, res) => {
  const { productId, targetPrice, alertType = "price" } = req.body;
  if (!productId) throw new ApiError(400, "productId is required");

  const product = await Product.findById(productId).select("name price stock isActive");
  if (!product || !product.isActive) throw new ApiError(404, "Product not found");

  if (alertType === "price") {
    if (!targetPrice) throw new ApiError(400, "targetPrice is required for price alerts");
    if (targetPrice >= product.price)
      throw new ApiError(400, `Target price must be below current price (₹${product.price})`);

    const alert = await PriceAlert.findOneAndUpdate(
      { user: req.user._id, product: productId, alertType: "price" },
      { targetPrice, currentPriceAtAlert: product.price, isActive: true, triggeredAt: null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json(new ApiResponse(200, alert, "Price alert set"));
  }

  if (alertType === "stock") {
    const alert = await PriceAlert.findOneAndUpdate(
      { user: req.user._id, product: productId, alertType: "stock" },
      { notifyWhenInStock: true, isActive: true, triggeredAt: null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json(new ApiResponse(200, alert, "Stock alert set"));
  }

  throw new ApiError(400, "Invalid alertType — must be 'price' or 'stock'");
});

// GET /price-alerts — buyer's all alerts
export const getMyAlerts = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = { user: req.user._id };
  if (type) filter.alertType = type;

  const alerts = await PriceAlert.find(filter)
    .sort({ createdAt: -1 })
    .populate("product", "name price comparePrice stock images priceUnit isActive");

  return res.status(200).json(new ApiResponse(200, alerts, "Alerts fetched"));
});

// DELETE /price-alerts/:id — remove a single alert
export const deleteAlert = asyncHandler(async (req, res) => {
  const alert = await PriceAlert.findOne({ _id: req.params.id, user: req.user._id });
  if (!alert) throw new ApiError(404, "Alert not found");
  await alert.deleteOne();
  return res.status(200).json(new ApiResponse(200, {}, "Alert removed"));
});

// DELETE /price-alerts/product/:productId — remove all alerts for a product (buyer)
export const deleteProductAlerts = asyncHandler(async (req, res) => {
  await PriceAlert.deleteMany({ user: req.user._id, product: req.params.productId });
  return res.status(200).json(new ApiResponse(200, {}, "All alerts for product removed"));
});

// GET /price-alerts/check/:productId — check active alerts for a product
export const checkAlert = asyncHandler(async (req, res) => {
  const [priceAlert, stockAlert] = await Promise.all([
    PriceAlert.findOne({ user: req.user._id, product: req.params.productId, alertType: "price", isActive: true }),
    PriceAlert.findOne({ user: req.user._id, product: req.params.productId, alertType: "stock", isActive: true }),
  ]);
  return res.status(200).json(
    new ApiResponse(200, {
      hasPriceAlert: !!priceAlert,
      hasStockAlert: !!stockAlert,
      priceAlert: priceAlert || null,
      stockAlert: stockAlert || null,
    }, "Alert check")
  );
});

// ─── Utility: trigger price alerts when seller updates price ───────────
export const triggerPriceAlerts = async (productId, newPrice, productName) => {
  try {
    const alerts = await PriceAlert.find({
      product: productId,
      alertType: "price",
      isActive: true,
      targetPrice: { $gte: newPrice },
    }).populate("user", "name email");

    for (const alert of alerts) {
      alert.isActive = false;
      alert.triggeredAt = new Date();
      await alert.save();

      await createNotification({
        userId: alert.user._id,
        type: "price_alert",
        title: "Price Drop Alert!",
        message: `${productName} dropped to ₹${newPrice} — at or below your target of ₹${alert.targetPrice}`,
        link: `/products/${productId}`,
        data: { productId, newPrice, targetPrice: alert.targetPrice },
      });

      try {
        if (alert.user?.email) {
          await sendEmail({
            to: alert.user.email,
            subject: `Price Alert: ${productName} dropped to ₹${newPrice}`,
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
                <h2 style="color:#1a56db">Price Drop Alert 🎉</h2>
                <p>Hi ${alert.user.name},</p>
                <p><strong>${productName}</strong> has dropped to <strong>₹${newPrice}</strong>, at or below your alert price of ₹${alert.targetPrice}.</p>
                <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/products/${productId}"
                   style="display:inline-block;background:#1a56db;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:12px">
                  View Product →
                </a>
              </div>
            `,
          });
        }
      } catch { /* non-critical */ }
    }
  } catch (err) {
    console.warn("triggerPriceAlerts error:", err?.message);
  }
};

// ─── Utility: trigger stock alerts when seller marks product in-stock ──
export const triggerStockAlerts = async (productId, newStock, productName) => {
  if (!newStock || newStock <= 0) return;
  try {
    const alerts = await PriceAlert.find({
      product: productId,
      alertType: "stock",
      isActive: true,
      notifyWhenInStock: true,
    }).populate("user", "name email");

    for (const alert of alerts) {
      alert.isActive = false;
      alert.triggeredAt = new Date();
      await alert.save();

      await createNotification({
        userId: alert.user._id,
        type: "stock_alert",
        title: "Back In Stock!",
        message: `${productName} is now back in stock — grab it before it's gone!`,
        link: `/products/${productId}`,
        data: { productId, newStock },
      });

      try {
        if (alert.user?.email) {
          await sendEmail({
            to: alert.user.email,
            subject: `Back In Stock: ${productName}`,
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
                <h2 style="color:#059669">Back In Stock! 📦</h2>
                <p>Hi ${alert.user.name},</p>
                <p><strong>${productName}</strong> is now back in stock!</p>
                <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/products/${productId}"
                   style="display:inline-block;background:#059669;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:12px">
                  View Product →
                </a>
              </div>
            `,
          });
        }
      } catch { /* non-critical */ }
    }
  } catch (err) {
    console.warn("triggerStockAlerts error:", err?.message);
  }
};
