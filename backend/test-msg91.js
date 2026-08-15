/**
 * MSG91 OTP Test Script
 * Run: node test-msg91.js
 *
 * Apna phone number aur keys yahan daalo (sirf testing ke liye)
 * Production mein .env use karo
 */

import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

// ── Config from .env ──────────────────────────────────────────────────────────
const AUTH_KEY    = process.env.MSG91_AUTH_KEY;
const TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;
const SENDER_ID   = process.env.MSG91_SENDER_ID || "INDMRT";

// !! APNA PHONE NUMBER YAHAN DAALO (testing ke liye) !!
const TEST_PHONE = "9174909424"; // <-- apna 10-digit number

const TEST_OTP   = "123456";

// ─────────────────────────────────────────────────────────────────────────────

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("   MSG91 OTP Integration Test");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// 1. Check config
console.log("📋 Config Check:");
console.log("  AUTH_KEY present:    ", !!AUTH_KEY && !AUTH_KEY.startsWith("YOUR_") ? "✅ YES" : "❌ NO — set MSG91_AUTH_KEY in .env");
console.log("  TEMPLATE_ID present: ", !!TEMPLATE_ID && !TEMPLATE_ID.startsWith("YOUR_") ? "✅ YES" : "❌ NO — set MSG91_TEMPLATE_ID in .env");
console.log("  SENDER_ID:          ", SENDER_ID);
console.log("  Test phone:         ", `+91${TEST_PHONE}`);
console.log("");

if (!AUTH_KEY || AUTH_KEY.startsWith("YOUR_")) {
  console.error("❌ MSG91_AUTH_KEY not set in .env");
  console.error("   Go to: https://msg91.com → Dashboard → API Keys");
  process.exit(1);
}

if (!TEMPLATE_ID || TEMPLATE_ID.startsWith("YOUR_")) {
  console.error("❌ MSG91_TEMPLATE_ID not set in .env");
  console.error("   Go to: https://msg91.com → SMS → Templates → Create OTP Template");
  process.exit(1);
}

// 2. Send test OTP
console.log("📤 Sending test OTP via MSG91...");
console.log("   Payload:", {
  authkey:     AUTH_KEY.substring(0, 6) + "***",
  template_id: TEMPLATE_ID,
  mobile:      `91${TEST_PHONE}`,
  otp:         TEST_OTP,
  sender:      SENDER_ID,
});
console.log("");

try {
  const { data } = await axios.post(
    "https://api.msg91.com/api/v5/otp",
    {
      authkey:     AUTH_KEY,
      template_id: TEMPLATE_ID,
      mobile:      `91${TEST_PHONE}`,
      otp:         TEST_OTP,
      sender:      SENDER_ID,
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    }
  );

  console.log("📨 MSG91 Response:");
  console.log("  ", JSON.stringify(data, null, 2));
  console.log("");

  if (data?.type === "success") {
    console.log("✅ SUCCESS! OTP sent to +91" + TEST_PHONE);
    console.log("   Check your phone for OTP:", TEST_OTP);
  } else {
    console.error("❌ FAILED:", data?.message || "Unknown error");
    showTroubleshooting(data);
  }

} catch (err) {
  console.error("❌ Request Error:");
  console.error("  Status:", err.response?.status);
  console.error("  Data:  ", JSON.stringify(err.response?.data, null, 2));
  console.error("  Msg:   ", err.message);
  showTroubleshooting(err.response?.data);
}

function showTroubleshooting(data) {
  console.log("\n📚 Troubleshooting:");
  const msg = JSON.stringify(data || {}).toLowerCase();

  if (msg.includes("auth") || msg.includes("key") || msg.includes("invalid")) {
    console.log("  → AUTH_KEY galat hai — MSG91 Dashboard se sahi key copy karo");
    console.log("    https://msg91.com/control-panel/api-key");
  } else if (msg.includes("template") || msg.includes("dlt")) {
    console.log("  → Template approved nahi hai");
    console.log("    MSG91 Dashboard → SMS → Templates → status check karo");
    console.log("    DLT registration required for Indian SMS");
  } else if (msg.includes("sender") || msg.includes("header")) {
    console.log("  → Sender ID (header) MSG91 mein registered nahi");
    console.log("    MSG91 → SMS → Sender IDs mein add karo");
  } else if (msg.includes("balance") || msg.includes("credit")) {
    console.log("  → Account mein credits nahi — recharge karo");
    console.log("    https://msg91.com/wallet");
  } else {
    console.log("  → MSG91 Dashboard check karo: https://msg91.com");
    console.log("  → Support: https://msg91.com/contact");
  }
}
