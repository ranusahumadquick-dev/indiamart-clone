'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { resolveImageUrl } from '@/lib/imageUrl';
import {
  HiOutlineBuildingStorefront,
  HiOutlineMagnifyingGlass,
  HiOutlineGlobeAlt,
} from 'react-icons/hi2';

interface Brand {
  _id: string;
  brandName: string;
  brandDescription: string;
  brandFeatures: string;
  logo: string;
  website: string;
  seller: { name: string; companyName?: string };
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/brands')
      .then((res) => setBrands(res.data.data.brands || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = brands.filter((b) =>
    !search.trim() ||
    b.brandName.toLowerCase().includes(search.toLowerCase()) ||
    b.brandDescription?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">All Brands</h1>
          <p className="text-sm text-gray-500 mb-5">Explore trusted brands from verified sellers</p>
          {/* Search */}
          <div className="relative max-w-md">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands..."
              className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <HiOutlineBuildingStorefront className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No brands found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((brand) => (
              <Link
                key={brand._id}
                href={`/brands/${brand._id}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-5 group"
              >
                {/* Logo */}
                <div className="flex items-center gap-3 mb-3">
                  {brand.logo ? (
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-100 shrink-0 bg-gray-50">
                      <img
                        src={resolveImageUrl(brand.logo)}
                        alt={brand.brandName}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <HiOutlineBuildingStorefront className="w-7 h-7 text-blue-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition truncate">
                      {brand.brandName}
                    </h3>
                    {brand.seller?.companyName && (
                      <p className="text-xs text-gray-400 truncate">{brand.seller.companyName}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                {brand.brandDescription && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {brand.brandDescription}
                  </p>
                )}

                {/* Features preview */}
                {brand.brandFeatures && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {brand.brandFeatures
                      .split('\n')
                      .map((f) => f.trim())
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((f, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium"
                        >
                          {f}
                        </span>
                      ))}
                    {brand.brandFeatures.split('\n').filter((f) => f.trim()).length > 3 && (
                      <span className="text-[11px] text-gray-400 px-1 py-0.5">
                        +{brand.brandFeatures.split('\n').filter((f) => f.trim()).length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Website */}
                {brand.website && (
                  <div className="flex items-center gap-1 text-xs text-blue-500">
                    <HiOutlineGlobeAlt className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{brand.website.replace(/^https?:\/\//, '')}</span>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-blue-600 font-medium group-hover:underline">
                  View Brand →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
