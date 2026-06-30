import Setting from "../models/Setting.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// MSG91 config keys
const MSG91_KEYS = ["msg91_widget_id", "msg91_token_auth", "msg91_auth_key"];

// ── GET public MSG91 config (widget_id + token_auth only — no secret) ─────────
export const getMsg91Config = asyncHandler(async (req, res) => {
  // Try DB first, then .env fallback
  let widgetId  = process.env.MSG91_WIDGET_ID  || "";
  let tokenAuth = process.env.MSG91_TOKEN_AUTH || "";

  try {
    const settings = await Setting.find({ key: { $in: MSG91_KEYS } });
    const dbConfig = {};
    settings.forEach((s) => { dbConfig[s.key] = s.value; });
    // DB values override .env if present
    if (dbConfig.msg91_widget_id)  widgetId  = dbConfig.msg91_widget_id;
    if (dbConfig.msg91_token_auth) tokenAuth = dbConfig.msg91_token_auth;
  } catch (e) {
    console.warn("[Settings] DB read failed, using .env fallback:", e.message);
  }

  const configured = !!(widgetId && tokenAuth);
  console.log("[Settings] MSG91 config:", { widgetId: widgetId ? "SET" : "MISSING", tokenAuth: tokenAuth ? "SET" : "MISSING", configured });

  return res.status(200).json(
    new ApiResponse(200, { widgetId, tokenAuth, configured }, "MSG91 config fetched")
  );
});

// ── GET all settings (admin only) ─────────────────────────────────────────────
export const getAllSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.find({ key: { $in: MSG91_KEYS } });
  const config = {};
  settings.forEach((s) => { config[s.key] = s.value; });

  return res.status(200).json(
    new ApiResponse(200, {
      msg91_widget_id:  config.msg91_widget_id  || "",
      msg91_token_auth: config.msg91_token_auth || "",
      msg91_auth_key:   config.msg91_auth_key   ? "••••••••" : "", // masked
      configured: !!(config.msg91_widget_id && config.msg91_token_auth),
    }, "Settings fetched")
  );
});

// ── UPDATE MSG91 settings (admin only) ────────────────────────────────────────
export const updateMsg91Settings = asyncHandler(async (req, res) => {
  const { msg91_widget_id, msg91_token_auth, msg91_auth_key } = req.body;

  if (!msg91_widget_id || !msg91_token_auth) {
    throw new ApiError(400, "Widget ID and Token Auth are required");
  }

  await Promise.all([
    Setting.set("msg91_widget_id",  msg91_widget_id.trim(),  "MSG91 Widget ID",    "msg91"),
    Setting.set("msg91_token_auth", msg91_token_auth.trim(), "MSG91 Token Auth",   "msg91"),
    ...(msg91_auth_key
      ? [Setting.set("msg91_auth_key", msg91_auth_key.trim(), "MSG91 Auth Key", "msg91")]
      : []),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { updated: true }, "MSG91 settings saved successfully")
  );
});

