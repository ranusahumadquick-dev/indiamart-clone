"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineCheckCircle,
  HiOutlineBuildingStorefront,
  HiOutlineShieldCheck,
  HiOutlineChartBar,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineUserGroup,
  HiOutlineCurrencyRupee,
  HiOutlineDocumentCheck,
  HiOutlineCheckBadge,
  HiOutlineStar,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
} from "@/lib/icons";

const BENEFITS = [
  {
    icon: HiOutlineBuildingStorefront,
    title: "Free to Get Started",
    description: "List your first 10 products for free. No setup fees, no hidden charges.",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: HiOutlineUserGroup,
    title: "Reach 10M+ Buyers",
    description: "Connect directly with verified buyers across India and global markets.",
    color: "from-purple-500 to-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: HiOutlineChartBar,
    title: "Grow Your Sales",
    description: "Advanced analytics to track inquiries, views, and conversion metrics.",
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "TrustSEAL Badge",
    description: "Get verified and earn the TrustSEAL badge to attract more serious buyers.",
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: HiOutlineSparkles,
    title: "Smart Seller Tools",
    description: "Bulk upload, price slab manager, customization requests, and more.",
    color: "from-pink-500 to-pink-600",
    bg: "bg-pink-50",
  },
  {
    icon: HiOutlineCheckCircle,
    title: "24/7 Seller Support",
    description: "Dedicated account manager and round-the-clock seller support.",
    color: "from-teal-500 to-teal-600",
    bg: "bg-teal-50",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Register as Seller",
    description: "Create your seller account with email and basic business details.",
    icon: HiOutlineBuildingStorefront,
  },
  {
    number: "02",
    title: "GST Verification",
    description: "Enter your valid GST number (minimum 2 years old) to get verified.",
    icon: HiOutlineDocumentCheck,
    highlight: true,
  },
  {
    number: "03",
    title: "Complete Business Profile",
    description: "Add your products, capabilities, certifications, and payment terms.",
    icon: HiOutlineCheckBadge,
  },
  {
    number: "04",
    title: "Start Receiving Leads",
    description: "Go live and start getting inquiries from verified buyers instantly.",
    icon: HiOutlineChartBar,
  },
];

const FAQS = [
  {
    q: "Is GST number mandatory to sell on IndiaMart?",
    a: "Yes. GST registration is mandatory for all sellers. Additionally, your GST must be at least 2 years old to ensure you are an established business. This protects buyers and maintains marketplace quality.",
  },
  {
    q: "Why must my GST be 2 years old?",
    a: "IndiaMart requires 2-year-old GST to verify that sellers are genuine, established businesses. This policy protects buyers from fraudulent new registrations and ensures high-quality B2B transactions.",
  },
  {
    q: "What if my GST is less than 2 years old?",
    a: "You can create an account but cannot complete seller verification until your GST is 2 years old. You'll receive a notification when you become eligible.",
  },
  {
    q: "What are seller commission charges?",
    a: "Basic listing is free. Premium plans start from ₹999/month with enhanced visibility, analytics, and priority placement in search results.",
  },
  {
    q: "How quickly can I start selling?",
    a: "Once your GST is verified and profile is complete, your products go live within 24 hours. Most sellers receive their first inquiry within the first week.",
  },
  {
    q: "What documents are needed for registration?",
    a: "You need: GST Certificate (2+ years old), PAN Card, Bank Account details, and Business address proof. Photo ID of the business owner is also required.",
  },
];

const SELLER_STATS = [
  { value: "10L+", label: "Verified Sellers", sub: "Across all categories", icon: "🏪", color: "text-blue-600" },
  { value: "10M+", label: "Active Buyers", sub: "Monthly visitors", icon: "👥", color: "text-emerald-600" },
  { value: "50M+", label: "Products Listed", sub: "On the platform", icon: "📦", color: "text-purple-600" },
  { value: "₹1000Cr+", label: "Annual GMV", sub: "Transactions processed", icon: "💰", color: "text-amber-600" },
];

