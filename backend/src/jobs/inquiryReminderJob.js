import cron from 'node-cron';
import Inquiry from '../models/Inquiry.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';
import { createNotification } from '../controllers/notificationController.js';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

async function sendFollowUpReminders() {
  try {
    console.log('⏰ Starting inquiry follow-up reminder job...');

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - THREE_DAYS_MS);
    const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS);

    // Find unanswered inquiries older than 3 days
    const oldInquiries = await Inquiry.find({
      status: { $in: ['new', 'read'] },
      createdAt: { $lt: threeDaysAgo },
      $or: [
        { lastReminderSentAt: null },
        { lastReminderSentAt: { $lt: sevenDaysAgo } },
      ],
    })
      .populate('seller', 'name email companyName notificationPreferences')
      .populate('buyer', 'name')
      .populate('product', 'name');

    if (oldInquiries.length === 0) {
      console.log('✅ No inquiries requiring reminders at this time');
      return;
    }

    console.log(`📧 Found ${oldInquiries.length} inquiries needing reminders`);

    for (const inquiry of oldInquiries) {
      try {
        const seller = inquiry.seller;
        const buyer = inquiry.buyer;
        const product = inquiry.product;

        if (!seller || !seller.email) {
          console.warn(`⚠️ Skipping inquiry ${inquiry._id}: no seller email`);
          continue;
        }

        // Check seller notification preferences
        const prefs = seller.notificationPreferences;
        const shouldSendEmail = prefs?.reminderNotifications !== false && prefs?.channels?.email !== false;

        if (shouldSendEmail) {
          // Send email to seller
          const html = `
            <p>Hi ${seller.name || 'Seller'},</p>
            <p><strong>⏰ Reminder: You have an unanswered inquiry</strong></p>
            <p>You received an inquiry <strong>${Math.round((now - inquiry.createdAt) / (24 * 60 * 60 * 1000))} days ago</strong> that hasn't been answered yet.</p>
            <p>
              <strong>Inquiry Details:</strong><br/>
              From: ${buyer.name}<br/>
              Product: ${product.name}<br/>
              Message: "${inquiry.message.substring(0, 100)}${inquiry.message.length > 100 ? '...' : ''}"
            </p>
            <p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/seller/inbox" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
                Reply to Inquiry →
              </a>
            </p>
            <p style="color:#999;font-size:12px;">Responding quickly helps build trust and increases your chances of closing a sale.</p>
          `;

          await sendEmail({
            to: seller.email,
            subject: `⏰ Reminder: Unanswered inquiry from ${buyer.name}`,
            html,
          });
        }

        // Create in-app notification
        await createNotification({
          userId: seller._id,
          type: 'inquiry_reminder',
          title: 'Unanswered inquiry reminder',
          message: `${buyer.name} is waiting for your response about ${product.name}`,
          link: `/seller/inbox`,
        });

        // Update reminder timestamp
        inquiry.lastReminderSentAt = now;
        await inquiry.save();

        console.log(`✅ Reminder sent for inquiry ${inquiry._id}`);
      } catch (err) {
        console.error(`❌ Failed to process reminder for inquiry ${inquiry._id}:`, err.message);
      }
    }

    console.log('✅ Follow-up reminder job completed');
  } catch (err) {
    console.error('❌ Error in follow-up reminder job:', err);
  }
}

export function initializeReminderJob() {
  // Run every 6 hours: 0 0,6,12,18 * * *
  cron.schedule('0 0,6,12,18 * * *', sendFollowUpReminders);
  console.log('✅ Inquiry reminder job scheduled (every 6 hours)');
}

export { sendFollowUpReminders };
