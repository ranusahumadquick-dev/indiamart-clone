'use client';

import { useState } from 'react';
import Image from 'next/image';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "@/lib/icons";

interface ImageGalleryProps {
  images: Array<{ url: string; alt: string }>;
  serviceName: string;
}

export default function ImageGallery({ images, serviceName }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No images available</p>
        </div>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23999"%3EImage not available%3C/text%3E%3C/svg%3E';

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden group">
        {currentImage?.url ? (
          <Image
            key={`main-image-${currentImageIndex}`}
            src={currentImage.url}
            alt={currentImage.alt || `Service image ${currentImageIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
            priority={currentImageIndex === 0}
            unoptimized={process.env.NODE_ENV === 'development'}
            onError={(e) => {
              console.error(`❌ Image load failed: ${currentImage.url}`);
              (e.target as HTMLImageElement).src = placeholderSvg;
            }}
            onLoad={() => {
              console.log(`✅ Image loaded: ${currentImage.url}`);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-100">
            <p className="text-gray-400">Image not available</p>
          </div>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-2 rounded-full transition opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <HiOutlineChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-2 rounded-full transition opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <HiOutlineChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={`thumbnail-${index}`}
              onClick={() => setCurrentImageIndex(index)}
              className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                index === currentImageIndex
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-300 hover:ring-1 hover:ring-blue-100'
              }`}
            >
              {image?.url ? (
                <Image
                  src={image.url}
                  alt={`${image.alt || 'Thumbnail'} ${index + 1}`}
                  fill
                  className="object-cover hover:scale-110 transition duration-300"
                  sizes="80px"
                  unoptimized={process.env.NODE_ENV === 'development'}
                  onError={(e) => {
                    console.error(`❌ Thumbnail load failed: ${image.url}`);
                    (e.target as HTMLImageElement).src = placeholderSvg;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-400">No image</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
