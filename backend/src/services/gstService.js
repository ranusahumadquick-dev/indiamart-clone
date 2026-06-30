/**
 * GST Verification Service
 *
 * Verifies a GSTIN against the Masters India API.
 * Returns raw verified data; all business-rule checks (age, turnover) are
 * enforced in the controller so they can also query the database.
 *
 * .env variables:
 *   MASTERS_INDIA_TOKEN         — bearer token (preferred)
 *   MASTERS_INDIA_CLIENT_ID     — client ID  (used to auto-fetch token)
 *   MASTERS_INDIA_CLIENT_SECRET — client secret
 */

import axios from "axios";

// ─── Constants ────────────────────────────────────────────────────────────────

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const STATE_CODES = {
  "01": "Jammu & Kashmir",      "02": "Himachal Pradesh",   "03": "Punjab",
  "04": "Chandigarh",           "05": "Uttarakhand",        "06": "Haryana",
  "07": "Delhi",                "08": "Rajasthan",          "09": "Uttar Pradesh",
  "10": "Bihar",                "11": "Sikkim",             "12": "Arunachal Pradesh",
  "13": "Nagaland",             "14": "Manipur",            "15": "Mizoram",
  "16": "Tripura",              "17": "Meghalaya",          "18": "Assam",
  "19": "West Bengal",          "20": "Jharkhand",          "21": "Odisha",
  "22": "Chhattisgarh",         "23": "Madhya Pradesh",     "24": "Gujarat",
  "26": "Dadra & Nagar Haveli", "27": "Maharashtra",        "28": "Andhra Pradesh",
  "29": "Karnataka",            "30": "Goa",                "31": "Lakshadweep",
  "32": "Kerala",               "33": "Tamil Nadu",         "34": "Puducherry",
  "35": "Andaman & Nicobar",    "36": "Telangana",          "37": "Andhra Pradesh (New)",
};

// ─── Error codes ──────────────────────────────────────────────────────────────
// Exported so the controller and frontend can handle each reason distinctly.
export const GST_ERROR = {
  INVALID_FORMAT:       "INVALID_FORMAT",
  NOT_FOUND:            "NOT_FOUND",
  INACTIVE:             "INACTIVE",
  TOO_NEW:              "TOO_NEW",
  TURNOVER_LOW:         "TURNOVER_LOW",
  TURNOVER_UNVERIFIABLE:"TURNOVER_UNVERIFIABLE", // no trusted source has turnover data
  API_UNAVAILABLE:      "API_UNAVAILABLE",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseGSTDate(dateStr) {
  if (!dateStr) return null;
  // "DD/MM/YYYY"
  if (dateStr.includes("/")) {
    const [d, m, y] = dateStr.split("/");
    return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
  }
  // "YYYY-MM-DD" or ISO
  return new Date(dateStr);
}

export function calcAgeMonths(date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 30));
}

export function calcAgeYears(date) {
  return parseFloat(((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 365)).toFixed(1));
}

// ─── Masters India GST API ────────────────────────────────────────────────────

async function fetchFromMastersIndia(gstin) {
  const token    = process.env.MASTERS_INDIA_TOKEN;
  const clientId = process.env.MASTERS_INDIA_CLIENT_ID;
  const secret   = process.env.MASTERS_INDIA_CLIENT_SECRET;

  if (!token && !(clientId && secret)) {
    return { success: false, code: GST_ERROR.API_UNAVAILABLE, reason: "MASTERS_INDIA credentials not set in .env" };
  }

  // Auto-fetch bearer token when only client credentials are provided
  let bearerToken = token;
  if (!token && clientId && secret) {
    try {
      const authRes = await axios.post(
        "https://api.mastersindia.co/o/token/",
        `client_id=${clientId}&client_secret=${secret}&grant_type=client_credentials`,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 8000 }
      );
      bearerToken = authRes.data.access_token;
    } catch (e) {
      return { success: false, code: GST_ERROR.API_UNAVAILABLE, reason: "Masters India auth failed: " + e.message };
    }
  }

  try {
    const { data } = await axios.get(
      `https://api.mastersindia.co/api/v1/gstin/${gstin}`,
      { headers: { Authorization: `Bearer ${bearerToken}` }, timeout: 10000 }
    );

    if (!data || data.error) {
      return { success: false, code: GST_ERROR.NOT_FOUND, reason: data?.error || "GST number not found" };
    }

    return {
      success:          true,
      businessName:     data.lgnm     || data.trade_name || "",
      tradeName:        data.tradeNam || "",
      status:           data.sts      || "Unknown",
      registrationDate: parseGSTDate(data.rgdt || data.registration_date),
      stateCode:        data.gstin?.substring(0, 2) || gstin.substring(0, 2),
      state:            data.stj?.split(" - ")[0]   || "",
      businessType:     data.ctb      || "",
      // Some GST APIs return turnover; most free tiers do not. null = not provided.
      apiTurnover:      data.totrev   ?? data.turnover ?? null,
      raw:              data,
    };
  } catch (err) {
    if (err.response?.status === 404) {
      return { success: false, code: GST_ERROR.NOT_FOUND, reason: "GST number not found" };
    }
    return {
      success: false,
      code:    GST_ERROR.API_UNAVAILABLE,
      reason:  err.response?.data?.message || err.message,
    };
  }
}

