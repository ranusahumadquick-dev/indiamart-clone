'use client';
import { resolveImageUrl } from '@/lib/imageUrl';

import React, { useState, useEffect } from 'react';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "@/lib/icons";

interface ProductGalleryCarouselProps {
  products: any[];
}

export default function ProductGalleryCarousel({ products }: ProductGalleryCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [displayProducts, setDisplayProducts] = useState(products.slice(0, 8));

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(displayProducts.length / 4));
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPlay, displayProducts.length]);

  const handlePrev = () => {
    setAutoPlay(false);
    setCurrentSlide((prev) =>
      prev === 0 ? Math.ceil(displayProducts.length / 4) - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setAutoPlay(false);
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(displayProducts.length / 4));
  };

  const visibleProducts = displayProducts.slice(currentSlide * 4, (currentSlide + 1) * 4);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pl-4 border-l-4 border-blue-600">
        <h3 className="text-2xl font-bold text-gray-900">Featured Products</h3>
        <p className="text-gray-600 text-sm mt-1">Best selling products from our catalog</p>
      </div>

      {/* Main Carousel */}
      <div
        className="relative bg-white rounded-2xl p-8 shadow-md"
        onMouseEnter={() => setAutoPlay(false)}
        onMouseLeave={() => setAutoPlay(true)}
      >
        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-80">
          {visibleProducts.map((product, idx) => (
            <div
              key={idx}
              className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
            >
              {/* Product Image */}
              <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
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
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-4xl">📦</span>
                  </div>
                )}

                {/* Quick Action Badge */}
                <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  In Stock
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h4 className="font-bold text-gray-900 line-clamp-2 text-sm mb-2">
                  {product.name || 'Product Name'}
                </h4>

                {/* Price & MOQ */}
                <div className="mb-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-blue-600">
                      ₹{product.price?.toLocaleString() || '0'}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-500 line-through">
                        ₹{product.originalPrice?.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {product.moq && (
                    <div className="text-xs text-gray-600">
                      MOQ: {product.moq} {product.unit || 'units'}
                    </div>
                  )}
                </div>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-xs font-bold text-gray-900">
                      {product.rating.toFixed(1)}★
                    </span>
                    <span className="text-xs text-gray-500">
                      ({product.reviews || 0} reviews)
                    </span>
                  </div>
                )}

                {/* Quick Inquiry Button */}
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors">
                  Quick Inquiry
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white hover:bg-blue-600 text-gray-900 hover:text-white rounded-full p-3 shadow-md transition-all z-10"
        >
          <HiOutlineChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-blue-600 text-gray-900 hover:text-white rounded-full p-3 shadow-md transition-all z-10"
        >
          <HiOutlineChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: Math.ceil(displayProducts.length / 4) }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentSlide(idx);
              setAutoPlay(false);
            }}
            className={`h-2 rounded-full transition-all ${
              idx === currentSlide ? 'bg-blue-600 w-8' : 'bg-gray-300 w-2 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{displayProducts.length}+</div>
          <div className="text-xs text-gray-600 font-medium">Products Listed</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
          <div className="text-2xl font-bold text-green-600">24h</div>
          <div className="text-xs text-gray-600 font-medium">Fast Dispatch</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">Pan-India</div>
          <div className="text-xs text-gray-600 font-medium">Free Shipping</div>
        </div>
      </div>
    </div>
  );
}
