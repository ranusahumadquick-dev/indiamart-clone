'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { resolveImageUrl } from '@/lib/imageUrl';
import {
  HiOutlineBuildingStorefront,
  HiOutlineGlobeAlt,
  HiOutlineArrowLeft,
  HiOutlineCheckBadge,
} from "@/lib/icons";

interface Brand {
  _id: string;
  brandName: string;
  brandDescription: string;
  brandFeatures: string;
  logo: string;
  website: string;
  seller: { name: string; companyName?: string };
  createdAt: string;
}

export default function BrandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/brands/${id}`)
      .then((res) => setBrand(res.data.data.brand))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !brand) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-500 text-lg">Brand not found</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm">Go back</button>
      </div>
    );
  }

  const featureLines = brand.brandFeatures
    ? brand.brandFeatures.split('\n').map((l) => l.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Brand Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8">
            <div className="flex items-center gap-5">
              {brand.logo ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white/30 shrink-0 bg-white">
                  <img
                    src={resolveImageUrl(brand.logo)}
                    alt={brand.brandName}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <HiOutlineBuildingStorefront className="w-10 h-10 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{brand.brandName}</h1>
                {brand.seller?.companyName && (
                  <p className="text-blue-200 text-sm mt-1">by {brand.seller.companyName}</p>
                )}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mt-2 transition"
                  >
                    <HiOutlineGlobeAlt className="w-4 h-4" />
                    {brand.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Description */}
            {brand.brandDescription && (
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-2">About the Brand</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {brand.brandDescription}
                </p>
              </div>
            )}

            {/* Brand Features */}
            {featureLines.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-3">Brand Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {featureLines.map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5"
                    >
                      <HiOutlineCheckBadge className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="border-t border-gray-100 pt-4 text-xs text-gray-400">
              Listed on {new Date(brand.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
