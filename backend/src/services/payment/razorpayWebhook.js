import Payment from "../../models/Payment.js";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import Razorpay from "razorpay";
import { sendEmail } from "../../utils/sendEmail.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Generate invoice number
const generateInvoiceNumber = () => {
  return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Handle Razorpay webhook events
export const handleWebhookEvent = async (event) => {
  const { event: eventType, payload } = event;
  const { payment } = payload || {};

  console.log(`Webhook received: ${eventType}`);

  switch (eventType) {
    case 'payment.captured':
      await handlePaymentCaptured(payment);
      break;
    case 'payment.failed':
      await handlePaymentFailed(payment);
      break;
    case 'refund.created':
      await handleRefundCreated(payment);
      break;
    case 'payment_link.paid':
      await handlePaymentLinkPaid(payment);
      break;
    default:
      console.log(`Unhandled event: ${eventType}`);
  }
};

// Handle successful payment capture
async function handlePaymentCaptured(paymentData) {
  try {
    const { id: paymentId, entity: paymentEntity } = paymentData;
    const { order_id, status, amount, currency, notes } = paymentEntity || {};

    // Find payment record by Razorpay order ID
    const payment = await Payment.findOne({ razorpayOrderId: order_id });
    
    if (!payment) {
      console.log(`Payment record not found for order: ${order_id}`);
      return;
    }

    // Only process if payment is still pending
    if (payment.status !== "pending") {
      console.log(`Payment already processed: ${payment._id}`);
      return;
    }

    // Update payment status
    payment.razorpayPaymentId = paymentId;
    payment.status = "completed";
    payment.completedAt = new Date();
    payment.paymentMethod = notes?.paymentMethod || "razorpay";
    
    // Generate invoice if it's a product payment
    if (payment.paymentFor === "product") {
      payment.invoiceNumber = generateInvoiceNumber();
      await payment.save();
      
      // Create/update order
      await handleProductPayment(payment, notes);
      
      // Send confirmation email
      await sendPaymentConfirmationEmail(payment);
    } else {
      // Handle other payment types
      await handleOtherPaymentTypes(payment, notes);
      await payment.save();
    }

    console.log(`Payment captured successfully: ${payment._id}`);
  } catch (error) {
    console.error("Error handling payment captured:", error);
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentData) {
  try {
    const { id: paymentId, entity: paymentEntity } = paymentData;
    const { order_id, notes } = paymentEntity || {};

    // Find payment record
    const payment = await Payment.findOne({ razorpayOrderId: order_id });
    
    if (!payment) {
      console.log(`Payment record not found for order: ${order_id}`);
      return;
    }

    // Update payment status
    payment.status = "failed";
    payment.failedAt = new Date();
    payment.failedReason = "Payment failed - Razorpay webhook";
    
    // If it's a product order, update order status
    if (payment.paymentFor === "product") {
      await Order.findOneAndUpdate(
        { paymentId: payment._id },
        { paymentStatus: "failed", status: "pending" },
        { new: true }
      );
    }

    await payment.save();
    console.log(`Payment marked as failed: ${payment._id}`);
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

// Handle refund created
async function handleRefundCreated(paymentData) {
  try {
    const { id: refundId, entity: refundEntity } = paymentData;
    const { payment_id, order_id, status, amount } = refundEntity || {};

    // Find payment record
    const payment = await Payment.findOne({ razorpayPaymentId: payment_id });
    
    if (!payment) {
      console.log(`Payment not found for refund: ${refundId}`);
      return;
    }

    // Update payment status
    if (payment.status === "completed") {
      payment.status = "refunded";
      payment.failedAt = new Date();
      payment.failedReason = `Refunded via Razorpay: ${refundId}`;
      
      // Update associated order if exists
      await Order.findOneAndUpdate(
        { paymentId: payment._id },
        { paymentStatus: "refunded", status: "refunded" },
        { new: true }
      );

      // Send refund confirmation email
      await sendRefundConfirmationEmail(payment, refundId);
      
      await payment.save();
      console.log(`Payment refunded: ${payment._id}`);
    }
  } catch (error) {
    console.error("Error handling refund created:", error);
  }
}

// Handle payment link paid
async function handlePaymentLinkPaid(paymentData) {
  try {
    const { id: paymentId, entity: paymentEntity } = paymentData;
    const { order_id, status, amount, currency, notes } = paymentEntity || {};

    // Find payment record
    const payment = await Payment.findOne({ razorpayOrderId: order_id });
    
    if (!payment) {
      console.log(`Payment record not found for order: ${order_id}`);
      return;
    }

    // Only process if payment is still pending
    if (payment.status !== "pending") {
      console.log(`Payment already processed: ${payment._id}`);
      return;
    }

    // Update payment status
    payment.razorpayPaymentId = paymentId;
    payment.status = "completed";
    payment.completedAt = new Date();
    payment.paymentMethod = notes?.paymentMethod || "razorpay_payment_link";
    
    // Generate invoice
    payment.invoiceNumber = generateInvoiceNumber();
    
    // Handle based on payment purpose
    await handlePaymentPurposeCompletion(payment, notes);
    
    await payment.save();
    console.log(`Payment link paid: ${payment._id}`);
  } catch (error) {
    console.error("Error handling payment link paid:", error);
  }
}

// Handle product payment
async function handleProductPayment(payment, notes) {
  try {
    const Order = (await import("../../models/Order.js")).default;
    
    const orderItems = (notes?.items || []).map(item => ({
      product: item.product,
      name: item.name,
      image: item.image,
      qty: item.qty,
      unitPrice: item.unitPrice,
      total: item.total,
    }));

    const order = await Order.findOneAndUpdate(
      { paymentId: payment._id },
      {
        buyer: notes?.userId,
        seller: notes?.sellerId,
        items: orderItems,
        totalAmount: payment.amount,
        paymentId: payment._id,
        paymentStatus: "paid",
        status: "confirmed",
        shippingAddress: notes?.shippingAddress || {}
      },
      { new: true, upsert: true }
    );

    console.log(`Order created/updated: ${order?._id}`);
  } catch (error) {
    console.error("Error creating/updating order:", error);
  }
}

// Handle other payment types
async function handleOtherPaymentTypes(payment, notes) {
  try {
    switch (payment.paymentFor) {
      case "subscription":
        await handleSubscriptionPayment(payment, notes);
        break;
      case "listing":
        await handleListingPayment(payment, notes);
        break;
      case "advertisement":
        await handleAdvertisementPayment(payment, notes);
        break;
      default:
        console.log(`Unhandled payment type: ${payment.paymentFor}`);
    }
  } catch (error) {
    console.error("Error handling payment types:", error);
  }
}

// Handle subscription payment
async function handleSubscriptionPayment(payment, notes) {
  try {
    const User = (await import("../../models/User.js")).default;
    const { planId } = notes || {};

    if (planId) {
      const UserSubscription = (await import("../../models/Subscription.js")).default;
      
      // Cancel any existing subscription
      await UserSubscription.updateMany(
        { userId: payment.userId, status: "active" },
        { $set: { status: "cancelled", cancelledAt: new Date() } }
      );

      // Create new subscription
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Default 30 days

      const subscription = await UserSubscription.create({
        userId: payment.userId,
        plan: planId,
        planFor: "buyer",
        status: "active",
        startDate,
        endDate,
        paymentId: payment._id
      });

      console.log(`Subscription created: ${subscription._id}`);
    }
  } catch (error) {
    console.error("Error handling subscription payment:", error);
  }
}

// Handle listing payment
async function handleListingPayment(payment, notes) {
  try {
    const User = (await import("../../models/User.js")).default;
    
    // Add listing quota
    await User.findByIdAndUpdate(
      payment.userId,
      { $inc: { listingQuota: 10 } }
    );

    console.log(`Listing quota added for user: ${payment.userId}`);
  } catch (error) {
    console.error("Error handling listing payment:", error);
  }
}

// Handle advertisement payment
async function handleAdvertisementPayment(payment, notes) {
  try {
    // Create advertisement record (to be implemented)
    console.log(`Advertisement payment processed: ${payment._id}`);
  } catch (error) {
    console.error("Error handling advertisement payment:", error);
  }
}

// Handle payment purpose completion (general handler)
async function handlePaymentPurposeCompletion(payment, notes) {
  switch (payment.paymentFor) {
    case 'product':
      await handleProductPayment(payment, notes);
      break;
    case 'subscription':
      await handleSubscriptionPayment(payment, notes);
      break;
    case 'listing':
      await handleListingPayment(payment, notes);
      break;
    case 'advertisement':
      await handleAdvertisementPayment(payment, notes);
      break;
  }
}

// Send payment confirmation email
async function sendPaymentConfirmationEmail(payment) {
  try {
    const user = await User.findById(payment.userId);

    if (!user) return;

    const subject = `Payment Successful - Invoice ${payment.invoiceNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Payment Successful</h1>
        <p>Hello ${user.name},</p>
        <p>Your payment has been successfully processed.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> ₹${payment.amount.toFixed(2)}</p>
          <p><strong>Currency:</strong> ${payment.currency}</p>
          <p><strong>Payment For:</strong> ${capitalizeFirst(payment.paymentFor)}</p>
          <p><strong>Payment Method:</strong> ${capitalizeFirst(payment.paymentMethod)}</p>
          <p><strong>Payment Status:</strong> <span style="color: green;">${payment.status.toUpperCase()}</span></p>
          <p><strong>Invoice Number:</strong> ${payment.invoiceNumber}</p>
          <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
        </div>
        <p>Thank you for your payment!</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject,
      html
    });
  } catch (error) {
    console.error("Email notification error:", error);
  }
}

// Send refund confirmation email
async function sendRefundConfirmationEmail(payment, refundId) {
  try {
    const user = await User.findById(payment.userId);

    if (!user) return;

    const subject = `Refund Confirmation - Invoice ${payment.invoiceNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Refund Processed</h1>
        <p>Hello ${user.name},</p>
        <p>Your refund request has been processed successfully.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount Refunded:</strong> ₹${payment.amount.toFixed(2)}</p>
          <p><strong>Refund ID:</strong> ${refundId}</p>
          <p><strong>Invoice Number:</strong> ${payment.invoiceNumber}</p>
          <p><strong>Payment Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
          <p><strong>Refund Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>The refund will be processed within 3-5 business days.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject,
      html
    });
  } catch (error) {
    console.error("Refund email error:", error);
  }
}

function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
