/**
 * Subscription Expiry Job
 * Runs daily to check and downgrade expired subscriptions
 */

import cron from "node-cron";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

const checkAndDowngradeExpiredSubscriptions = async () => {
  try {
    console.log("[EXPIRY JOB] Starting subscription expiry check...");

    // Find all expired subscriptions that are still marked as active
    const expiredSubscriptions = await Subscription.find({
      status: "active",
      endDate: { $lt: new Date() }
    }).populate("userId").populate("plan");

    if (expiredSubscriptions.length === 0) {
      console.log("[EXPIRY JOB] No expired subscriptions found");
      return;
    }

    console.log(`[EXPIRY JOB] Found ${expiredSubscriptions.length} expired subscriptions`);

    // Process each expired subscription
    for (const subscription of expiredSubscriptions) {
      try {
        const user = subscription.userId;

        // Downgrade to inactive status
        subscription.status = "expired";
        subscription.expiredAt = new Date();
        await subscription.save();

        console.log(`[EXPIRY JOB] Downgraded subscription for user ${user._id}`);

        // Send expiry notification email
        try {
          const planName = subscription.plan?.name || "Premium";
          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
                  .container { max-width: 600px; margin: 20px auto; }
                  .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                  .content { padding: 20px; }
                  .button { display: inline-block; padding: 10px 20px; background: #1a56db; color: white; text-decoration: none; border-radius: 4px; }
                  .footer { color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0; color: #1a56db;">Subscription Expired</h1>
                  </div>
                  <div class="content">
                    <p>Hello ${user.name},</p>
                    <p>Your ${planName} subscription on IndiaMart has expired. You have been downgraded to the <strong>Free Plan</strong>.</p>

                    <h3>What This Means:</h3>
                    <ul>
                      <li>You can now list up to 10 products (down from your plan limit)</li>
                      <li>You still have access to all basic features</li>
                      <li>To regain premium features, upgrade your plan</li>
                    </ul>

                    <p style="margin-top: 30px;">
                      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/seller/billing" class="button">Renew Subscription</a>
                    </p>

                    <p style="margin-top: 20px;">If you have any questions, contact us at support@indiamart.com</p>
                  </div>
                  <div class="footer">
                    <p>© 2025 IndiaMart. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `;

          await sendEmail({
            to: user.email,
            subject: "Your IndiaMart Subscription Has Expired",
            html: emailHtml
          });

          console.log(`[EXPIRY JOB] Sent expiry email to ${user.email}`);
        } catch (emailErr) {
          console.error(`[EXPIRY JOB] Error sending email for user ${user._id}:`, emailErr);
        }
      } catch (err) {
        console.error(`[EXPIRY JOB] Error processing subscription:`, err);
      }
    }

    console.log("[EXPIRY JOB] Subscription expiry check completed");
  } catch (err) {
    console.error("[EXPIRY JOB] Fatal error:", err);
  }
};

// Schedule the job to run daily at 2:00 AM IST (8:30 PM UTC previous day)
const scheduleExpiryJob = () => {
  // 0 2 * * * = 2:00 AM every day
  const job = cron.schedule("0 2 * * *", async () => {
    await checkAndDowngradeExpiredSubscriptions();
  });

  console.log("✓ Subscription expiry job scheduled (runs daily at 2:00 AM)");
  return job;
};

// Manual endpoint to trigger the job (for testing)
const triggerExpiryCheckManually = async (req, res) => {
  try {
    await checkAndDowngradeExpiredSubscriptions();
    res.json({ message: "Expiry check completed", timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { scheduleExpiryJob, checkAndDowngradeExpiredSubscriptions, triggerExpiryCheckManually };
