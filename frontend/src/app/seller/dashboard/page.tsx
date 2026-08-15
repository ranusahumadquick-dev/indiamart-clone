"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import { resolveImageUrl } from "@/lib/imageUrl";
import {
  HiOutlineShoppingBag,
  HiOutlineChatBubbleLeftRight,
  HiOutlineEye,
  HiOutlinePlusCircle,
  HiOutlineArrowTrendingUp,
  HiOutlineCurrencyDollar,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineBeaker,
  HiOutlineClipboardDocumentList,
  HiOutlineChatBubbleOvalLeft,
  HiOutlineShieldCheck,
  HiOutlineReceiptPercent,
  HiOutlineXCircle,
  HiOutlineArrowTopRightOnSquare,
  HiMiniShieldCheck,
  HiOutlineSparkles,
  HiOutlineArrowUpCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "@/lib/icons";
import toast from "react-hot-toast";
import PlanUsageMeter from "@/components/seller/PlanUsageMeter";
import GalleryManager from "@/components/seller/GalleryManager";

// ─── Verification Status Card ─────────────────────────────────────────
interface VerificationUser {
  isVerified?: boolean;
  verificationRequested?: boolean;
  verificationRequestedAt?: string;
  profileCompleted?: boolean;
  companyName?: string;
  gstNumber?: string;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  email?: string;
  phone?: string;
  name?: string;
}

function VerificationStatusCard({ user, onRefresh }: { user: VerificationUser | null; onRefresh: () => Promise<void> }) {
  const [requesting, setRequesting] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");

  if (!user) return null;

  const checks = [
    { label: "Profile completed", done: !!user.profileCompleted, href: "/seller/complete-profile" },
    { label: "Company name set", done: !!user.companyName, href: "/seller/complete-profile" },
    { label: "GST number added", done: !!user.gstNumber, href: "/seller/complete-profile" },
    { label: "Email verified", done: !!user.isEmailVerified, href: null },
  ];

  const completedChecks = checks.filter((c) => c.done).length;
  const canRequest = !user.isTrusted && !user.trustRequested && completedChecks >= 2;

  const handleRequest = async () => {
    setRequesting(true);
    try {
      await api.post("/sellers/request-verification", { note });
      await onRefresh();
      toast.success("Verification request submitted! Admin will review in 2–3 business days.");
      setShowNote(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${user.isTrusted ? "bg-blue-50 border-blue-200" : user.trustRequested ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-1.5">
          <HiOutlineShieldCheck className="w-4 h-4 text-blue-500" />
          Verification Status
        </h3>
        {user.isTrusted && (
          <span className="flex items-center gap-1 text-xs font-bold bg-blue-600 text-white px-2.5 py-1 rounded-full">
            <HiMiniShieldCheck className="w-3.5 h-3.5" />
            Verified
          </span>
        )}
        {!user.isTrusted && user.trustRequested && (
          <span className="flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
            <HiOutlineClock className="w-3.5 h-3.5" />
            Under Review
          </span>
        )}
        {!user.isTrusted && !user.trustRequested && (
          <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
            Not Verified
          </span>
        )}
      </div>

      {/* Verified state — show what they unlocked */}
      {user.isTrusted ? (
        <div className="space-y-2.5">
          <p className="text-sm text-blue-700 font-medium">Your account is platform verified!</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
            <span className="flex items-center gap-1"><HiOutlineCheckCircle className="w-3.5 h-3.5" />Verified badge visible</span>
            <span className="flex items-center gap-1"><HiOutlineCheckCircle className="w-3.5 h-3.5" />Priority in search</span>
            <span className="flex items-center gap-1"><HiOutlineCheckCircle className="w-3.5 h-3.5" />Buyer trust increased</span>
            <span className="flex items-center gap-1"><HiOutlineCheckCircle className="w-3.5 h-3.5" />More inquiries</span>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-gray-500 mb-2">Account details</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Company</span>
                <span className="font-medium text-gray-700">{user.companyName || "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">GST</span>
                <span className={user.gstNumber ? "font-medium text-green-700" : "text-gray-400"}>
                  {user.gstNumber ? "Registered" : "Not added"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Checklist */}
          <div className="space-y-2">
            {checks.map((c) => (
              <div key={c.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {c.done
                    ? <HiOutlineCheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    : <HiOutlineXCircle className="w-4 h-4 text-gray-300 shrink-0" />}
                  <span className={c.done ? "text-gray-700" : "text-gray-400"}>{c.label}</span>
                </div>
                {!c.done && c.href && (
                  <Link href={c.href} className="text-[10px] text-[var(--primary)] hover:underline flex items-center gap-0.5">
                    Fix <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Verification readiness</span>
              <span>{completedChecks}/{checks.length}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${(completedChecks / checks.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Request submitted state */}
          {user.trustRequested && (
            <div className="bg-amber-100 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <p className="font-semibold flex items-center gap-1 mb-1">
                <HiOutlineClock className="w-4 h-4" />
                Request submitted
              </p>
              <p className="text-xs">
                Submitted {user.trustRequestedAt
                  ? new Date(user.trustRequestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                  : "recently"}.
                {" "}Admin will review within <strong>2–3 business days</strong>. You'll see the Verified badge once approved.
              </p>
            </div>
          )}

          {/* Request button */}
          {!user.trustRequested && (
            <>
              {canRequest ? (
                showNote ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional: tell admin about your business (years in operation, certifications, etc.)"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleRequest}
                        disabled={requesting}
                        className="flex-1 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
                      >
                        {requesting ? "Submitting..." : "Submit Verification Request"}
                      </button>
                      <button
                        onClick={() => setShowNote(false)}
                        className="px-3 py-2 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNote(true)}
                    className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <HiOutlineShieldCheck className="w-4 h-4" />
                    Request Verification
                  </button>
                )
              ) : (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2.5 text-center">
                  Complete at least 2 checklist items above to request verification
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface AnalyticsTrend {
  date: string;
  label: string;
  value: number;
}

interface AnalyticsData {
  inquiryTrend: AnalyticsTrend[];
  topProducts: { _id: string; name: string; views: number; inquiryCount: number; images: { url: string }[]; price: number }[];
  totalViews: number;
  totalInquiries: number;
  monthlyInquiries: number;
  conversionRate: string;
}

// ─── Subscription Card ────────────────────────────────────────────────────────
interface SubscriptionInfo {
  planName: string;
  price: number;
  expiresAt?: string;
  daysLeft?: number;
  maxProducts: number;
  featuredListings: number;
  analytics: boolean;
  prioritySupport: boolean;
}

function SubscriptionCard({ sub }: { sub: SubscriptionInfo | null }) {
  const isFree = !sub || sub.price === 0;
  const isExpiringSoon = sub?.daysLeft !== undefined && sub.daysLeft <= 7 && sub.daysLeft > 0;

  return (
    <div className={`rounded-xl border p-5 shadow-sm relative overflow-hidden ${
      isFree ? "bg-white border-gray-100" : "bg-gradient-to-br from-blue-600 to-indigo-700 border-0 text-white"
    }`}>
      {/* Background decoration */}
      {!isFree && (
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold flex items-center gap-1.5 text-sm ${isFree ? "text-gray-800" : "text-white"}`}>
            <HiOutlineSparkles className={`w-4 h-4 ${isFree ? "text-amber-500" : "text-yellow-300"}`} />
            Subscription Plan
          </h3>
          {!isFree && (
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">Active</span>
          )}
        </div>

        {/* Plan name + price */}
        <div className="mb-3">
          <p className={`text-lg font-bold ${isFree ? "text-gray-800" : "text-white"}`}>
            {sub?.planName || "Free Plan"}
          </p>
          {isFree ? (
            <p className="text-xs text-gray-400 mt-0.5">Basic features included</p>
          ) : (
            <p className="text-xs text-white/80 mt-0.5">
              ₹{sub?.price}/month
              {sub?.daysLeft !== undefined && (
                <span className={`ml-2 ${isExpiringSoon ? "text-red-200" : "text-white/70"}`}>
                  · {sub.daysLeft}d left
                </span>
              )}
            </p>
          )}
        </div>

        {/* Key limits */}
        <div className={`space-y-1.5 mb-4 text-xs ${isFree ? "text-gray-500" : "text-white/90"}`}>
          <div className="flex items-center gap-1.5">
            <HiOutlineCheckCircle className={`w-3.5 h-3.5 shrink-0 ${isFree ? "text-green-500" : "text-green-300"}`} />
            {sub?.maxProducts === -1 ? "Unlimited products" : `Up to ${sub?.maxProducts || 10} products`}
          </div>
          <div className="flex items-center gap-1.5">
            <HiOutlineCheckCircle className={`w-3.5 h-3.5 shrink-0 ${isFree ? "text-green-500" : "text-green-300"}`} />
            {sub?.featuredListings === -1 ? "Unlimited featured listings" : sub?.featuredListings ? `${sub.featuredListings} featured listings` : "No featured listings"}
          </div>
          {sub?.analytics && (
            <div className="flex items-center gap-1.5">
              <HiOutlineCheckCircle className="w-3.5 h-3.5 shrink-0 text-green-300" />
              Advanced analytics
            </div>
          )}
          {sub?.prioritySupport && (
            <div className="flex items-center gap-1.5">
              <HiOutlineCheckCircle className="w-3.5 h-3.5 shrink-0 text-green-300" />
              Priority support
            </div>
          )}
        </div>

        {/* Upgrade CTA */}
        {isFree ? (
          <Link href="/seller/plans"
            className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition">
            <HiOutlineArrowUpCircle className="w-4 h-4" />
            Upgrade to Basic — ₹499/mo
          </Link>
        ) : (
          <Link href="/seller/plans"
            className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold bg-white/20 text-white rounded-lg hover:bg-white/30 transition border border-white/20">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            View all plans
          </Link>
        )}
      </div>
    </div>
  );
}

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalViews: number;
  totalInquiries: number;
  unreadInquiries: number;
  pendingProducts: number;
  pendingSamples: number;
  monthlyRevenue: number;
  unreadMessages: number;
  pendingCustomizations: number;
}

interface CustomizationRequest {
  _id: string;
  productId: { name: string };
  buyerId: { name: string; companyName: string };
  quantity: number;
  message: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  logoUrl?: string;
  createdAt: string;
}

interface RecentProduct {
  _id: string;
  name: string;
  price: number;
  status: string;
  isActive: boolean;
  views: number;
  inquiryCount: number;
  images: { url: string }[];
  createdAt: string;
}

function DashboardContent() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [customizations, setCustomizations] = useState<CustomizationRequest[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<{
    sellerStatus: string;
    sellerStatusNote: string;
    gstVerified: boolean;
    docsUploaded: { itr: boolean; caCertificate: boolean; bankStatement: boolean; uploadedAt: string | null };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [productsRes, samplesRes, messagesRes, analyticsRes, subRes, customizationsRes, servicesRes] = await Promise.allSettled([
          api.get("/products/seller/mine?limit=5"),
          api.get("/samples/seller?limit=100"),
          api.get("/messages/conversations"),
          api.get("/sellers/analytics"),
          api.get("/payments/subscription?planFor=seller"),
          api.get("/sellers/customizations?limit=5"),
          api.get("/services/dashboard/my-services?limit=10"),
        ]);

        const products = productsRes.status === "fulfilled" ? (productsRes.value.data.data.products || []) : [];
        const samples = samplesRes.status === "fulfilled" ? (samplesRes.value.data.data?.samples || []) : [];
        const conversations = messagesRes.status === "fulfilled" ? (messagesRes.value.data.data || []) : [];
        const customizationsList = customizationsRes.status === "fulfilled" ? (customizationsRes.value.data.data?.customizations || []) : [];
        const servicesList = servicesRes.status === "fulfilled" ? (servicesRes.value.data.data?.services || []) : [];

        console.log('📋 [Dashboard] Customization requests fetched:', customizationsList.length);
        console.log('💼 [Dashboard] Services fetched:', servicesList.length);

        // Subscription
        if (subRes.status === "fulfilled") {
          const rawSub = subRes.value.data.data?.subscription;
          if (rawSub) {
            const daysLeft = rawSub.expiresAt
              ? Math.max(0, Math.ceil((new Date(rawSub.expiresAt).getTime() - Date.now()) / 86400000))
              : undefined;
            setSubscription({
              planName: rawSub.plan?.name || "Plan",
              price: rawSub.plan?.price || 0,
              expiresAt: rawSub.expiresAt,
              daysLeft,
              maxProducts: rawSub.plan?.limits?.maxProducts ?? 10,
              featuredListings: rawSub.plan?.limits?.featuredListings ?? 0,
              analytics: rawSub.plan?.limits?.analytics ?? false,
              prioritySupport: rawSub.plan?.limits?.prioritySupport ?? false,
            });
          }
        }

        const totalProducts = productsRes.status === "fulfilled"
          ? (productsRes.value.data.data.pagination?.totalProducts || products.length)
          : products.length;
        const activeProducts = products.filter((p: RecentProduct) => p.status === "approved" && p.isActive !== false).length;
        const totalViews = products.reduce((sum: number, p: RecentProduct) => sum + (p.views || 0), 0);
        const totalInquiries = products.reduce((sum: number, p: RecentProduct) => sum + (p.inquiryCount || 0), 0);
        const pendingProducts = products.filter((p: RecentProduct) => p.status === "pending").length;
        const pendingSamples = samples.filter((s: any) => s.status === "pending").length;
        const pendingCustomizations = customizationsList.filter((c: CustomizationRequest) => c.status === "pending").length;
        const monthlyRevenue = samples
          .filter((s: any) => s.paymentStatus === "paid")
          .reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
        const unreadMessages = conversations.reduce((sum: number, c: any) => sum + (c.myUnread || 0), 0);

        setStats({ totalProducts, activeProducts, totalViews, totalInquiries, unreadInquiries: 0, pendingProducts, pendingSamples, monthlyRevenue, unreadMessages, pendingCustomizations });
        setRecentProducts(products.slice(0, 5));
        setCustomizations(customizationsList.slice(0, 5));
        setServices(servicesList.slice(0, 5));
        if (analyticsRes.status === "fulfilled") {
          setAnalytics(analyticsRes.value.data.data);
        }

        // Fetch seller verification & docs status
        try {
          const verifyRes = await api.get("/seller-verify/status");
          if (verifyRes.data.success) {
            setVerifyStatus(verifyRes.data.data);
          }
        } catch (err) {
          console.warn("Could not fetch verify status:", err);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service? This cannot be undone.')) return;
    try {
      await api.delete(`/services/${id}`);
      setServices((prev) => prev.filter((s) => s._id !== id));
      toast.success('Service deleted');
    } catch {
      toast.error('Failed to delete service');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Products", value: stats?.totalProducts || 0, icon: HiOutlineShoppingBag, bgLight: "bg-blue-50", textColor: "text-blue-700", href: "/seller/products" },
    { label: "Active Listings", value: stats?.activeProducts || 0, icon: HiOutlineCheckCircle, bgLight: "bg-green-50", textColor: "text-green-700", href: "/seller/products" },
    { label: "Total Views", value: stats?.totalViews || 0, icon: HiOutlineEye, bgLight: "bg-purple-50", textColor: "text-purple-700", href: "/seller/products" },
    { label: "Inquiries", value: stats?.totalInquiries || 0, icon: HiOutlineChatBubbleLeftRight, bgLight: "bg-orange-50", textColor: "text-orange-700", href: "/seller/inbox" },
    { label: "Services", value: services?.length || 0, icon: HiOutlineSparkles, bgLight: "bg-purple-50", textColor: "text-purple-700", href: "/services" },
    { label: "Customizations", value: stats?.pendingCustomizations || 0, icon: HiOutlineBeaker, bgLight: "bg-indigo-50", textColor: "text-indigo-700", href: "/seller/inbox" },
    { label: "Pending Samples", value: stats?.pendingSamples || 0, icon: HiOutlineBeaker, bgLight: "bg-yellow-50", textColor: "text-yellow-700", href: "/seller/samples" },
    { label: "Monthly Revenue", value: `₹${(stats?.monthlyRevenue || 0).toLocaleString()}`, icon: HiOutlineCurrencyDollar, bgLight: "bg-emerald-50", textColor: "text-emerald-700", href: "/seller/orders" },
    { label: "Unread Messages", value: stats?.unreadMessages || 0, icon: HiOutlineChatBubbleOvalLeft, bgLight: "bg-pink-50", textColor: "text-pink-700", href: "/seller/messages" },
    { label: "Pending Approval", value: stats?.pendingProducts || 0, icon: HiOutlineClock, bgLight: "bg-gray-50", textColor: "text-gray-600", href: "/seller/products" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here&apos;s an overview of your seller dashboard
          </p>
        </div>
        <Link
          href="/seller/products/new"
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[var(--primary-dark)] transition shrink-0"
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
          Add New Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition block"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${card.bgLight} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Plan Usage Meter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <PlanUsageMeter />
      </div>

      {/* Quick Actions + Subscription + Verification */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/seller/products/new" className="flex items-center gap-3 text-sm text-gray-600 hover:text-[var(--primary)] py-2 transition">
              <HiOutlinePlusCircle className="w-5 h-5 text-green-500" />
              Add a new product listing
            </Link>
            <Link href="/seller/samples" className="flex items-center gap-3 text-sm text-gray-600 hover:text-[var(--primary)] py-2 transition">
              <HiOutlineBeaker className="w-5 h-5 text-yellow-500" />
              Manage sample requests
            </Link>
            <Link href="/seller/orders" className="flex items-center gap-3 text-sm text-gray-600 hover:text-[var(--primary)] py-2 transition">
              <HiOutlineClipboardDocumentList className="w-5 h-5 text-blue-500" />
              View orders
            </Link>
            <Link href="/seller/messages" className="flex items-center gap-3 text-sm text-gray-600 hover:text-[var(--primary)] py-2 transition">
              <HiOutlineChatBubbleOvalLeft className="w-5 h-5 text-pink-500" />
              Open messages
            </Link>
            <Link href="/seller/inbox" className="flex items-center gap-3 text-sm text-gray-600 hover:text-[var(--primary)] py-2 transition">
              <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-orange-500" />
              View buyer inquiries
            </Link>
          </div>
        </div>

        {/* Subscription Card */}
        <SubscriptionCard sub={subscription} />

        {/* Verification Status Card */}
        <VerificationStatusCard user={user} onRefresh={refreshUser} />
      </div>

      {/* Uploaded Documents Status */}
      {verifyStatus && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-1.5">
              <HiOutlineReceiptPercent className="w-4 h-4 text-orange-500" />
              Uploaded Documents
            </h3>
            <div className="flex items-center gap-2">
              {verifyStatus.sellerStatus && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  verifyStatus.sellerStatus === "approved" ? "bg-green-100 text-green-700 border border-green-200" :
                  verifyStatus.sellerStatus === "under_review" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                  verifyStatus.sellerStatus === "rejected" ? "bg-red-100 text-red-700 border border-red-200" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {verifyStatus.sellerStatus === "approved" ? "✅ Approved" :
                   verifyStatus.sellerStatus === "under_review" ? "⏳ Under Review" :
                   verifyStatus.sellerStatus === "rejected" ? "❌ Rejected" : "Pending"}
                </span>
              )}
              <Link href="/seller/itr-certificates" className="text-xs text-[var(--primary)] hover:underline flex items-center gap-0.5">
                View All <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {verifyStatus.sellerStatusNote && verifyStatus.sellerStatus === "rejected" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-red-700"><strong>Reason:</strong> {verifyStatus.sellerStatusNote}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`rounded-lg border p-4 flex items-center gap-3 ${
              verifyStatus.docsUploaded.itr ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                verifyStatus.docsUploaded.itr ? "bg-green-100" : "bg-gray-100"
              }`}>
                {verifyStatus.docsUploaded.itr ? "✅" : "📄"}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">ITR Certificate</p>
                <p className={`text-xs ${verifyStatus.docsUploaded.itr ? "text-green-600" : "text-gray-400"}`}>
                  {verifyStatus.docsUploaded.itr ? "Uploaded" : "Not uploaded"}
                </p>
              </div>
            </div>

            <div className={`rounded-lg border p-4 flex items-center gap-3 ${
              verifyStatus.docsUploaded.caCertificate ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                verifyStatus.docsUploaded.caCertificate ? "bg-green-100" : "bg-gray-100"
              }`}>
                {verifyStatus.docsUploaded.caCertificate ? "✅" : "🏛️"}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">CA Certificate</p>
                <p className={`text-xs ${verifyStatus.docsUploaded.caCertificate ? "text-green-600" : "text-gray-400"}`}>
                  {verifyStatus.docsUploaded.caCertificate ? "Uploaded" : "Not uploaded"}
                </p>
              </div>
            </div>

            <div className={`rounded-lg border p-4 flex items-center gap-3 ${
              verifyStatus.docsUploaded.bankStatement ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                verifyStatus.docsUploaded.bankStatement ? "bg-green-100" : "bg-gray-100"
              }`}>
                {verifyStatus.docsUploaded.bankStatement ? "✅" : "🏦"}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Bank Statement</p>
                <p className={`text-xs ${verifyStatus.docsUploaded.bankStatement ? "text-green-600" : "text-gray-400"}`}>
                  {verifyStatus.docsUploaded.bankStatement ? "Uploaded" : "Not uploaded"}
                </p>
              </div>
            </div>
          </div>

          {verifyStatus.docsUploaded.uploadedAt && (
            <p className="text-xs text-gray-400 mt-3">
              Last uploaded: {new Date(verifyStatus.docsUploaded.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      )}

      {/* Analytics Section */}
      {analytics && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* 7-Day Inquiry Trend */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Inquiry Trend (7 days)</h3>
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{analytics.monthlyInquiries} this month</span>
            </div>
            <div className="flex items-end gap-2 h-28">
              {analytics.inquiryTrend.map((day) => {
                const maxVal = Math.max(...analytics.inquiryTrend.map((d) => d.value), 1);
                const heightPct = (day.value / maxVal) * 100;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500 font-medium">{day.value || ""}</span>
                    <div className="w-full rounded-t-md bg-blue-100 relative" style={{ height: "80px" }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-[var(--primary)] rounded-t-md transition-all duration-500"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">{day.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-500">
              <span>Conversion: <strong className="text-gray-700">{analytics.conversionRate}%</strong></span>
              <span>Views: <strong className="text-gray-700">{analytics.totalViews.toLocaleString()}</strong></span>
              <span>Inquiries: <strong className="text-gray-700">{analytics.totalInquiries}</strong></span>
            </div>
          </div>

          {/* Top Products by Views */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Top Products</h3>
              <span className="text-xs text-gray-400">by views</span>
            </div>
            {analytics.topProducts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No product data yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.topProducts.map((p, idx) => (
                  <div key={p._id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-4">{idx + 1}</span>
                    <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden shrink-0">
                      {p.images?.[0]?.url ? (
                        <img src={resolveImageUrl(p.images[0].url)} alt={p.name} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-[var(--primary)] h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (p.views / (analytics.topProducts[0]?.views || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">{p.views}v · {p.inquiryCount}i</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Products */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Recent Products</h3>
          <Link
            href="/seller/products"
            className="text-sm text-[var(--primary)] font-medium hover:underline"
          >
            View All →
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="p-12 text-center">
            <HiOutlineShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 mb-2">
              No products yet
            </h4>
            <p className="text-sm text-gray-400 mb-4">
              Start selling by adding your first product
            </p>
            <Link
              href="/seller/products/new"
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[var(--primary-dark)] transition"
            >
              <HiOutlinePlusCircle className="w-5 h-5" />
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left py-3 px-5 font-medium">Product</th>
                  <th className="text-left py-3 px-5 font-medium">Price</th>
                  <th className="text-center py-3 px-5 font-medium">Status</th>
                  <th className="text-center py-3 px-5 font-medium">Views</th>
                  <th className="text-center py-3 px-5 font-medium">Inquiries</th>
                  <th className="text-right py-3 px-5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((product) => (
                  <tr
                    key={product._id}
                    className="border-t border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {product.images?.[0]?.url ? (
                            <img
                              src={resolveImageUrl(product.images[0].url)}
                              alt={product.name}
                              className="w-10 h-10 object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 flex items-center justify-center text-gray-300 text-xs">
                              No img
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate max-w-[200px]">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(product.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-medium text-gray-700">
                      ₹{product.price?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span
                        className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-medium ${
                          product.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : product.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center text-gray-500">
                      {product.views || 0}
                    </td>
                    <td className="py-3 px-5 text-center text-gray-500">
                      {product.inquiryCount || 0}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Link
                        href={`/seller/products/${product._id}/edit`}
                        className="text-[var(--primary)] hover:underline font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Services Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <HiOutlineSparkles className="w-5 h-5 text-purple-600" />
            Professional Services
          </h3>
          <div className="flex gap-2">
            <Link
              href="/services"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium hover:bg-gray-50 px-3 py-1 rounded-lg transition"
            >
              View All Services
            </Link>
            <Link
              href="/services/create"
              className="text-sm bg-purple-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-1"
            >
              <HiOutlinePlusCircle className="w-4 h-4" />
              Add Service
            </Link>
          </div>
        </div>

        {services.length === 0 ? (
          <div className="p-12 text-center">
            <HiOutlineSparkles className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 mb-2">
              No services yet
            </h4>
            <p className="text-sm text-gray-400 mb-4">
              Create professional services to offer specialized work to clients
            </p>
            <Link
              href="/services/create"
              className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Create Your First Service
            </Link>
          </div>
        ) : (
          <>
            {/* Services Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 border-b border-gray-100 bg-gray-50">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
                <p className="text-xs text-gray-600 font-medium">Active Services</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {services.reduce((sum, s) => sum + (s.inquiries || 0), 0)}
                </p>
                <p className="text-xs text-gray-600 font-medium">Total Inquiries</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {services.reduce((sum, s) => sum + (s.views || 0), 0)}
                </p>
                <p className="text-xs text-gray-600 font-medium">Total Views</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ₹{services.reduce((sum, s) => sum + (s.price || 0), 0).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-600 font-medium">Total Value</p>
              </div>
            </div>

            {/* Services Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left py-3 px-5 font-medium">Service Name</th>
                    <th className="text-left py-3 px-5 font-medium">Category</th>
                    <th className="text-center py-3 px-5 font-medium">Price</th>
                    <th className="text-center py-3 px-5 font-medium">Views</th>
                    <th className="text-center py-3 px-5 font-medium">Inquiries</th>
                    <th className="text-center py-3 px-5 font-medium">Status</th>
                    <th className="text-right py-3 px-5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.slice(0, 5).map((service: any) => (
                    <tr
                      key={service._id}
                      className="border-t border-gray-50 hover:bg-gray-50 transition"
                    >
                      <td className="py-3 px-5">
                        <div>
                          <p className="font-medium text-gray-800">{service.serviceName}</p>
                          <p className="text-xs text-gray-400">{service.deliveryTime} days delivery</p>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span className="inline-block bg-purple-100 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full">
                          {service.category}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center font-semibold text-gray-900">
                        ₹{service.price?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-5 text-center text-gray-600">
                        {service.views || 0}
                      </td>
                      <td className="py-3 px-5 text-center text-gray-600">
                        {service.inquiries || 0}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span
                          className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-medium ${
                            service.availability === 'available'
                              ? 'bg-green-100 text-green-700'
                              : service.availability === 'unavailable'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {service.availability}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/services/${service._id}`}
                            className="text-purple-600 hover:underline font-medium text-xs"
                          >
                            View
                          </Link>
                          <Link
                            href={`/services/${service._id}/edit`}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
                          >
                            <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteService(service._id)}
                            className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                          >
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {services.length > 5 && (
              <div className="p-4 text-center border-t border-gray-100">
                <Link
                  href="/services"
                  className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center justify-center gap-1"
                >
                  View all {services.length} services
                  <HiOutlineArrowTopRightOnSquare className="w-4 h-4" />
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customization Requests Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Recent Customization Requests</h3>
          <Link
            href="/seller/inbox"
            className="text-sm text-[var(--primary)] font-medium hover:underline"
          >
            View All →
          </Link>
        </div>

        {customizations.length === 0 ? (
          <div className="p-12 text-center">
            <HiOutlineBeaker className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 mb-2">
              No customization requests yet
            </h4>
            <p className="text-sm text-gray-400">
              Customers will be able to request customizations for your products
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left py-3 px-5 font-medium">Customer</th>
                  <th className="text-left py-3 px-5 font-medium">Product</th>
                  <th className="text-center py-3 px-5 font-medium">Quantity</th>
                  <th className="text-center py-3 px-5 font-medium">Status</th>
                  <th className="text-left py-3 px-5 font-medium">Date</th>
                  <th className="text-right py-3 px-5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customizations.map((req) => (
                  <tr
                    key={req._id}
                    className="border-t border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-5">
                      <div>
                        <p className="font-medium text-gray-800">
                          {req.buyerId?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {req.buyerId?.companyName || ''}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-gray-700">
                      {req.productId?.name || 'Unknown Product'}
                    </td>
                    <td className="py-3 px-5 text-center text-gray-500">
                      {req.quantity}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span
                        className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-medium ${
                          req.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : req.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-700'
                            : req.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-gray-500 text-xs">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Link
                        href={`/seller/inbox`}
                        className="text-[var(--primary)] hover:underline font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Company Gallery Management */}
      <div className="mt-10">
        <GalleryManager sellerId={user?._id || ''} />
      </div>

      </div>
    </div>
  );
}

export default function SellerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["seller"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
