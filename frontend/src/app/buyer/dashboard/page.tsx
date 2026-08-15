"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import { resolveImageUrl } from "@/lib/imageUrl";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineShoppingBag,
  HiOutlineClipboardDocumentList,
  HiOutlineBeaker,
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineHeart,
  HiOutlineBell,
  HiOutlineBolt,
  HiOutlineSparkles,
  HiOutlineBuildingStorefront,
  HiOutlineMapPin,
  HiOutlineMagnifyingGlass,
  HiOutlineCurrencyRupee,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineXCircle,
  HiOutlineChartBar,
  HiMiniShieldCheck,
  HiOutlineUserCircle,
  HiOutlineArrowPath,
  HiOutlineWrenchScrewdriver,
} from "@/lib/icons";

// ─── Types ────────────────────────────────────────────────────────────

interface InquiryStats {
  all: number;
  new: number;
  read: number;
  replied: number;
  closed: number;
}

interface RecentInquiry {
  _id: string;
  subject?: string;
  status: string;
  createdAt: string;
  product?: { _id: string; name: string; images: { url: string }[] };
  seller?: { _id: string; name: string; companyName?: string };
}

interface ActiveRequirement {
  _id: string;
  productName: string;
  status: string;
  quantityRequired: number;
  unit: string;
  budgetMax?: number;
  responses?: { _id: string; supplier: { name: string; companyName?: string }; quotedPrice?: number }[];
  createdAt: string;
}

interface SavedSeller {
  _id: string;
  seller: {
    _id: string;
    name: string;
    companyName?: string;
    businessLogo?: string;
    city?: string;
    state?: string;
    isTrusted?: boolean;
    businessDescription?: string;
  };
  createdAt: string;
}

interface ActivePlan {
  name: string;
  price: number;
  daysRemaining: number;
  isExpiringSoon: boolean;
}

interface RecentOrder {
  _id: string;
  product?: { _id: string; name: string; images?: { url: string }[] };
  seller?: { name: string; companyName?: string };
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────

const INQ_STATUS_COLOR: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  read: "bg-gray-100 text-gray-600",
  replied: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
  pending: "bg-yellow-100 text-yellow-700",
};

const REQ_STATUS_COLOR: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  fulfilled: "bg-blue-100 text-blue-700",
  closed: "bg-gray-100 text-gray-500",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────

function StatBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-14 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-6 text-right">{value}</span>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────

