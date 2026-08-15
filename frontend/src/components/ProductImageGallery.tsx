'use client';
import { resolveImageUrl } from '@/lib/imageUrl';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineXMark, HiOutlineEye, HiOutlinePlayCircle } from "@/lib/icons";
import { Swiper as SwiperClass } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

interface ProductImage {
  url: string;
  alt?: string;
  type?: 'image' | 'video'; // 'image' or 'video'
  videoThumbnail?: string; // Thumbnail for video
}

interface ProductImageGalleryProps {
  images: ProductImage[];
}

export default function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<Set<number>>(new Set());
  const mainImageRef = useRef<HTMLDivElement>(null);
  const thumbSwiperRef = useRef<SwiperClass | null>(null);
  const lightboxSwiperRef = useRef<SwiperClass | null>(null);

  // 🔍 Debug: Log images being received
  useEffect(() => {
    console.log("🖼️ [ProductImageGallery] Received images:", images);
    console.log("🖼️ [ProductImageGallery] Images count:", images?.length || 0);
    if (images && images.length > 0) {
      console.log("🖼️ [ProductImageGallery] First image:", images[0]);
    }
  }, [images]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleThumbnailError = (index: number) => {
    setThumbnailErrors((prev) => new Set(prev).add(index));
  };

  // Handle thumbnail selection
  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index);
    thumbSwiperRef.current?.slideTo(index);
  }, []);

  // Handle prev/next arrows
  const handlePrevImage = useCallback(() => {
    const newIndex = selectedIndex === 0 ? images.length - 1 : selectedIndex - 1;
    handleThumbnailClick(newIndex);
  }, [selectedIndex, images.length, handleThumbnailClick]);

  const handleNextImage = useCallback(() => {
    const newIndex = selectedIndex === images.length - 1 ? 0 : selectedIndex + 1;
    handleThumbnailClick(newIndex);
  }, [selectedIndex, images.length, handleThumbnailClick]);

  // Handle zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !mainImageRef.current) return;

    const rect = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  // Lightbox handlers
  const openLightbox = useCallback(() => {
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    document.body.style.overflow = 'unset';
  }, []);

  // Reset image error when selected index changes
  useEffect(() => {
    setImageError(false);
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'ArrowLeft') handlePrevImage();
        else if (e.key === 'ArrowRight') handleNextImage();
        else if (e.key === 'Escape') closeLightbox();
      } else {
        if (e.key === 'ArrowLeft') handlePrevImage();
        else if (e.key === 'ArrowRight') handleNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handlePrevImage, handleNextImage, closeLightbox]);

  if (!images || images.length === 0) {
    console.warn("🖼️ [ProductImageGallery] No images provided, showing placeholder");
    return (
      <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center">
        <p className="text-gray-400">No images available</p>
      </div>
    );
  }

  const currentImage = images[selectedIndex];

  return (
    <>
      {/* Main Gallery Container */}
      <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
        {/* Left Vertical Thumbnail Gallery - Hidden on mobile, visible on lg */}
        <div className="hidden lg:flex lg:flex-col lg:w-20">
          <Swiper
            direction="vertical"
            spaceBetween={8}
            slidesPerView="auto"
            onSwiper={(swiper) => {
              thumbSwiperRef.current = swiper;
            }}
            className="flex-1"
          >
            {images.map((img, i) => (
              <SwiperSlide key={i}>
                <button
                  onClick={() => handleThumbnailClick(i)}
                  className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition ${
                    selectedIndex === i ? 'border-blue-600 shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={img.type === 'video' ? 'Video' : `Image ${i + 1}`}
                >
                  {!thumbnailErrors.has(i) && img.url ? (
                    <>
                      <Image
                        src={resolveImageUrl(img.videoThumbnail && img.type === 'video' ? img.videoThumbnail : img.url)}
                        alt={img.alt || `Product ${img.type === 'video' ? 'video' : 'image'} ${i + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform"
                        sizes="80px"
                        onError={() => handleThumbnailError(i)}
                      />
                      {/* Play Icon for Videos */}
                      {img.type === 'video' && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <HiOutlinePlayCircle className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400 text-xs">
                      {img.type === 'video' ? '▶' : '✕'}
                    </div>
                  )}
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Main Image Section */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Main Image Container */}
          <div
            ref={mainImageRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onClick={openLightbox}
            className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in group"
          >
            {!imageError && currentImage?.url ? (
              currentImage.type === 'video' ? (
                <>
                  {/* Video Thumbnail */}
                  <Image
                    src={currentImage.videoThumbnail && currentImage.videoThumbnail.trim() ? currentImage.videoThumbnail : currentImage.url}
                    alt={currentImage.alt || 'Video thumbnail'}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
                    onError={handleImageError}
                  />
                  {/* Play Icon */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition flex items-center justify-center">
                    <HiOutlinePlayCircle className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
                  </div>
                </>
              ) : (
                <>
                  {/* Image with Zoom */}
                  <Image
                    src={currentImage.url}
                    alt={currentImage.alt || 'Product image'}
                    fill
                    className={`object-cover transition-transform duration-200 ${isZoomed ? 'scale-130' : 'scale-100'}`}
                    style={
                      isZoomed
                        ? {
                            transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                          }
                        : undefined
                    }
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
                    onError={handleImageError}
                  />

                  {/* Zoom Icon */}
                  {!isZoomed && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <HiOutlineEye className="w-8 h-8 text-white" />
                    </div>
                  )}
                </>
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 text-sm font-medium">Image unavailable</p>
                </div>
              </div>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur text-white px-3 py-1 rounded-full text-sm font-medium">
              {selectedIndex + 1} / {images.length}
            </div>

            {/* Prev/Next Arrows - Only show if more than 1 image */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition z-10"
                  aria-label="Previous image"
                >
                  <HiOutlineChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition z-10"
                  aria-label="Next image"
                >
                  <HiOutlineChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Thumbnail Gallery - Visible only on mobile, hidden on lg */}
          <div className="lg:hidden">
            <Swiper
              spaceBetween={8}
              slidesPerView="auto"
              className="w-full"
            >
              {images.map((img, i) => (
                <SwiperSlide key={i} style={{ width: '80px' }}>
                  <button
                    onClick={() => handleThumbnailClick(i)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                      selectedIndex === i ? 'border-blue-600 shadow-md' : 'border-gray-200'
                    }`}
                    title={img.type === 'video' ? 'Video' : `Image ${i + 1}`}
                  >
                    {!thumbnailErrors.has(i) && img.url ? (
                      <>
                        <Image
                          src={resolveImageUrl(img.videoThumbnail && img.type === 'video' ? img.videoThumbnail : img.url)}
                          alt={img.alt || `Product ${img.type === 'video' ? 'video' : 'image'} ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                          onError={() => handleThumbnailError(i)}
                        />
                        {/* Play Icon for Videos */}
                        {img.type === 'video' && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <HiOutlinePlayCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400 text-xs">
                        {img.type === 'video' ? '▶' : '✕'}
                      </div>
                    )}
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div
            className="relative w-full max-w-5xl max-h-screen flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition z-50 md:top-4 md:right-4 md:bg-black/40 md:p-2 md:rounded-full"
              aria-label="Close lightbox"
            >
              <HiOutlineXMark className="w-8 h-8" />
            </button>

            {/* Main Image in Lightbox */}
            <div className="relative flex-1 min-h-0 flex items-center justify-center bg-black">
              {!imageError && currentImage?.url ? (
                currentImage.type === 'video' ? (
                  <>
                    <Image
                      src={currentImage.videoThumbnail && currentImage.videoThumbnail.trim() ? currentImage.videoThumbnail : currentImage.url}
                      alt={currentImage.alt || 'Video thumbnail'}
                      fill
                      className="object-contain"
                      sizes="90vw"
                      quality={95}
                      onError={handleImageError}
                    />
                    {/* Large Play Button for Video */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <HiOutlinePlayCircle className="w-24 h-24 text-white hover:scale-110 transition-transform cursor-pointer" />
                    </div>
                  </>
                ) : (
                  <Image
                    src={currentImage.url}
                    alt={currentImage.alt || 'Product image'}
                    fill
                    className="object-contain"
                    sizes="90vw"
                    quality={95}
                    onError={handleImageError}
                  />
                )
              ) : (
                <div className="flex items-center justify-center text-white text-sm">
                  <p>Image unavailable</p>
                </div>
              )}

              {/* Lightbox Navigation Arrows - Only show if more than 1 image */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition z-10"
                    aria-label="Previous image"
                  >
                    <HiOutlineChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition z-10"
                    aria-label="Next image"
                  >
                    <HiOutlineChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image Counter in Lightbox */}
              <div className="absolute top-4 left-4 bg-black/40 text-white px-3 py-1 rounded-full text-sm font-medium">
                {selectedIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnail Strip in Lightbox */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 px-4">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    handleThumbnailClick(i);
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                    selectedIndex === i ? 'border-blue-400 shadow-lg' : 'border-white/20'
                  }`}
                >
                  {!thumbnailErrors.has(i) && img.url ? (
                    <Image
                      src={resolveImageUrl(img.videoThumbnail && img.type === 'video' && img.videoThumbnail.trim() ? img.videoThumbnail : img.url)}
                      alt={img.alt || `Product image ${i + 1}`}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                      onError={() => handleThumbnailError(i)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-xs">
                      {img.type === 'video' ? '▶' : '✕'}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
