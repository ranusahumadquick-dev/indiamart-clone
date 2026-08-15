"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineBuildingStorefront,
  HiOutlineDevicePhoneMobile,
  HiOutlineEnvelope,
  HiOutlineCheckCircle,
  HiOutlineRocketLaunch,
  HiOutlineCurrencyRupee,
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArchiveBox,
  HiOutlineBell,
  HiOutlineChartBar,
  HiOutlineCreditCard,
  HiOutlineTag,
} from "@/lib/icons";
import toast from "react-hot-toast";

const SELLER_BENEFITS = [
  "List products for FREE — no setup cost",
  "Reach 10M+ verified buyers instantly",
  "Get direct buyer inquiries daily",
  "Dashboard analytics & insights",
  "Dedicated seller support 24/7",
];

const APP_FEATURES = [
  { icon: HiOutlineMagnifyingGlass, label: "Smart Search" },
  { icon: HiOutlineChatBubbleLeftRight, label: "Live Chat" },
  { icon: HiOutlineArchiveBox, label: "Track Orders" },
  { icon: HiOutlineBell, label: "Alerts" },
  { icon: HiOutlineChartBar, label: "Analytics" },
  { icon: HiOutlineCreditCard, label: "Easy Pay" },
];

export default function CTASection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      toast.success("Successfully subscribed!");
      setEmail("");
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Sell on IndiaMart + App Download */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Seller CTA */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0044bb] via-[#0052cc] to-[#1a6aff] p-8 sm:p-10 text-white">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/8 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-xl" />
            <div className="absolute top-4 right-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3">
                <HiOutlineBuildingStorefront className="w-6 h-6 text-white/70" />
              </div>
            </div>

            <div className="relative">
              <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
                <HiOutlineTag className="w-3.5 h-3.5" />
                FOR SELLERS
              </span>
              <h3 className="text-2xl sm:text-3xl font-black mb-3 leading-tight">
                Start Selling on
                <span className="block text-yellow-300">IndiaMart — For Free!</span>
              </h3>
              <p className="text-blue-100 mb-6 leading-relaxed text-sm max-w-sm">
                Join 2M+ suppliers. Get your business in front of millions of buyers across India with zero listing fees.
              </p>

              {/* Benefits */}
              <ul className="space-y-2 mb-7">
                {SELLER_BENEFITS.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-white/85">
                    <HiOutlineCheckCircle className="w-4 h-4 text-green-300 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/sell"
                  className="bg-white text-[#0052cc] px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                >
                  <HiOutlineRocketLaunch className="w-4 h-4" />
                  Start Selling Free
                </Link>
                <Link
                  href="/subscription/plans"
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all text-sm flex items-center gap-2"
                >
                  <HiOutlineCurrencyRupee className="w-4 h-4" />
                  View Plans
                </Link>
              </div>
            </div>
          </div>

          {/* App Download CTA */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-[#0d1117] p-8 sm:p-10 text-white">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/8 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/8 rounded-full blur-xl" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 bg-white/8 backdrop-blur-sm border border-white/12 text-white/80 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
                <HiOutlineDevicePhoneMobile className="w-3.5 h-3.5" />
                MOBILE APP
              </span>
              <h3 className="text-2xl sm:text-3xl font-black mb-3 leading-tight">
                Manage Business
                <span className="block text-blue-400">On the Go</span>
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed text-sm max-w-sm">
                Buy, sell, chat, and manage orders from anywhere. IndiaMart on your phone — available 24/7.
              </p>

              {/* App Features Grid */}
              <div className="grid grid-cols-3 gap-2.5 mb-7">
                {APP_FEATURES.map((f, i) => (
                  <div key={i} className="bg-white/5 border border-white/8 rounded-xl p-3 text-center hover:bg-white/10 transition-colors">
                    <f.icon className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                    <p className="text-[10px] text-gray-300 font-medium">{f.label}</p>
                  </div>
                ))}
              </div>

              {/* Download Buttons */}
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-3 bg-white text-gray-900 px-5 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg text-sm">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/></svg>
                  <div className="text-left">
                    <p className="text-[10px] text-gray-500 leading-none">Download on</p>
                    <p className="font-black text-sm leading-tight">App Store</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 bg-white text-gray-900 px-5 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg text-sm">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0"><path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l14 8.5c.6.36.6 1.24 0 1.6l-14 8.5c-.66.5-1.6.03-1.6-.8z"/></svg>
                  <div className="text-left">
                    <p className="text-[10px] text-gray-500 leading-none">Get it on</p>
                    <p className="font-black text-sm leading-tight">Google Play</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 p-8 sm:p-12">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-200/30 rounded-full blur-2xl" />

          <div className="relative max-w-3xl mx-auto text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-500/30">
              <HiOutlineEnvelope className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
              Stay Ahead in Business
            </h3>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto">
              Get exclusive deals, new product alerts, market insights, and industry news delivered to your inbox.
            </p>

            {subscribed ? (
              <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                <HiOutlineCheckCircle className="w-6 h-6" />
                You&apos;re subscribed! Check your inbox.
              </div>
            ) : (
              <>
                <form onSubmit={handleSubscribe} className="flex gap-2 bg-white rounded-xl p-1.5 shadow-xl shadow-blue-100 border border-blue-200 max-w-lg mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your business email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none text-sm rounded-lg"
                  />
                  <button
                    type="submit"
                    className="bg-[#0052cc] hover:bg-[#003d99] text-white px-6 py-2.5 rounded-lg font-bold transition-all text-sm whitespace-nowrap flex items-center gap-2"
                  >
                    Subscribe
                    <HiOutlineArrowRight className="w-4 h-4" />
                  </button>
                </form>
                <div className="flex items-center justify-center gap-4 mt-4">
                  {["No spam ever", "Unsubscribe anytime", "10K+ subscribers"].map((item, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-500" />
                      {item}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Post Requirement Banner */}
        <div className="bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
          <div className="relative text-white text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-black mb-2">
              Know exactly what you need?
            </h3>
            <p className="text-orange-100 text-sm max-w-md">
              Post your requirement and receive competitive quotes from 100+ verified suppliers within hours.
            </p>
          </div>
          <Link
            href="/post-requirement"
            className="relative shrink-0 bg-white text-[#ff6b00] font-bold px-8 py-4 rounded-2xl hover:bg-gray-50 transition-all shadow-xl hover:-translate-y-0.5 flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <HiOutlineUserGroup className="w-5 h-5" />
            Post Your Requirement
            <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
