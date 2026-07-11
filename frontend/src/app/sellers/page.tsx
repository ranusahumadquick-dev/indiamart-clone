"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import SellerShortlistButton from "@/components/ui/SellerShortlistButton";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineXCircle,
  HiOutlineShieldCheck,
  HiOutlineBuildingStorefront,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCubeTransparent,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineReceiptPercent,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineCheckBadge,
  HiOutlineFunnel,
  HiMiniShieldCheck,
} from "react-icons/hi2";

interface Seller {
  _id: string;
  name: string;
  companyName?: string;
  avatar?: string;
  businessType?: string;
  businessDescription?: string;
  city?: string;
  state?: string;
  isVerified?: boolean;
  hasGST?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  yearEstablished?: number;
  avgResponseTime?: number;
  replyCount?: number;
  productCount: number;
}

const BUSINESS_TYPES = [
  "All",
  "Manufacturer",
  "Supplier",
  "Exporter",
  "Wholesaler",
  "Trader",
  "Service Provider",
];

// Compute a trust score 0–4 based on available verification signals
function getTrustScore(seller: Seller) {
  let score = 0;
  if (seller.isVerified) score += 2;
  if (seller.hasGST) score += 1;
  if (seller.isEmailVerified) score += 0.5;
  if (seller.isPhoneVerified) score += 0.5;
  return Math.min(score, 4);
}

