"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiMagnifyingGlassPlus,
  HiOutlineArrowUpTray,
} from "@/lib/icons";

interface ColorVariant {
  id: string;
  name: string;
  hexCode: string;
  image: string;
  thumbnail: string;
}

interface ProductShowcaseProps {
  productId: string;
  productName: string;
  productCategory: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  stock: number;
  description: string;
  colorVariants: ColorVariant[];
  tags?: string[];
}

export default function ProductGallery({
  productId,
  productName,
  productCategory,
  price,
  originalPrice,
  rating,
  reviews,
  stock,
  description,
  colorVariants,
  tags = [],
}: ProductShowcaseProps) {
  const [selectedColor, setSelectedColor] = useState<ColorVariant>(colorVariants[0]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const handleColorSelect = (color: ColorVariant) => {
    setSelectedColor(color);
    setSelectedImageIndex(0);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const stockStatus = stock > 10 ? "In Stock" : stock > 0 ? "Limited Stock" : "Out of Stock";
  const stockColor = stock > 10 ? "text-green-600" : stock > 0 ? "text-orange-600" : "text-red-600";
  const stockBg = stock > 10 ? "bg-green-50" : stock > 0 ? "bg-orange-50" : "bg-red-50";

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT: Image Gallery */}
        <div className="space-y-4">
          {/* Main Product Image */}
          <div
            className="relative w-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => !isMobile && setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <div className="relative w-full aspect-square">
              <Image
                src={selectedColor.image}
                alt={`${productName} - ${selectedColor.name}`}
                fill
                className={`object-contain transition-transform duration-300 ${
                  isZoomed ? "scale-150" : "scale-100"
                }`}
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      }
                    : {}
                }
                priority
              />

              {/* Stock Badge */}
              <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${stockBg} ${stockColor}`}>
                {stock > 0 ? (
                  <HiOutlineCheckCircle className="w-4 h-4" />
                ) : (
                  <HiOutlineExclamationTriangle className="w-4 h-4" />
                )}
                {stockStatus}
              </div>

              {/* Discount Badge */}
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold">
                  -{discount}%
                </div>
              )}

              {/* Zoom Indicator */}
              {!isMobile && (
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium opacity-0 hover:opacity-100 transition-opacity">
                  <HiMagnifyingGlassPlus className="w-4 h-4" />
                  Zoom
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail Gallery */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[selectedColor.thumbnail, selectedColor.image, selectedColor.thumbnail].map((thumb, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                  selectedImageIndex === idx
                    ? "border-blue-500 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Image
                  src={thumb}
                  alt={`Thumbnail ${idx + 1}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Color Variants Section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Color Options</h3>

            <div className="space-y-3">
              {colorVariants.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleColorSelect(color)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 border-2 ${
                    selectedColor.id === color.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {/* Color Swatch */}
                  <div className="flex-shrink-0 relative">
                    <div
                      className="w-10 h-10 rounded-full shadow-sm border-2 border-gray-200 transition-transform hover:scale-110"
                      style={{ backgroundColor: color.hexCode }}
                      title={color.name}
                    />
                    {selectedColor.id === color.id && (
                      <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-pulse" />
                    )}
                  </div>

                  {/* Color Name & Hex */}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">{color.name}</p>
                    <p className="text-xs text-gray-500">{color.hexCode}</p>
                  </div>

                  {/* Selection Indicator */}
                  {selectedColor.id === color.id && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setLiked(!liked)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-red-300 hover:text-red-500 transition-colors duration-200 group"
            >
              <HiOutlineHeart className={`w-5 h-5 transition-transform group-hover:scale-110 ${liked ? "fill-red-500 text-red-500" : ""}`} />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-gray-300 transition-colors duration-200 group">
              <HiOutlineArrowUpTray className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* RIGHT: Product Details */}
        <div className="space-y-6">
          {/* Breadcrumb & Category */}
          <div>
            <p className="text-sm text-gray-500 mb-2">{productCategory}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{productName}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{rating}</span> ({reviews.toLocaleString()} reviews)
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-bold text-gray-900">₹{price.toLocaleString("en-IN")}</span>
              {originalPrice && (
                <span className="text-xl text-gray-500 line-through">₹{originalPrice.toLocaleString("en-IN")}</span>
              )}
            </div>
            {discount > 0 && (
              <p className="text-sm text-green-600 font-semibold">
                Save ₹{(originalPrice! - price).toLocaleString("en-IN")} ({discount}% off)
              </p>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-600 leading-relaxed">{description}</p>
          </div>

          {/* Stock Status */}
          <div className={`rounded-2xl border-2 p-4 ${stockBg} ${stockColor}`}>
            <div className="flex items-center gap-2">
              {stock > 0 ? <HiOutlineCheckCircle className="w-5 h-5" /> : <HiOutlineExclamationTriangle className="w-5 h-5" />}
              <div>
                <p className="font-semibold">{stockStatus}</p>
                <p className="text-sm opacity-75">{stock > 0 ? `${stock} units available` : "Currently unavailable"}</p>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            disabled={stock === 0}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-200 ${
              stock > 0
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:scale-105 active:scale-95"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <HiOutlineShoppingBag className="w-6 h-6" />
            {stock > 0 ? "Add to Cart" : "Out of Stock"}
          </button>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600 mb-1">✓</p>
              <p className="text-xs font-medium text-gray-600">Verified Seller</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-bold text-green-600 mb-1">🚚</p>
              <p className="text-xs font-medium text-gray-600">Free Shipping</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-bold text-purple-600 mb-1">↩️</p>
              <p className="text-xs font-medium text-gray-600">Easy Returns</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-bold text-orange-600 mb-1">🔒</p>
              <p className="text-xs font-medium text-gray-600">Secure Payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
