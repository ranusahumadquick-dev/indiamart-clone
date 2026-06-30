/**
 * Email Service — Nodemailer + Gmail SMTP
 * Sends OTP emails for verification
 */
import nodemailer from "nodemailer";

let transporter = null;

// ── Create transporter (lazy init) ───────────────────────────────────────────
function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass || user.includes("YOUR_") || pass.includes("YOUR_")) {
    console.warn("[Email] ⚠️  Gmail credentials not configured in .env");
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  console.log("[Email] ✅ Gmail transporter ready for:", user);
  return transporter;
}

// ── Send OTP Email ────────────────────────────────────────────────────────────
export async function sendOTPEmail(email, otp) {
  const isDev = process.env.NODE_ENV !== "production";
  const t     = getTransporter();

  // Dev mode — no Gmail configured
  if (!t) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  📧 DEV MODE EMAIL OTP`);
    console.log(`  To: ${email}`);
    console.log(`  OTP: ${otp}`);
    console.log("  ⚠️  Set GMAIL_USER + GMAIL_APP_PASSWORD in .env");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return { sent: false, dev: true };
  }

  const fromName    = process.env.EMAIL_FROM_NAME || "IndiaMart";
  const fromAddress = process.env.GMAIL_USER;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0052cc,#1a75ff);padding:32px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 16px;margin-bottom:12px;">
              <span style="color:#fff;font-weight:900;font-size:22px;letter-spacing:1px;">IndiaMart</span>
            </div>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px;">B2B Marketplace</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h2 style="color:#1a1a2e;font-size:22px;margin:0 0 8px;">Verify Your Email</h2>
            <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 28px;">
              Use the OTP below to verify your email address. This code expires in <strong>5 minutes</strong>.
            </p>

            <!-- OTP Box -->
            <div style="background:#f0f4ff;border:2px dashed #0052cc;border-radius:12px;padding:24px;text-align:center;margin:0 0 28px;">
              <p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Your OTP</p>
              <p style="color:#0052cc;font-size:40px;font-weight:900;letter-spacing:12px;margin:0;font-family:monospace;">${otp}</p>
            </div>

            <div style="background:#fff8ed;border-left:4px solid #f59e0b;border-radius:4px;padding:12px 16px;margin:0 0 24px;">
              <p style="color:#92400e;font-size:13px;margin:0;">
                🔒 <strong>Never share this OTP</strong> with anyone. IndiaMart will never ask for your OTP.
              </p>
            </div>

            <p style="color:#94a3b8;font-size:12px;margin:0;">
              If you didn't request this OTP, please ignore this email. Your account is safe.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="color:#94a3b8;font-size:11px;margin:0;">
              © ${new Date().getFullYear()} IndiaMart B2B Marketplace · India's Largest B2B Platform
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const info = await t.sendMail({
      from:    `"${fromName}" <${fromAddress}>`,
      to:      email,
      subject: `${otp} is your IndiaMart verification code`,
      html,
      text: `Your IndiaMart OTP is: ${otp}\nValid for 5 minutes.\nDo not share with anyone.`,
    });

    console.log(`[Email] ✅ OTP email sent to ${email} — MessageId: ${info.messageId}`);
    return { sent: true, dev: false };

  } catch (err) {
    console.error("[Email] ❌ Send failed:", err.message);
    return { sent: false, dev: false, error: err.message };
  }
}
