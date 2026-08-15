"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface GeneralSettings { site_name: string; contact_email: string; contact_phone: string; business_address: string; currency: string; timezone: string; maintenance_mode: boolean; }
interface SellerSettings  { gst_min_age_months: number; min_turnover: number; doc_itr_required: boolean; doc_ca_required: boolean; doc_bank_required: boolean; auto_approve_sellers: boolean; }
interface Msg91Settings   { msg91_widget_id: string; msg91_token_auth: string; msg91_auth_key: string; configured: boolean; }
interface UsersSettings   { default_buyer_role: string; allow_guest_browsing: boolean; auto_block_after_days: number; max_login_attempts: number; }
interface NotifSettings   { email_welcome: boolean; email_approval: boolean; email_rejection: boolean; sms_otp_enabled: boolean; whatsapp_alerts: boolean; push_enabled: boolean; smtp_host: string; smtp_port: string; smtp_user: string; smtp_from: string; }
interface LeadsSettings   { max_sellers_per_lead: number; lead_credits_enabled: boolean; credits_per_lead: number; spam_filter_enabled: boolean; min_message_length: number; block_duplicate_hours: number; }
interface SeoSettings     { meta_title: string; meta_description: string; meta_keywords: string; google_analytics_id: string; sitemap_enabled: boolean; robots_noindex: boolean; homepage_banner_text: string; homepage_banner_active: boolean; }
interface SecuritySettings{ min_password_length: number; require_uppercase: boolean; require_number: boolean; require_special: boolean; session_timeout_minutes: number; audit_log_enabled: boolean; terms_content: string; privacy_content: string; }
interface AnalyticsSettings{ show_revenue_widget: boolean; show_users_widget: boolean; show_orders_widget: boolean; show_leads_widget: boolean; export_csv_enabled: boolean; export_excel_enabled: boolean; retention_days: number; }
interface Plan { _id: string; name: string; price: number; duration: number; description?: string; limits?: { products?: number; leads?: number; [key: string]: number | undefined; }; }

