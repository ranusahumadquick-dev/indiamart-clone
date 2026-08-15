"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiMagnifyingGlass,
  HiOutlineArrowRight,
  HiOutlineBuildingStorefront,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineStar,
  HiOutlineCheckBadge,
  HiOutlineTrophy,
  HiOutlineBanknotes,
  HiOutlineRocketLaunch,
  HiOutlineArchiveBox,
  HiOutlineBuildingOffice2,
  HiOutlineChatBubbleLeftRight,
  HiOutlineLockClosed,
  HiOutlineBoltSlash,
  HiOutlineCog6Tooth,
  HiOutlineScissors,
  HiOutlineBeaker,
  HiOutlineGlobeAlt,
  HiOutlineHomeModern,
  HiOutlineCube,
  HiOutlineHeart,
  HiOutlineSun,
  HiOutlineWrench,
  HiOutlineUserGroup,
} from "@/lib/icons";

const POPULAR_SEARCHES = [
  "Solar Panel", "LED Light", "Cement", "Rice", "T-Shirt",
  "Mobile Cover", "Packaging Box", "Steel Pipe", "Hand Sanitizer", "Laptop",
];

const SLIDES = [
  {
    badgeIcon: HiOutlineTrophy,
    badge: "India's #1 B2B Platform",
    title: "Source Smarter.",
    titleHighlight: "Grow Faster.",
    subtitle: "Connect with 2M+ verified manufacturers & suppliers across India. No middlemen. Best wholesale rates guaranteed.",
    cta: "Start Buying Now",
    ctaLink: "/products",
    secondaryCta: "Sell on IndiaMart",
    secondaryLink: "/sell",
    bg: "#0052cc",
    accentColor: "#ffd166",
  },
  {
    badgeIcon: HiOutlineBanknotes,
    badge: "Wholesale Deals Daily",
    title: "Best Prices.",
    titleHighlight: "Direct from Factory.",
    subtitle: "Skip the middlemen and get factory-direct pricing. Compare quotes from hundreds of verified suppliers instantly.",
    cta: "Browse Deals",
    ctaLink: "/products",
    secondaryCta: "Post Requirement",
    secondaryLink: "/post-requirement",
    bg: "#065f46",
    accentColor: "#6ee7b7",
  },
  {
    badgeIcon: HiOutlineRocketLaunch,
    badge: "Grow Your Business",
    title: "Reach Millions.",
    titleHighlight: "Sell Across India.",
    subtitle: "List your products for free and get inquiries from millions of verified buyers. Join 2M+ successful sellers today.",
    cta: "Start Selling Free",
    ctaLink: "/sell",
    secondaryCta: "Learn More",
    secondaryLink: "/help",
    bg: "#4338ca",
    accentColor: "#c4b5fd",
  },
];

const TICKER_ITEMS = [
  "1.2M+ orders processed today",
  "45,000+ new product listings this week",
  "98% buyer satisfaction rate",
  "India's most trusted B2B marketplace since 1999",
  "Free listing for all sellers — join now",
  "10M+ happy buyers across India",
  "Save up to 40% with direct manufacturer pricing",
  "Get 50+ supplier quotes in minutes",
];

const TRUST_BADGES = [
  { icon: HiOutlineShieldCheck, text: "2M+ Verified Suppliers" },
  { icon: HiOutlineCheckBadge, text: "TrustSEAL Certified" },
  { icon: HiOutlineTruck, text: "Pan-India Delivery" },
  { icon: HiOutlineStar, text: "Rated 4.8/5 by Buyers" },
];

const HIGHLIGHT_TILES = [
  { icon: HiOutlineArchiveBox, title: "Bulk Orders", sub: "Min 50 units", tint: "bg-blue-50 text-blue-600" },
  { icon: HiOutlineCheckBadge, title: "Verified", sub: "TrustSEAL", tint: "bg-emerald-50 text-emerald-600" },
  { icon: HiOutlineBuildingOffice2, title: "Manufacturers", sub: "Direct pricing", tint: "bg-violet-50 text-violet-600" },
  { icon: HiOutlineTruck, title: "Fast Shipping", sub: "28K+ pincodes", tint: "bg-orange-50 text-orange-600" },
  { icon: HiOutlineChatBubbleLeftRight, title: "Quick Reply", sub: "Within 2 hours", tint: "bg-teal-50 text-teal-600" },
  { icon: HiOutlineLockClosed, title: "Secure Pay", sub: "Buyer protection", tint: "bg-pink-50 text-pink-600" },
];

