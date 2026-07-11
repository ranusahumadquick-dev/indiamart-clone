"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiCheckCircle,
  HiXCircle,
  HiOutlineShieldCheck,
  HiOutlineBolt,
  HiOutlineBuildingOffice2,
  HiOutlineSparkles,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBell,
  HiOutlineUsers,
  HiOutlineClipboardDocumentList,
  HiOutlineBeaker,
  HiOutlineArrowRight,
  HiOutlinePhone,
  HiOutlineCurrencyRupee,
  HiOutlineDocumentText,
  HiOutlineChartBarSquare,
  HiOutlineVideoCamera,
  HiOutlineTag,
  HiOutlineStar,
  HiOutlineArrowsRightLeft,
  HiOutlineHeart,
  HiMiniCheckCircle,
} from "react-icons/hi2";

interface BuyerPlanLimits {
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
}

interface BuyerPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  benefits: string[];
  limits: BuyerPlanLimits;
  isPopular: boolean;
}

interface ActiveSub {
  _id: string;
  name: string;
  endDate: string;
  daysRemaining: number;
  plan: { _id: string };
}

// ─── Static content ─────────────────────────────────────────────────

const FREE_FEATURES = [
  {
    icon: <HiOutlineChatBubbleLeftRight className="w-6 h-6" />,
    title: "Send Enquiries",
    desc: "Contact any supplier directly from the product page. Get quotes, MOQ details, and pricing.",
    img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=280&fit=crop&q=80",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: <HiOutlineClipboardDocumentList className="w-6 h-6" />,
    title: "Post Buy Requirements",
    desc: "Describe what you need — verified suppliers reach out to you with competitive quotes.",
    img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=280&fit=crop&q=80",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: <HiOutlineStar className="w-6 h-6" />,
    title: "Rate Suppliers",
    desc: "Leave honest reviews after dealing with suppliers — help the community and hold sellers accountable.",
    img: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400&h=280&fit=crop&q=80",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: <HiOutlineArrowsRightLeft className="w-6 h-6" />,
    title: "Compare & Wishlist",
    desc: "Compare up to 4 products side-by-side and save favourites to your wishlist for later.",
    img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=280&fit=crop&q=80",
    color: "bg-purple-50 text-purple-600",
  },
];

const ADVANCED_CATEGORIES = [
  {
    title: "Direct Supplier Access",
    subtitle: "Business plan",
    color: "from-blue-500 to-blue-700",
    img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=360&fit=crop&q=80",
    features: [
      { icon: <HiOutlinePhone className="w-4 h-4" />, label: "Verified phone numbers & WhatsApp" },
      { icon: <HiOutlineChatBubbleLeftRight className="w-4 h-4" />, label: "Direct negotiation chat" },
      { icon: <HiOutlineUsers className="w-4 h-4" />, label: "Bulk enquiry — 7 sellers at once" },
      { icon: <HiOutlineShieldCheck className="w-4 h-4" />, label: '"Verified Buyer" badge on your profile' },
    ],
  },
  {
    title: "Sample & Trial Orders",
    subtitle: "Business plan",
    color: "from-orange-500 to-rose-600",
    img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=360&fit=crop&q=80",
    features: [
      { icon: <HiOutlineBeaker className="w-4 h-4" />, label: "Request product samples before bulk order" },
      { icon: <HiOutlineCurrencyRupee className="w-4 h-4" />, label: "Track sample shipping & status" },
      { icon: <HiOutlineTag className="w-4 h-4" />, label: "Negotiate sample pricing directly" },
      { icon: <HiOutlineClipboardDocumentList className="w-4 h-4" />, label: "RFQ to multiple suppliers at once" },
    ],
  },
  {
    title: "Trade Protection",
    subtitle: "Enterprise plan",
    color: "from-emerald-500 to-teal-700",
    img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=360&fit=crop&q=80",
    features: [
      { icon: <HiOutlineShieldCheck className="w-4 h-4" />, label: "Trade Assurance — payment protection" },
      { icon: <HiOutlineCurrencyRupee className="w-4 h-4" />, label: "Escrow payment on every order" },
      { icon: <HiOutlineDocumentText className="w-4 h-4" />, label: "Legal templates — NDA, PO, LOI" },
      { icon: <HiOutlineVideoCamera className="w-4 h-4" />, label: "Video verification call with supplier" },
    ],
  },
  {
    title: "Procurement Analytics",
    subtitle: "Enterprise plan",
    color: "from-violet-500 to-purple-700",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=360&fit=crop&q=80",
    features: [
      { icon: <HiOutlineChartBarSquare className="w-4 h-4" />, label: "Spend dashboard & supplier scorecards" },
      { icon: <HiOutlineDocumentText className="w-4 h-4" />, label: "Export to PDF & Excel" },
      { icon: <HiOutlineUsers className="w-4 h-4" />, label: "3 team member seats" },
      { icon: <HiOutlineBolt className="w-4 h-4" />, label: "Dedicated Sourcing Manager" },
    ],
  },
];

