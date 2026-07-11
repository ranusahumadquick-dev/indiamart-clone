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
  HiOutlineSparkles,
  HiOutlineBoltSlash,
  HiOutlineCog6Tooth,
  HiOutlineScissors,
  HiOutlineBeaker,
  HiOutlineGlobeAlt,
  HiOutlineHomeModern,
  HiOutlineArchiveBox,
  HiOutlineCube,
  HiOutlineHeart,
  HiOutlineSun,
  HiOutlineWrench,
  HiOutlineUserGroup,
} from "react-icons/hi2";

const POPULAR_SEARCHES = [
  "Solar Panel", "LED Light", "Cement", "Rice", "T-Shirt",
  "Mobile Cover", "Packaging Box", "Steel Pipe", "Hand Sanitizer", "Laptop",
];

const SLIDES = [
  {
    badge: "🏆 India's #1 B2B Platform",
    title: "Source Smarter.",
    titleHighlight: "Grow Faster.",
    subtitle: "Connect with 2M+ verified manufacturers & suppliers across India. No middlemen. Best wholesale rates guaranteed.",
    cta: "Start Buying Now",
    ctaLink: "/products",
    secondaryCta: "Sell on IndiaMart",
    secondaryLink: "/sell",
    bg: "from-[#0052cc] via-[#0066ff] to-[#1a75ff]",
    accentColor: "#fbbf24",
  },
  {
    badge: "💰 Wholesale Deals Daily",
    title: "Best Prices.",
    titleHighlight: "Direct from Factory.",
    subtitle: "Skip the middlemen and get factory-direct pricing. Compare quotes from hundreds of verified suppliers instantly.",
    cta: "Browse Deals",
    ctaLink: "/products",
    secondaryCta: "Post Requirement",
    secondaryLink: "/post-requirement",
    bg: "from-[#065f46] via-[#047857] to-[#059669]",
    accentColor: "#34d399",
  },
  {
    badge: "🚀 Grow Your Business",
    title: "Reach Millions.",
    titleHighlight: "Sell Across India.",
    subtitle: "List your products for free and get inquiries from millions of verified buyers. Join 2M+ successful sellers today.",
    cta: "Start Selling Free",
    ctaLink: "/sell",
    secondaryCta: "Learn More",
    secondaryLink: "/help",
    bg: "from-[#7c3aed] via-[#6d28d9] to-[#4f46e5]",
    accentColor: "#a78bfa",
  },
];

const TRUST_BADGES = [
  { icon: <HiOutlineShieldCheck className="w-4 h-4" />, text: "2M+ Verified Suppliers" },
  { icon: <HiOutlineCheckBadge className="w-4 h-4" />, text: "TrustSEAL Certified" },
  { icon: <HiOutlineTruck className="w-4 h-4" />, text: "Pan-India Delivery" },
  { icon: <HiOutlineStar className="w-4 h-4" />, text: "Rated 4.8/5 by Buyers" },
];

