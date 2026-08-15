'use client';

import Link from 'next/link';
import ProductImage from '@/components/ProductImage';
import { HiOutlineChatBubbleLeftRight } from "@/lib/icons";

interface SellerProductCardProps {
  _id: string;
  name: string;
  price: number;
  images: { url: string; alt?: string }[];
  companyName?: string;
  brand?: { _id: string; brandName: string } | null;
}

function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SellerProductCard({
  _id,
  name,
  price,
  images,
  companyName,
  brand,
}: SellerProductCardProps) {
  const imageSrc = images?.[0]?.url || '/placeholder.svg';

  return (
    <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* ── Product Image ── */}
      <Link href={`/products/${_id}`} className="block">
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
          <ProductImage
            productId={_id}
            title={name}
            category="products"
            existingImage={imageSrc}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>

      {/* ── Product Info ── */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Product Name */}
        <Link href={`/products/${_id}`}>
          <h3 className="text-[14px] font-semibold text-gray-900 line-clamp-2 leading-snug min-h-[2.25rem] group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
        </Link>

        {/* Brand */}
        {brand && (
          <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-medium w-fit">
            {brand.brandName}
          </span>
        )}

        {/* Price */}
        <div className="pt-1 border-t border-gray-100">
          <p className="text-xl font-bold text-gray-900">
            {formatINR(price)}
          </p>
          <p className="text-[11px] text-gray-500">Per Piece</p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {/* Get Best Quote Button */}
          <Link
            href={`/products/${_id}#inquiry`}
            className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-white bg-blue-600 rounded-lg py-2.5 hover:bg-blue-700 transition-colors"
          >
            <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
            <span>Get Best Quote</span>
          </Link>

          {/* View Details Button */}
          <Link
            href={`/products/${_id}`}
            className="flex-1 text-center text-[13px] font-semibold text-blue-600 border border-blue-600 rounded-lg py-2.5 hover:bg-blue-50 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