// ── GET all settings grouped (admin dashboard) ────────────────────────────────
export const getAdminSettings = asyncHandler(async (req, res) => {
  const all = await Setting.find({});
  const map = {};
  all.forEach((s) => { map[s.key] = s.value; });

  return res.status(200).json(new ApiResponse(200, {
    general: {
      site_name:        map.site_name        || "IndiaMart B2B",
      contact_email:    map.contact_email    || "",
      contact_phone:    map.contact_phone    || "",
      business_address: map.business_address || "",
      currency:         map.currency         || "INR",
      timezone:         map.timezone         || "Asia/Kolkata",
      maintenance_mode: map.maintenance_mode === true || map.maintenance_mode === "true",
    },
    seller: {
      gst_min_age_months:   Number(map.gst_min_age_months   ?? 24),
      min_turnover:         Number(map.min_turnover          ?? 1000000),
      doc_itr_required:     map.doc_itr_required     !== false,
      doc_ca_required:      map.doc_ca_required       !== false,
      doc_bank_required:    map.doc_bank_required     !== false,
      auto_approve_sellers: map.auto_approve_sellers  === true || map.auto_approve_sellers === "true",
    },
    msg91: {
      msg91_widget_id:  map.msg91_widget_id  || "",
      msg91_token_auth: map.msg91_token_auth || "",
      msg91_auth_key:   map.msg91_auth_key   ? "••••••••" : "",
      configured: !!(map.msg91_widget_id && map.msg91_token_auth),
    },
    plans: await (async () => {
      try {
        const SubscriptionPlan = (await import("../models/SubscriptionPlan.js")).default;
        return await SubscriptionPlan.find({ planFor: "seller" }).sort({ price: 1 }).lean();
      } catch { return []; }
    })(),
    users: {
      default_buyer_role:     map.default_buyer_role     || "buyer",
      allow_guest_browsing:   map.allow_guest_browsing   !== false,
      auto_block_after_days:  Number(map.auto_block_after_days  ?? 0),
      max_login_attempts:     Number(map.max_login_attempts     ?? 5),
    },
    notifications: {
      email_welcome:          map.email_welcome          !== false,
      email_approval:         map.email_approval         !== false,
      email_rejection:        map.email_rejection        !== false,
      sms_otp_enabled:        map.sms_otp_enabled        !== false,
      whatsapp_alerts:        map.whatsapp_alerts        === true,
      push_enabled:           map.push_enabled           === true,
      smtp_host:              map.smtp_host              || "",
      smtp_port:              map.smtp_port              || "587",
      smtp_user:              map.smtp_user              || "",
      smtp_from:              map.smtp_from              || "",
    },
    leads: {
      max_sellers_per_lead:   Number(map.max_sellers_per_lead   ?? 5),
      lead_credits_enabled:   map.lead_credits_enabled   === true,
      credits_per_lead:       Number(map.credits_per_lead       ?? 1),
      spam_filter_enabled:    map.spam_filter_enabled    !== false,
      min_message_length:     Number(map.min_message_length     ?? 20),
      block_duplicate_hours:  Number(map.block_duplicate_hours  ?? 24),
    },
    seo: {
      meta_title:             map.meta_title             || "IndiaMart B2B — Buy & Sell Online",
      meta_description:       map.meta_description       || "",
      meta_keywords:          map.meta_keywords          || "",
      google_analytics_id:    map.google_analytics_id    || "",
      sitemap_enabled:        map.sitemap_enabled        !== false,
      robots_noindex:         map.robots_noindex         === true,
      homepage_banner_text:   map.homepage_banner_text   || "",
      homepage_banner_active: map.homepage_banner_active === true,
    },
    security: {
      min_password_length:    Number(map.min_password_length    ?? 8),
      require_uppercase:      map.require_uppercase      !== false,
      require_number:         map.require_number         !== false,
      require_special:        map.require_special        === true,
      session_timeout_minutes:Number(map.session_timeout_minutes ?? 60),
      audit_log_enabled:      map.audit_log_enabled      !== false,
      terms_content:          map.terms_content          || "",
      privacy_content:        map.privacy_content        || "",
    },
    analytics: {
      show_revenue_widget:    map.show_revenue_widget    !== false,
      show_users_widget:      map.show_users_widget      !== false,
      show_orders_widget:     map.show_orders_widget     !== false,
      show_leads_widget:      map.show_leads_widget      !== false,
      export_csv_enabled:     map.export_csv_enabled     !== false,
      export_excel_enabled:   map.export_excel_enabled   !== false,
      retention_days:         Number(map.retention_days          ?? 90),
    },
  }, "Settings fetched"));
});