function TrustBar({ seller }: { seller: Seller }) {
  const score = getTrustScore(seller);
  const pct = (score / 4) * 100;
  const color = score >= 3 ? "bg-green-500" : score >= 2 ? "bg-blue-500" : score >= 1 ? "bg-amber-500" : "bg-gray-300";
  const label = score >= 3 ? "Highly Trusted" : score >= 2 ? "Verified" : score >= 1 ? "Partially Verified" : "Unverified";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-medium ${score >= 3 ? "text-green-600" : score >= 2 ? "text-blue-600" : score >= 1 ? "text-amber-600" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}

function VerifiedBadge({ type }: { type: "platform" | "gst" | "email" | "phone" }) {
  const configs = {
    platform: {
      icon: <HiMiniShieldCheck className="w-3 h-3" />,
      label: "Verified",
      cls: "bg-blue-600 text-white",
      title: "Platform Verified Supplier",
    },
    gst: {
      icon: <HiOutlineReceiptPercent className="w-3 h-3" />,
      label: "GST",
      cls: "bg-green-600 text-white",
      title: "GST Registered Business",
    },
    email: {
      icon: <HiOutlineEnvelope className="w-3 h-3" />,
      label: "Email",
      cls: "bg-gray-100 text-gray-600",
      title: "Email Verified",
    },
    phone: {
      icon: <HiOutlinePhone className="w-3 h-3" />,
      label: "Phone",
      cls: "bg-gray-100 text-gray-600",
      title: "Phone Verified",
    },
  };
  const c = configs[type];
  return (
    <span title={c.title} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.cls}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

function SellerCard({ seller }: { seller: Seller }) {
  const initials = (seller.companyName || seller.name || "S")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3 ${seller.isVerified ? "border-blue-100" : "border-gray-100"}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 overflow-hidden relative ${seller.isVerified ? "bg-blue-600" : "bg-[var(--primary)]"} text-white`}>
          {seller.avatar ? (
            <img src={seller.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
          {seller.isVerified && (
            <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow">
              <HiMiniShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-gray-800 text-sm truncate max-w-[140px]">
              {seller.companyName || seller.name}
            </h3>
          </div>

          {/* Verification badges row */}
          <div className="flex flex-wrap gap-1 mt-1">
            {seller.isVerified && <VerifiedBadge type="platform" />}
            {seller.hasGST && <VerifiedBadge type="gst" />}
            {seller.isEmailVerified && <VerifiedBadge type="email" />}
            {seller.isPhoneVerified && <VerifiedBadge type="phone" />}
          </div>

          {seller.businessType && (
            <span className="inline-block mt-1 text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">
              {seller.businessType.replace(/_/g, " ")}
            </span>
          )}
        </div>

        <SellerShortlistButton sellerId={seller._id} iconSize="w-5 h-5" />
      </div>

      {/* Location */}
      {(seller.city || seller.state) && (
        <p className="text-xs text-gray-400 flex items-center gap-1 -mt-1">
          <HiOutlineMapPin className="w-3 h-3" />
          {[seller.city, seller.state].filter(Boolean).join(", ")}
          {seller.yearEstablished && (
            <span className="ml-2 text-gray-300">· Est. {seller.yearEstablished}</span>
          )}
        </p>
      )}

      {/* Description */}
      {seller.businessDescription && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {seller.businessDescription}
        </p>
      )}

      {/* Trust bar */}
      <TrustBar seller={seller} />

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <HiOutlineCubeTransparent className="w-3.5 h-3.5" />
          {seller.productCount} Products
        </span>
        {seller.avgResponseTime != null && seller.avgResponseTime > 0 && (
          <span className="flex items-center gap-1">
            <HiOutlineClock className="w-3.5 h-3.5" />
            ~{seller.avgResponseTime}m response
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-gray-50">
        <Link
          href={`/sellers/${seller._id}`}
          className="flex-1 text-center text-xs font-medium border border-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
        >
          View Profile
        </Link>
        <Link
          href={`/sellers/${seller._id}`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-[var(--primary)] text-white py-2 rounded-lg hover:opacity-90 transition"
        >
          <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
          Chat
        </Link>
      </div>
    </div>
  );
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [gstOnly, setGstOnly] = useState(false);
  const [page, setPage] = useState(1);

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "18" });
      if (search) params.set("search", search);
      if (activeType !== "All") params.set("category", activeType);
      if (verifiedOnly) params.set("verified", "true");
      if (gstOnly) params.set("hasGST", "true");
      const res = await api.get(`/sellers?${params}`);
      setSellers(res.data.data?.sellers || []);
      setTotal(res.data.data?.total || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, activeType, verifiedOnly, gstOnly, page]);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const resetFilters = () => {
    setVerifiedOnly(false);
    setGstOnly(false);
    setActiveType("All");
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const activeFilterCount = (verifiedOnly ? 1 : 0) + (gstOnly ? 1 : 0) + (activeType !== "All" ? 1 : 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <HiOutlineBuildingStorefront className="w-6 h-6 text-[var(--primary)]" />
          Supplier Directory
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {total.toLocaleString()} suppliers — find verified &amp; GST-registered businesses
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-4">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by company name, product type, city, state…"
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <HiOutlineXCircle className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Verification filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => { setVerifiedOnly((v) => !v); setPage(1); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            verifiedOnly
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
          }`}
        >
          <HiMiniShieldCheck className="w-3.5 h-3.5" />
          Verified Suppliers
          {verifiedOnly && <span className="ml-1">✓</span>}
        </button>

        <button
          onClick={() => { setGstOnly((v) => !v); setPage(1); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            gstOnly
              ? "bg-green-600 text-white border-green-600 shadow-sm"
              : "bg-white text-green-600 border-green-200 hover:bg-green-50"
          }`}
        >
          <HiOutlineReceiptPercent className="w-3.5 h-3.5" />
          GST Registered
          {gstOnly && <span className="ml-1">✓</span>}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-all"
          >
            <HiOutlineXCircle className="w-3.5 h-3.5" />
            Clear filters ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Business type filter chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {BUSINESS_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => { setActiveType(type); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
              ${activeType === type
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Active filters summary */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
          <HiOutlineFunnel className="w-3.5 h-3.5" />
          Showing {total} results
          {verifiedOnly && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Platform Verified</span>}
          {gstOnly && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">GST Registered</span>}
          {activeType !== "All" && <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">{activeType}</span>}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <div className="text-center py-16">
          <HiOutlineCheckBadge className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">No suppliers found</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            {activeFilterCount > 0
              ? "Try removing some filters to see more results"
              : search
              ? "Try different keywords"
              : "No verified suppliers yet"}
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-sm text-[var(--primary)] hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellers.map((seller) => (
              <SellerCard key={seller._id} seller={seller} />
            ))}
          </div>

          {/* Pagination */}
          {total > 18 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">
                Page {page} of {Math.ceil(total / 18)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 18)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
