"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineArrowUpTray,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineTruck,
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlineStar,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiOutlineScale,
  HiOutlineDownload,
  HiOutlineEnvelope,
  HiOutlinePhone,
} from "react-icons/hi2";

interface ProductVariant {
  id: string;
  color?: string;
  size?: string;
  price: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  stock: number;
  moq: number;
  images: string[];
  thumbnails: string[];
  description: string;
  specifications: { label: string; value: string }[];
  colors?: string[];
  sizes?: string[];
  variants: ProductVariant[];
  seller: {
    name: string;
    image: string;
    rating: number;
    reviews: number;
    responseTime: string;
    location: string;
    verified: boolean;
  };
  tags: string[];
  featured: boolean;
  deliveryDays: number;
  deliveryInfo: string;
  returnPolicy: string;
  warranty: string;
}

interface ProductDetailPageProps {
  product: Product;
  relatedProducts: Product[];
  onProductChange?: (productId: string) => void;
}

export default function ProductDetailPage({
  product: initialProduct,
  relatedProducts,
  onProductChange,
}: ProductDetailPageProps) {
  const [product, setProduct] = useState(initialProduct);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    initialProduct.colors?.[0]
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    initialProduct.sizes?.[0]
  );
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showRFQForm, setShowRFQForm] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"specs" | "reviews" | "shipping">("specs");
  const [currentRelatedIndex, setCurrentRelatedIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const handleProductChange = (newProduct: Product) => {
    setProduct(newProduct);
    setSelectedImageIndex(0);
    setSelectedColor(newProduct.colors?.[0]);
    setSelectedSize(newProduct.sizes?.[0]);
    setSelectedVariant(newProduct.variants[0]);
    setQuantity(1);
    onProductChange?.(newProduct.id);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const relatedProductsPerPage = isMobile ? 2 : 4;
  const totalPages = Math.ceil(relatedProducts.length / relatedProductsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto">
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Home
          </Link>
          <HiOutlineChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <Link href={`/category/${product.category}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            {product.category}
          </Link>
          <HiOutlineChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-600 text-sm font-medium truncate">{product.name}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* LEFT: Image Gallery */}
          <div className="lg:col-span-1">
            {/* Main Image */}
            <div
              className="relative w-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm mb-4 group cursor-zoom-in"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => !isMobile && setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
            >
              <div className="relative w-full aspect-square">
                <Image
                  src={product.images[selectedImageIndex]}
                  alt={product.name}
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

                {/* Badge */}
                <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                  {product.featured && (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-bold">
                      ⭐ Featured
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold">
                      -{discount}%
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                  product.stock > 10
                    ? "bg-green-50 text-green-700"
                    : product.stock > 0
                    ? "bg-orange-50 text-orange-700"
                    : "bg-red-50 text-red-700"
                }`}>
                  {product.stock > 0 ? <HiOutlineCheckCircle className="w-4 h-4" /> : <HiOutlineXMark className="w-4 h-4" />}
                  {product.stock > 10 ? "In Stock" : product.stock > 0 ? "Limited" : "Out of Stock"}
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.thumbnails.map((thumb, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                    selectedImageIndex === idx
                      ? "border-blue-500 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={thumb}
                    alt={`Thumbnail ${idx + 1}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* MIDDLE: Product Info */}
          <div className="space-y-6">
            {/* Title & Rating */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <HiOutlineStar
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  <span className="font-semibold">{product.rating}</span> ({product.reviews.toLocaleString()})
                </span>
              </div>
              <p className="text-sm text-gray-500">SKU: {product.id}</p>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString("en-IN")}</span>
                {product.originalPrice > product.price && (
                  <span className="text-lg text-gray-500 line-through">₹{product.originalPrice.toLocaleString("en-IN")}</span>
                )}
              </div>
              {discount > 0 && (
                <p className="text-sm text-green-600 font-semibold">
                  Save ₹{(product.originalPrice - product.price).toLocaleString("en-IN")} ({discount}% off)
                </p>
              )}
            </div>

            {/* Options */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Color</label>
                <div className="flex gap-3 flex-wrap">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedColor === color
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Size</label>
                <div className="flex gap-3 flex-wrap">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedSize === size
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & MOQ */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Quantity</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-gray-600 hover:bg-gray-100"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center font-semibold outline-none"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">MOQ</label>
                <div className="bg-gray-100 rounded-lg p-2 text-center font-semibold text-gray-700">
                  {product.moq} units
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT: Seller & CTA */}
          <div className="space-y-6">
            {/* Seller Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <Image
                  src={product.seller?.image || '/placeholder.svg'}
                  alt={product.seller?.name || 'Seller'}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{product.seller.name}</h3>
                    {product.seller.verified && (
                      <HiOutlineCheckCircle className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <HiOutlineStar
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.round(product.seller.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-600 ml-1">
                      ({product.seller.reviews.toLocaleString()})
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <HiOutlineClock className="w-4 h-4 text-blue-600" />
                  <span>Response Time: {product.seller.responseTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlineMapPin className="w-4 h-4 text-blue-600" />
                  <span>{product.seller.location}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                  <HiOutlinePhone className="w-4 h-4" />
                  Call Seller
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
                  💬 WhatsApp
                </button>
                <button
                  onClick={() => setShowRFQForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                >
                  <HiOutlineEnvelope className="w-4 h-4" />
                  Send Inquiry
                </button>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <HiOutlineTruck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">Delivery</p>
                  <p className="text-sm text-gray-600">{product.deliveryDays} days delivery</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <HiOutlineClock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">Return Policy</p>
                  <p className="text-sm text-gray-600">{product.returnPolicy}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <HiOutlineCheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">Warranty</p>
                  <p className="text-sm text-gray-600">{product.warranty}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-4 space-y-3">
              <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={product.stock === 0}
              >
                <HiOutlineShoppingBag className="w-6 h-6" />
                {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
              </button>

              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
                  isWishlisted
                    ? "bg-red-50 text-red-600 border-2 border-red-200"
                    : "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-gray-300"
                }`}
              >
                <HiOutlineHeart className={`w-5 h-5 ${isWishlisted ? "fill-red-600" : ""}`} />
                {isWishlisted ? "Saved" : "Save"}
              </button>

              <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                <HiOutlineArrowUpTray className="w-5 h-5" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-12">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {(["specs", "reviews", "shipping"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab === "specs" && "Specifications"}
                {tab === "reviews" && "Reviews"}
                {tab === "shipping" && "Shipping & Returns"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "specs" && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Product Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.specifications.map((spec, idx) => (
                    <div key={idx} className="flex justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">{spec.label}</span>
                      <span className="text-gray-600">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Reviews</h3>
                <p className="text-gray-600">Reviews will be displayed here</p>
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Delivery Information</h4>
                  <p className="text-gray-600">{product.deliveryInfo}</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Return Policy</h4>
                  <p className="text-gray-600">{product.returnPolicy}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Similar Products You Might Like</h2>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentRelatedIndex(
                      (prev) => (prev - 1 + totalPages) % totalPages
                    )
                  }
                  className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <HiOutlineChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setCurrentRelatedIndex((prev) => (prev + 1) % totalPages)
                  }
                  className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <HiOutlineChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts
                .slice(
                  currentRelatedIndex * relatedProductsPerPage,
                  (currentRelatedIndex + 1) * relatedProductsPerPage
                )
                .map((relatedProduct) => (
                  <button
                    key={relatedProduct.id}
                    onClick={() => handleProductChange(relatedProduct)}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                      <Image
                        src={relatedProduct.images[0]}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {relatedProduct.featured && (
                        <span className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-2 text-left">{relatedProduct.name}</p>
                      <p className="text-blue-600 font-bold mt-2 text-left">₹{relatedProduct.price.toLocaleString("en-IN")}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <HiOutlineStar
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.round(relatedProduct.rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-600">({relatedProduct.reviews})</span>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* RFQ Modal */}
      {showRFQForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Send Inquiry</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Name</label>
                <input type="text" placeholder="Your name" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Email</label>
                <input type="email" placeholder="Your email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Quantity</label>
                <input type="number" placeholder="Quantity needed" defaultValue={quantity} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Message</label>
                <textarea placeholder="Your inquiry..." rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowRFQForm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
