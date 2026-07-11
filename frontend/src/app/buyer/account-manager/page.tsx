"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineUserCircle,
  HiOutlinePhone,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlinePlusCircle,
  HiOutlineSparkles,
  HiOutlineBolt,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineClipboardDocumentList,
  HiOutlineCurrencyRupee,
  HiOutlineMapPin,
  HiOutlineTag,
  HiOutlineExclamationCircle,
  HiOutlineStar,
  HiMiniCheckCircle,
  HiOutlineCheckBadge,
  HiOutlineBuildingOffice2,
  HiOutlineGlobeAlt,
} from "react-icons/hi2";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ShortlistedSupplier {
  name: string;
  companyName?: string;
  contact?: string;
  city?: string;
  quotedPrice?: number;
  priceUnit?: string;
  note?: string;
  productUrl?: string;
}

interface SourcingRequest {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  targetPrice?: number;
  budget?: number;
  timeline?: string;
  urgency: "low" | "medium" | "high" | "urgent";
  preferredLocation?: string;
  certificationRequired?: string;
  additionalNotes?: string;
  status: "open" | "in_progress" | "shortlisted" | "resolved" | "cancelled";
  managerNote?: string;
  shortlistedSuppliers?: ShortlistedSupplier[];
  resolvedAt?: string;
  createdAt: string;
}

