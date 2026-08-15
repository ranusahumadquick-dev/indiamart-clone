"use client";

import { useEffect, useRef, useState } from "react";
import {
  HiOutlineUsers,
  HiOutlineBuildingLibrary,
  HiOutlineGlobeAlt,
  HiOutlineCheckCircle,
  HiOutlineCube,
  HiOutlineStar,
  HiOutlineTrophy,
  HiOutlineClock,
} from "@/lib/icons";

const STATS = [
  {
    icon: HiOutlineUsers,
    endValue: 10,
    suffix: "M+",
    label: "Registered Buyers",
    sublabel: "Active monthly users",
    color: "from-blue-400 to-blue-600",
    bg: "bg-blue-500/10",
  },
  {
    icon: HiOutlineBuildingLibrary,
    endValue: 2,
    suffix: "M+",
    label: "Verified Suppliers",
    sublabel: "TrustSEAL certified",
    color: "from-emerald-400 to-emerald-600",
    bg: "bg-emerald-500/10",
  },
  {
    icon: HiOutlineCube,
    endValue: 50,
    suffix: "M+",
    label: "Products Listed",
    sublabel: "Across 100+ categories",
    color: "from-purple-400 to-purple-600",
    bg: "bg-purple-500/10",
  },
  {
    icon: HiOutlineGlobeAlt,
    endValue: 28,
    suffix: "K+",
    label: "Pin Codes Served",
    sublabel: "Pan-India delivery",
    color: "from-orange-400 to-orange-600",
    bg: "bg-orange-500/10",
  },
  {
    icon: HiOutlineCheckCircle,
    endValue: 100,
    suffix: "M+",
    label: "Enquiries Sent",
    sublabel: "Business connections made",
    color: "from-teal-400 to-teal-600",
    bg: "bg-teal-500/10",
  },
  {
    icon: HiOutlineStar,
    endValue: 4.8,
    suffix: "/5",
    label: "Buyer Rating",
    sublabel: "Avg. platform satisfaction",
    color: "from-yellow-400 to-amber-500",
    bg: "bg-yellow-500/10",
  },
];

function AnimatedCounter({ endValue, suffix, duration = 2000 }: { endValue: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const isDecimal = endValue % 1 !== 0;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = endValue * eased;
      setCount(isDecimal ? Math.round(current * 10) / 10 : Math.round(current));
      if (currentStep >= steps) clearInterval(timer);
    }, stepDuration);

    return () => clearInterval(timer);
  }, [started, endValue, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}{suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="py-16 sm:py-24 relative overflow-hidden bg-[#001a4d]">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexgrid" width="50" height="43" patternUnits="userSpaceOnUse">
              <polygon points="25,2 48,15 48,37 25,50 2,37 2,15" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexgrid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-blue-200 text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-5">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Platform Statistics
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Trusted by Millions
          </h2>
          <p className="text-blue-200/80 max-w-2xl mx-auto text-base">
            India's largest B2B marketplace — numbers that speak for themselves
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 hover:border-white/25 transition-all duration-300 hover:-translate-y-2 text-center overflow-hidden"
              >
                {/* Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />

                {/* Icon */}
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <div className={`bg-gradient-to-br ${stat.color} bg-clip-text`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Counter */}
                <p className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight">
                  <AnimatedCounter endValue={stat.endValue} suffix={stat.suffix} />
                </p>

                <p className="text-white/80 text-xs font-semibold mb-0.5 leading-tight">{stat.label}</p>
                <p className="text-white/40 text-[10px] leading-tight">{stat.sublabel}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-center">
          {[
            { icon: HiOutlineTrophy, text: "India's #1 B2B Marketplace" },
            { icon: HiOutlineClock, text: "Since 1999 — 25 Years of Trust" },
            { icon: HiOutlineGlobeAlt, text: "Serving 100+ Countries" },
          ].map((item, i) => (
            <span key={i} className="text-blue-200/70 text-sm font-medium flex items-center gap-2">
              <item.icon className="w-4 h-4" />
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