const TESTIMONIALS = [
  {
    name: "Rajesh Mehta",
    role: "Procurement Head, Mehta Industries",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80",
    plan: "Business",
    quote: "Verified contacts alone saved me 3 days per sourcing cycle. I get responses in hours, not weeks.",
  },
  {
    name: "Priya Sharma",
    role: "Founder, Artisans Direct",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80",
    plan: "Business",
    quote: "Requested samples from 5 suppliers before placing a ₹2L order. Business plan paid for itself on day one.",
  },
  {
    name: "Vikram Singh",
    role: "VP Supply Chain, Singh Exports",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80",
    plan: "Enterprise",
    quote: "Trade Assurance gave our finance team confidence to process large orders online. Our dedicated manager handles everything.",
  },
];

const COMPARISON_ROWS = [
  { label: "Daily Enquiries", key: "maxDailyInquiries", format: (v: number) => v === -1 ? "Unlimited" : `${v}/day` },
  { label: "Bulk Enquiry Size", key: "bulkInquirySize", format: (v: number) => `${v} sellers` },
  { label: "Price Alerts", key: "maxPriceAlerts", format: (v: number) => v === -1 ? "Unlimited" : String(v) },
  { label: "Buy Requirements/mo", key: "maxBuyRequirements", format: (v: number) => v === -1 ? "Unlimited" : String(v) },
  { label: "Sample Requests", key: "sampleRequestAccess", isBool: true },
  { label: "Verified Phone Numbers", key: "verifiedContactsAccess", isBool: true },
  { label: "RFQ Access", key: "rfqAccess", isBool: true },
  { label: "Trade Assurance", key: "tradeAssurance", isBool: true },
  { label: "Dedicated Manager", key: "dedicatedManager", isBool: true },
  { label: "Export Catalog", key: "exportCatalogAccess", isBool: true },
] as const;

const PLAN_STYLE: Record<string, { accent: string; bg: string; btnClass: string; iconBg: string }> = {
  "Buyer Free": {
    accent: "text-gray-800",
    bg: "bg-white",
    btnClass: "bg-gray-900 text-white hover:bg-gray-700",
    iconBg: "bg-gray-100 text-gray-600",
  },
  "Buyer Business": {
    accent: "text-white",
    bg: "bg-gradient-to-b from-blue-600 to-blue-700",
    btnClass: "bg-white text-blue-700 hover:bg-blue-50",
    iconBg: "bg-white/20 text-white",
  },
  "Buyer Enterprise": {
    accent: "text-gray-800",
    bg: "bg-white",
    btnClass: "bg-violet-600 text-white hover:bg-violet-700",
    iconBg: "bg-violet-50 text-violet-600",
  },
};

const PLAN_ICON: Record<string, React.ReactNode> = {
  "Buyer Free": <HiOutlineBolt className="w-5 h-5" />,
  "Buyer Business": <HiOutlineBuildingOffice2 className="w-5 h-5" />,
  "Buyer Enterprise": <HiOutlineSparkles className="w-5 h-5" />,
};

// ─── Component ──────────────────────────────────────────────────────

