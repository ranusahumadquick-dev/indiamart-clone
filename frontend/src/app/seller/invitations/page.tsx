"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineLockClosed,
  HiOutlineEyeSlash,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineCalendarDays,
  HiOutlineUserCircle,
  HiOutlineBuildingStorefront,
  HiOutlineArrowRight,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiMiniShieldCheck,
  HiOutlineShieldCheck,
  HiOutlinePaperAirplane,
  HiOutlineReceiptPercent,
  HiOutlineTruck,
} from "@/lib/icons";

// ─── Types ────────────────────────────────────────────────────────────

interface BuyerInfo {
  _id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
}

interface PrivateReq {
  _id: string;
  productName: string;
  description?: string;
  quantityRequired: number;
  unit: string;
  budgetMin?: number;
  budgetMax?: number;
  deliveryLocation?: { city?: string; state?: string };
  deliveryTimeline?: string;
  status: string;
  category?: { name: string };
  privateNote?: string;
  responses?: { supplier: { _id: string }; quotedPrice?: number; respondedAt: string }[];
  buyer: BuyerInfo;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  active:    { label: "Active",    color: "bg-green-100 text-green-700" },
  closed:    { label: "Closed",    color: "bg-gray-100 text-gray-500" },
  fulfilled: { label: "Fulfilled", color: "bg-blue-100 text-blue-700" },
};

// ─── Response Form ────────────────────────────────────────────────────

