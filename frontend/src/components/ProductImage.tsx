'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/imageUrl';

interface ProductImageProps {
  productId: string;
  title: string;
  category: string;
  existingImage?: string;
}

export default function ProductImage({
  productId,
  title,
  category,
  existingImage
}: ProductImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(existingImage ? resolveImageUrl(existingImage) : null);
  const [isLoading, setIsLoading] = useState(!existingImage);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (existingImage) {
      setImageUrl(resolveImageUrl(existingImage));
      setIsLoading(false);
      return;
    }
    // If no existingImage provided, don't try to fetch - just show placeholder
    setIsLoading(false);
  }, [existingImage]);

  return (
    <div className="relative w-full h-full bg-gray-50 overflow-hidden group">
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-pulse" />
      )}

      {/* Error State */}
      {error && !imageUrl && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-10">
          <div className="text-center">
            <p className="text-gray-500 text-xs">Image unavailable</p>
          </div>
        </div>
      )}

      {/* Product Image */}
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={false}
          onError={() => {
            setImageUrl(null);
            setError(true);
          }}
        />
      )}

      {/* Fallback Placeholder */}
      {!imageUrl && !isLoading && !error && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
          <span className="text-2xl">📦</span>
        </div>
      )}
    </div>
  );
}