// ─── Placeholder: external turnover API ──────────────────────────────────────
/**
 * Fetch turnover from a third-party external API (MCA21, TaxPro, etc.).
 * Return a number in rupees, or null if the source has no data.
 *
 * This is intentionally separate from the database lookup (which lives in the
 * controller so it can access Mongoose models without coupling the service to
 * the ORM layer).
 */
export async function fetchTurnoverFromExternalAPI(gstin) {
  // TODO: wire up an external provider here when one is available.
  // Example:
  //   const res = await axios.get(`https://api.taxpro.in/turnover/${gstin}`,
  //     { headers: { "x-api-key": process.env.TAXPRO_KEY }, timeout: 8000 });
  //   return typeof res.data.turnover === "number" ? res.data.turnover : null;
  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * Verifies format, existence, and active status via the GST API.
 * Age and turnover checks are NOT performed here — they are the
 * controller's responsibility (turnover may require a DB lookup).
 *
 * Returns:
 *   { ok: false, errorCode, error }  — hard failure (stop here)
 *   { ok: true, apiUsed, ... }       — proceed to controller checks
 */
export async function verifyGSTIN(gstin) {
  const cleaned = gstin.trim().toUpperCase();

  // 1. Format check
  if (cleaned.length !== 15) {
    return { ok: false, errorCode: GST_ERROR.INVALID_FORMAT, error: "GSTIN must be exactly 15 characters" };
  }
  if (!GST_REGEX.test(cleaned)) {
    return { ok: false, errorCode: GST_ERROR.INVALID_FORMAT, error: "Invalid GSTIN format. Example: 27ABCDE1234F1Z5" };
  }

  // 2. GST API call
  const api = await fetchFromMastersIndia(cleaned);

  // API not configured — caller must supply registration date; turnover must come from DB
  if (!api.success && api.code === GST_ERROR.API_UNAVAILABLE) {
    console.warn("[GST] API unavailable:", api.reason);
    const stateCode = cleaned.substring(0, 2);
    return {
      ok:               true,
      apiUsed:          "format-only",
      gstin:            cleaned,
      businessName:     "",
      tradeName:        "",
      status:           null,
      registrationDate: null,   // controller must require manual date
      stateCode,
      state:            STATE_CODES[stateCode] || "",
      businessType:     "",
      apiTurnover:      null,   // no turnover from API — controller checks DB
    };
  }

  // API returned an error (not found, etc.)
  if (!api.success) {
    return { ok: false, errorCode: api.code || GST_ERROR.NOT_FOUND, error: api.reason };
  }

  // 3. Active status check
  const statusLower = (api.status || "").toLowerCase();
  if (statusLower && statusLower !== "active") {
    return {
      ok:        false,
      errorCode: GST_ERROR.INACTIVE,
      error:     `GST registration is ${api.status}. Only Active GST registrations are accepted.`,
    };
  }

  const stateCode = cleaned.substring(0, 2);
  return {
    ok:               true,
    apiUsed:          "masters-india",
    gstin:            cleaned,
    businessName:     api.businessName,
    tradeName:        api.tradeName,
    status:           api.status,
    registrationDate: api.registrationDate,   // Date object or null
    stateCode,
    state:            STATE_CODES[stateCode]  || api.state || "",
    businessType:     api.businessType,
    apiTurnover:      api.apiTurnover,        // number or null
  };
}
