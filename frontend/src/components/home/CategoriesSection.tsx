"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HiOutlineArrowRight } from "react-icons/hi2";
import api from "@/lib/axios";

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  productCount?: number;
}

const CATEGORIES = [
  { _id: "1", name: "Electronics", slug: "electronics", icon: "🔌", productCount: 5200, gradient: "from-blue-500 to-blue-600", light: "bg-blue-50 border-blue-200 hover:border-blue-400", iconBg: "bg-blue-100" },
  { _id: "2", name: "Machinery", slug: "machinery", icon: "⚙️", productCount: 3800, gradient: "from-slate-500 to-slate-600", light: "bg-slate-50 border-slate-200 hover:border-slate-400", iconBg: "bg-slate-100" },
  { _id: "3", name: "Textiles", slug: "textiles", icon: "🧵", productCount: 4100, gradient: "from-pink-500 to-rose-600", light: "bg-pink-50 border-pink-200 hover:border-pink-400", iconBg: "bg-pink-100" },
  { _id: "4", name: "Chemicals", slug: "chemicals", icon: "🧪", productCount: 2900, gradient: "from-emerald-500 to-emerald-600", light: "bg-emerald-50 border-emerald-200 hover:border-emerald-400", iconBg: "bg-emerald-100" },
  { _id: "5", name: "Food & Agro", slug: "food", icon: "🌾", productCount: 3500, gradient: "from-amber-500 to-amber-600", light: "bg-amber-50 border-amber-200 hover:border-amber-400", iconBg: "bg-amber-100" },
  { _id: "6", name: "Construction", slug: "building", icon: "🏗️", productCount: 2700, gradient: "from-orange-500 to-orange-600", light: "bg-orange-50 border-orange-200 hover:border-orange-400", iconBg: "bg-orange-100" },
  { _id: "7", name: "Packaging", slug: "packaging", icon: "📦", productCount: 1800, gradient: "from-indigo-500 to-indigo-600", light: "bg-indigo-50 border-indigo-200 hover:border-indigo-400", iconBg: "bg-indigo-100" },
  { _id: "8", name: "Automobile", slug: "automobile", icon: "🚗", productCount: 2300, gradient: "from-red-500 to-red-600", light: "bg-red-50 border-red-200 hover:border-red-400", iconBg: "bg-red-100" },
  { _id: "9", name: "Apparel", slug: "apparel", icon: "👔", productCount: 4600, gradient: "from-purple-500 to-purple-600", light: "bg-purple-50 border-purple-200 hover:border-purple-400", iconBg: "bg-purple-100" },
  { _id: "10", name: "Pharma", slug: "pharma", icon: "💊", productCount: 1500, gradient: "from-teal-500 to-teal-600", light: "bg-teal-50 border-teal-200 hover:border-teal-400", iconBg: "bg-teal-100" },
  { _id: "11", name: "Hardware", slug: "hardware", icon: "🔧", productCount: 2100, gradient: "from-cyan-500 to-cyan-600", light: "bg-cyan-50 border-cyan-200 hover:border-cyan-400", iconBg: "bg-cyan-100" },
  { _id: "12", name: "Solar & Energy", slug: "solar", icon: "☀️", productCount: 900, gradient: "from-yellow-500 to-yellow-600", light: "bg-yellow-50 border-yellow-200 hover:border-yellow-400", iconBg: "bg-yellow-100" },
];

export default function CategoriesSection() {
  const [categories, setCategories] = useState(CATEGORIES);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/categories?limit=12").then((res) => {
      if (res.data?.success && res.data?.data?.categories?.length > 0) {
        setCategories(
          res.data.data.categories.map((cat: Category, i: number) => ({
            ...CATEGORIES[i % CATEGORIES.length],
            ...cat,
            icon: CATEGORIES[i % CATEGORIES.length].icon,
          }))
        );
      }
    }).catch(() => {});
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-8 bg-[#0052cc] rounded-full" />
              <span className="text-[#0052cc] text-xs font-bold uppercase tracking-widest">Categories</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              Shop by Category
            </h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Explore 50M+ products across 100+ categories from verified suppliers
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-[#0052cc] font-semibold hover:gap-3 transition-all text-sm group"
          >
            View All Categories
            <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/products?category=${cat.slug}`}
              className={`group relative border-2 ${cat.light} rounded-2xl p-4 sm:p-5 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2 overflow-hidden`}
              onMouseEnter={() => setHoveredId(cat._id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />

              <div className="relative z-10">
                {/* Icon */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 ${cat.iconBg} group-hover:bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110`}>
                  <span className="text-2xl sm:text-3xl">{cat.icon}</span>
                </div>

                {/* Name */}
                <h3 className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-white transition-colors duration-300 leading-tight">
                  {cat.name}
                </h3>

                {/* Count */}
                <p className="text-[10px] sm:text-xs text-gray-500 group-hover:text-white/70 transition-colors duration-300 mt-1">
                  {((cat.productCount || 0) / 1000).toFixed(1)}K+ products
                </p>
              </div>

              {/* Shimmer on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />
            </Link>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-10 bg-gradient-to-r from-[#0052cc] to-[#1a75ff] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold mb-1">Can't find what you need?</h3>
            <p className="text-blue-100 text-sm">Post your requirement and get quotes from 100+ verified suppliers</p>
          </div>
          <Link
            href="/post-requirement"
            className="shrink-0 bg-white text-[#0052cc] font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 text-sm"
          >
            Post Requirement
            <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