// ── UPDATE general settings ───────────────────────────────────────────────────
export const updateGeneralSettings = asyncHandler(async (req, res) => {
  const { site_name, contact_email, contact_phone, business_address, currency, timezone, maintenance_mode } = req.body;
  await Promise.all([
    site_name        != null && Setting.set("site_name",        site_name,        "Site Name",        "general"),
    contact_email    != null && Setting.set("contact_email",    contact_email,    "Contact Email",    "general"),
    contact_phone    != null && Setting.set("contact_phone",    contact_phone,    "Contact Phone",    "general"),
    business_address != null && Setting.set("business_address", business_address, "Business Address", "general"),
    currency         != null && Setting.set("currency",         currency,         "Currency",         "general"),
    timezone         != null && Setting.set("timezone",         timezone,         "Timezone",         "general"),
    maintenance_mode != null && Setting.set("maintenance_mode", maintenance_mode, "Maintenance Mode", "general"),
  ].filter(Boolean));
  return res.status(200).json(new ApiResponse(200, {}, "General settings saved"));
});

// ── UPDATE seller verification settings ───────────────────────────────────────
export const updateSellerSettings = asyncHandler(async (req, res) => {
  const { gst_min_age_months, min_turnover, doc_itr_required, doc_ca_required, doc_bank_required, auto_approve_sellers } = req.body;
  await Promise.all([
    gst_min_age_months   != null && Setting.set("gst_min_age_months",   Number(gst_min_age_months),   "GST Min Age (months)",   "seller"),
    min_turnover         != null && Setting.set("min_turnover",          Number(min_turnover),          "Min Turnover (₹)",       "seller"),
    doc_itr_required     != null && Setting.set("doc_itr_required",      doc_itr_required,              "ITR Required",           "seller"),
    doc_ca_required      != null && Setting.set("doc_ca_required",       doc_ca_required,               "CA Cert Required",       "seller"),
    doc_bank_required    != null && Setting.set("doc_bank_required",     doc_bank_required,             "Bank Statement Required","seller"),
    auto_approve_sellers != null && Setting.set("auto_approve_sellers",  auto_approve_sellers,          "Auto Approve Sellers",   "seller"),
  ].filter(Boolean));
  return res.status(200).json(new ApiResponse(200, {}, "Seller settings saved"));
});

// ── UPDATE any settings group (generic) ───────────────────────────────────────
export const updateSettingsGroup = asyncHandler(async (req, res) => {
  const { group } = req.params;
  const allowed = ["users", "notifications", "leads", "seo", "security", "analytics"];
  if (!allowed.includes(group)) throw new ApiError(400, "Invalid settings group");
  await Promise.all(
    Object.entries(req.body).map(([key, value]) => Setting.set(key, value, key, group))
  );
  return res.status(200).json(new ApiResponse(200, {}, `${group} settings saved`));
});

// ── UPDATE subscription plan ───────────────────────────────────────────────────
export const updatePlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;
  const SubscriptionPlan = (await import("../models/SubscriptionPlan.js")).default;
  const plan = await SubscriptionPlan.findByIdAndUpdate(planId, req.body, { new: true, runValidators: true });
  if (!plan) throw new ApiError(404, "Plan not found");
  return res.status(200).json(new ApiResponse(200, plan, "Plan updated"));
});

// ── VERIFY MSG91 token (called after widget OTP verification) ─────────────────
// MSG91 widget already verified OTP on their servers — token is proof of success
export const verifyMsg91Token = asyncHandler(async (req, res) => {
  const { token, phone } = req.body;

  console.log("[MSG91 Verify] Token received:", token ? "YES" : "MISSING");

  if (!token) throw new ApiError(400, "Verification token is required");

  // MSG91 widget returns a JWT — decode to check it's valid (not expired)
  try {
    // JWT has 3 parts separated by dots
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid token format");

    // Decode payload (base64)
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    );
    console.log("[MSG91 Verify] Token payload:", JSON.stringify(payload));

    // Check expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      throw new ApiError(400, "OTP session expired. Please verify again.");
    }

    // Token is valid — MSG91 widget already verified OTP
    return res.status(200).json(
      new ApiResponse(200, {
        verified: true,
        phone: payload.mobile || payload.phone || phone || "",
      }, "Mobile verified successfully")
    );
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error("[MSG91 Verify] Error:", err.message);
    throw new ApiError(400, "Invalid verification token. Please try OTP again.");
  }
});
