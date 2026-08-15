'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/imageUrl';
import { HiOutlineXMark, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlinePhoto } from "@/lib/icons";

interface GalleryImage {
  _id: string;
  url: string;
  caption?: string;
  category?: string;
  isCover?: boolean;
}

interface ImageGalleryProps {
  images?: GalleryImage[];
}

const CATEGORY_LABELS: Record<string, string> = {
  office: 'Office',
  factory: 'Factory',
  team: 'Team',
  warehouse: 'Warehouse',
  showroom: 'Showroom',
  logo: 'Logo',
  other: 'Other',
};

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const galleryImages = images && images.length > 0 ? images : [];

  if (galleryImages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="pl-4 border-l-4 border-blue-600">
          <h3 className="text-2xl font-bold text-gray-900">Company Gallery</h3>
          <p className="text-gray-600 text-sm mt-1">Office, factory & team photos</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <HiOutlinePhoto className="w-14 h-14 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No company gallery uploaded yet.</p>
          <p className="text-gray-400 text-sm mt-1">The seller hasn't added any photos.</p>
        </div>
      </div>
    );
  }

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pl-4 border-l-4 border-blue-600">
        <h3 className="text-2xl font-bold text-gray-900">Company Gallery</h3>
        <p className="text-gray-600 text-sm mt-1">
          Office, factory & team photos · {galleryImages.length} photo{galleryImages.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Main Featured Image */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
        <div className="relative h-96 bg-gray-100 overflow-hidden group cursor-pointer"
          onClick={() => openLightbox(currentIndex)}
        >
          <img
            src={resolveImageUrl(galleryImages[currentIndex]?.url)}
            alt={galleryImages[currentIndex]?.caption || 'Company photo'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Category badge */}
          {galleryImages[currentIndex]?.category && galleryImages[currentIndex].category !== 'other' && (
            <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {CATEGORY_LABELS[galleryImages[currentIndex].category!] || galleryImages[currentIndex].category}
            </div>
          )}

          {/* Caption */}
          {galleryImages[currentIndex]?.caption && (
            <div className="absolute bottom-14 left-0 right-0 px-4">
              <p className="text-white text-sm font-medium bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg inline-block">
                {galleryImages[currentIndex].caption}
              </p>
            </div>
          )}

          {/* Navigation */}
          {galleryImages.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(p => (p - 1 + galleryImages.length) % galleryImages.length); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2.5 transition shadow-lg">
                <HiOutlineChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(p => (p + 1) % galleryImages.length); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2.5 transition shadow-lg">
                <HiOutlineChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="absolute bottom-3 right-3 bg-black/50 text-white px-3 py-1 rounded-lg text-xs font-medium">
            {currentIndex + 1} / {galleryImages.length}
          </div>
        </div>

        {/* Thumbnail Strip */}
        {galleryImages.length > 1 && (
          <div className="bg-gray-50 p-3 border-t border-gray-200">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {galleryImages.map((img, idx) => (
                <button key={img._id} onClick={() => setCurrentIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                    idx === currentIndex ? 'border-blue-600 shadow-md' : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <img src={resolveImageUrl(img.url)} alt={img.caption || `Photo ${idx + 1}`}
                    className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {galleryImages.map((img, idx) => (
          <button key={img._id} onClick={() => openLightbox(idx)}
            className="relative h-36 rounded-xl overflow-hidden shadow hover:shadow-md transition group"
          >
            <img src={resolveImageUrl(img.url)} alt={img.caption || `Photo ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
            {img.isCover && (
              <span className="absolute top-1.5 left-1.5 bg-yellow-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">COVER</span>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-end p-2">
              {img.caption && (
                <p className="opacity-0 group-hover:opacity-100 text-white text-xs truncate transition">{img.caption}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightboxOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition">
              <HiOutlineXMark className="w-8 h-8" />
            </button>

            <img
              src={resolveImageUrl(galleryImages[lightboxIndex]?.url)}
              alt={galleryImages[lightboxIndex]?.caption || 'Full size'}
              className="w-full rounded-xl max-h-[80vh] object-contain"
            />

            {galleryImages[lightboxIndex]?.caption && (
              <p className="text-white text-center mt-3 text-sm">{galleryImages[lightboxIndex].caption}</p>
            )}

            {galleryImages.length > 1 && (
              <>
                <button onClick={() => setLightboxIndex(p => (p - 1 + galleryImages.length) % galleryImages.length)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 text-white hover:text-gray-300 transition">
                  <HiOutlineChevronLeft className="w-8 h-8" />
                </button>
                <button onClick={() => setLightboxIndex(p => (p + 1) % galleryImages.length)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 text-white hover:text-gray-300 transition">
                  <HiOutlineChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