export default function BuyerPlansPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<BuyerPlan[]>([]);
  const [activeSub, setActiveSub] = useState<ActiveSub | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    (async () => {
      try {
        const [plansRes, subRes] = await Promise.allSettled([
          api.get("/payments/buyer-plans"),
          isAuthenticated ? api.get("/payments/buyer-subscription") : Promise.reject(""),
        ]);
        if (plansRes.status === "fulfilled") setPlans(plansRes.value.data.data.plans || []);
        if (subRes.status === "fulfilled") setActiveSub(subRes.value.data.data.subscription);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  const handleSubscribe = async (plan: BuyerPlan) => {
    if (!isAuthenticated) { router.push("/auth/login?redirect=/buyer/plans"); return; }
    if (activeSub?.plan._id === plan._id) { toast("You're already on this plan!", { icon: "✅" }); return; }
    setSubscribing(plan._id);
    try {
      const res = await api.post("/payments/subscribe-buyer", { planId: plan._id });
      const data = res.data.data;
      if (plan.price === 0) {
        toast.success(`${plan.name} activated!`);
        setActiveSub(data.subscription);
        return;
      }
      const { orderId, key, amount } = data;
      const options = {
        key, amount, currency: "INR",
        name: "IndiaMart — Buyer Plans",
        description: plan.name,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const vRes = await api.post("/payments/verify-buyer-payment", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentId: data.paymentId,
              planId: plan._id,
            });
            toast.success(`${plan.name} activated!`);
            setActiveSub(vRes.data.data.subscription);
          } catch { toast.error("Payment verification failed"); }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#2563eb" },
      };
      new (window as any).Razorpay(options).open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to subscribe");
    } finally {
      setSubscribing(null);
    }
  };

  const annualPrice = (m: number) => Math.round(m * 12 * 0.8);
  const displayPrice = (plan: BuyerPlan) =>
    billing === "annual" && plan.price > 0 ? Math.round(annualPrice(plan.price) / 12) : plan.price;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-white">
        {/* Background image */}
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-1664575602276-acd073f104c1?w=1600&h=700&fit=crop&q=70"
            alt="Procurement background"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-sm font-medium text-blue-200 mb-6">
              <HiOutlineSparkles className="w-4 h-4 text-amber-400" />
              Buyer Plans — Smarter Sourcing
            </div>
            <h1 className="text-5xl font-black leading-tight mb-5">
              Source <span className="text-amber-400">smarter.</span><br />
              Buy with confidence.
            </h1>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              From free browsing to enterprise procurement — choose the plan that matches your sourcing scale and unlock verified contacts, trade assurance, and dedicated support.
            </p>
            {/* Billing toggle */}
            <div className="inline-flex bg-white/10 border border-white/20 rounded-xl p-1 gap-1">
              {(["monthly", "annual"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition capitalize flex items-center gap-2 ${billing === b ? "bg-white text-blue-700 shadow" : "text-white/70 hover:text-white"}`}
                >
                  {b === "annual" && billing !== "annual" && (
                    <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">20% OFF</span>
                  )}
                  {b}
                  {b === "annual" && billing === "annual" && (
                    <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">20% OFF</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Active plan banner ────────────────────────────────────── */}
      {activeSub && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-800">
              <HiCheckCircle className="w-5 h-5 text-green-600" />
              <span>Active: <strong>{activeSub.name}</strong> · {activeSub.daysRemaining ?? "?"} days remaining</span>
            </div>
            <Link href="/buyer/subscription" className="text-xs font-semibold text-green-700 hover:underline flex items-center gap-1">
              Manage <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── What's always free ────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Always Free</p>
          <h2 className="text-3xl font-bold text-gray-900">Core features — no plan needed</h2>
          <p className="text-gray-500 mt-2">These tools are available to every registered buyer at no cost.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FREE_FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
              <div className="relative h-36 overflow-hidden">
                <Image
                  src={f.img}
                  alt={f.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className={`absolute bottom-3 left-3 w-9 h-9 rounded-xl flex items-center justify-center shadow ${f.color}`}>
                  {f.icon}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pricing cards ─────────────────────────────────────────── */}
      <div className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Upgrade</p>
            <h2 className="text-3xl font-bold text-gray-900">Choose your plan</h2>
            <p className="text-gray-500 mt-2">All paid plans include a 30-day money-back guarantee.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const style = PLAN_STYLE[plan.name] || PLAN_STYLE["Buyer Free"];
              const isCurrent = activeSub?.plan._id === plan._id;
              const dp = displayPrice(plan);
              const isBusiness = plan.name === "Buyer Business";

              return (
                <div
                  key={plan._id}
                  className={`relative rounded-2xl overflow-hidden shadow-lg flex flex-col ${style.bg} ${isBusiness ? "ring-2 ring-blue-500 scale-[1.02] shadow-2xl shadow-blue-200" : "ring-1 ring-gray-200"}`}
                >
                  {isBusiness && (
                    <div className="absolute top-0 inset-x-0 flex justify-center">
                      <span className="bg-amber-400 text-amber-900 text-[11px] font-black px-5 py-1 rounded-b-xl tracking-wide">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  <div className={`p-7 flex flex-col flex-1 ${isBusiness ? "pt-10" : ""}`}>
                    {/* Icon + tier */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg}`}>
                        {PLAN_ICON[plan.name]}
                      </div>
                      <div>
                        <p className={`text-[11px] font-bold uppercase tracking-widest ${isBusiness ? "text-blue-200" : "text-gray-400"}`}>
                          {plan.name.replace("Buyer ", "")}
                        </p>
                        <p className={`text-xs ${isBusiness ? "text-blue-100" : "text-gray-500"}`}>{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      {plan.price === 0 ? (
                        <p className={`text-5xl font-black ${isBusiness ? "text-white" : "text-gray-900"}`}>Free</p>
                      ) : (
                        <>
                          <div className="flex items-end gap-1">
                            <span className={`text-5xl font-black ${isBusiness ? "text-white" : "text-gray-900"}`}>₹{dp}</span>
                            <span className={`text-sm mb-2 ${isBusiness ? "text-blue-200" : "text-gray-400"}`}>/mo</span>
                          </div>
                          {billing === "annual" && (
                            <p className={`text-xs mt-0.5 ${isBusiness ? "text-blue-200" : "text-gray-400"}`}>
                              Billed ₹{annualPrice(plan.price)}/yr · Save ₹{plan.price * 12 - annualPrice(plan.price)}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={!!subscribing || isCurrent}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition mb-7 flex items-center justify-center gap-2 disabled:opacity-60 ${style.btnClass}`}
                    >
                      {subscribing === plan._id ? (
                        <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Processing...</>
                      ) : isCurrent ? (
                        <><HiCheckCircle className="w-4 h-4" />Current Plan</>
                      ) : plan.price === 0 ? (
                        "Start for Free"
                      ) : (
                        <>Upgrade to {plan.name.replace("Buyer ", "")} <HiOutlineArrowRight className="w-4 h-4" /></>
                      )}
                    </button>

                    {/* Features */}
                    <div className="flex-1 space-y-2.5">
                      {plan.features.map((f, i) => (
                        <div key={i} className={`flex items-start gap-2.5 text-sm ${isBusiness ? "text-blue-50" : "text-gray-600"}`}>
                          <HiMiniCheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isBusiness ? "text-amber-400" : "text-green-500"}`} />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Advanced feature categories with images ──────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Premium Features</p>
          <h2 className="text-3xl font-bold text-gray-900">What you unlock with paid plans</h2>
          <p className="text-gray-500 mt-2">Every advanced capability, explained.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {ADVANCED_CATEGORIES.map((cat) => (
            <div key={cat.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              {/* Image */}
              <div className={`relative h-44 bg-gradient-to-br ${cat.color}`}>
                <Image
                  src={cat.img}
                  alt={cat.title}
                  fill
                  className="object-cover mix-blend-overlay opacity-60"
                  unoptimized
                />
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <span className="text-white/70 text-[11px] font-bold uppercase tracking-widest mb-1">{cat.subtitle}</span>
                  <h3 className="text-white text-xl font-bold">{cat.title}</h3>
                </div>
              </div>
              {/* Features */}
              <div className="p-5 space-y-3">
                {cat.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                      {f.icon}
                    </span>
                    {f.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Comparison table ─────────────────────────────────────── */}
      <div className="bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Full Feature Comparison</h2>
          <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-500 w-2/5">Feature</th>
                  {plans.map((p) => (
                    <th key={p._id} className="px-4 py-4 text-center">
                      <span className={`text-sm font-bold ${p.isPopular ? "text-blue-600" : "text-gray-700"}`}>
                        {p.name.replace("Buyer ", "")}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={row.key} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}>
                    <td className="px-6 py-3.5 text-sm text-gray-600 font-medium">{row.label}</td>
                    {plans.map((p) => {
                      const val = (p.limits as any)[row.key];
                      return (
                        <td key={p._id} className="px-4 py-3.5 text-center text-sm">
                          {"isBool" in row && row.isBool ? (
                            val
                              ? <HiCheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                              : <HiXCircle className="w-5 h-5 text-gray-200 mx-auto" />
                          ) : (
                            <span className={`font-semibold ${p.isPopular ? "text-blue-600" : "text-gray-800"}`}>
                              {"format" in row ? row.format(val) : val}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Trusted By Buyers</p>
          <h2 className="text-3xl font-bold text-gray-900">What our buyers say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={44}
                  height={44}
                  className="rounded-full object-cover"
                  unoptimized
                />
                <div>
                  <p className="text-sm font-bold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
                <span className="ml-auto text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-full">{t.plan}</span>
              </div>
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => <HiOutlineStar key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">"{t.quote}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust strip ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: <HiOutlineShieldCheck className="w-7 h-7" />, label: "30-Day Money Back", sub: "No questions asked" },
            { icon: <HiOutlineBolt className="w-7 h-7" />, label: "Instant Activation", sub: "Start sourcing right away" },
            { icon: <HiOutlineChatBubbleLeftRight className="w-7 h-7" />, label: "Cancel Anytime", sub: "No lock-in contracts" },
            { icon: <HiOutlineUsers className="w-7 h-7" />, label: "10,000+ Buyers", sub: "Already upgrading" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-1">
                {item.icon}
              </div>
              <p className="font-bold text-sm">{item.label}</p>
              <p className="text-blue-200 text-xs">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to source smarter?</h2>
        <p className="text-gray-500 mb-6">Start free — upgrade when you need more reach, verified contacts, or trade protection.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/products"
            className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-700 transition"
          >
            Browse Products for Free
          </Link>
          {plans.find((p) => p.isPopular) && (
            <button
              onClick={() => { const p = plans.find((pl) => pl.isPopular); if (p) handleSubscribe(p); }}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              Upgrade to Business <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-5">
          Already subscribed?{" "}
          <Link href="/buyer/subscription" className="text-blue-600 hover:underline font-medium">Manage your plan</Link>
        </p>
      </div>
    </div>
  );
}
