"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HiOutlineArrowRight,
  HiOutlineShieldCheck,
  HiOutlineMapPin,
  HiOutlineStar,
  HiOutlineBuildingOffice2,
  HiOutlineClock,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckBadge,
} from "@/lib/icons";
import api from "@/lib/axios";

interface Seller {
  _id: string;
  user?: { _id: string; fullName: string };
  companyName?: string;
  businessType?: string;
  city?: string;
  state?: string;
  yearEstablished?: number;
  isTrusted?: boolean;
  trustScore?: number;
  totalProducts?: number;
  rating?: number;
  numReviews?: number;
  categories?: string[];
}

const FALLBACK_SELLERS = [
  {
    _id: "1",
    companyName: "Shree Ganesh Industries",
    businessType: "Manufacturer & Exporter",
    city: "Mumbai", state: "Maharashtra",
    yearEstablished: 2010, isTrusted: true, trustScore: 92,
    totalProducts: 450, rating: 4.8, numReviews: 320,
    categories: ["Electronics", "Components", "PCB"],
  },
  {
    _id: "2",
    companyName: "Patel Textile Exports",
    businessType: "Manufacturer & Exporter",
    city: "Surat", state: "Gujarat",
    yearEstablished: 2005, isTrusted: true, trustScore: 95,
    totalProducts: 780, rating: 4.9, numReviews: 560,
    categories: ["Textiles", "Fabrics", "Yarn"],
  },
  {
    _id: "3",
    companyName: "Delhi Steel Works",
    businessType: "Manufacturer",
    city: "Delhi", state: "Delhi",
    yearEstablished: 2015, isTrusted: true, trustScore: 88,
    totalProducts: 230, rating: 4.6, numReviews: 180,
    categories: ["Hardware", "Steel", "Pipes"],
  },
  {
    _id: "4",
    companyName: "Bangalore Solar Solutions",
    businessType: "Manufacturer & Supplier",
    city: "Bangalore", state: "Karnataka",
    yearEstablished: 2018, isTrusted: true, trustScore: 91,
    totalProducts: 120, rating: 4.7, numReviews: 95,
    categories: ["Solar", "Energy", "Inverters"],
  },
];

const AVATARS_COLORS = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-emerald-500 to-emerald-600",
  "from-orange-500 to-orange-600",
];

export default function TopSuppliersSection() {
  const [sellers, setSellers] = useState<Seller[]>(FALLBACK_SELLERS);

  useEffect(() => {
    api.get("/sellers?limit=4&sortBy=trustScore").then((res) => {
      if (res.data?.success && res.data?.data?.sellers?.length > 0) {
        setSellers(res.data.data.sellers);
      }
    }).catch(() => {});
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-8 bg-emerald-500 rounded-full" />
              <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest">Verified</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
              Top Verified Suppliers
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Trusted manufacturers & wholesalers with the highest trust scores
            </p>
          </div>
          <Link
            href="/sellers"
            className="inline-flex items-center gap-2 text-[#0052cc] font-semibold hover:gap-3 transition-all text-sm group"
          >
            View All Suppliers
            <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Supplier Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {sellers.map((seller, idx) => {
            const location = [seller.city, seller.state].filter(Boolean).join(", ");
            const years = seller.yearEstablished ? new Date().getFullYear() - seller.yearEstablished : 0;
            const colorClass = AVATARS_COLORS[idx % AVATARS_COLORS.length];
            const trustScore = seller.trustScore || 85;

            return (
              <Link
                key={seller._id}
                href={`/sellers/${seller._id}`}
                className="group bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-50 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
              >
                {/* Top Gradient Bar */}
                <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

                {/* Verified Banner */}
                {seller.isTrusted && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 px-4 py-2 flex items-center gap-1.5">
                    <HiOutlineCheckBadge className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">GST & TrustSEAL Verified</span>
                  </div>
                )}

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-xl font-black shrink-0 shadow-lg`}>
                      {(seller.companyName || "S")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm group-hover:text-emerald-600 transition-colors leading-tight truncate">
                        {seller.companyName || "Company"}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">{seller.businessType || "Supplier"}</p>
                      {/* Stars */}
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map((s) => (
                          <HiOutlineStar key={s} className={`w-3 h-3 ${s <= Math.round(seller.rating || 0) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                        ))}
                        <span className="text-[10px] text-gray-500 ml-0.5">({seller.numReviews || 0})</span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <HiOutlineMapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{location || "India"}</span>
                    </div>
                    {years > 0 && (
                      <div className="flex items-center gap-2">
                        <HiOutlineClock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{years}+ years in business</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <HiOutlineBuildingOffice2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{seller.totalProducts || 0} products listed</span>
                    </div>
                  </div>

                  {/* Trust Score Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-semibold text-gray-600">Trust Score</span>
                      <span className="text-xs font-black text-emerald-600">{trustScore}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-1000"
                        style={{ width: `${trustScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Category Tags */}
                  {seller.categories && seller.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {seller.categories.slice(0, 3).map((cat, i) => (
                        <span key={i} className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex gap-2">
                    <span className="flex-1 text-center bg-emerald-50 text-emerald-700 text-xs font-bold py-2.5 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 flex items-center justify-center gap-1.5">
                      <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
                      Contact
                    </span>
                    <span className="flex-1 text-center bg-gray-50 text-gray-700 text-xs font-bold py-2.5 rounded-xl group-hover:bg-[#0052cc] group-hover:text-white transition-all duration-300 flex items-center justify-center gap-1.5">
                      View Profile
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
