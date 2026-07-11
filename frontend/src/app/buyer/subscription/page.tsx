"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiCheckCircle,
  HiOutlineArrowRight,
  HiOutlineExclamationTriangle,
  HiOutlineCalendarDays,
  HiOutlineCreditCard,
  HiOutlineArrowPathRoundedSquare,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBell,
  HiOutlineUsers,
  HiOutlineClipboardDocumentList,
  HiOutlineBeaker,
  HiOutlineShieldCheck,
  HiOutlineBolt,
  HiXMark,
} from "react-icons/hi2";

interface Plan {
  _id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  limits: {
    maxDailyInquiries: number;
    bulkInquirySize: number;
    maxPriceAlerts: number;
    maxBuyRequirements: number;
    sampleRequestAccess: boolean;
    verifiedContactsAccess: boolean;
    tradeAssurance: boolean;
    dedicatedManager: boolean;
    rfqAccess: boolean;
    exportCatalogAccess: boolean;
  };
}

interface Subscription {
  _id: string;
  name: string;
  price: number;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  daysRemaining: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  plan: Plan;
}

export default function BuyerSubscriptionPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "premium"]}>
      <SubscriptionContent />
    </ProtectedRoute>
  );
}

function SubscriptionContent() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/payments/buyer-subscription");
        setSub(res.data.data.subscription);
      } catch {
        // no sub
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post("/payments/cancel-subscription", { planFor: "buyer" });
      toast.success("Subscription cancelled. Access continues until expiry.");
      setSub((prev) => prev ? { ...prev, status: "cancelled", autoRenew: false } : null);
      setShowCancelModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const usageItems = sub?.plan.limits ? [
    { icon: <HiOutlineChatBubbleLeftRight className="w-4 h-4" />, label: "Daily Inquiries", value: sub.plan.limits.maxDailyInquiries === -1 ? "Unlimited" : String(sub.plan.limits.maxDailyInquiries) },
    { icon: <HiOutlineUsers className="w-4 h-4" />, label: "Bulk Inquiry Size", value: `Up to ${sub.plan.limits.bulkInquirySize} sellers` },
    { icon: <HiOutlineBell className="w-4 h-4" />, label: "Price Alerts", value: sub.plan.limits.maxPriceAlerts === -1 ? "Unlimited" : String(sub.plan.limits.maxPriceAlerts) },
    { icon: <HiOutlineClipboardDocumentList className="w-4 h-4" />, label: "Buy Requirements", value: sub.plan.limits.maxBuyRequirements === -1 ? "Unlimited" : String(sub.plan.limits.maxBuyRequirements) },
  ] : [];

  const boolItems = sub?.plan.limits ? [
    { label: "Sample Requests", enabled: sub.plan.limits.sampleRequestAccess },
    { label: "Verified Contacts", enabled: sub.plan.limits.verifiedContactsAccess },
    { label: "Trade Assurance", enabled: sub.plan.limits.tradeAssurance },
    { label: "Dedicated Manager", enabled: sub.plan.limits.dedicatedManager },
    { label: "RFQ Access", enabled: sub.plan.limits.rfqAccess },
    { label: "Export Catalog", enabled: sub.plan.limits.exportCatalogAccess },
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <HiOutlineCreditCard className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Active Buyer Plan</h1>
          <p className="text-gray-500 mb-8">
            Upgrade to unlock verified contacts, bulk inquiries, sample requests, and more.
          </p>
          <Link
            href="/buyer/plans"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            View Buyer Plans <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const daysProgress = Math.max(0, Math.min(100, (sub.daysRemaining / sub.plan.duration) * 100));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Buyer Plan</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your sourcing subscription</p>
          </div>
          <Link
            href="/buyer/plans"
            className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            Upgrade <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Expiry warning */}
        {sub.isExpiringSoon && sub.status === "active" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3 mb-6">
            <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800">
              Your plan expires in <strong>{sub.daysRemaining} days</strong>.{" "}
              <Link href="/buyer/plans" className="underline font-semibold">Renew now</Link>
            </p>
          </div>
        )}

        {sub.status === "cancelled" && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 flex items-center gap-3 mb-6">
            <HiOutlineExclamationTriangle className="w-5 h-5 text-orange-500 shrink-0" />
            <p className="text-sm text-orange-800">
              Subscription cancelled — access continues until <strong>{formatDate(sub.endDate)}</strong>.
            </p>
          </div>
        )}

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          {/* Plan header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Active Plan</p>
                <h2 className="text-2xl font-bold">{sub.name}</h2>
                <p className="text-blue-100 mt-1">
                  {sub.price === 0 ? "Free" : `₹${sub.price}/month`}
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                sub.status === "active" ? "bg-green-400 text-green-900" :
                sub.status === "cancelled" ? "bg-orange-300 text-orange-900" :
                "bg-red-400 text-red-900"
              }`}>
                {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-6 py-4 border-b border-gray-50">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Plan validity</span>
              <span className="font-semibold text-gray-800">{sub.daysRemaining} days remaining</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${daysProgress > 25 ? "bg-blue-500" : "bg-red-400"}`}
                style={{ width: `${daysProgress}%` }}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 divide-x divide-gray-50 border-b border-gray-50">
            <div className="px-6 py-4 flex items-center gap-3">
              <HiOutlineCalendarDays className="w-5 h-5 text-gray-300 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Start date</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(sub.startDate)}</p>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center gap-3">
              <HiOutlineCalendarDays className="w-5 h-5 text-gray-300 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Expires on</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(sub.endDate)}</p>
              </div>
            </div>
          </div>

          {/* Auto-renew */}
          <div className="px-6 py-4 flex items-center gap-3 border-b border-gray-50">
            <HiOutlineArrowPathRoundedSquare className="w-5 h-5 text-gray-300 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">Auto-renewal</p>
              <p className="text-xs text-gray-400">{sub.autoRenew ? "Enabled — renews automatically" : "Disabled"}</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sub.autoRenew ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {sub.autoRenew ? "ON" : "OFF"}
            </span>
          </div>

          {/* Usage limits */}
          <div className="px-6 py-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Your Limits</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {usageItems.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 flex items-center gap-2.5">
                  <span className="text-gray-400">{item.icon}</span>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-bold text-gray-800">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {boolItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {item.enabled ? (
                    <HiCheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <HiXMark className="w-4 h-4 text-gray-200 shrink-0" />
                  )}
                  <span className={item.enabled ? "text-gray-700" : "text-gray-300"}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">Included in your plan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sub.plan.features.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <HiCheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/buyer/plans"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition text-sm"
          >
            <HiOutlineBolt className="w-4 h-4" />
            Upgrade Plan
          </Link>
          {sub.status === "active" && sub.price > 0 && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex-1 py-3 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition text-sm"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <HiOutlineExclamationTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Cancel subscription?</h3>
              <p className="text-sm text-gray-500">
                You'll keep access until <strong>{formatDate(sub.endDate)}</strong>. After that, you'll revert to Free plan limits.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition disabled:opacity-60"
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