function DashboardContent() {
  const { user } = useAuth();
  const [inquiryStats, setInquiryStats] = useState<InquiryStats>({ all: 0, new: 0, read: 0, replied: 0, closed: 0 });
  const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([]);
  const [activeReqs, setActiveReqs] = useState<ActiveRequirement[]>([]);
  const [savedSellers, setSavedSellers] = useState<SavedSeller[]>([]);
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [inquiryRes, reqRes, sellerRes, planRes, orderRes] = await Promise.allSettled([
        api.get("/inquiries/buyer/my-inquiries?limit=5"),
        api.get("/buy-requirements/user/my-requirements"),
        api.get("/wishlist/sellers"),
        api.get("/payments/buyer-subscription"),
        api.get("/orders/buyer?limit=3"),
      ]);

      if (inquiryRes.status === "fulfilled") {
        const d = inquiryRes.value.data.data;
        setRecentInquiries(d?.inquiries || []);
        if (d?.stats) setInquiryStats(d.stats);
        else setInquiryStats({ all: d?.total || 0, new: 0, read: 0, replied: 0, closed: 0 });
      }

      if (reqRes.status === "fulfilled") {
        const reqs: ActiveRequirement[] = reqRes.value.data.data?.buyRequirements || [];
        setActiveReqs(reqs.filter((r) => r.status === "active").slice(0, 4));
      }

      if (sellerRes.status === "fulfilled") {
        setSavedSellers((sellerRes.value.data.data || []).slice(0, 4));
      }

      if (planRes.status === "fulfilled") {
        const sub = planRes.value.data.data?.subscription;
        if (sub) setActivePlan({ name: sub.name, price: sub.price, daysRemaining: sub.daysRemaining ?? 0, isExpiringSoon: sub.isExpiringSoon });
      }

      if (orderRes.status === "fulfilled") {
        setRecentOrders(orderRes.value.data.data?.orders?.slice(0, 3) || []);
      }

      setLoading(false);
    })();
  }, []);

  const responseRate = inquiryStats.all > 0
    ? Math.round(((inquiryStats.replied + inquiryStats.closed) / inquiryStats.all) * 100)
    : 0;

  const statCards = [
    { label: "Inquiries Sent", value: inquiryStats.all, icon: HiOutlineChatBubbleLeftRight, color: "bg-blue-50 text-blue-600", href: "/buyer/inquiries" },
    { label: "Active RFQs", value: activeReqs.length, icon: HiOutlineClipboardDocumentList, color: "bg-green-50 text-green-600", href: "/buyer/requirements" },
    { label: "Saved Suppliers", value: savedSellers.length, icon: HiOutlineBuildingStorefront, color: "bg-rose-50 text-rose-600", href: "/buyer/wishlist" },
    { label: "Replies Received", value: inquiryStats.replied, icon: HiOutlineCheckCircle, color: "bg-purple-50 text-purple-600", href: "/buyer/inquiries" },
  ];

  const quickActions = [
    { label: "Browse Products", href: "/products", icon: HiOutlineShoppingBag, color: "bg-[var(--primary)] text-white" },
    { label: "Browse Brands", href: "/brands", icon: HiOutlineBuildingStorefront, color: "bg-teal-600 text-white" },
    { label: "Browse Services", href: "/services", icon: HiOutlineWrenchScrewdriver, color: "bg-indigo-600 text-white" },
    { label: "Post RFQ", href: "/buyer/requirements", icon: HiOutlineClipboardDocumentList, color: "bg-green-600 text-white" },
    { label: "Find Suppliers", href: "/sellers", icon: HiOutlineBuildingStorefront, color: "bg-orange-500 text-white" },
    { label: "Messages", href: "/buyer/messages", icon: HiOutlineChatBubbleLeftRight, color: "bg-blue-600 text-white" },
    { label: "Wishlist", href: "/buyer/wishlist", icon: HiOutlineHeart, color: "bg-rose-500 text-white" },
    { label: "Price Alerts", href: "/buyer/alerts", icon: HiOutlineBell, color: "bg-amber-500 text-white" },
    { label: "My Manager", href: "/buyer/account-manager", icon: HiOutlineUserCircle, color: "bg-purple-600 text-white" },
    { label: "My Orders", href: "/buyer/orders", icon: HiOutlineArrowPath, color: "bg-teal-600 text-white" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-16 w-24 h-24 rounded-full border-4 border-white" />
          <div className="absolute -bottom-6 right-4 w-40 h-40 rounded-full border-4 border-white" />
        </div>
        <div className="relative">
          <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1">Buyer Dashboard</p>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0] || "Buyer"}!</h1>
          <p className="text-blue-100 text-sm mt-1">
            {inquiryStats.new > 0
              ? `You have ${inquiryStats.new} new repl${inquiryStats.new > 1 ? "ies" : "y"} from sellers.`
              : "Here's an overview of your sourcing activity."}
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link href="/products" className="inline-flex items-center gap-2 bg-white text-[var(--primary)] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition">
              <HiOutlineMagnifyingGlass className="w-4 h-4" />
              Find Products
            </Link>
            <Link href="/sellers" className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/30 transition">
              <HiOutlineBuildingStorefront className="w-4 h-4" />
              Browse Suppliers
            </Link>
          </div>
        </div>
      </div>

      {/* Plan widget */}
      {activePlan ? (
        <div className={`rounded-xl border px-5 py-4 flex items-center justify-between ${activePlan.isExpiringSoon ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-100"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activePlan.isExpiringSoon ? "bg-amber-100" : "bg-blue-100"}`}>
              <HiOutlineBolt className={`w-5 h-5 ${activePlan.isExpiringSoon ? "text-amber-600" : "text-blue-600"}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {activePlan.name}
                {activePlan.price === 0 && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">Free</span>}
              </p>
              <p className={`text-xs ${activePlan.isExpiringSoon ? "text-amber-700" : "text-gray-500"}`}>
                {activePlan.daysRemaining} days remaining{activePlan.isExpiringSoon ? " — renew soon!" : ""}
              </p>
            </div>
          </div>
          <Link href="/buyer/plans" className={`text-xs font-semibold flex items-center gap-1 ${activePlan.isExpiringSoon ? "text-amber-700" : "text-blue-600"} hover:underline`}>
            {activePlan.price === 0 ? "Upgrade" : "Manage"} <HiOutlineArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <Link href="/buyer/plans" className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-5 py-4 flex items-center justify-between hover:bg-blue-50 transition group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <HiOutlineSparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700">Unlock Premium Sourcing</p>
              <p className="text-xs text-gray-400">Verified contacts, sample requests, bulk inquiries &amp; more</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-600 group-hover:underline flex items-center gap-1">
            View Plans <HiOutlineArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{loading ? <span className="inline-block w-8 h-7 bg-gray-100 rounded animate-pulse" /> : card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className={`flex flex-col items-center gap-2 p-3 rounded-xl text-xs font-medium hover:opacity-90 transition text-center ${action.color}`}>
              <action.icon className="w-5 h-5" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main content: 2-column layout */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* LEFT (2/3): Enquiries overview */}
        <div className="lg:col-span-2 space-y-5">

          {/* Enquiry Activity Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
              <div>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <HiOutlineChartBar className="w-4 h-4 text-blue-500" />
                  Enquiry Activity
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Track your inquiry pipeline</p>
              </div>
              <Link href="/buyer/inquiries" className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1">
                View all <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            ) : inquiryStats.all === 0 ? (
              <div className="p-8 text-center">
                <HiOutlineChatBubbleLeftRight className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500">No inquiries yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-3">Browse products and send your first inquiry</p>
                <Link href="/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline">
                  <HiOutlineShoppingBag className="w-4 h-4" /> Browse Products
                </Link>
              </div>
            ) : (
              <div className="p-5">
                {/* Stats bar + response rate */}
                <div className="grid grid-cols-2 gap-6 mb-5">
                  <div className="space-y-2.5">
                    <StatBar label="Pending" value={inquiryStats.new + inquiryStats.read} total={inquiryStats.all} color="bg-amber-400" />
                    <StatBar label="Replied" value={inquiryStats.replied} total={inquiryStats.all} color="bg-green-500" />
                    <StatBar label="Closed" value={inquiryStats.closed} total={inquiryStats.all} color="bg-gray-300" />
                  </div>
                  <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-4">
                    <p className="text-3xl font-bold text-gray-800">{responseRate}%</p>
                    <p className="text-xs text-gray-500 mt-0.5">Response Rate</p>
                    <div className={`mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${responseRate >= 70 ? "bg-green-100 text-green-700" : responseRate >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                      {responseRate >= 70 ? "Excellent" : responseRate >= 40 ? "Good" : "Low"}
                    </div>
                  </div>
                </div>

                {/* Recent inquiries list */}
                <div className="space-y-2">
                  {recentInquiries.slice(0, 5).map((inq) => (
                    <div key={inq._id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition group">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        {inq.product?.images?.[0]?.url
                          ? <img src={resolveImageUrl(inq.product.images[0].url)} alt="" className="w-full h-full object-cover" />
                          : <HiOutlineShoppingBag className="w-4 h-4 m-auto mt-2.5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{inq.subject || inq.product?.name || "Inquiry"}</p>
                        <p className="text-xs text-gray-400 truncate">{inq.seller?.companyName || inq.seller?.name} · {timeAgo(inq.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${INQ_STATUS_COLOR[inq.status] || "bg-gray-100 text-gray-500"}`}>
                          {inq.status === "new" ? "Replied" : inq.status}
                        </span>
                        {inq.product?._id && (
                          <Link href={`/products/${inq.product._id}`} className="opacity-0 group-hover:opacity-100 transition">
                            <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5 text-gray-400 hover:text-[var(--primary)]" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active RFQs Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
              <div>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <HiOutlineClipboardDocumentList className="w-4 h-4 text-green-500" />
                  Active Requirements (RFQs)
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Requirements with incoming quotes</p>
              </div>
              <Link href="/buyer/requirements" className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1">
                Manage <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            ) : activeReqs.length === 0 ? (
              <div className="p-8 text-center">
                <HiOutlineClipboardDocumentList className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500">No active requirements</p>
                <p className="text-xs text-gray-400 mt-1 mb-3">Post an RFQ and get quotes from multiple suppliers</p>
                <Link href="/buyer/requirements" className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition">
                  Post RFQ
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activeReqs.map((req) => {
                  const quoteCount = req.responses?.length ?? 0;
                  const bestPrice = req.responses?.filter((r) => r.quotedPrice).sort((a, b) => (a.quotedPrice ?? 0) - (b.quotedPrice ?? 0))[0];
                  return (
                    <div key={req._id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800 truncate">{req.productName}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${REQ_STATUS_COLOR[req.status]}`}>
                            {req.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{req.quantityRequired} {req.unit}</span>
                          {req.budgetMax && <span>Budget: ₹{req.budgetMax.toLocaleString("en-IN")}</span>}
                          <span>{timeAgo(req.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {quoteCount > 0 ? (
                          <div className="text-right">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                {quoteCount}
                              </span>
                              <span className="text-xs text-gray-500">quote{quoteCount > 1 ? "s" : ""}</span>
                            </div>
                            {bestPrice?.quotedPrice && (
                              <p className="text-[10px] text-green-700 font-semibold mt-0.5">
                                Best: ₹{bestPrice.quotedPrice.toLocaleString("en-IN")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <HiOutlineClock className="w-3.5 h-3.5" />
                            Waiting
                          </span>
                        )}
                        <Link
                          href="/buyer/requirements"
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${quoteCount > 0 ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                        >
                          {quoteCount > 0 ? "Compare" : "View"}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT (1/3): Saved Suppliers */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
              <div>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <HiOutlineHeart className="w-4 h-4 text-rose-500" />
                  Saved Suppliers
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Your shortlisted contacts</p>
              </div>
              <Link href="/buyer/wishlist" className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1">
                All <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            ) : savedSellers.length === 0 ? (
              <div className="p-6 text-center">
                <HiOutlineBuildingStorefront className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500">No saved suppliers</p>
                <p className="text-xs text-gray-400 mt-1 mb-3">Save suppliers to contact them later</p>
                <Link href="/sellers" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline">
                  <HiOutlineMagnifyingGlass className="w-3.5 h-3.5" /> Find Suppliers
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {savedSellers.map((item) => {
                  const s = item.seller;
                  if (!s) return null;
                  const initials = (s.companyName || s.name || "S").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                  return (
                    <div key={item._id} className="px-4 py-3.5 hover:bg-gray-50 transition">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 relative overflow-visible ${s.isTrusted ? "bg-blue-600" : "bg-[var(--primary)]"} text-white`}>
                          {s.businessLogo
                            ? <img src={s.businessLogo} alt="" className="w-full h-full object-cover rounded-xl" />
                            : initials}
                          {s.isTrusted && (
                            <span className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5">
                              <HiMiniShieldCheck className="w-3 h-3 text-blue-600" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{s.companyName || s.name}</p>
                          {(s.city || s.state) && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <HiOutlineMapPin className="w-3 h-3" />
                              {[s.city, s.state].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 mt-2.5">
                        <Link href={`/sellers/${s._id}`} className="flex-1 text-center text-xs font-medium border border-gray-200 text-gray-600 py-1.5 rounded-lg hover:bg-gray-50 transition">
                          Profile
                        </Link>
                        <Link href={`/sellers/${s._id}`} className="flex-1 text-center text-xs font-medium bg-[var(--primary)] text-white py-1.5 rounded-lg hover:opacity-90 transition">
                          Chat
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {savedSellers.length > 0 && (
              <div className="px-4 pb-4">
                <Link href="/sellers" className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-[var(--primary)] border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition">
                  <HiOutlineMagnifyingGlass className="w-3.5 h-3.5" />
                  Find More Suppliers
                </Link>
              </div>
            )}
          </div>

          {/* Recent Orders widget */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
              <div>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <HiOutlineArrowPath className="w-4 h-4 text-teal-500" />
                  Recent Orders
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Reorder with one click</p>
              </div>
              <Link href="/buyer/orders" className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1">
                All <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-5 text-center">
                <HiOutlineShoppingBag className="w-9 h-9 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No orders yet</p>
                <Link href="/products" className="text-xs text-[var(--primary)] hover:underline mt-1 block">Browse products</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <div key={order._id} className="px-4 py-3.5 hover:bg-gray-50 transition">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        {order.product?.images?.[0]?.url
                          ? <img src={resolveImageUrl(order.product.images[0].url)} alt="" className="w-full h-full object-cover" />
                          : <HiOutlineShoppingBag className="w-4 h-4 m-auto mt-2.5 text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{order.product?.name || "Product"}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{order.quantity} pcs · ₹{order.totalAmount.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                    {["delivered", "cancelled"].includes(order.status) && (
                      <Link href="/buyer/orders" className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100 py-1.5 rounded-lg hover:bg-teal-100 transition">
                        <HiOutlineArrowPath className="w-3 h-3" />
                        Reorder
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}

            {recentOrders.length > 0 && (
              <div className="px-4 pb-4">
                <Link href="/buyer/orders" className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-teal-600 border border-dashed border-teal-200 rounded-lg hover:bg-teal-50 transition">
                  <HiOutlineArrowPath className="w-3.5 h-3.5" />
                  View All Orders
                </Link>
              </div>
            )}
          </div>

          {/* Account Manager widget */}
          <Link href="/buyer/account-manager" className="block bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4 hover:shadow-sm transition">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                <HiOutlineUserCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Account Manager</p>
                <p className="text-xs text-gray-500">Personal sourcing support</p>
              </div>
            </div>
            <p className="text-xs text-purple-700 flex items-center gap-1">
              View sourcing requests <HiOutlineArrowRight className="w-3 h-3" />
            </p>
          </Link>

          {/* Alerts summary widget */}
          <Link href="/buyer/alerts" className="block bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-4 hover:shadow-sm transition">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                <HiOutlineBell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Price & Stock Alerts</p>
                <p className="text-xs text-gray-500">Get notified on price drops</p>
              </div>
            </div>
            <p className="text-xs text-amber-700 flex items-center gap-1">
              Manage alerts <HiOutlineArrowRight className="w-3 h-3" />
            </p>
          </Link>

          {/* Find verified suppliers CTA */}
          <Link href="/sellers?verified=true" className="block bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 hover:shadow-sm transition">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <HiMiniShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Verified Suppliers</p>
                <p className="text-xs text-gray-500">Platform-verified businesses</p>
              </div>
            </div>
            <p className="text-xs text-blue-700 flex items-center gap-1">
              Browse verified only <HiOutlineArrowRight className="w-3 h-3" />
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BuyerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "premium", "admin"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
