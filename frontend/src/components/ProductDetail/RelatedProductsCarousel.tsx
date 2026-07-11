"use client";

import { useState } from "react";
import Image from "next/image";
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineStar,
  HiOutlineHeart,
  HiOutlineShoppingCart,
} from "react-icons/hi2";

interface RelatedProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  category: string;
  badge?: string;
}

interface RelatedProductsCarouselProps {
  products: RelatedProduct[];
  title?: string;
  onProductClick?: (productId: string) => void;
}

export default function RelatedProductsCarousel({
  products,
  title = "Related Products You Might Like",
  onProductClick,
}: RelatedProductsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!products || products.length === 0) return null;

  const itemsPerPage = 4;
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const visibleProducts = products.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  );

  const discount = (product: RelatedProduct) => {
    if (!product.originalPrice) return 0;
    return Math.round(
      ((product.originalPrice - product.price) / product.originalPrice) * 100
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} products available
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlePrevious}
            className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            disabled={totalPages <= 1}
            title="Previous products"
          >
            <HiOutlineChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2 text-sm text-gray-700">
            <span className="font-semibold">{currentIndex + 1}</span>
            <span className="text-gray-400">/</span>
            <span>{totalPages}</span>
          </div>
          <button
            onClick={handleNext}
            className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            disabled={totalPages <= 1}
            title="Next products"
          >
            <HiOutlineChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {visibleProducts.map((product) => {
          const disc = discount(product);
          return (
            <div
              key={product.id}
              onClick={() => onProductClick?.(product.id)}
              className="group cursor-pointer"
            >
              {/* Product Card */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                {/* Image Container */}
                <div
                  className="relative w-full aspect-square bg-gray-100 overflow-hidden"
                  onMouseEnter={() => setHoveredId(product.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className={`object-cover transition-transform duration-300 ${
                      hoveredId === product.id ? "scale-110" : "scale-100"
                    }`}
                  />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
                    {product.badge && (
                      <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                        {product.badge}
                      </span>
                    )}
                    {disc > 0 && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        -{disc}%
                      </span>
                    )}
                  </div>

                  {/* Hover Actions */}
                  {hoveredId === product.id && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3">
                      <button className="p-3 bg-white rounded-full text-red-500 hover:scale-110 transition-transform">
                        <HiOutlineHeart className="w-5 h-5" />
                      </button>
                      <button className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform">
                        <HiOutlineShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  {/* Name */}
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </p>

                  {/* Price */}
                  <div className="mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-blue-600 text-lg">
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-gray-500 line-through">
                          ₹{product.originalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <HiOutlineStar
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(product.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 ml-1">
                      {product.rating} ({product.reviews})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-100">
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "bg-blue-600 w-6"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              title={`Go to page ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
