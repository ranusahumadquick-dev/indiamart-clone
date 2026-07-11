"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HiOutlineArrowRight,
  HiStar,
  HiOutlineShieldCheck,
  HiOutlineMapPin,
  HiOutlineChatBubbleLeftRight,
  HiOutlineEye,
  HiOutlineFire,
} from "react-icons/hi2";
import ProductImage from "@/components/ProductImage";
import api from "@/lib/axios";

interface Product {
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
  category?: string | { _id: string; name: string; slug?: string };
}

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function ProductCard({ product }: { product: Product }) {
  const location = [product.city, product.state].filter(Boolean).join(", ");
  const imageSrc = product.images?.[0]?.url || "/placeholder.svg";
  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;
  const rating = product.averageRating || 4.2;

  return (
    <Link
      href={`/products/${product._id}`}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-50 hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-50 shrink-0">
        <ProductImage
          productId={product._id}
          title={product.name}
          category={typeof product.category === "string" ? product.category : "products"}
          existingImage={imageSrc}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="bg-red-500 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-lg">
              {discount}% OFF
            </span>
          )}
          {product.isVerified && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow">
              <HiOutlineShieldCheck className="w-3 h-3" /> Verified
            </span>
          )}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-[#0052cc]/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
          <span className="bg-white text-[#0052cc] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-gray-100 transition">
            <HiOutlineEye className="w-4 h-4" />
            Quick View
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category */}
        {product.category && (
          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full self-start mb-2">
            {typeof product.category === "string" ? product.category : (product.category as any)?.name}
          </span>
        )}

        {/* Name */}
        <h3 className="font-bold text-gray-900 line-clamp-2 text-sm mb-2 group-hover:text-[#0052cc] transition-colors leading-snug flex-1">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-black text-gray-900">
            {formatINR(product.price)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs text-gray-400 line-through font-medium">
              {formatINR(product.comparePrice)}
            </span>
          )}
          {product.priceUnit && (
            <span className="text-[10px] text-gray-400">/ {product.priceUnit}</span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map((s) => (
              <HiStar key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
            ))}
          </div>
          <span className="text-xs text-gray-500">{product.numReviews || 0} reviews</span>
        </div>

        {/* MOQ */}
        {product.minOrderQuantity && (
          <p className="text-[10px] text-gray-500 bg-gray-50 rounded-lg px-2 py-1 mb-2 font-medium">
            Min. Order: {product.minOrderQuantity} {product.priceUnit || "units"}
          </p>
        )}

        {/* Location */}
        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
          <HiOutlineMapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          <span className="truncate">{location || product.companyName || "India"}</span>
        </div>

        {/* CTA */}
        <div className="flex gap-2 mt-auto">
          <span className="flex-1 text-center bg-[#0052cc] text-white text-xs font-bold py-2.5 rounded-xl group-hover:bg-[#003d99] transition-all duration-300 flex items-center justify-center gap-1">
            <HiOutlineEye className="w-3.5 h-3.5" />
            View
          </span>
          <span className="flex-1 text-center bg-gray-50 text-gray-700 text-xs font-bold py-2.5 rounded-xl group-hover:bg-[#ff6b00] group-hover:text-white transition-all duration-300 flex items-center justify-center gap-1">
            <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
            Inquiry
          </span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-100 rounded-full w-1/4" />
        <div className="h-4 bg-gray-100 rounded-full w-3/4" />
        <div className="h-4 bg-gray-100 rounded-full w-1/2" />
        <div className="h-6 bg-gray-100 rounded-full w-1/3" />
        <div className="h-3 bg-gray-100 rounded-full w-2/3" />
        <div className="flex gap-2">
          <div className="flex-1 h-9 bg-gray-100 rounded-xl" />
          <div className="flex-1 h-9 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function FeaturedProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/products/featured").then((res) => {
      if (res.data?.success) setProducts((res.data.data || []).slice(0, 8));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-8 bg-[#ff6b00] rounded-full" />
              <span className="text-[#ff6b00] text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <HiOutlineFire className="w-3.5 h-3.5" />
                Trending Now
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
              Featured Products
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Handpicked deals from top verified manufacturers
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-[#0052cc] hover:bg-[#003d99] text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm group shadow-lg shadow-blue-200"
          >
            View All Products
            <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading
            ? [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
            : products.length > 0
              ? products.slice(0, 8).map((product) => <ProductCard key={product._id} product={product} />)
              : (
                <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="text-5xl mb-4">⭐</div>
                  <p className="text-gray-400 text-lg font-medium mb-2">No Featured Products Available</p>
                  <p className="text-gray-400 text-sm">Check back soon for handpicked deals</p>
                </div>
              )
          }
        </div>
      </div>
    </section>
  );
}
