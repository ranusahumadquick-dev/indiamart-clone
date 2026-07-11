"use client";

import Link from "next/link";
import {
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineBanknotes,
  HiOutlineChatBubbleLeftRight,
  HiOutlineLockClosed,
  HiOutlineGlobeAlt,
  HiOutlineCheckBadge,
  HiOutlineHandThumbUp,
  HiOutlineArrowRight,
  HiOutlineUserGroup,
  HiOutlineSparkles,
} from "react-icons/hi2";

const FEATURES = [
  {
    icon: HiOutlineShieldCheck,
    title: "Verified Suppliers",
    desc: "Every supplier passes our rigorous TrustSEAL verification — background checks, GST verification, and quality audits.",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    stat: "2M+",
    statLabel: "Verified",
  },
  {
    icon: HiOutlineLockClosed,
    title: "Secure Transactions",
    desc: "End-to-end encrypted payments with buyer protection. Your money is safe with our escrow system until delivery.",
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    stat: "₹0",
    statLabel: "Hidden Fees",
  },
  {
    icon: HiOutlineChatBubbleLeftRight,
    title: "Instant Response",
    desc: "Get supplier responses within 2 hours. Our platform ensures faster communication for all your business needs.",
    color: "from-purple-500 to-purple-600",
    bg: "bg-purple-50",
    stat: "2hr",
    statLabel: "Avg. Reply",
  },
  {
    icon: HiOutlineCheckBadge,
    title: "Quality Assurance",
    desc: "Products undergo strict quality checks. Sample testing available for all bulk orders above minimum thresholds.",
    color: "from-amber-500 to-amber-600",
    bg: "bg-amber-50",
    stat: "99%",
    statLabel: "Quality Pass",
  },
  {
    icon: HiOutlineTruck,
    title: "Nationwide Delivery",
    desc: "Reliable logistics covering 28,000+ pin codes across India. Real-time tracking on every shipment.",
    color: "from-red-500 to-red-600",
    bg: "bg-red-50",
    stat: "28K+",
    statLabel: "Pin Codes",
  },
  {
    icon: HiOutlineBanknotes,
    title: "Best Wholesale Prices",
    desc: "Compare quotes from multiple suppliers simultaneously. Save up to 40% vs retail pricing on bulk orders.",
    color: "from-teal-500 to-teal-600",
    bg: "bg-teal-50",
    stat: "40%",
    statLabel: "Savings",
  },
];

const PROCESS_STEPS = [
  { step: "01", title: "Search & Discover", desc: "Find products from 50M+ listings across all categories" },
  { step: "02", title: "Compare Suppliers", desc: "View verified ratings, prices, and business profiles" },
  { step: "03", title: "Send Inquiry", desc: "Get instant quotes from multiple suppliers at once" },
  { step: "04", title: "Close the Deal", desc: "Negotiate, pay securely, and track your delivery" },
];

export default function WhyChooseUsSection() {
  return (
    <section className="py-16 sm:py-24 bg-gray-950 text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/8 backdrop-blur-sm border border-white/12 text-blue-300 text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-5">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            Why IndiaMart
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
            Why Businesses Choose
            <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              IndiaMart
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-base">
            India's most trusted B2B platform — designed to help your business source smarter and grow faster
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="group relative bg-white/4 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/8 hover:border-white/18 hover:bg-white/8 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
              >
                {/* Hover glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-8 transition-opacity duration-300 rounded-2xl`} />

                <div className="relative z-10">
                  {/* Icon + Stat */}
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-black bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`}>{feature.stat}</p>
                      <p className="text-xs text-white/40">{feature.statLabel}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-2 text-white group-hover:text-blue-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="relative">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">How It Works</h3>
            <p className="text-gray-400 text-sm">Get from requirement to delivery in 4 simple steps</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector Line */}
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-30" />

            {PROCESS_STEPS.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 relative z-10">
                  <span className="text-white font-black text-xl">{step.step}</span>
                </div>
                <h4 className="text-white font-bold mb-2">{step.title}</h4>
                <p className="text-gray-400 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-xl shadow-blue-500/30 hover:-translate-y-0.5 hover:shadow-2xl"
            >
              <HiOutlineUserGroup className="w-5 h-5" />
              Join 10M+ Happy Buyers
              <HiOutlineArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
