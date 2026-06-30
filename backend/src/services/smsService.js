/**
 * SMS Service — MSG91 Production Integration
 *
 * Required .env variables:
 *   MSG91_AUTH_KEY      — Dashboard → API Keys
 *   MSG91_TEMPLATE_ID   — SMS → OTP Templates
 *   MSG91_SENDER_ID     — SMS → Sender IDs (e.g. INDMRT)
 *   MSG91_COUNTRY_CODE  — 91 (default)
 */
import axios from "axios";

const MSG91_OTP_URL = "https://api.msg91.com/api/v5/otp";

// ── Fast2SMS (fallback when MSG91 not configured) ────────────────────────────
async function sendViaFast2SMS(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey || apiKey.startsWith("YOUR_") || apiKey.trim() === "") {
    console.error("[SMS] ❌ No SMS provider configured. Add MSG91 or FAST2SMS_API_KEY to .env");
    return { success: false, code: "NOT_CONFIGURED",
      message: "SMS service not configured. Please add MSG91 or Fast2SMS credentials to .env" };
  }

  try {
    const { data } = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization:    apiKey,
        variables_values: otp,
        route:            "otp",
        numbers:          phone,
      },
      headers: { "cache-control": "no-cache" },
      timeout: 10000,
    });

    if (data?.return === true) {
      console.log(`[Fast2SMS] ✅ OTP sent to +91${phone}`);
      return { success: true };
    }
    console.error("[Fast2SMS] ❌", data);
    return { success: false, code: "FAST2SMS_ERROR", message: data?.message || "Fast2SMS failed" };
  } catch (err) {
    console.error("[Fast2SMS] ❌", err.response?.data || err.message);
    return { success: false, code: "SMS_FAILED", message: err.message };
  }
}

// ── Validate credentials at startup ─────────────────────────────────────────
export function validateMSG91Config() {
  const required = {
    MSG91_AUTH_KEY:    process.env.MSG91_AUTH_KEY,
    MSG91_TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID,
    MSG91_SENDER_ID:   process.env.MSG91_SENDER_ID,
  };

  const missing = Object.entries(required)
    .filter(([, v]) => !v || v.startsWith("YOUR_") || v.trim() === "")
    .map(([k]) => k);

  return { configured: missing.length === 0, missing };
}

// ── Send OTP via MSG91 ────────────────────────────────────────────────────────
export async function sendOTPSMS(phone, otp) {
  const authKey    = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const senderId   = process.env.MSG91_SENDER_ID   || "INDMRT";
  const country    = process.env.MSG91_COUNTRY_CODE || "91";

  // Check MSG91 config
  const { configured } = validateMSG91Config();

  // If MSG91 not configured, try Fast2SMS
  if (!configured) {
    return sendViaFast2SMS(phone, otp);
  }

  const mobile = `${country}${phone}`;
  console.log(`[MSG91] Sending OTP to ${mobile}`);

  try {
    const { data } = await axios.post(
      MSG91_OTP_URL,
      {
        authkey:     authKey,
        template_id: templateId,
        mobile,
        otp,
        sender:      senderId,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    console.log(`[MSG91] Response:`, data);

    if (data?.type === "success") {
      console.log(`[MSG91] ✅ OTP delivered to ${mobile}`);
      return { success: true };
    }

    return {
      success: false,
      code:    "MSG91_REJECTED",
      message: data?.message || "MSG91 rejected the request",
    };

  } catch (err) {
    const status  = err.response?.status;
    const errData = err.response?.data;
    const errMsg  = errData?.message || err.message;

    console.error(`[MSG91] ❌ HTTP ${status}:`, errData || err.message);

    if (status === 401 || errMsg?.toLowerCase().includes("auth")) {
      return { success: false, code: "INVALID_AUTH_KEY",
        message: "Invalid MSG91_AUTH_KEY. Verify at msg91.com → API Keys" };
    }
    if (errMsg?.toLowerCase().includes("template")) {
      return { success: false, code: "INVALID_TEMPLATE",
        message: "Invalid MSG91_TEMPLATE_ID. Check msg91.com → SMS → Templates" };
    }
    if (errMsg?.toLowerCase().includes("sender") || errMsg?.toLowerCase().includes("header")) {
      return { success: false, code: "INVALID_SENDER",
        message: "Invalid MSG91_SENDER_ID. Register at msg91.com → SMS → Sender IDs" };
    }
    if (errMsg?.toLowerCase().includes("balance") || errMsg?.toLowerCase().includes("credit")) {
      return { success: false, code: "LOW_BALANCE",
        message: "MSG91 balance insufficient. Recharge at msg91.com/wallet" };
    }
    if (err.code === "ECONNABORTED" || errMsg?.toLowerCase().includes("timeout")) {
      return { success: false, code: "TIMEOUT",
        message: "MSG91 request timed out. Try again." };
    }
    if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
      return { success: false, code: "NETWORK_ERROR",
        message: "Network error. Cannot reach MSG91. Check internet connection." };
    }

    return { success: false, code: "SMS_FAILED",
      message: `SMS delivery failed: ${errMsg}` };
  }
}

// ── Resend OTP via MSG91 ──────────────────────────────────────────────────────
export async function resendOTPSMS(phone) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const country = process.env.MSG91_COUNTRY_CODE || "91";

  const { configured } = validateMSG91Config();
  if (!configured) return { success: false, code: "NOT_CONFIGURED" };

  const mobile = `${country}${phone}`;
  console.log(`[MSG91] Resending OTP to ${mobile}`);

  try {
    const { data } = await axios.get(
      `https://api.msg91.com/api/v5/otp/retry`,
      {
        params: { authkey: authKey, mobile, retrytype: "text" },
        timeout: 10000,
      }
    );

    if (data?.type === "success") {
      console.log(`[MSG91] ✅ OTP resent to ${mobile}`);
      return { success: true };
    }
    return { success: false, code: "MSG91_REJECTED", message: data?.message };
  } catch (err) {
    console.error("[MSG91] Resend error:", err.message);
    return { success: false, code: "SMS_FAILED", message: err.message };
  }
}