// ─── Reusable UI ──────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-gray-50">
        <span className="text-xl">{icon}</span>
        <h2 className="font-black text-gray-700 text-sm uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1">
        {label}{hint && <span className="ml-2 text-xs text-gray-400 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", mono }: { value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean; }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none transition ${mono ? "font-mono" : ""}`} />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none transition resize-none" />
  );
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string; }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-blue-600" : "bg-gray-300"}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-7" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function SaveBtn({ saving, onClick, label = "Save Changes" }: { saving: boolean; onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition flex items-center gap-2">
      {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <>✅ {label}</>}
    </button>
  );
}

function InfoBox({ type, children }: { type: "warning" | "info" | "success"; children: React.ReactNode }) {
  const s = { warning: "bg-orange-50 border-orange-200 text-orange-700", info: "bg-blue-50 border-blue-100 text-blue-700", success: "bg-green-50 border-green-200 text-green-700" }[type];
  return <div className={`${s} border rounded-xl p-4 text-sm`}>{children}</div>;
}

// ─── Tabs definition ──────────────────────────────────────────────────────────
const TABS = [
  { id: "general",       label: "General",           icon: "🌐" },
  { id: "seller",        label: "Seller Rules",       icon: "🛡️" },
  { id: "plans",         label: "Plans & Billing",    icon: "💳" },
  { id: "users",         label: "Users & Roles",      icon: "👥" },
  { id: "notifications", label: "Notifications",      icon: "🔔" },
  { id: "leads",         label: "Leads & Inquiries",  icon: "📩" },
  { id: "seo",           label: "SEO & Content",      icon: "🔍" },
  { id: "security",      label: "Security",           icon: "🔐" },
  { id: "analytics",     label: "Analytics",          icon: "📊" },
  { id: "otp",           label: "OTP / MSG91",        icon: "📱" },
];

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("general");

  // ── State ────────────────────────────────────────────────────────────────
  const [general,   setGeneral]   = useState<GeneralSettings>({ site_name: "IndiaMart B2B", contact_email: "", contact_phone: "", business_address: "", currency: "INR", timezone: "Asia/Kolkata", maintenance_mode: false });
  const [seller,    setSeller]    = useState<SellerSettings>({ gst_min_age_months: 24, min_turnover: 1000000, doc_itr_required: true, doc_ca_required: true, doc_bank_required: true, auto_approve_sellers: false });
  const [msg91,     setMsg91]     = useState<Msg91Settings>({ msg91_widget_id: "", msg91_token_auth: "", msg91_auth_key: "", configured: false });
  const [users,     setUsers]     = useState<UsersSettings>({ default_buyer_role: "buyer", allow_guest_browsing: true, auto_block_after_days: 0, max_login_attempts: 5 });
  const [notif,     setNotif]     = useState<NotifSettings>({ email_welcome: true, email_approval: true, email_rejection: true, sms_otp_enabled: true, whatsapp_alerts: false, push_enabled: false, smtp_host: "", smtp_port: "587", smtp_user: "", smtp_from: "" });
  const [leads,     setLeads]     = useState<LeadsSettings>({ max_sellers_per_lead: 5, lead_credits_enabled: false, credits_per_lead: 1, spam_filter_enabled: true, min_message_length: 20, block_duplicate_hours: 24 });
  const [seo,       setSeo]       = useState<SeoSettings>({ meta_title: "IndiaMart B2B — Buy & Sell Online", meta_description: "", meta_keywords: "", google_analytics_id: "", sitemap_enabled: true, robots_noindex: false, homepage_banner_text: "", homepage_banner_active: false });
  const [security,  setSecurity]  = useState<SecuritySettings>({ min_password_length: 8, require_uppercase: true, require_number: true, require_special: false, session_timeout_minutes: 60, audit_log_enabled: true, terms_content: "", privacy_content: "" });
  const [analytics, setAnalytics] = useState<AnalyticsSettings>({ show_revenue_widget: true, show_users_widget: true, show_orders_widget: true, show_leads_widget: true, export_csv_enabled: true, export_excel_enabled: true, retention_days: 90 });
  const [plans,     setPlans]     = useState<Plan[]>([]);
  const [editPlan,  setEditPlan]  = useState<Plan | null>(null);
  const [showKey,   setShowKey]   = useState(false);

  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const setSav = (k: string, v: boolean) => setSaving(p => ({ ...p, [k]: v }));

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => { if (!loading && user?.role !== "admin") router.push("/"); }, [user, loading, router]);

  useEffect(() => {
    api.get("/settings").then((res) => {
      const d = res.data?.data;
      if (d?.general)       setGeneral(d.general);
      if (d?.seller)        setSeller(d.seller);
      if (d?.msg91)         setMsg91(d.msg91);
      if (d?.users)         setUsers(d.users);
      if (d?.notifications) setNotif(d.notifications);
      if (d?.leads)         setLeads(d.leads);
      if (d?.seo)           setSeo(d.seo);
      if (d?.security)      setSecurity(d.security);
      if (d?.analytics)     setAnalytics(d.analytics);
      if (d?.plans)         setPlans(d.plans);
    }).catch(() => {});
  }, []);

  // ── Save helpers ─────────────────────────────────────────────────────────
  const save = async (key: string, endpoint: string, body: object) => {
    setSav(key, true);
    try {
      await api.post(endpoint, body);
      toast.success("Settings saved!");
    } catch { toast.error("Failed to save"); }
    finally { setSav(key, false); }
  };

  const saveGroup = (group: string, body: object) => save(group, `/settings/group/${group}`, body);

  const saveMsg91 = async () => {
    if (!msg91.msg91_widget_id.trim() || !msg91.msg91_token_auth.trim()) { toast.error("Widget ID and Token Auth required"); return; }
    setSav("msg91", true);
    try {
      await api.post("/settings/msg91", {
        msg91_widget_id: msg91.msg91_widget_id,
        msg91_token_auth: msg91.msg91_token_auth,
        ...(msg91.msg91_auth_key && !msg91.msg91_auth_key.includes("•") && { msg91_auth_key: msg91.msg91_auth_key }),
      });
      toast.success("MSG91 settings saved!"); setMsg91(p => ({ ...p, configured: true }));
    } catch { toast.error("Failed to save"); }
    finally { setSav("msg91", false); }
  };

  const savePlan = async () => {
    if (!editPlan) return; setSav("plan", true);
    try {
      const res = await api.patch(`/settings/plans/${editPlan._id}`, editPlan);
      setPlans(p => p.map(pl => pl._id === editPlan._id ? res.data.data : pl));
      setEditPlan(null); toast.success("Plan updated!");
    } catch { toast.error("Failed to update plan"); }
    finally { setSav("plan", false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">⚙️ Admin Settings</h1>
        <p className="text-gray-500 mt-1">Manage all platform configuration from one place</p>
      </div>

      {/* Tabs — scrollable row */}
      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition border ${tab === t.id ? "bg-blue-600 text-white border-blue-600 shadow" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ══ GENERAL ══ */}
      {tab === "general" && (
        <div className="space-y-6">
          <SectionCard title="Site Identity" icon="🌐">
            <Field label="Site Name"><Input value={general.site_name} onChange={v => setGeneral(p => ({ ...p, site_name: v }))} placeholder="IndiaMart B2B" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Default Currency">
                <select value={general.currency} onChange={e => setGeneral(p => ({ ...p, currency: e.target.value }))} className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none">
                  <option value="INR">INR — Indian Rupee (₹)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                </select>
              </Field>
              <Field label="Timezone">
                <select value={general.timezone} onChange={e => setGeneral(p => ({ ...p, timezone: e.target.value }))} className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none">
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </Field>
            </div>
          </SectionCard>
          <SectionCard title="Contact & Support" icon="📞">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Support Email"><Input type="email" value={general.contact_email} onChange={v => setGeneral(p => ({ ...p, contact_email: v }))} placeholder="support@indiamart.com" /></Field>
              <Field label="Support Phone"><Input value={general.contact_phone} onChange={v => setGeneral(p => ({ ...p, contact_phone: v }))} placeholder="+91-XXXXXXXXXX" /></Field>
            </div>
            <Field label="Business Address" hint="(footer / legal pages)">
              <Textarea value={general.business_address} onChange={v => setGeneral(p => ({ ...p, business_address: v }))} placeholder="123, Business Park, Mumbai - 400001" rows={3} />
            </Field>
          </SectionCard>
          <SectionCard title="Site Status" icon="🔧">
            <Toggle checked={general.maintenance_mode} onChange={v => setGeneral(p => ({ ...p, maintenance_mode: v }))} label="Maintenance Mode" desc="Visitors see maintenance page. Admin login still works." />
            {general.maintenance_mode && <InfoBox type="warning">⚠️ Maintenance mode is ON — site inaccessible to buyers & sellers</InfoBox>}
          </SectionCard>
          <SaveBtn saving={!!saving.general} onClick={() => save("general", "/settings/general", general)} />
        </div>
      )}

      {/* ══ SELLER RULES ══ */}
      {tab === "seller" && (
        <div className="space-y-6">
          <SectionCard title="GST Requirements" icon="🛡️">
            <div className="grid grid-cols-2 gap-4">
              <Field label="GST Minimum Age" hint="in months">
                <Input type="number" value={seller.gst_min_age_months} onChange={v => setSeller(p => ({ ...p, gst_min_age_months: Number(v) }))} />
                <p className="text-xs text-gray-400 mt-1">= {Math.floor(seller.gst_min_age_months / 12)} yrs {seller.gst_min_age_months % 12} months</p>
              </Field>
              <Field label="Minimum Turnover (₹)">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                  <input type="number" value={seller.min_turnover} onChange={e => setSeller(p => ({ ...p, min_turnover: Number(e.target.value) }))} className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl pl-8 pr-4 py-3 text-sm outline-none" />
                </div>
                <p className="text-xs text-gray-400 mt-1">= ₹{seller.min_turnover.toLocaleString("en-IN")}</p>
              </Field>
            </div>
          </SectionCard>
          <SectionCard title="Required Documents" icon="📄">
            <Toggle checked={seller.doc_itr_required}  onChange={v => setSeller(p => ({ ...p, doc_itr_required: v }))}  label="ITR Certificate"  desc="Income Tax Return — last 2 years" />
            <Toggle checked={seller.doc_ca_required}   onChange={v => setSeller(p => ({ ...p, doc_ca_required: v }))}   label="CA Certificate"   desc="CA certified turnover statement" />
            <Toggle checked={seller.doc_bank_required} onChange={v => setSeller(p => ({ ...p, doc_bank_required: v }))} label="Bank Statement"   desc="Last 6 months bank statement" />
          </SectionCard>
          <SectionCard title="Approval Workflow" icon="✅">
            <Toggle checked={seller.auto_approve_sellers} onChange={v => setSeller(p => ({ ...p, auto_approve_sellers: v }))} label="Auto-Approve Sellers" desc="Sellers approved automatically after GST verification. OFF = manual review." />
            {seller.auto_approve_sellers && <InfoBox type="warning">⚠️ Auto-approve ON — sellers bypass manual review</InfoBox>}
          </SectionCard>
          <SaveBtn saving={!!saving.seller} onClick={() => save("seller", "/settings/seller", seller)} />
        </div>
      )}

      {/* ══ PLANS & BILLING ══ */}
      {tab === "plans" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.length === 0 && (
              <div className="col-span-2 bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
                <p className="text-3xl mb-2">💳</p><p className="font-semibold">No plans found</p>
                <p className="text-sm mt-1">Add subscription plans from the database</p>
              </div>
            )}
            {plans.map(plan => (
              <div key={plan._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                  <div><h3 className="text-white font-black text-lg">{plan.name}</h3><p className="text-blue-100 text-xs">{plan.duration} days</p></div>
                  <span className="bg-white/20 text-white font-bold text-sm px-3 py-1 rounded-full">{plan.price === 0 ? "Free" : `₹${plan.price.toLocaleString("en-IN")}`}</span>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Products</span><span className="font-bold">{plan.limits?.products ?? "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Leads/month</span><span className="font-bold">{plan.limits?.leads ?? "—"}</span></div>
                  {plan.description && <p className="text-xs text-gray-400 pt-2 border-t">{plan.description}</p>}
                  <button onClick={() => setEditPlan({ ...plan })} className="w-full mt-2 border-2 border-blue-200 text-blue-600 font-bold py-2 rounded-xl text-sm hover:bg-blue-50 transition">✏️ Edit Plan</button>
                </div>
              </div>
            ))}
          </div>
          {editPlan && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                  <h3 className="text-white font-black">Edit: {editPlan.name}</h3>
                  <button onClick={() => setEditPlan(null)} className="text-white/70 hover:text-white text-2xl">×</button>
                </div>
                <div className="p-6 space-y-4">
                  <Field label="Plan Name"><Input value={editPlan.name} onChange={v => setEditPlan(p => p ? { ...p, name: v } : p)} /></Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Price (₹)"><Input type="number" value={editPlan.price} onChange={v => setEditPlan(p => p ? { ...p, price: Number(v) } : p)} /></Field>
                    <Field label="Duration (days)"><Input type="number" value={editPlan.duration} onChange={v => setEditPlan(p => p ? { ...p, duration: Number(v) } : p)} /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Max Products"><Input type="number" value={editPlan.limits?.products ?? ""} onChange={v => setEditPlan(p => p ? { ...p, limits: { ...p.limits, products: Number(v) } } : p)} /></Field>
                    <Field label="Monthly Leads"><Input type="number" value={editPlan.limits?.leads ?? ""} onChange={v => setEditPlan(p => p ? { ...p, limits: { ...p.limits, leads: Number(v) } } : p)} /></Field>
                  </div>
                  <Field label="Description"><Input value={editPlan.description ?? ""} onChange={v => setEditPlan(p => p ? { ...p, description: v } : p)} placeholder="Short plan description..." /></Field>
                  <div className="flex gap-3">
                    <button onClick={savePlan} disabled={!!saving.plan} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition">
                      {saving.plan ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "✅"} Save
                    </button>
                    <button onClick={() => setEditPlan(null)} className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ USERS & ROLES ══ */}
      {tab === "users" && (
        <div className="space-y-6">
          <SectionCard title="Buyer Account Settings" icon="👤">
            <Field label="Default New User Role">
              <select value={users.default_buyer_role} onChange={e => setUsers(p => ({ ...p, default_buyer_role: e.target.value }))} className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none">
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </Field>
            <Toggle checked={users.allow_guest_browsing} onChange={v => setUsers(p => ({ ...p, allow_guest_browsing: v }))} label="Allow Guest Browsing" desc="Unregistered users can browse products (no login required)" />
            <Field label="Max Login Attempts" hint="before account locked">
              <Input type="number" value={users.max_login_attempts} onChange={v => setUsers(p => ({ ...p, max_login_attempts: Number(v) }))} />
            </Field>
            <Field label="Auto-Block Inactive Users" hint="days (0 = disabled)">
              <Input type="number" value={users.auto_block_after_days} onChange={v => setUsers(p => ({ ...p, auto_block_after_days: Number(v) }))} />
              <p className="text-xs text-gray-400 mt-1">{users.auto_block_after_days === 0 ? "Auto-block disabled" : `Users inactive for ${users.auto_block_after_days} days will be suspended`}</p>
            </Field>
          </SectionCard>
          <SectionCard title="Admin Sub-Roles" icon="🔑">
            <InfoBox type="info">
              <p className="font-bold mb-1">Available Admin Roles:</p>
              <div className="space-y-2 mt-2">
                {[{ role: "super-admin", desc: "Full access — all settings, delete, approve", color: "bg-red-100 text-red-700" },
                  { role: "moderator",   desc: "Manage products, sellers, inquiries — no settings", color: "bg-yellow-100 text-yellow-700" },
                  { role: "support",     desc: "View only — respond to inquiries & buyer issues", color: "bg-blue-100 text-blue-700" }
                ].map(r => (
                  <div key={r.role} className="flex items-center gap-3">
                    <span className={`text-xs font-black px-2 py-1 rounded-lg ${r.color}`}>{r.role}</span>
                    <span className="text-xs text-gray-500">{r.desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3 text-blue-500">Assign roles from User Management page → Edit User</p>
            </InfoBox>
          </SectionCard>
          <SaveBtn saving={!!saving.users} onClick={() => saveGroup("users", users)} />
        </div>
      )}

      {/* ══ NOTIFICATIONS ══ */}
      {tab === "notifications" && (
        <div className="space-y-6">
          <SectionCard title="Email Notifications" icon="✉️">
            <Toggle checked={notif.email_welcome}   onChange={v => setNotif(p => ({ ...p, email_welcome: v }))}   label="Welcome Email"   desc="Send welcome email when new user registers" />
            <Toggle checked={notif.email_approval}  onChange={v => setNotif(p => ({ ...p, email_approval: v }))}  label="Approval Email"  desc="Notify seller when their account is approved" />
            <Toggle checked={notif.email_rejection} onChange={v => setNotif(p => ({ ...p, email_rejection: v }))} label="Rejection Email" desc="Notify seller when account is rejected with reason" />
          </SectionCard>
          <SectionCard title="SMS / WhatsApp" icon="💬">
            <Toggle checked={notif.sms_otp_enabled}  onChange={v => setNotif(p => ({ ...p, sms_otp_enabled: v }))}  label="SMS OTP"         desc="Send OTP via SMS for mobile verification" />
            <Toggle checked={notif.whatsapp_alerts}  onChange={v => setNotif(p => ({ ...p, whatsapp_alerts: v }))}  label="WhatsApp Alerts" desc="Send order/inquiry alerts via WhatsApp Business API" />
            <Toggle checked={notif.push_enabled}     onChange={v => setNotif(p => ({ ...p, push_enabled: v }))}     label="Push Notifications" desc="Browser/app push notifications for users" />
          </SectionCard>
          <SectionCard title="SMTP / Email Server Config" icon="📧">
            <div className="grid grid-cols-2 gap-4">
              <Field label="SMTP Host"><Input value={notif.smtp_host} onChange={v => setNotif(p => ({ ...p, smtp_host: v }))} placeholder="smtp.gmail.com" mono /></Field>
              <Field label="SMTP Port"><Input value={notif.smtp_port} onChange={v => setNotif(p => ({ ...p, smtp_port: v }))} placeholder="587" /></Field>
            </div>
            <Field label="SMTP Username / Email"><Input value={notif.smtp_user} onChange={v => setNotif(p => ({ ...p, smtp_user: v }))} placeholder="noreply@indiamart.com" /></Field>
            <Field label="From Name / Email"><Input value={notif.smtp_from} onChange={v => setNotif(p => ({ ...p, smtp_from: v }))} placeholder="IndiaMart B2B <noreply@indiamart.com>" /></Field>
            <InfoBox type="info">💡 SMTP password should be set directly in backend <code className="bg-blue-100 px-1 rounded">.env</code> as <code className="bg-blue-100 px-1 rounded">SMTP_PASS</code> for security</InfoBox>
          </SectionCard>
          <SaveBtn saving={!!saving.notifications} onClick={() => saveGroup("notifications", notif)} />
        </div>
      )}

      {/* ══ LEADS & INQUIRIES ══ */}
      {tab === "leads" && (
        <div className="space-y-6">
          <SectionCard title="Lead Distribution" icon="📩">
            <Field label="Max Sellers Per Lead" hint="how many sellers receive one inquiry">
              <Input type="number" value={leads.max_sellers_per_lead} onChange={v => setLeads(p => ({ ...p, max_sellers_per_lead: Number(v) }))} />
              <p className="text-xs text-gray-400 mt-1">Each buyer inquiry will be distributed to {leads.max_sellers_per_lead} sellers max</p>
            </Field>
          </SectionCard>
          <SectionCard title="Lead Credits System" icon="💰">
            <Toggle checked={leads.lead_credits_enabled} onChange={v => setLeads(p => ({ ...p, lead_credits_enabled: v }))} label="Enable Lead Credits" desc="Sellers pay credits to unlock buyer contact details" />
            {leads.lead_credits_enabled && (
              <Field label="Credits Per Lead">
                <Input type="number" value={leads.credits_per_lead} onChange={v => setLeads(p => ({ ...p, credits_per_lead: Number(v) }))} />
              </Field>
            )}
          </SectionCard>
          <SectionCard title="Spam / Fake Lead Filtering" icon="🚫">
            <Toggle checked={leads.spam_filter_enabled} onChange={v => setLeads(p => ({ ...p, spam_filter_enabled: v }))} label="Spam Filter" desc="Auto-reject inquiries that look like spam or fake leads" />
            <Field label="Minimum Message Length" hint="characters">
              <Input type="number" value={leads.min_message_length} onChange={v => setLeads(p => ({ ...p, min_message_length: Number(v) }))} />
              <p className="text-xs text-gray-400 mt-1">Inquiries shorter than {leads.min_message_length} chars will be rejected</p>
            </Field>
            <Field label="Block Duplicate Lead Window" hint="hours">
              <Input type="number" value={leads.block_duplicate_hours} onChange={v => setLeads(p => ({ ...p, block_duplicate_hours: Number(v) }))} />
              <p className="text-xs text-gray-400 mt-1">Same buyer cannot send inquiry to same seller within {leads.block_duplicate_hours} hours</p>
            </Field>
          </SectionCard>
          <SaveBtn saving={!!saving.leads} onClick={() => saveGroup("leads", leads)} />
        </div>
      )}

      {/* ══ SEO & CONTENT ══ */}
      {tab === "seo" && (
        <div className="space-y-6">
          <SectionCard title="Default Meta Tags" icon="🔍">
            <Field label="Meta Title"><Input value={seo.meta_title} onChange={v => setSeo(p => ({ ...p, meta_title: v }))} placeholder="IndiaMart B2B — Buy & Sell Online" /></Field>
            <Field label="Meta Description"><Textarea value={seo.meta_description} onChange={v => setSeo(p => ({ ...p, meta_description: v }))} placeholder="India's B2B marketplace..." rows={3} /></Field>
            <Field label="Meta Keywords" hint="comma separated"><Input value={seo.meta_keywords} onChange={v => setSeo(p => ({ ...p, meta_keywords: v }))} placeholder="b2b, wholesale, india, suppliers" /></Field>
            <Field label="Google Analytics ID"><Input value={seo.google_analytics_id} onChange={v => setSeo(p => ({ ...p, google_analytics_id: v }))} placeholder="G-XXXXXXXXXX" mono /></Field>
          </SectionCard>
          <SectionCard title="Sitemap / Robots" icon="🗺️">
            <Toggle checked={seo.sitemap_enabled} onChange={v => setSeo(p => ({ ...p, sitemap_enabled: v }))} label="Sitemap Enabled" desc="Auto-generate sitemap.xml for search engines" />
            <Toggle checked={seo.robots_noindex}  onChange={v => setSeo(p => ({ ...p, robots_noindex: v }))}  label="Noindex Mode" desc="Tell search engines not to index the site (use during dev/staging)" />
            {seo.robots_noindex && <InfoBox type="warning">⚠️ Noindex is ON — site will NOT appear in Google search results</InfoBox>}
          </SectionCard>
          <SectionCard title="Homepage Banner (CMS)" icon="🖼️">
            <Toggle checked={seo.homepage_banner_active} onChange={v => setSeo(p => ({ ...p, homepage_banner_active: v }))} label="Show Homepage Banner" desc="Display announcement/promo banner at top of homepage" />
            {seo.homepage_banner_active && (
              <Field label="Banner Text"><Textarea value={seo.homepage_banner_text} onChange={v => setSeo(p => ({ ...p, homepage_banner_text: v }))} placeholder="🎉 Summer Sale — 20% off premium plans! Offer ends June 30." rows={2} /></Field>
            )}
          </SectionCard>
          <SaveBtn saving={!!saving.seo} onClick={() => saveGroup("seo", seo)} />
        </div>
      )}

      {/* ══ SECURITY ══ */}
      {tab === "security" && (
        <div className="space-y-6">
          <SectionCard title="Password Policy" icon="🔑">
            <Field label="Minimum Password Length">
              <Input type="number" value={security.min_password_length} onChange={v => setSecurity(p => ({ ...p, min_password_length: Number(v) }))} />
            </Field>
            <Toggle checked={security.require_uppercase} onChange={v => setSecurity(p => ({ ...p, require_uppercase: v }))} label="Require Uppercase Letter"   desc="At least one A-Z character required" />
            <Toggle checked={security.require_number}    onChange={v => setSecurity(p => ({ ...p, require_number: v }))}    label="Require Number"            desc="At least one digit 0-9 required" />
            <Toggle checked={security.require_special}   onChange={v => setSecurity(p => ({ ...p, require_special: v }))}   label="Require Special Character" desc="At least one !@#$%^ etc. required" />
          </SectionCard>
          <SectionCard title="Session Settings" icon="⏱️">
            <Field label="Session Timeout" hint="minutes (0 = never)">
              <Input type="number" value={security.session_timeout_minutes} onChange={v => setSecurity(p => ({ ...p, session_timeout_minutes: Number(v) }))} />
              <p className="text-xs text-gray-400 mt-1">{security.session_timeout_minutes === 0 ? "Sessions never expire" : `Users logged out after ${security.session_timeout_minutes} minutes of inactivity`}</p>
            </Field>
            <Toggle checked={security.audit_log_enabled} onChange={v => setSecurity(p => ({ ...p, audit_log_enabled: v }))} label="Audit Log" desc="Record all admin actions (who changed what and when)" />
          </SectionCard>
          <SectionCard title="Legal Content Editor" icon="📜">
            <Field label="Terms & Conditions">
              <Textarea value={security.terms_content} onChange={v => setSecurity(p => ({ ...p, terms_content: v }))} placeholder="Enter your Terms & Conditions text here..." rows={6} />
            </Field>
            <Field label="Privacy Policy">
              <Textarea value={security.privacy_content} onChange={v => setSecurity(p => ({ ...p, privacy_content: v }))} placeholder="Enter your Privacy Policy text here..." rows={6} />
            </Field>
          </SectionCard>
          <SaveBtn saving={!!saving.security} onClick={() => saveGroup("security", security)} />
        </div>
      )}

      {/* ══ ANALYTICS ══ */}
      {tab === "analytics" && (
        <div className="space-y-6">
          <SectionCard title="Dashboard Widgets" icon="📊">
            <p className="text-xs text-gray-400 -mt-2 mb-1">Choose which widgets appear on the admin dashboard</p>
            <Toggle checked={analytics.show_revenue_widget} onChange={v => setAnalytics(p => ({ ...p, show_revenue_widget: v }))} label="💰 Revenue Widget"  desc="Total revenue / GMV stats" />
            <Toggle checked={analytics.show_users_widget}   onChange={v => setAnalytics(p => ({ ...p, show_users_widget: v }))}   label="👥 Users Widget"   desc="Total buyers, sellers, new registrations" />
            <Toggle checked={analytics.show_orders_widget}  onChange={v => setAnalytics(p => ({ ...p, show_orders_widget: v }))}  label="📦 Orders Widget"  desc="Order count, status breakdown" />
            <Toggle checked={analytics.show_leads_widget}   onChange={v => setAnalytics(p => ({ ...p, show_leads_widget: v }))}   label="📩 Leads Widget"   desc="Inquiry count and lead quality stats" />
          </SectionCard>
          <SectionCard title="Export / Reports" icon="📥">
            <Toggle checked={analytics.export_csv_enabled}   onChange={v => setAnalytics(p => ({ ...p, export_csv_enabled: v }))}   label="CSV Export"   desc="Allow admins to export data as .csv files" />
            <Toggle checked={analytics.export_excel_enabled} onChange={v => setAnalytics(p => ({ ...p, export_excel_enabled: v }))} label="Excel Export" desc="Allow admins to export data as .xlsx files" />
            <Field label="Data Retention Period" hint="days">
              <Input type="number" value={analytics.retention_days} onChange={v => setAnalytics(p => ({ ...p, retention_days: Number(v) }))} />
              <p className="text-xs text-gray-400 mt-1">Analytics data older than {analytics.retention_days} days will be archived</p>
            </Field>
          </SectionCard>
          <SaveBtn saving={!!saving.analytics} onClick={() => saveGroup("analytics", analytics)} />
        </div>
      )}

      {/* ══ OTP / MSG91 ══ */}
      {tab === "otp" && (
        <div className="space-y-6">
          <SectionCard title="MSG91 OTP Configuration" icon="📱">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${msg91.configured ? "bg-green-50 border border-green-200 text-green-700" : "bg-orange-50 border border-orange-200 text-orange-700"}`}>
              {msg91.configured ? "✅ MSG91 is configured and active" : "⚠️ MSG91 not configured — OTP will not work"}
            </div>
            <Field label="Widget ID" hint="MSG91 Dashboard → OTP Widget → Widget ID">
              <Input mono value={msg91.msg91_widget_id} onChange={v => setMsg91(p => ({ ...p, msg91_widget_id: v }))} placeholder="e.g. 3666416a5579363335323731" />
            </Field>
            <Field label="Token Auth" hint="MSG91 Dashboard → API Keys → Auth Token">
              <Input mono value={msg91.msg91_token_auth} onChange={v => setMsg91(p => ({ ...p, msg91_token_auth: v }))} placeholder="e.g. 491409Txat6fkff697de7f7P1" />
            </Field>
            <Field label="Secret API Key">
              <div className="relative">
                <input type={showKey ? "text" : "password"} value={msg91.msg91_auth_key}
                  onChange={e => setMsg91(p => ({ ...p, msg91_auth_key: e.target.value }))}
                  placeholder={msg91.configured ? "Leave blank to keep existing" : "Enter MSG91 Auth Key"}
                  className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 pr-12 text-sm font-mono outline-none transition" />
                <button type="button" onClick={() => setShowKey(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">
                  {showKey ? "🙈" : "👁️"}
                </button>
              </div>
            </Field>
            <InfoBox type="info">
              <p className="font-bold mb-1">How MSG91 OTP works:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs mt-1">
                <li>Widget loads on buyer/seller verification page</li>
                <li>User enters mobile → MSG91 sends OTP via SMS</li>
                <li>Widget verifies OTP → returns a signed token</li>
                <li>Backend validates token using Secret API Key</li>
              </ol>
            </InfoBox>
          </SectionCard>
          <SaveBtn saving={!!saving.msg91} onClick={saveMsg91} label="Save MSG91 Settings" />
        </div>
      )}
    </div>
  );
}
