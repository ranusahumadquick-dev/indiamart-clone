'use client';

import { useState } from 'react';
import { HiXMark, HiStar, HiOutlineStar } from 'react-icons/hi2';

interface ProductDetailModalProps {
  product: {
    _id: string;
    name: string;
    description: string;
    price: number;
    comparePrice?: number;
    images: Array<{ url: string }>;
    category: string;
    stock: number;
    minOrderQuantity?: number;
    averageRating?: number;
    totalReviews?: number;
    specifications?: Record<string, string>;
  };
  onClose: () => void;
}

export default function ProductDetailModal({
  product,
  onClose,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const mainImage = product.images?.[0]?.url || 'https://via.placeholder.com/500';
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Modal Backdrop - Close on click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition"
          aria-label="Close modal"
        >
          <HiXMark className="w-6 h-6 text-gray-700" />
        </button>

        <div className="p-6">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Image */}
            <div className="flex flex-col gap-4">
              {/* Main Image */}
              <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>

              {/* Stock Status */}
              <div className="text-sm">
                {product.stock > 0 ? (
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                    In Stock ({product.stock} available)
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full font-medium">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Right: Product Details */}
            <div className="flex flex-col gap-6">
              {/* Category Badge */}
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  {product.category}
                </span>
              </div>

              {/* Product Name */}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <div key={i}>
                      {i < Math.floor(product.averageRating || 0) ? (
                        <HiStar className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <HiOutlineStar className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {product.averageRating?.toFixed(1) || 'No'} ⭐
                </span>
                <span className="text-sm text-gray-600">
                  ({product.totalReviews || 0} reviews)
                </span>
              </div>

              {/* Price Section */}
              <div className="border-t border-b py-4">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.comparePrice && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        ₹{product.comparePrice.toLocaleString('en-IN')}
                      </span>
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
                  {product.description}
                </p>
              </div>

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Specifications</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(product.specifications).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="border border-gray-200 rounded p-2">
                        <p className="text-xs text-gray-600 mb-1">{key}</p>
                        <p className="text-sm font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & MOQ */}
              <div className="space-y-3">
                {product.minOrderQuantity && (
                  <p className="text-xs text-gray-600">
                    Minimum Order: <span className="font-semibold">{product.minOrderQuantity} units</span>
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700">Quantity:</label>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition"
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center font-semibold border-none outline-none"
                      min="1"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  disabled={product.stock <= 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                >
                  Send Inquiry for {quantity} unit{quantity > 1 ? 's' : ''}
                </button>
              </div>

              {/* Info Footer */}
              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
                <p>📱 Contact seller for bulk orders and custom requirements</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fade-in animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
