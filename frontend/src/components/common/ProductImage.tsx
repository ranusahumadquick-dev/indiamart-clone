'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { resolveImageUrl } from '@/lib/imageUrl';

interface ProductImageProps {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  fallback?: string;
  onError?: (e: any) => void;
}

const PLACEHOLDER_IMAGE = '/placeholder-product.png';

/**
 * ProductImage Component
 * Handles product image display with fallback and error handling
 * Supports both local and external images
 */
const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = 'Product Image',
  width = 200,
  height = 200,
  className = '',
  priority = false,
  fill = false,
  fallback = PLACEHOLDER_IMAGE,
  onError,
}) => {
  const [imageSrc, setImageSrc] = useState(resolveImageUrl(src) || fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Determine which image URL to use
  const effectiveImageUrl = imageSrc || fallback;

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    console.log('✅ Image loaded successfully:', effectiveImageUrl);
  }, [effectiveImageUrl]);

  // Handle image error
  const handleError = useCallback(
    (e: any) => {
      console.error('❌ Image failed to load:', imageSrc);
      console.error('   Error event:', e);
      setIsLoading(false);
      setHasError(true);

      // Don't infinitely loop if fallback also fails
      if (imageSrc !== fallback && imageSrc !== PLACEHOLDER_IMAGE) {
        console.log('🔄 Attempting fallback image:', fallback);
        setImageSrc(fallback);
        setHasError(false);
      } else {
        console.error('❌ All image sources failed (src:', imageSrc, 'fallback:', fallback, ')');
      }

      onError?.(e);
    },
    [imageSrc, fallback, onError]
  );

  // Use regular img tag for better compatibility
  if (!fill && (width && height)) {
    return (
      <div className={`relative bg-gray-100 overflow-hidden ${className}`} style={{ width, height }}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-400 rounded-full animate-spin" />
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <HiOutlineExclamationTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Image unavailable</p>
            </div>
          </div>
        )}

        <img
          src={effectiveImageUrl}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} object-cover w-full h-full ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-300`}
          loading="lazy"
        />
      </div>
    );
  }

  // Fill layout (for Next.js Image component)
  return (
    <div className={`relative bg-gray-100 overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-400 rounded-full animate-spin" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <HiOutlineExclamationTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Image unavailable</p>
          </div>
        </div>
      )}

      <Image
        src={effectiveImageUrl}
        alt={alt}
        fill
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} object-cover ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-300`}
      />
    </div>
  );
};

export default ProductImage;
