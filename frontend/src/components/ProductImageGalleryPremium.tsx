'use client';
import { resolveImageUrl } from '@/lib/imageUrl';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineXMark, HiOutlineEye, HiOutlinePlayCircle, HiOutlineMagnifyingGlass } from "@/lib/icons";
import { Swiper as SwiperClass } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

interface ProductImage {
  url: string;
  alt?: string;
  type?: 'image' | 'video';
  videoThumbnail?: string;
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
  const [showZoomLens, setShowZoomLens] = useState(false);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const thumbSwiperRef = useRef<SwiperClass | null>(null);
  const lightboxSwiperRef = useRef<SwiperClass | null>(null);
  const zoomLensRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("🖼️ [ProductImageGallery] Received images:", images?.length || 0);
  }, [images]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleThumbnailError = (index: number) => {
    setThumbnailErrors((prev) => new Set(prev).add(index));
  };

  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index);
    thumbSwiperRef.current?.slideTo(index);
  }, []);

  const handlePrevImage = useCallback(() => {
    const newIndex = selectedIndex === 0 ? images.length - 1 : selectedIndex - 1;
    handleThumbnailClick(newIndex);
  }, [selectedIndex, images.length, handleThumbnailClick]);

  const handleNextImage = useCallback(() => {
    const newIndex = selectedIndex === images.length - 1 ? 0 : selectedIndex + 1;
    handleThumbnailClick(newIndex);
  }, [selectedIndex, images.length, handleThumbnailClick]);

  // Enhanced zoom with lens
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current) return;

    const rect = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });

    // Show zoom lens
    if (zoomLensRef.current) {
      const lensSize = 80;
      const lensX = e.clientX - rect.left - lensSize / 2;
      const lensY = e.clientY - rect.top - lensSize / 2;

      zoomLensRef.current.style.left = Math.max(0, Math.min(lensX, rect.width - lensSize)) + 'px';
      zoomLensRef.current.style.top = Math.max(0, Math.min(lensY, rect.height - lensSize)) + 'px';
    }
  };

  const handleMouseEnter = () => {
    setIsZoomed(true);
    setShowZoomLens(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
    setShowZoomLens(false);
  };

  const openLightbox = useCallback(() => {
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    document.body.style.overflow = 'unset';
  }, []);

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
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg aspect-square flex items-center justify-center border border-gray-200">
        <div className="text-center">
          <HiOutlineEye className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">No images available</p>
        </div>
      </div>
    );
  }

  const currentImage = images[selectedIndex];

  return (
    <>
      {/* Main Gallery Container */}
      <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
        {/* Left Vertical Thumbnail Gallery - Hidden on mobile, visible on lg */}
        <div className="hidden lg:flex lg:flex-col lg:w-20">
          <Swiper
            direction="vertical"
            spaceBetween={6}
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
                  className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 group ${
                    selectedIndex === i
                      ? 'border-blue-600 shadow-lg ring-2 ring-blue-300'
                      : 'border-gray-300 hover:border-blue-400 shadow-sm hover:shadow-md'
                  }`}
                  title={img.type === 'video' ? 'Video' : `Image ${i + 1}`}
                  aria-label={`Select ${img.type === 'video' ? 'video' : 'image'} ${i + 1}`}
                >
                  {!thumbnailErrors.has(i) && img.url ? (
                    <>
                      <Image
                        src={resolveImageUrl(img.videoThumbnail && img.type === 'video' ? img.videoThumbnail : img.url)}
                        alt={img.alt || `Product ${img.type === 'video' ? 'video' : 'image'} ${i + 1}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-200"
                        sizes="80px"
                        onError={() => handleThumbnailError(i)}
                      />
                      {/* Video Play Icon */}
                      {img.type === 'video' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition">
                          <HiOutlinePlayCircle className="w-5 h-5 text-white group-hover:scale-125 transition-transform" />
                        </div>
                      )}
                      {/* Active Indicator Badge */}
                      {selectedIndex === i && (
                        <div className="absolute top-1 right-1 bg-blue-600 rounded-full w-2 h-2"></div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400">
                      {img.type === 'video' ? '▶' : '✕'}
                    </div>
                  )}
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Main Image Section */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Main Image Container with Premium Design */}
          <div
            ref={mainImageRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={openLightbox}
            className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden cursor-zoom-in group border border-gray-300 shadow-md"
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
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 85vw, 65vw"
                    onError={handleImageError}
                  />
                  {/* Premium Play Icon */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent group-hover:from-black/70 transition flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-full group-hover:bg-white transition shadow-lg">
                        <HiOutlinePlayCircle className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-white text-sm font-semibold">Click to play</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Image with Premium Zoom */}
                  <Image
                    src={currentImage.url}
                    alt={currentImage.alt || 'Product image'}
                    fill
                    className={`object-cover transition-transform duration-200 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                    style={
                      isZoomed
                        ? {
                            transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                          }
                        : undefined
                    }
                    priority
                    quality={95}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 85vw, 65vw"
                    onError={handleImageError}
                  />

                  {/* Zoom Lens - Premium Design */}
                  {showZoomLens && isZoomed && (
                    <div
                      ref={zoomLensRef}
                      className="absolute w-20 h-20 border-2 border-blue-500 rounded-lg pointer-events-none shadow-lg bg-white/5 backdrop-blur-sm"
                      style={{
                        transition: 'none',
                      }}
                    />
                  )}

                  {/* Hover Zoom Indicator */}
                  {!isZoomed && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex flex-col items-center gap-1">
                        <HiOutlineMagnifyingGlass className="w-6 h-6 text-white drop-shadow-lg" />
                        <span className="text-white text-xs font-medium drop-shadow">Hover to zoom</span>
                      </div>
                    </div>
                  )}
                </>
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-600 text-sm font-medium">Image unavailable</p>
                </div>
              </div>
            )}

            {/* Premium Image Counter - Top Right */}
            <div className="absolute top-3 right-3 bg-gradient-to-r from-gray-900/90 to-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-white/20 flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-4 h-4 bg-white/20 rounded-full text-xs">{selectedIndex + 1}</span>
              <span className="text-gray-300">/</span>
              <span>{images.length}</span>
            </div>

            {/* Navigation Arrows - Premium Styling */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-black/60 to-black/40 hover:from-black/80 hover:to-black/60 text-white p-2.5 rounded-full transition-all duration-200 z-10 shadow-lg hover:shadow-xl opacity-0 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <HiOutlineChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-black/40 to-black/60 hover:from-black/60 hover:to-black/80 text-white p-2.5 rounded-full transition-all duration-200 z-10 shadow-lg hover:shadow-xl opacity-0 group-hover:opacity-100"
                  aria-label="Next image"
                >
                  <HiOutlineChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Click to Fullscreen Indicator */}
            <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2.5 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              💡 Click for fullscreen
            </div>
          </div>

          {/* Mobile Thumbnail Gallery - Horizontal Scroll */}
          <div className="lg:hidden -mx-4 px-4">
            <Swiper
              spaceBetween={6}
              slidesPerView="auto"
              className="w-full"
            >
              {images.map((img, i) => (
                <SwiperSlide key={i} style={{ width: '70px' }}>
                  <button
                    onClick={() => handleThumbnailClick(i)}
                    className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 group ${
                      selectedIndex === i
                        ? 'border-blue-600 shadow-md ring-2 ring-blue-300'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                    title={img.type === 'video' ? 'Video' : `Image ${i + 1}`}
                    aria-label={`Select ${img.type === 'video' ? 'video' : 'image'} ${i + 1}`}
                  >
                    {!thumbnailErrors.has(i) && img.url ? (
                      <>
                        <Image
                          src={resolveImageUrl(img.videoThumbnail && img.type === 'video' ? img.videoThumbnail : img.url)}
                          alt={img.alt || `Product ${img.type === 'video' ? 'video' : 'image'} ${i + 1}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform"
                          sizes="70px"
                          onError={() => handleThumbnailError(i)}
                        />
                        {/* Video Play Icon */}
                        {img.type === 'video' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition">
                            <HiOutlinePlayCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {/* Active Indicator */}
                        {selectedIndex === i && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-blue-600 rounded-full w-2 h-2"></div>
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

      {/* Premium Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image fullscreen view"
        >
          <div
            className="relative w-full h-screen max-w-6xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Premium Design */}
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white/70 hover:text-white transition-all duration-200 z-50 p-2 rounded-full hover:bg-white/10 backdrop-blur-sm"
              aria-label="Close fullscreen"
            >
              <HiOutlineXMark className="w-8 h-8" />
            </button>

            {/* Main Fullscreen Image */}
            <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
              {!imageError && currentImage?.url ? (
                currentImage.type === 'video' ? (
                  <>
                    <Image
                      src={currentImage.videoThumbnail && currentImage.videoThumbnail.trim() ? currentImage.videoThumbnail : currentImage.url}
                      alt={currentImage.alt || 'Video thumbnail'}
                      fill
                      className="object-contain"
                      sizes="95vw"
                      quality={95}
                      onError={handleImageError}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-full">
                        <HiOutlinePlayCircle className="w-12 h-12 text-blue-600" />
                      </div>
                    </div>
                  </>
                ) : (
                  <Image
                    src={currentImage.url}
                    alt={currentImage.alt || 'Product image fullscreen'}
                    fill
                    className="object-contain"
                    sizes="95vw"
                    quality={95}
                    onError={handleImageError}
                  />
                )
              ) : (
                <div className="flex items-center justify-center text-white text-sm">
                  <p>Image unavailable</p>
                </div>
              )}

              {/* Fullscreen Image Counter */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-gray-900/90 to-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg border border-white/20 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-xs font-bold">{selectedIndex + 1}</span>
                <span className="text-gray-300">/</span>
                <span>{images.length}</span>
              </div>

              {/* Fullscreen Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-3 rounded-full transition-all z-10 backdrop-blur-sm"
                    aria-label="Previous image"
                  >
                    <HiOutlineChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-3 rounded-full transition-all z-10 backdrop-blur-sm"
                    aria-label="Next image"
                  >
                    <HiOutlineChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Thumbnail Strip at Bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => handleThumbnailClick(i)}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedIndex === i
                          ? 'border-blue-400 ring-2 ring-blue-300 shadow-lg'
                          : 'border-white/30 hover:border-white/50'
                      }`}
                      aria-label={`Select image ${i + 1}`}
                    >
                      <Image
                        src={resolveImageUrl(img.videoThumbnail && img.type === 'video' ? img.videoThumbnail : img.url)}
                        alt={img.alt || `Thumbnail ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                      {img.type === 'video' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <HiOutlinePlayCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyboard Hint */}
              <div className="absolute bottom-4 left-4 text-white/50 text-xs font-medium">
                ← → to navigate • ESC to close
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
