"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { HiOutlineArrowRight, HiOutlineShieldCheck, HiOutlineMapPin, HiOutlineFire } from "react-icons/hi2";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000";

interface Product {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number;
  images?: (string | { url?: string; filename?: string })[];
  city?: string;
  state?: string;
  companyName?: string;
  minOrderQuantity?: number;
  priceUnit?: string;
  isVerified?: boolean;
  category?: { _id: string; name: string; slug: string } | string;
  seller?: { companyName?: string; city?: string };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

function getProductImage(product: Product): string {
  const raw = product.images?.[0];
  if (!raw) return "";
  const img = typeof raw === "string" ? raw : (raw as any)?.url || (raw as any)?.filename || "";
  if (!img) return "";
  if (img.startsWith("http")) return img;
  return `${BACKEND_URL}/uploads/products/${img}`;
}

function formatINR(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

function ProductCard({ product }: { product: Product }) {
  const img = getProductImage(product);
  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;
  const location = product.seller?.city || product.city || "";
  const company = product.seller?.companyName || product.companyName || "";

  return (
    <Link
      href={`/products/${product._id}`}
      className="group bg-white rounded-xl border border-gray-100 hover:border-[#0052cc]/30 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative w-full aspect-square overflow-hidden bg-gray-50">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
            📦
          </div>
        )}

        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
            {discount}% OFF
          </span>
        )}
        {product.isVerified && (
          <span className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
            <HiOutlineShieldCheck className="w-3 h-3" /> GST
          </span>
        )}

        {/* Quick view overlay */}
        <div className="absolute inset-0 bg-[#0052cc]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="bg-white text-[#0052cc] text-xs font-bold px-4 py-2 rounded-lg">
            View Details
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-900 font-semibold line-clamp-2 leading-snug mb-2 group-hover:text-[#0052cc] transition-colors flex-1">
          {product.name}
        </p>

        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-base font-black text-gray-900">{formatINR(product.price)}</span>
          {product.priceUnit && <span className="text-[10px] text-gray-400">/ {product.priceUnit}</span>}
        </div>
        {product.comparePrice && product.comparePrice > product.price && (
          <span className="text-[10px] text-gray-400 line-through mb-1">{formatINR(product.comparePrice)}</span>
        )}

        {product.minOrderQuantity && (
          <p className="text-[10px] text-gray-500 mb-1">
            MOQ: {product.minOrderQuantity} {product.priceUnit || "pcs"}
          </p>
        )}

        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-auto pt-2 border-t border-gray-50">
          <HiOutlineMapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{location || company || "India"}</span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="w-full aspect-square bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-2 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function ProductShowcase() {
  const [tabs, setTabs] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load categories for tabs
  useEffect(() => {
    api.get("/categories?limit=20").then((res) => {
      const all: Category[] = res.data?.data?.categories || res.data?.data || [];
      const parents = all.filter((c: any) => !c.parentCategory).slice(0, 8);
      setTabs(parents);
    }).catch(() => {});
  }, []);

  // Load products when tab changes
  useEffect(() => {
    setLoading(true);
    const url = activeTab === "all"
      ? "/products?limit=10&status=approved"
      : `/products?limit=10&status=approved&category=${activeTab}`;

    api.get(url).then((res) => {
      const prods = res.data?.data?.products || res.data?.products || [];
      setProducts(prods);
    }).catch(() => setProducts([])).finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HiOutlineFire className="w-4 h-4 text-orange-500" />
              <span className="text-orange-500 text-xs font-bold uppercase tracking-widest">Live Products</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Our Products</h2>
            <p className="text-gray-500 text-sm mt-1">Browse latest listings from verified suppliers</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[#0052cc] font-semibold text-sm hover:gap-3 transition-all group"
          >
            View All <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button
            onClick={() => setActiveTab("all")}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
              activeTab === "all"
                ? "bg-[#0052cc] text-white border-[#0052cc]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#0052cc] hover:text-[#0052cc]"
            }`}
          >
            All Products
          </button>
          {tabs.map((tab) => (
            <button
              key={tab._id}
              onClick={() => setActiveTab(tab.slug)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                activeTab === tab.slug
                  ? "bg-[#0052cc] text-white border-[#0052cc]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#0052cc] hover:text-[#0052cc]"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {loading
            ? [...Array(10)].map((_, i) => <SkeletonCard key={i} />)
            : products.length > 0
              ? products.map((p) => <ProductCard key={p._id} product={p} />)
              : (
                <div className="col-span-full text-center py-14 bg-white rounded-xl border border-gray-100">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-gray-400 font-medium">No products in this category yet</p>
                  <Link href="/products" className="text-[#0052cc] text-sm font-semibold mt-2 inline-block hover:underline">
                    Browse all products →
                  </Link>
                </div>
              )
          }
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-[#0052cc] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#003d99] transition-all shadow-lg shadow-blue-200 group"
          >
            View All Products
            <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