const CATEGORY_SHORTCUTS = [
  { label: "Electronics", Icon: HiOutlineBoltSlash, slug: "electronics", color: "text-blue-500 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300" },
  { label: "Machinery", Icon: HiOutlineCog6Tooth, slug: "machinery", color: "text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300" },
  { label: "Textiles", Icon: HiOutlineScissors, slug: "textiles", color: "text-pink-500 bg-pink-50 border-pink-200 hover:bg-pink-100 hover:border-pink-300" },
  { label: "Chemicals", Icon: HiOutlineBeaker, slug: "chemicals", color: "text-emerald-500 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300" },
  { label: "Food & Agro", Icon: HiOutlineGlobeAlt, slug: "food", color: "text-amber-500 bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300" },
  { label: "Building", Icon: HiOutlineHomeModern, slug: "building", color: "text-orange-500 bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300" },
  { label: "Packaging", Icon: HiOutlineArchiveBox, slug: "packaging", color: "text-indigo-500 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300" },
  { label: "Auto Parts", Icon: HiOutlineCube, slug: "automobile", color: "text-red-500 bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300" },
  { label: "Pharma", Icon: HiOutlineHeart, slug: "pharma", color: "text-rose-500 bg-rose-50 border-rose-200 hover:bg-rose-100 hover:border-rose-300" },
  { label: "Solar", Icon: HiOutlineSun, slug: "solar", color: "text-yellow-500 bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300" },
  { label: "Hardware", Icon: HiOutlineWrench, slug: "hardware", color: "text-cyan-500 bg-cyan-50 border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300" },
  { label: "Apparel", Icon: HiOutlineUserGroup, slug: "apparel", color: "text-purple-500 bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300" },
];