interface Subscription {
  plan: { name: string; limits: { dedicatedManager: boolean } };
  status: string;
  daysRemaining: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const URGENCY_CONFIG = {
  low:    { label: "Low",    color: "bg-gray-100 text-gray-600",    dot: "bg-gray-400" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500" },
  high:   { label: "High",   color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700",      dot: "bg-red-500" },
};

const STATUS_CONFIG = {
  open:        { label: "Submitted",         color: "bg-yellow-100 text-yellow-700",  step: 0 },
  in_progress: { label: "AM Working on It",  color: "bg-blue-100 text-blue-700",      step: 1 },
  shortlisted: { label: "Suppliers Found",   color: "bg-purple-100 text-purple-700",  step: 2 },
  resolved:    { label: "Resolved",          color: "bg-green-100 text-green-700",    step: 3 },
  cancelled:   { label: "Cancelled",         color: "bg-gray-100 text-gray-500",      step: -1 },
};

const STATUS_STEPS = ["open", "in_progress", "shortlisted", "resolved"];

const UNITS = ["Piece", "Kg", "Ton", "Meter", "Liter", "Box", "Set", "Packet", "Other"];
const TIMELINES = ["ASAP", "Within 1 week", "Within 1 month", "1–3 months", "Flexible"];

// ─── AM Profile (static, can be dynamic later) ─────────────────────────────

const AM_PROFILE = {
  name: "Priya Sharma",
  title: "Senior Sourcing Manager",
  avatar: "PS",
  avatarBg: "from-indigo-500 to-purple-600",
  expertise: ["Industrial Goods", "Textiles & Fabric", "Electronics", "Agri Products"],
  languages: ["Hindi", "English", "Gujarati"],
  responseTime: "< 4 hours",
  experience: "8 years",
  dealsCompleted: "450+",
  rating: 4.9,
  phone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
};

// ─── Sub-components ────────────────────────────────────────────────────────

function AMCard() {
  return (
    <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 rounded-2xl p-6 text-white overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
      <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-8 -translate-x-6" />

      <div className="relative flex items-start gap-5">
        {/* Avatar */}
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${AM_PROFILE.avatarBg} flex items-center justify-center text-xl font-bold shrink-0 ring-2 ring-white/30`}>
          {AM_PROFILE.avatar}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-bold text-lg">{AM_PROFILE.name}</p>
            <span className="flex items-center gap-1 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
              <HiOutlineCheckBadge className="w-3 h-3" /> Verified AM
            </span>
          </div>
          <p className="text-purple-200 text-sm">{AM_PROFILE.title}</p>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <HiOutlineStar key={i} className={`w-3.5 h-3.5 ${i < Math.floor(AM_PROFILE.rating) ? "fill-yellow-300 text-yellow-300" : "text-white/30"}`} />
            ))}
            <span className="text-xs text-white/80 ml-1">{AM_PROFILE.rating} · {AM_PROFILE.dealsCompleted} deals</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="relative grid grid-cols-3 gap-3 mt-5">
        {[
          { label: "Response Time", value: AM_PROFILE.responseTime, icon: HiOutlineClock },
          { label: "Experience",    value: AM_PROFILE.experience,   icon: HiOutlineBuildingOffice2 },
          { label: "Languages",     value: AM_PROFILE.languages.length + " lang", icon: HiOutlineGlobeAlt },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white/10 rounded-xl px-3 py-2.5 text-center backdrop-blur-sm">
            <Icon className="w-4 h-4 text-purple-200 mx-auto mb-1" />
            <p className="text-sm font-bold">{value}</p>
            <p className="text-[10px] text-purple-200">{label}</p>
          </div>
        ))}
      </div>

      {/* Expertise tags */}
      <div className="relative mt-4 flex flex-wrap gap-1.5">
        {AM_PROFILE.expertise.map((e) => (
          <span key={e} className="text-[10px] bg-white/15 text-white px-2 py-1 rounded-full">{e}</span>
        ))}
      </div>

      {/* Contact actions */}
      <div className="relative mt-5 flex gap-3">
        <a href={`tel:${AM_PROFILE.phone}`}
          className="flex-1 flex items-center justify-center gap-1.5 bg-white text-indigo-700 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-50 transition">
          <HiOutlinePhone className="w-4 h-4" /> Call Now
        </a>
        <a href={`https://wa.me/${AM_PROFILE.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 transition">
          <HiOutlineChatBubbleLeftRight className="w-4 h-4" /> WhatsApp
        </a>
      </div>
    </div>
  );
}

function UpgradePrompt() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Top gradient banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white text-center">
        <HiOutlineUserCircle className="w-12 h-12 mx-auto mb-2 opacity-80" />
        <h2 className="text-lg font-bold">Get a Dedicated Account Manager</h2>
        <p className="text-purple-200 text-sm mt-1">Personal sourcing support for high-volume buyers</p>
      </div>

      {/* Benefits */}
      <div className="p-6">
        <div className="space-y-3 mb-6">
          {[
            { icon: HiOutlineUserCircle,          title: "Personal AM Assigned",          desc: "A dedicated manager handles all your sourcing needs" },
            { icon: HiOutlineSparkles,            title: "Supplier Shortlisting",          desc: "We find & vet verified suppliers matching your specs" },
            { icon: HiOutlineClock,               title: "4-Hour Response Guarantee",     desc: "Quick turnaround on all sourcing briefs" },
            { icon: HiOutlineShieldCheck,         title: "Negotiation Support",            desc: "Your AM negotiates pricing & terms on your behalf" },
            { icon: HiOutlineCalendarDays,        title: "Scheduled Consultations",        desc: "Book strategy calls to plan your procurement" },
            { icon: HiOutlineBolt,                title: "Priority Processing",            desc: "Jump the queue — your requests handled first" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link href="/buyer/plans"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition">
          <HiOutlineBolt className="w-4 h-4" />
          Upgrade to Premium Plan
          <HiOutlineArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-gray-400 text-center mt-3">Dedicated Account Manager included in Enterprise plan</p>
      </div>
    </div>
  );
}

// ─── New Request Modal ──────────────────────────────────────────────────────

function NewRequestModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (req: SourcingRequest) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "",
    quantity: "", unit: "Piece",
    targetPrice: "", budget: "",
    timeline: "Flexible", urgency: "medium" as SourcingRequest["urgency"],
    preferredLocation: "", certificationRequired: "", additionalNotes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSubmitting(true);
    try {
      const res = await api.post("/sourcing-requests", {
        ...form,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        targetPrice: form.targetPrice ? Number(form.targetPrice) : undefined,
        budget: form.budget ? Number(form.budget) : undefined,
      });
      toast.success("Sourcing brief submitted! Your AM will respond within 4 hours.");
      onSubmit(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-gray-900">New Sourcing Brief</h2>
            <p className="text-xs text-gray-400 mt-0.5">Your AM will respond within 4 hours</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              What do you need? <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Need 10 ton SS 304 seamless pipes for chemical plant"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Category + Urgency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="Industrial / Textiles..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Urgency</label>
              <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value as any })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Qty + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity Required</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                placeholder="500"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Price (₹/unit)</label>
              <input type="number" min="0" value={form.targetPrice} onChange={e => setForm({ ...form, targetPrice: e.target.value })}
                placeholder="450"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Budget (₹)</label>
              <input type="number" min="0" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
                placeholder="2,00,000"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
          </div>

          {/* Location + Timeline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Supplier Location</label>
              <input value={form.preferredLocation} onChange={e => setForm({ ...form, preferredLocation: e.target.value })}
                placeholder="Mumbai, Gujarat..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Timeline</label>
              <select value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400">
                {TIMELINES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Detailed Requirements</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Specifications, grade, standards, certifications, packing requirements..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
          </div>

          {/* Certification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Certification / Standard Required</label>
            <input value={form.certificationRequired} onChange={e => setForm({ ...form, certificationRequired: e.target.value })}
              placeholder="ISO 9001, BIS, ASTM A312, FSSAI..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <HiOutlineClock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700">
              <strong>{AM_PROFILE.name}</strong> will review your brief and respond with shortlisted suppliers within <strong>4 hours</strong> on business days.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-60">
              {submitting ? "Submitting..." : "Submit Sourcing Brief"}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Request Card ───────────────────────────────────────────────────────────

function RequestCard({ req, onCancel }: { req: SourcingRequest; onCancel: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.open;
  const urgencyCfg = URGENCY_CONFIG[req.urgency] ?? URGENCY_CONFIG.medium;
  const stepIdx = STATUS_STEPS.indexOf(req.status);
  const isActive = !["cancelled", "resolved"].includes(req.status);

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${
      req.status === "shortlisted" ? "border-purple-200" :
      req.status === "resolved" ? "border-green-200" :
      req.status === "in_progress" ? "border-blue-200" : "border-gray-100"
    }`}>
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${urgencyCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${urgencyCfg.dot}`} />
                {urgencyCfg.label}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 leading-snug">{req.title}</h3>
            {req.category && <p className="text-xs text-gray-400 mt-0.5">{req.category}</p>}
          </div>
          <p className="text-xs text-gray-400 shrink-0">
            {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </p>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {req.quantity && (
            <span className="flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg">
              <HiOutlineClipboardDocumentList className="w-3 h-3" /> {req.quantity} {req.unit}
            </span>
          )}
          {req.targetPrice && (
            <span className="flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg">
              <HiOutlineCurrencyRupee className="w-3 h-3" /> ₹{req.targetPrice.toLocaleString("en-IN")}/unit
            </span>
          )}
          {req.preferredLocation && (
            <span className="flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg">
              <HiOutlineMapPin className="w-3 h-3" /> {req.preferredLocation}
            </span>
          )}
          {req.timeline && (
            <span className="flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg">
              <HiOutlineClock className="w-3 h-3" /> {req.timeline}
            </span>
          )}
        </div>

        {/* Progress stepper */}
        {req.status !== "cancelled" && (
          <div className="mb-3">
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 border-2 transition-all ${
                    i < stepIdx ? "bg-indigo-600 border-indigo-600 text-white" :
                    i === stepIdx ? "bg-white border-indigo-600 text-indigo-600" :
                    "bg-white border-gray-200 text-gray-300"
                  }`}>
                    {i < stepIdx ? <HiMiniCheckCircle className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${i < stepIdx ? "bg-indigo-500" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {["Submitted", "Working", "Shortlisted", "Resolved"].map((label, i) => (
                <span key={label} className={`text-[9px] font-medium ${i <= stepIdx ? "text-indigo-600" : "text-gray-300"}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AM note */}
        {req.managerNote && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-3">
            <p className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
              <HiOutlineCheckBadge className="w-3.5 h-3.5" /> {AM_PROFILE.name} — Account Manager
            </p>
            <p className="text-sm text-indigo-800">{req.managerNote}</p>
          </div>
        )}

        {/* Shortlisted suppliers */}
        {req.shortlistedSuppliers && req.shortlistedSuppliers.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Shortlisted Suppliers ({req.shortlistedSuppliers.length})
            </p>
            <div className="space-y-2">
              {req.shortlistedSuppliers.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                        {(s.companyName || s.name).charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{s.companyName || s.name}</p>
                    </div>
                    <div className="flex gap-2 mt-0.5 ml-7.5">
                      {s.city && <span className="text-[10px] text-gray-400">{s.city}</span>}
                      {s.note && <span className="text-[10px] text-gray-500 italic">"{s.note}"</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    {s.quotedPrice && (
                      <p className="text-sm font-bold text-gray-800">₹{s.quotedPrice.toLocaleString("en-IN")}{s.priceUnit ? `/${s.priceUnit}` : ""}</p>
                    )}
                    {s.contact && (
                      <a href={`tel:${s.contact}`} className="text-[10px] text-indigo-600 hover:underline">{s.contact}</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expand for full description */}
        {(req.description || req.certificationRequired) && (
          <button onClick={() => setExpanded(!expanded)}
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
            {expanded ? "▲ Show less" : "▼ Full details"}
          </button>
        )}
        {expanded && (
          <div className="mt-3 space-y-2">
            {req.description && <p className="text-sm text-gray-600">{req.description}</p>}
            {req.certificationRequired && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <HiOutlineTag className="w-3.5 h-3.5" /> Cert: {req.certificationRequired}
              </p>
            )}
          </div>
        )}

        {/* Cancel action */}
        {isActive && (
          <button onClick={() => onCancel(req._id)}
            className="mt-4 text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition">
            <HiOutlineXMark className="w-3.5 h-3.5" /> Cancel this request
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Content ───────────────────────────────────────────────────────────

function AMContent() {
  const { user } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [requests, setRequests] = useState<SourcingRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  const hasDedicatedManager = sub?.plan?.limits?.dedicatedManager === true && sub?.status === "active";

  useEffect(() => {
    // Check subscription
    api.get("/payments/buyer-subscription")
      .then(res => setSub(res.data.data?.subscription))
      .catch(() => {})
      .finally(() => setSubLoading(false));

    // Load sourcing requests
    api.get("/sourcing-requests/my")
      .then(res => setRequests(res.data.data?.requests || []))
      .catch(() => {})
      .finally(() => setReqLoading(false));
  }, []);

  const handleNewRequest = (req: SourcingRequest) => {
    setRequests(prev => [req, ...prev]);
    setShowModal(false);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this sourcing request?")) return;
    try {
      await api.put(`/sourcing-requests/${id}/cancel`);
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: "cancelled" } : r));
      toast.success("Request cancelled");
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const activeRequests = requests.filter(r => !["cancelled", "resolved"].includes(r.status));
  const resolvedRequests = requests.filter(r => r.status === "resolved");
  const filteredRequests = activeTab === "active" ? activeRequests : activeTab === "resolved" ? resolvedRequests : requests;

  const stats = [
    { label: "Active",    value: activeRequests.length,   color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-100" },
    { label: "Resolved",  value: resolvedRequests.length, color: "text-green-700",  bg: "bg-green-50 border-green-100" },
    { label: "Suppliers Found", value: requests.reduce((s, r) => s + (r.shortlistedSuppliers?.length ?? 0), 0), color: "text-purple-700", bg: "bg-purple-50 border-purple-100" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Manager</h1>
          <p className="text-sm text-gray-500 mt-0.5">Personal sourcing support for your business</p>
        </div>
        {hasDedicatedManager && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-sm">
            <HiOutlinePlusCircle className="w-4 h-4" />
            New Brief
          </button>
        )}
      </div>

      {subLoading ? (
        <div className="h-56 bg-gray-100 rounded-2xl animate-pulse mb-6" />
      ) : hasDedicatedManager ? (
        <>
          {/* AM Card */}
          <AMCard />

          {/* Stats */}
          {requests.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-6">
              {stats.map(s => (
                <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Requests section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Sourcing Requests</h2>
              <div className="flex gap-1">
                {[["active", "Active"], ["resolved", "Resolved"], ["all", "All"]].map(([val, label]) => (
                  <button key={val} onClick={() => setActiveTab(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeTab === val ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}>{label}</button>
                ))}
              </div>
            </div>

            {reqLoading ? (
              <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
            ) : filteredRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <HiOutlineClipboardDocumentList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="font-semibold text-gray-500">No {activeTab !== "all" ? activeTab : ""} sourcing requests</p>
                <p className="text-sm text-gray-400 mt-1 mb-4">Submit a brief and your AM will find the right suppliers for you</p>
                <button onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                  <HiOutlinePlusCircle className="w-4 h-4" /> Submit First Brief
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map(req => (
                  <RequestCard key={req._id} req={req} onCancel={handleCancel} />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <UpgradePrompt />
      )}

      {/* Modal */}
      {showModal && hasDedicatedManager && (
        <NewRequestModal onClose={() => setShowModal(false)} onSubmit={handleNewRequest} />
      )}
    </div>
  );
}

export default function AccountManagerPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "premium", "admin"]}>
      <AMContent />
    </ProtectedRoute>
  );
}
