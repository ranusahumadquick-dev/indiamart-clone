"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HiOutlineMapPin,
  HiStar,
  HiOutlineStar,
  HiOutlineShieldCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowsRightLeft,
  HiOutlineHeart,
  HiHeart,
  HiOutlineXMark,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { HiMiniShieldCheck } from "react-icons/hi2";
import WishlistButton from "./WishlistButton";
import { useCompare } from "@/contexts/CompareContext";
import { useBulkInquiry } from "@/contexts/BulkInquiryContext";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// ─── Types ──────────────────────────────────────────────────────────
interface ProductCardProps {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number;
  images: { url: string; alt?: string }[];
  city?: string;
  state?: string;
  companyName?: string;
  averageRating?: number;
  numReviews?: number;
  minOrderQuantity?: number;
  priceUnit?: string;
  isVerified?: boolean;
  category?: string;
  brand?: { _id: string; brandName: string } | null;
  badge?: "new" | "bestseller" | "hot" | "limited" | null;
  stock?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────
function formatINR(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const diff = rating - i;
        return (
          <span key={i} className="relative inline-block w-3.5 h-3.5">
            <HiOutlineStar className="w-3.5 h-3.5 text-gray-200 absolute inset-0" />
            {diff >= 1 && <HiStar className="w-3.5 h-3.5 text-amber-400 absolute inset-0" />}
            {diff > 0 && diff < 1 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <HiStar className="w-3.5 h-3.5 text-amber-400" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ─── ProductImage with fallback ──────────────────────────────────────
function CardImage({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (err || !src) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-1">
        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs text-gray-400">No Image</span>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setErr(true)}
        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}

// ─── TrustSEAL Popup ────────────────────────────────────────────────
function TrustPopup({ companyName, productId, onClose }: { companyName?: string; productId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
              <HiMiniShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">TrustSEAL Verified</h3>
              <p className="text-[10px] text-blue-600 font-medium">by IndiaMart</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><HiOutlineXMark className="w-5 h-5" /></button>
        </div>
        <div className="space-y-2 mb-4">
          {["Identity & business documents verified", "GST registration confirmed", "Company details validated", "Regular compliance checks"].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <HiOutlineCheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span className="text-xs text-gray-700">{item}</span>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 mb-3">
          <strong>{companyName || "This seller"}</strong> has been verified by our team.
        </div>
        <div className="flex gap-2">
          <Link href={`/products/${productId}`} onClick={onClose} className="flex-1 text-center py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition">View Product</Link>
          <button onClick={onClose} className="px-3 py-2 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
const ProductCard = ({
  _id, name, price, comparePrice, images, city, state,
  companyName, averageRating = 0, numReviews = 0,
  minOrderQuantity, priceUnit = "Piece",
  isVerified = false, category, brand, badge = null, stock = 999,
}: ProductCardProps) => {
  const { addItem, removeItem, isInCompare } = useCompare();
  const { addItem: addToBulk, removeItem: removeFromBulk, isInBulk } = useBulkInquiry();
  const inCompare = isInCompare(_id);
  const inBulk = isInBulk(_id);
  const [showTrust, setShowTrust] = useState(false);
  const protect = useProtectedAction();
  const router = useRouter();

  const discount = comparePrice && comparePrice > price
    ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

  const location = [city, state].filter(Boolean).join(", ");
  const imageSrc = images?.[0]?.url || "";
  const isOutOfStock = stock === 0;

  const handleBulkToggle = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (inBulk) { removeFromBulk(_id); toast("Removed from bulk inquiry", { icon: "📋" }); }
    else { const ok = addToBulk({ _id, name, price, priceUnit, images }); ok ? toast.success("Added to bulk inquiry") : toast.error("Bulk inquiry is full (max 10)"); }
  };

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (inCompare) { removeItem(_id); toast("Removed from compare", { icon: "📊" }); }
    else { const ok = addItem({ _id, name, price, comparePrice, images, city, state, companyName, averageRating, numReviews, minOrderQuantity, priceUnit, isVerified, category }); ok ? toast.success("Added to compare") : toast.error("Max 4 products"); }
  };

  return (
    <>
      <div className="group relative bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden">

        {/* ── Image ── */}
        <Link href={`/products/${_id}`} className="block relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
          <CardImage src={imageSrc} alt={name} />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Stock badge */}
          {isOutOfStock ? (
            <span className="absolute top-2.5 left-2.5 bg-gray-800/90 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">
              OUT OF STOCK
            </span>
          ) : discount > 0 ? (
            <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
              {discount}% OFF
            </span>
          ) : badge ? (
            <span className={`absolute top-2.5 left-2.5 text-white text-[10px] font-bold px-2 py-1 rounded-md
              ${{ new: "bg-green-500", bestseller: "bg-purple-500", hot: "bg-orange-500", limited: "bg-red-600" }[badge]}`}>
              {{ new: "NEW", bestseller: "BESTSELLER", hot: "HOT DEAL", limited: "LIMITED" }[badge]}
            </span>
          ) : stock > 0 && stock <= 10 ? (
            <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
              Only {stock} left
            </span>
          ) : null}

          {/* TrustSEAL */}
          {isVerified && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTrust(true); }}
              className="absolute top-2.5 right-2.5 bg-blue-600/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-1 rounded-md flex items-center gap-0.5 hover:bg-blue-700 transition-colors"
            >
              <HiMiniShieldCheck className="w-3 h-3" /> TrustSEAL
            </button>
          )}

          {/* Action icons — visible on hover */}
          <div className="absolute bottom-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
            <div className="bg-white/95 rounded-full p-1.5 shadow-md hover:bg-blue-50 transition-colors">
              <WishlistButton productId={_id} iconSize="w-3.5 h-3.5" />
            </div>
            <button
              onClick={handleCompareToggle}
              title={inCompare ? "Remove from compare" : "Compare"}
              className={`bg-white/95 rounded-full p-1.5 shadow-md transition-colors ${inCompare ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"}`}
            >
              <HiOutlineArrowsRightLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleBulkToggle}
              title={inBulk ? "Remove from bulk" : "Add to bulk inquiry"}
              className={`bg-white/95 rounded-full p-1.5 shadow-md transition-colors ${inBulk ? "text-orange-500 bg-orange-50" : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"}`}
            >
              <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Link>

        {/* ── Body ── */}
        <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-1.5">

          {/* Seller */}
          <p className="text-[11px] font-semibold truncate flex items-center gap-1 text-blue-600 h-4">
            {isVerified && <HiOutlineShieldCheck className="w-3 h-3 shrink-0" />}
            {companyName || <span className="text-gray-300">—</span>}
          </p>

          {/* Product name — always 2 lines */}
          <Link href={`/products/${_id}`}>
            <h3 className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-[1.35] h-[2.7em] group-hover:text-blue-700 transition-colors">
              {name}
            </h3>
          </Link>

          {/* Category / Brand pill */}
          <div className="h-5">
            {brand ? (
              <span className="inline-flex items-center text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-medium">
                {brand.brandName}
              </span>
            ) : category ? (
              <span className="inline-flex items-center text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                {category}
              </span>
            ) : null}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[17px] font-bold text-gray-900 leading-none">{formatINR(price)}</span>
            {comparePrice && comparePrice > price && (
              <span className="text-xs text-gray-400 line-through leading-none">{formatINR(comparePrice)}</span>
            )}
            <span className="text-[11px] text-gray-400 leading-none">/ {priceUnit}</span>
          </div>

          {/* MOQ */}
          <div className="h-5">
            {minOrderQuantity ? (
              <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                MOQ: {minOrderQuantity} {priceUnit}
              </span>
            ) : null}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 h-4">
            {averageRating > 0 ? (
              <>
                <StarRating rating={averageRating} />
                <span className="text-[11px] font-semibold text-amber-600">{averageRating.toFixed(1)}</span>
                {numReviews > 0 && <span className="text-[10px] text-gray-400">({numReviews})</span>}
              </>
            ) : (
              <span className="text-[10px] text-gray-300 italic">No ratings yet</span>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1 min-h-[4px]" />

          {/* Location */}
          <div className="flex items-center gap-1 text-[11px] text-gray-400 border-t border-gray-100 pt-2 h-7">
            <HiOutlineMapPin className="w-3 h-3 shrink-0 text-gray-300" />
            {location ? <span className="truncate">{location}</span> : <span className="text-gray-200">Location not set</span>}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-0.5">
            <button
              onClick={() => protect(() => router.push(`/products/${_id}`))}
              className="flex-1 text-center text-[12px] font-semibold text-blue-600 border-2 border-blue-600 rounded-xl py-2 hover:bg-blue-600 hover:text-white transition-all duration-200"
            >
              View Details
            </button>
            <button
              onClick={() => protect(() => router.push(`/products/${_id}#inquiry`))}
              className="flex-1 flex items-center justify-center gap-1 text-[12px] font-semibold text-white bg-orange-500 hover:bg-orange-600 active:scale-95 rounded-xl py-2 transition-all duration-200"
            >
              <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5 shrink-0" />
              Contact Seller
            </button>
          </div>
        </div>
      </div>

      {showTrust && <TrustPopup companyName={companyName} productId={_id} onClose={() => setShowTrust(false)} />}
    </>
  );
};

// ─── Dummy Data ──────────────────────────────────────────────────────
export const DUMMY_PRODUCTS: ProductCardProps[] = [
  { _id: "demo-1", name: "Industrial Stainless Steel Pipe 304 Grade Seamless Tube", price: 450, comparePrice: 600, images: [{ url: "https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=400&h=300&fit=crop" }], city: "Mumbai", state: "Maharashtra", companyName: "Shree Ganesh Steel Corp", averageRating: 4.5, numReviews: 128, minOrderQuantity: 50, priceUnit: "Meter", isVerified: true, category: "Industrial Pipes" },
  { _id: "demo-2", name: "Pure Cotton Printed Fabric for Garments & Home Textile", price: 120, comparePrice: 180, images: [{ url: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=300&fit=crop" }], city: "Surat", state: "Gujarat", companyName: "Surat Textile Mills Pvt Ltd", averageRating: 3.5, numReviews: 64, minOrderQuantity: 500, priceUnit: "Meter", isVerified: true, category: "Textile Fabric" },
];

export default ProductCard;