function RespondForm({ req, onSuccess }: { req: PrivateReq; onSuccess: () => void }) {
  const [form, setForm] = useState({ message: "", quotedPrice: "", moq: "", deliveryDays: "", validityDays: "7" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) { toast.error("Message is required"); return; }
    setSubmitting(true);
    try {
      await api.post(`/buy-requirements/${req._id}/respond`, {
        message: form.message,
        quotedPrice: form.quotedPrice ? Number(form.quotedPrice) : undefined,
        moq: form.moq ? Number(form.moq) : undefined,
        deliveryDays: form.deliveryDays ? Number(form.deliveryDays) : undefined,
        validityDays: Number(form.validityDays),
      });
      toast.success("Quote submitted to buyer!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit quote");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 pt-4 border-t border-purple-100">
      <h4 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
        <HiOutlinePaperAirplane className="w-4 h-4" />
        Submit Your Quote
      </h4>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Message to Buyer *</label>
        <textarea
          required
          rows={3}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Describe your capability, quality, lead time, certifications..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Quoted Price (₹/{req.unit})</label>
          <input
            type="number" min="0"
            value={form.quotedPrice}
            onChange={(e) => setForm({ ...form, quotedPrice: e.target.value })}
            placeholder="e.g. 450"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Min Order Qty ({req.unit})</label>
          <input
            type="number" min="1"
            value={form.moq}
            onChange={(e) => setForm({ ...form, moq: e.target.value })}
            placeholder="e.g. 50"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Delivery (days)</label>
          <input
            type="number" min="1"
            value={form.deliveryDays}
            onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })}
            placeholder="e.g. 7"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Quote Valid (days)</label>
          <select
            value={form.validityDays}
            onChange={(e) => setForm({ ...form, validityDays: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400"
          >
            {["3", "7", "14", "30"].map((d) => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <HiOutlinePaperAirplane className="w-4 h-4" />
        )}
        {submitting ? "Submitting..." : "Send Quote to Buyer"}
      </button>
    </form>
  );
}

// ─── Invitation Card ──────────────────────────────────────────────────

function InvitationCard({ req, onResponded }: { req: PrivateReq; onResponded: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CFG[req.status] || { label: req.status, color: "bg-gray-100 text-gray-500" };
  const myUserId = ""; // we check by responses list
  const alreadyResponded = req.responses && req.responses.length > 0;

  return (
    <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-sm overflow-hidden hover:border-purple-200 transition">
      {/* Purple header strip */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiOutlineLockClosed className="w-4 h-4 text-white/80" />
          <span className="text-xs font-bold text-white/90 uppercase tracking-wide">Private Invitation</span>
        </div>
        <span className="text-[10px] text-purple-200">{timeAgo(req.createdAt)}</span>
      </div>

      <div className="p-5">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-base leading-snug">{req.productName}</h3>
            {req.category && <p className="text-xs text-purple-500 font-medium mt-0.5">{req.category.name}</p>}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>

        {/* Key details row */}
        <div className="flex flex-wrap gap-3 mb-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg">
            <HiOutlineReceiptPercent className="w-3.5 h-3.5 text-gray-400" />
            {req.quantityRequired} {req.unit}
          </span>
          {(req.budgetMin || req.budgetMax) && (
            <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg">
              <HiOutlineCurrencyRupee className="w-3.5 h-3.5 text-gray-400" />
              {req.budgetMin && req.budgetMax
                ? `₹${req.budgetMin.toLocaleString("en-IN")} – ₹${req.budgetMax.toLocaleString("en-IN")}`
                : req.budgetMax
                ? `Up to ₹${req.budgetMax.toLocaleString("en-IN")}`
                : `Min ₹${req.budgetMin?.toLocaleString("en-IN")}`}
            </span>
          )}
          {req.deliveryTimeline && (
            <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg">
              <HiOutlineCalendarDays className="w-3.5 h-3.5 text-gray-400" />
              {req.deliveryTimeline}
            </span>
          )}
          {(req.deliveryLocation?.city || req.deliveryLocation?.state) && (
            <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg">
              <HiOutlineMapPin className="w-3.5 h-3.5 text-gray-400" />
              {[req.deliveryLocation?.city, req.deliveryLocation?.state].filter(Boolean).join(", ")}
            </span>
          )}
        </div>

        {/* Buyer info */}
        <div className="flex items-center gap-3 bg-purple-50 rounded-xl px-4 py-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
            {(req.buyer?.companyName || req.buyer?.name || "B").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{req.buyer?.companyName || req.buyer?.name}</p>
            {(req.buyer?.city || req.buyer?.state) && (
              <p className="text-xs text-gray-400">{[req.buyer?.city, req.buyer?.state].filter(Boolean).join(", ")}</p>
            )}
          </div>
          <span className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded-lg">Invited you</span>
        </div>

        {/* Private note */}
        {req.privateNote && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
            <HiOutlineEyeSlash className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-0.5">Confidential Note from Buyer</p>
              <p className="text-xs text-amber-800 leading-relaxed">{req.privateNote}</p>
            </div>
          </div>
        )}

        {/* Description */}
        {req.description && (
          <div className="mb-4">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
            >
              {expanded ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
              {expanded ? "Hide details" : "Full description"}
            </button>
            {expanded && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{req.description}</p>}
          </div>
        )}

        {/* Response section */}
        {req.status === "active" ? (
          alreadyResponded ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <HiOutlineCheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-700">Quote Submitted</p>
                <p className="text-xs text-green-600">Your response has been sent to the buyer</p>
              </div>
            </div>
          ) : (
            <RespondForm req={req} onSuccess={onResponded} />
          )
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
            <HiOutlineXCircle className="w-4 h-4" />
            This requirement is {req.status} — no longer accepting responses
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────

function InvitationsContent() {
  const [requirements, setRequirements] = useState<PrivateReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  const fetchInvitations = async (status: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status !== "all") params.status = status;
      const res = await api.get("/buy-requirements/seller/invitations", { params });
      setRequirements(res.data.data?.requirements || []);
    } catch {
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvitations(activeTab); }, [activeTab]);

  const handleResponded = () => fetchInvitations(activeTab);

  const tabs = [
    { key: "active", label: "Active" },
    { key: "fulfilled", label: "Fulfilled" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <HiOutlineLockClosed className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Private Invitations</h1>
            <p className="text-purple-100 text-sm mt-0.5">
              Buyers have personally invited you to bid on their confidential requirements
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 bg-white/10 rounded-xl px-4 py-3">
          <HiOutlineShieldCheck className="w-4 h-4 text-white/80 shrink-0 mt-0.5" />
          <p className="text-xs text-purple-100 leading-relaxed">
            These requirements are <strong>not publicly visible</strong>. The buyer has selected you specifically. Submit your best quote to win the deal.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-white text-gray-800 shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-purple-100 p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-16 bg-gray-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : requirements.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-purple-100 py-16 text-center">
          <HiOutlineLockClosed className="w-14 h-14 text-purple-200 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">No private invitations yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">
            Complete your seller profile to get discovered by buyers for private deals
          </p>
          <Link
            href="/seller/complete-profile"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition"
          >
            Complete Profile <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requirements.map((req) => (
            <InvitationCard key={req._id} req={req} onResponded={handleResponded} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SellerInvitationsPage() {
  return (
    <ProtectedRoute allowedRoles={["seller"]}>
      <div className="min-h-[80vh] bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <InvitationsContent />
        </div>
      </div>
    </ProtectedRoute>
  );
}
