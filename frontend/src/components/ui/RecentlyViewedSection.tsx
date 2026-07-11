"use client";

import { useEffect, useState } from "react";
import { useRecentlyViewed, RecentProduct } from "@/hooks/useRecentlyViewed";
import ProductCard from "./ProductCard";
import { HiOutlineClock } from "react-icons/hi2";

interface RecentlyViewedSectionProps {
  excludeId?: string;
  maxItems?: number;
}

export default function RecentlyViewedSection({
  excludeId,
  maxItems = 6,
}: RecentlyViewedSectionProps) {
  const { getProducts } = useRecentlyViewed();
  const [products, setProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    const all = getProducts();
    const filtered = all
      .filter((p) => p._id !== excludeId)
      .slice(0, maxItems);
    setProducts(filtered);
  }, [excludeId, maxItems, getProducts]);

  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <HiOutlineClock className="w-5 h-5 text-gray-400" />
          Recently Viewed
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {products.map((product) => (
          <ProductCard key={product._id} {...product} />
        ))}
      </div>
    </section>
  );
}
