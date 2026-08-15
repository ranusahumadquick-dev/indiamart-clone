'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductImage from '@/components/ProductImage';
import {
  HiOutlineStar,
  HiStar,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
} from "@/lib/icons";

// ─── Types ──────────────────────────────────────────────────────────
interface ProductCardProProps {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number;
  images?: { url: string; alt?: string }[];
  city?: string;
  state?: string;
  companyName?: string;
  averageRating?: number;
  numReviews?: number;
  minOrderQuantity?: number;
  priceUnit?: string;
  isVerified?: boolean;
  category?: string | { _id: string; name: string };
  stock?: number;
}

// ─── Helper Functions ───────────────────────────────────────────────
function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const diff = rating - i;
    if (diff >= 1) return 'full';
    if (diff >= 0.5) return 'half';
    return 'empty';
  });

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {stars.map((type, i) => (
          <span key={i} className="relative">
            <HiOutlineStar className="w-3.5 h-3.5 text-gray-300" />
            {type === 'full' && (
              <HiStar className="w-3.5 h-3.5 text-amber-400 absolute inset-0" />
            )}
            {type === 'half' && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                <HiStar className="w-3.5 h-3.5 text-amber-400" />
              </span>
            )}
          </span>
        ))}
      </div>
      {reviews > 0 && (
        <span className="text-xs text-gray-500 ml-1">
          ({reviews})
        </span>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
export default function ProductCardPro({
  _id,
  name,
  price,
  comparePrice,
  images,
  city,
  state,
  companyName,
  averageRating = 0,
  numReviews = 0,
  minOrderQuantity,
  priceUnit = 'Piece',
  isVerified = false,
  category,
  stock,
}: ProductCardProProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  // Extract category name
  const categoryName =
    typeof category === 'object' ? category?.name || 'Products' : category || 'Products';

  // Calculate discount
  const discount =
    comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : 0;

  // Format location
  const location = [city, state].filter(Boolean).join(', ');

  // Get image source
  const imageSrc = images?.[0]?.url;

  return (
    <Link href={`/products/${_id}`}>
      <div
        className="group bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ─── Image Container (Fixed Height: 250px | Aspect 4:3) ─── */}
        <div className="relative w-full h-[250px] bg-gray-50 overflow-hidden">
          {/* Product Image with Smart Matching */}
          <ProductImage
            productId={_id}
            title={name}
            category={categoryName}
            existingImage={imageSrc}
          />

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-md shadow-md">
              <span className="text-xs font-bold">{discount}% OFF</span>
            </div>
          )}

          {/* Verified Badge */}
          {isVerified && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-md shadow-md flex items-center gap-1">
              <HiOutlineShieldCheck className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Verified</span>
            </div>
          )}

          {/* Stock Status */}
          {stock !== undefined && stock <= 5 && stock > 0 && (
            <div className="absolute bottom-3 left-3 bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
              Only {stock} left
            </div>
          )}

          {stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-red-600 text-white px-3 py-1 rounded font-semibold text-sm">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* ─── Content Section ─── */}
        <div className="flex-1 flex flex-col p-4 gap-3">
          {/* Product Name (Truncate to 2 lines) */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{categoryName}</p>
          </div>

          {/* Rating & Reviews */}
          {averageRating > 0 && (
            <StarRating rating={averageRating} reviews={numReviews || 0} />
          )}

          {/* Price Section */}
          <div className="mt-auto space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(price)}
              </span>
              {comparePrice && comparePrice > price && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(comparePrice)}
                </span>
              )}
            </div>

            {/* Unit Info */}
            <p className="text-xs text-gray-500">
              {priceUnit}
              {minOrderQuantity && ` (MOQ: ${minOrderQuantity})`}
            </p>
          </div>

          {/* Seller Info */}
          <div className="border-t border-gray-100 pt-3 space-y-1.5">
            {companyName && (
              <p className="text-xs font-medium text-gray-700 truncate">
                {companyName}
              </p>
            )}

            {location && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <HiOutlineMapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <button
            onClick={() => router.push(`/products/${_id}`)}
            className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
}