export default function SellPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#001a4d] via-[#0052cc] to-[#1a6aff] text-white py-20 sm:py-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-5">
            <defs>
              <pattern id="dotsell" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotsell)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-yellow-300 text-xs font-bold px-4 py-2 rounded-full mb-6">
                <HiOutlineSparkles className="w-3.5 h-3.5" />
                Join India's #1 B2B Marketplace
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-5 leading-tight">
                Sell to
                <span className="block text-yellow-300">10 Million+</span>
                Buyers
              </h1>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed max-w-lg">
                Join <strong className="text-white">10 Lakh+ verified sellers</strong> on IndiaMart. Get direct inquiries, real-time analytics, and grow your B2B business exponentially.
              </p>

              {/* GST Alert */}
              <div className="bg-amber-400/20 backdrop-blur-sm border border-amber-300/30 rounded-2xl p-4 mb-8 flex gap-3">
                <HiOutlineDocumentCheck className="w-5 h-5 text-yellow-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-200 text-sm font-bold">GST Verification Required</p>
                  <p className="text-yellow-100/80 text-xs mt-0.5">
                    A valid GST number that is <strong>at least 2 years old</strong> is mandatory to become a verified seller.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/seller-register")}
                  className="bg-[#ff6b00] hover:bg-[#e05a00] text-white px-8 py-4 rounded-xl text-base font-black flex items-center gap-2 transition-all shadow-xl hover:-translate-y-0.5"
                >
                  Start Selling Now
                  <HiOutlineArrowRight className="w-5 h-5" />
                </button>
                <Link
                  href="/seller/plans"
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <HiOutlineCurrencyRupee className="w-5 h-5" />
                  View Plans
                </Link>
              </div>
            </div>

            {/* Right stats panel */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {SELLER_STATS.map((stat, i) => (
                <div key={i} className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl p-6 text-center hover:bg-white/15 transition-all">
                  <span className="text-3xl block mb-2">{stat.icon}</span>
                  <p className={`text-3xl font-black mb-1 ${stat.color.replace("text-", "text-white")}`}>{stat.value}</p>
                  <p className="text-white/90 font-semibold text-sm">{stat.label}</p>
                  <p className="text-white/50 text-xs mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── GST REQUIREMENT SECTION ── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-bold px-4 py-2 rounded-full mb-4">
              <HiOutlineDocumentCheck className="w-3.5 h-3.5" />
              GST VERIFICATION POLICY
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              GST Number Requirements
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              To maintain a trustworthy marketplace, IndiaMart requires all sellers to have a verified GST registration
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              {
                icon: HiOutlineDocumentCheck,
                title: "Valid GST Required",
                desc: "Your GSTIN must be a valid 15-character number registered under Indian GST law.",
                color: "from-blue-500 to-blue-600",
                bg: "bg-blue-50",
                badge: "Mandatory",
                badgeColor: "bg-blue-600",
              },
              {
                icon: HiOutlineClock,
                title: "2 Years Minimum Age",
                desc: "GST registration must be at least 2 years old. This ensures you are an established business.",
                color: "from-amber-500 to-amber-600",
                bg: "bg-amber-50",
                badge: "Key Requirement",
                badgeColor: "bg-amber-500",
              },
              {
                icon: HiOutlineShieldCheck,
                title: "Active GST Status",
                desc: "Your GST must be in active status — not cancelled, suspended, or surrendered.",
                color: "from-emerald-500 to-emerald-600",
                bg: "bg-emerald-50",
                badge: "Verified",
                badgeColor: "bg-emerald-600",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className={`${item.bg} rounded-2xl p-6 border border-gray-100`}>
                  <span className={`${item.badgeColor} text-white text-[10px] font-bold px-2.5 py-1 rounded-full inline-block mb-4`}>
                    {item.badge}
                  </span>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-black text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* 10L+ Sellers Banner */}
          <div className="bg-gradient-to-r from-[#0052cc] to-indigo-600 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineCheckBadge className="w-5 h-5 text-yellow-300" />
                <span className="text-yellow-300 font-bold text-sm">GST Verified Sellers</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black mb-1">10 Lakh+ Sellers</h3>
              <p className="text-blue-100 text-sm">
                All verified with valid 2+ year old GST — join India's most trusted B2B community
              </p>
            </div>
            <div className="text-center shrink-0">
              <div className="bg-white/10 border border-white/20 rounded-2xl px-8 py-4">
                <p className="text-4xl font-black text-yellow-300">10L+</p>
                <p className="text-white/80 text-xs font-semibold mt-1">Verified Sellers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {SELLER_STATS.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-3xl block mb-2">{stat.icon}</span>
                <p className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</p>
                <p className="font-bold text-gray-800 text-sm">{stat.label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
              4 Steps to Start Selling
            </h2>
            <p className="text-gray-500">From registration to your first inquiry in under 24 hours</p>
          </div>

          <div className="relative">
            {/* Connector */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className={`relative text-center ${s.highlight ? "lg:-mt-2" : ""}`}>
                    {s.highlight && (
                      <span className="inline-block bg-amber-400 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full mb-2 uppercase tracking-wider">
                        Key Step
                      </span>
                    )}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg relative z-10 ${
                      s.highlight
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200"
                        : "bg-gradient-to-br from-[#0052cc] to-indigo-600 shadow-blue-200"
                    }`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white z-20 ${
                      s.highlight ? "bg-amber-500" : "bg-[#0052cc]"
                    }`}>
                      {s.number.slice(-1)}
                    </div>
                    <h4 className="font-black text-gray-900 mb-1.5">{s.title}</h4>
                    <p className="text-gray-500 text-xs leading-relaxed">{s.description}</p>
                    {s.highlight && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-2">
                        <p className="text-[10px] text-amber-700 font-semibold">
                          📋 GST must be 2+ years old
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => router.push("/seller-register")}
              className="inline-flex items-center gap-2 bg-[#0052cc] hover:bg-[#003d99] text-white font-bold px-10 py-4 rounded-xl transition-all shadow-xl shadow-blue-200 hover:-translate-y-0.5 text-base"
            >
              <HiOutlineBuildingStorefront className="w-5 h-5" />
              Start Selling — It's Free
              <HiOutlineArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-gray-400 mt-3">✓ Free listing  ✓ No setup fee  ✓ GST required</p>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Why Sell on IndiaMart?</h2>
            <p className="text-gray-500">Everything you need to grow your B2B business</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div key={i} className={`group ${benefit.bg} rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Frequently Asked Questions</h2>
            <p className="text-gray-500 text-sm">Everything sellers want to know</p>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className={`rounded-2xl p-5 border ${i < 3 ? "border-amber-100 bg-amber-50" : "border-gray-100 bg-white shadow-sm"}`}>
                <div className="flex gap-3">
                  {i < 3 ? (
                    <HiOutlineDocumentCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <HiOutlineInformationCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className={`font-bold mb-2 text-sm ${i < 3 ? "text-amber-900" : "text-gray-900"}`}>
                      {faq.q}
                    </h3>
                    <p className={`text-sm leading-relaxed ${i < 3 ? "text-amber-700" : "text-gray-600"}`}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 bg-gradient-to-br from-[#0052cc] to-indigo-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Ready to Join 10 Lakh+ Sellers?
          </h2>
          <p className="text-blue-100 text-base mb-8 max-w-xl mx-auto leading-relaxed">
            Verified sellers with 2-year-old GST get 3× more buyer inquiries and earn the prestigious TrustSEAL badge.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/seller-register")}
              className="bg-[#ff6b00] hover:bg-[#e05a00] text-white px-10 py-4 rounded-xl font-black text-base inline-flex items-center justify-center gap-2 transition-all shadow-xl hover:-translate-y-0.5"
            >
              Register as Seller
              <HiOutlineArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/help"
              className="border-2 border-white/30 text-white px-10 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all inline-flex items-center justify-center gap-2"
            >
              Learn More
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {[
              "✓ GST Verified Sellers Only",
              "✓ 2-Year GST Required",
              "✓ 10L+ Trusted Sellers",
              "✓ Free to List",
            ].map((item, i) => (
              <span key={i} className="text-blue-200 text-xs font-medium">{item}</span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