const FLOATING_CARDS = [
  { emoji: "📦", title: "Bulk Orders", sub: "Min 50 units", color: "from-blue-500 to-blue-600" },
  { emoji: "✅", title: "Verified", sub: "TrustSEAL", color: "from-green-500 to-green-600" },
  { emoji: "🏭", title: "Manufacturers", sub: "Direct pricing", color: "from-purple-500 to-purple-600" },
  { emoji: "🚚", title: "Fast Shipping", sub: "28K+ pincodes", color: "from-orange-500 to-orange-600" },
  { emoji: "💬", title: "Quick Reply", sub: "Within 2 hours", color: "from-teal-500 to-teal-600" },
  { emoji: "🔒", title: "Secure Pay", sub: "Buyer protection", color: "from-pink-500 to-pink-600" },
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
          {[...Array(3)].fill([
            "🔥 1.2M+ Orders Processed Today",
            "⚡ 45,000+ New Product Listings This Week",
            "✅ 98% Buyer Satisfaction Rate",
            "🏆 India's Most Trusted B2B Marketplace Since 1999",
            "📦 Free Listing for All Sellers — Join Now!",
            "🌟 10M+ Happy Buyers Across India",
            "💰 Save up to 40% with Direct Manufacturer Pricing",
            "🚀 Get 50+ Supplier Quotes in Minutes",
          ]).flat().map((text, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition cursor-default select-none">
              {text}
              <span className="text-blue-400 mx-2">|</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero Banner */}
      <section className="relative overflow-hidden min-h-[560px] lg:min-h-[600px]">
        {/* Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${slide.bg} transition-all duration-700`} />

        {/* Animated Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl animate-[float_6s_ease-in-out_infinite_reverse]" />
          <div className="absolute top-1/2 right-1/3 w-[200px] h-[200px] rounded-full bg-white/8 blur-2xl animate-[float_4s_ease-in-out_infinite]" />
          {/* Dot grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 transition-all duration-400 ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">

            {/* LEFT CONTENT */}
            <div className="lg:col-span-3">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-5">
                <HiOutlineSparkles className="w-3.5 h-3.5" style={{ color: slide.accentColor }} />
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
                <div className="flex bg-white rounded-2xl overflow-hidden shadow-2xl shadow-black/30 max-w-2xl border-2 border-white/20">
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
                    className="bg-[#ff6b00] hover:bg-[#e05a00] px-7 py-4 text-white font-bold flex items-center gap-2 transition-all text-sm sm:text-base shrink-0"
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
                    className="bg-white/10 hover:bg-white/25 backdrop-blur-sm text-white/90 hover:text-white text-xs px-3 py-1.5 rounded-full transition-all border border-white/10 hover:border-white/30 font-medium"
                  >
                    {term}
                  </button>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href={slide.ctaLink}
                  className="bg-white text-[#0052cc] px-7 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-0.5 text-sm sm:text-base flex items-center gap-2"
                >
                  {slide.cta}
                  <HiOutlineArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={slide.secondaryLink}
                  className="bg-white/10 backdrop-blur-sm text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/25 text-sm sm:text-base flex items-center gap-2"
                >
                  <HiOutlineBuildingStorefront className="w-4 h-4" />
                  {slide.secondaryCta}
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3">
                {TRUST_BADGES.map((badge, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 text-white/80 text-xs px-3 py-1.5 rounded-full">
                    {badge.icon}
                    {badge.text}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT PANEL — Floating Cards Grid */}
            <div className="lg:col-span-2 hidden lg:block">
              <div className="relative">
                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-sm">Platform Highlights</h3>
                    <span className="flex items-center gap-1.5 text-green-300 text-xs font-medium">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Live
                    </span>
                  </div>

                  {/* 2x3 Grid of Feature Tiles */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {FLOATING_CARDS.map((card, i) => (
                      <div
                        key={i}
                        className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-0.5 cursor-default"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-xl mx-auto mb-2 shadow-lg`}>
                          {card.emoji}
                        </div>
                        <p className="text-white text-xs font-bold">{card.title}</p>
                        <p className="text-white/50 text-[10px] mt-0.5">{card.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Stats Row */}
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { val: "1.2M+", label: "Orders/Day" },
                        { val: "45K+", label: "New Listings" },
                        { val: "98%", label: "Satisfaction" },
                      ].map((stat, i) => (
                        <div key={i}>
                          <p className="text-white text-xl font-black">{stat.val}</p>
                          <p className="text-white/50 text-[10px] mt-0.5">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -top-4 -right-4 bg-[#ff6b00] text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-xl animate-bounce flex items-center gap-1.5">
                  🎉 10M+ Happy Buyers
                </div>
                <div className="absolute -bottom-4 -left-4 bg-green-500 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-xl">
                  ✅ 2M+ Verified Sellers
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
            {[
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
            ].map(({ label, Icon, slug, color }) => (
              <Link
                key={slug}
                href={`/products?category=${slug}`}
                className={`flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${color}`}
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
