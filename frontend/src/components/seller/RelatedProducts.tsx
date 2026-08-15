'use client';
import { resolveImageUrl } from '@/lib/imageUrl';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "@/lib/icons";

interface Product {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number;
  image?: string;
  rating?: number;
  reviews?: number;
  moq?: number;
  unit?: string;
}

interface RelatedProductsProps {
  products: Product[];
  currentProductId?: string;
}

export default function RelatedProducts({
  products,
  currentProductId,
}: RelatedProductsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const filteredProducts = products
    .filter((p) => p._id !== currentProductId)
    .slice(0, 8);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  if (!filteredProducts || filteredProducts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 mt-12">
      {/* Section Header */}
      <div className="pl-4 border-l-4 border-blue-600">
        <h3 className="text-2xl font-bold text-gray-900">Related Products</h3>
        <p className="text-gray-600 text-sm mt-1">Similar products from this supplier</p>
      </div>

      {/* Products Carousel */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 hide-scrollbar"
          style={{
            scrollBehavior: 'smooth',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {filteredProducts.map((product) => (
            <Link
              key={product._id}
              href={`/products/${product._id}`}
              className="flex-shrink-0 w-48 group cursor-pointer"
            >
              <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full hover:-translate-y-1">
                {/* Product Image */}
                <div className="relative h-40 bg-gray-200 overflow-hidden">
                  {product.images && product.images.length > 0 && product.images[0]?.url ? (
                    <img
                      src={resolveImageUrl(product.images[0].url)}
                      alt={product.images[0].alt || product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-3xl">📦</span>
                    </div>
                  )}

                  {/* Discount Badge */}
                  {product.comparePrice && product.comparePrice > product.price && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                      -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  {/* Name */}
                  <h4 className="font-bold text-gray-900 line-clamp-2 text-sm group-hover:text-blue-600 transition">
                    {product.name}
                  </h4>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-600">
                      ₹{product.price?.toLocaleString() || '0'}
                    </span>
                    {product.comparePrice && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{product.comparePrice?.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* MOQ */}
                  {product.moq && (
                    <p className="text-xs text-gray-600">
                      MOQ: {product.moq} {product.unit || 'units'}
                    </p>
                  )}

                  {/* Rating */}
                  {product.rating && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-bold text-gray-900">
                        {product.rating.toFixed(1)}★
                      </span>
                      <span className="text-gray-500">({product.reviews || 0})</span>
                    </div>
                  )}

                  {/* CTA Button */}
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors mt-2">
                    Inquire
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Navigation Arrows */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-50 shadow-md z-10"
          >
            <HiOutlineChevronLeft className="w-5 h-5 text-gray-900" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-50 shadow-md z-10"
          >
            <HiOutlineChevronRight className="w-5 h-5 text-gray-900" />
          </button>
        )}
      </div>

      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