export default function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [tickerPaused, setTickerPaused] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((s) => (s + 1) % SLIDES.length);
        setIsTransitioning(false);
      }, 400);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    if (index === currentSlide) return;
    setIsTransitioning(true);
    setTimeout(() => { setCurrentSlide(index); setIsTransitioning(false); }, 400);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  const slide = SLIDES[currentSlide];
  const BadgeIcon = slide.badgeIcon;

  return (
    <div>
      {/* Live Ticker Bar */}
      <div className="bg-[#002d80] text-white py-2 overflow-hidden relative">
        <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-[#002d80] to-transparent z-10" />
        <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-[#002d80] to-transparent z-10" />
        <div
          className={`flex gap-10 whitespace-nowrap text-xs font-medium ${!tickerPaused ? "animate-[ticker_40s_linear_infinite]" : ""}`}
          onMouseEnter={() => setTickerPaused(true)}
          onMouseLeave={() => setTickerPaused(false)}
          style={{ animationPlayState: tickerPaused ? "paused" : "running" }}
        >
          {[...Array(3)].fill(TICKER_ITEMS).flat().map((text, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition cursor-default select-none">
              {text}
              <span className="text-blue-400 mx-2">|</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero Banner */}
      <section className="relative overflow-hidden min-h-[560px] lg:min-h-[600px]" style={{ backgroundColor: slide.bg }}>
        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 transition-all duration-400 ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">

            {/* LEFT CONTENT */}
            <div className="lg:col-span-3">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-5">
                <BadgeIcon className="w-3.5 h-3.5" style={{ color: slide.accentColor }} />
                {slide.badge}
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight mb-2">
                {slide.title}
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-none tracking-tight mb-5" style={{ color: slide.accentColor }}>
                {slide.titleHighlight}
              </h1>
              <p className="text-base sm:text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
                {slide.subtitle}
              </p>

              {/* Search Box */}
              <form onSubmit={handleSearch} className="mb-5">
                <div className="flex bg-white rounded-2xl overflow-hidden shadow-lg max-w-2xl border border-black/10">
                  <div className="flex items-center pl-5 text-gray-400">
                    <HiMagnifyingGlass className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search products, suppliers, categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-4 text-gray-900 placeholder-gray-400 outline-none text-sm sm:text-base font-medium"
                  />
                  <button
                    type="submit"
                    className="bg-[#ff6b00] hover:bg-[#e05a00] px-7 py-4 text-white font-bold flex items-center gap-2 transition-colors text-sm sm:text-base shrink-0"
                  >
                    <HiMagnifyingGlass className="w-5 h-5" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </form>

              {/* Popular Searches */}
              <div className="flex flex-wrap items-center gap-2 mb-8">
                <span className="text-white/50 text-xs font-medium">Popular:</span>
                {POPULAR_SEARCHES.slice(0, 7).map((term) => (
                  <button
                    key={term}
                    onClick={() => router.push(`/products?search=${encodeURIComponent(term)}`)}
                    className="bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-xs px-3 py-1.5 rounded-full transition-colors border border-white/10 hover:border-white/30 font-medium"
                  >
                    {term}
                  </button>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href={slide.ctaLink}
                  className="bg-white text-[#0052cc] px-7 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-md text-sm sm:text-base flex items-center gap-2"
                >
                  {slide.cta}
                  <HiOutlineArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={slide.secondaryLink}
                  className="bg-white/10 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/25 text-sm sm:text-base flex items-center gap-2"
                >
                  <HiOutlineBuildingStorefront className="w-4 h-4" />
                  {slide.secondaryCta}
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3">
                {TRUST_BADGES.map((badge, i) => {
                  const Icon = badge.icon;
                  return (
                    <div key={i} className="flex items-center gap-1.5 bg-white/10 border border-white/15 text-white/80 text-xs px-3 py-1.5 rounded-full">
                      <Icon className="w-4 h-4" />
                      {badge.text}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT PANEL — Platform Highlights */}
            <div className="lg:col-span-2 hidden lg:block">
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900 font-bold text-sm">Platform Highlights</h3>
                  <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    Live
                  </span>
                </div>

                {/* 2x3 Grid of Feature Tiles */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {HIGHLIGHT_TILES.map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={i}
                        className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center"
                      >
                        <div className={`w-10 h-10 rounded-lg ${card.tint} flex items-center justify-center mx-auto mb-2`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className="text-gray-900 text-xs font-bold">{card.title}</p>
                        <p className="text-gray-500 text-[10px] mt-0.5">{card.sub}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Stats Row */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { val: "1.2M+", label: "Orders/Day" },
                      { val: "45K+", label: "New Listings" },
                      { val: "98%", label: "Satisfaction" },
                    ].map((stat, i) => (
                      <div key={i}>
                        <p className="text-gray-900 text-xl font-black">{stat.val}</p>
                        <p className="text-gray-500 text-[10px] mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buyer / Seller counts */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-xs">
                  <span className="flex items-center gap-1.5 text-gray-600 font-semibold">
                    <HiOutlineUserGroup className="w-4 h-4 text-[#0052cc]" />
                    10M+ Happy Buyers
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-600 font-semibold">
                    <HiOutlineCheckBadge className="w-4 h-4 text-emerald-600" />
                    2M+ Verified Sellers
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "w-8 bg-white" : "w-2 bg-white/35 hover:bg-white/55"}`}
            />
          ))}
        </div>
      </section>

      {/* Quick Category Shortcuts */}
      <div className="bg-white border-b border-gray-100 py-2.5">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 px-4 sm:px-6 lg:px-8 min-w-max w-full">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">QUICK:</span>
            {CATEGORY_SHORTCUTS.map(({ label, Icon, slug, color }) => (
              <Link
                key={slug}
                href={`/products?category=${slug}`}
                className={`flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${color}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </Link>
            ))}
            <div className="w-4 shrink-0" />{/* right padding spacer */}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
