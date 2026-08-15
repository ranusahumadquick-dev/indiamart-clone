'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/axios';
import { resolveImageUrl } from '@/lib/imageUrl';
import toast from 'react-hot-toast';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineMapPin,
  HiOutlineStar,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineSparkles,
} from "@/lib/icons";

interface Service {
  _id: string;
  serviceName: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  priceType: string;
  deliveryTime: number;
  images: Array<{ url: string; alt: string }>;
  provider: {
    userId: { _id: string; fullName: string; avatar?: string; companyName?: string };
    isVerified: boolean;
    rating: number;
    reviewCount: number;
    responseTime?: string;
  };
  availability: string;
  views: number;
  ratings: { average: number; total: number };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const CATEGORIES = [
  'all',
  'Raw Materials',
  'Manufacturing',
  'Electronics',
  'Textiles',
  'Chemicals',
  'Machinery',
  'Agriculture',
  'Packaging',
  'Quality Testing',
  'Logistics',
  'Other',
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [availability, setAvailability] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  useEffect(() => {
    console.log('🔄 Fetching with filters:', {
      page: pagination.page,
      category,
      availability,
      sortBy,
      priceRange,
    });
    fetchServices();
  }, [pagination.page, category, availability, sortBy, priceRange]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        category,
        availability,
        sortBy,
        ...(priceRange.min && { minPrice: priceRange.min }),
        ...(priceRange.max && { maxPrice: priceRange.max }),
        ...(search && { search }),
      });

      const response = await api.get(`/services?${params}`);

      if (response.data.success) {
        console.log('📊 API Response:', {
          success: response.data.success,
          servicesCount: response.data.data?.services?.length,
          filters: { category, availability, priceRange },
        });
        setServices(response.data.data?.services || []);
        setPagination(response.data.data?.pagination || pagination);
      } else {
        console.error('❌ API Response not successful:', response.data);
      }
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.get(`/services/search?query=${search}&page=1&limit=12`);
      console.log('🔍 Search Response:', response.data);
      if (response.data.success) {
        setServices(response.data.data?.services || []);
        setPagination(response.data.data?.pagination || pagination);
      }
    } catch (error: any) {
      console.error('❌ Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">B2B Business Services & Solutions</h1>
        <p className="text-gray-600 text-lg">
          Find verified suppliers, manufacturers, and service providers for your industrial and business needs
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search services by name, category, or business keywords (e.g., manufacturing, ISO certified)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-6 py-4 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
            >
              <HiOutlineMagnifyingGlass className="w-5 h-5" />
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-fit">
            <div className="flex items-center gap-2 mb-6">
              <HiOutlineFunnel className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Filters</h3>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Price Range</label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min price"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max price"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleFilterChange}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Availability Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Availability
              </label>
              <select
                value={availability}
                onChange={(e) => {
                  setAvailability(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="on-break">On Break</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Newest</option>
                <option value="price">Price: Low to High</option>
                <option value="views">Most Viewed</option>
                <option value="ratings">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Services Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center min-h-96">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No services found. Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {services.map((service) => (
                    <Link
                      key={service._id}
                      href={`/services/${service._id}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-purple-300 transition overflow-hidden"
                    >
                      {/* Service Image */}
                      <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center group">
                        {service.images && service.images.length > 0 && service.images[0]?.url ? (
                          <div className="relative w-full h-full">
                            <Image
                              key={`${service._id}-image-0`}
                              src={resolveImageUrl(service.images[0].url)}
                              alt={service.images[0].alt || service.serviceName}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover group-hover:opacity-95 transition"
                              onError={(e) => {
                                console.error(`❌ Image load failed: ${service.images[0].url}`);
                                e.currentTarget.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log(`✅ Image loaded: ${service.images[0].url}`);
                              }}
                              priority={false}
                              unoptimized={process.env.NODE_ENV === 'development'}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-50">
                            <div className="text-center">
                              <HiOutlineSparkles className="w-12 h-12 text-purple-300 mx-auto mb-2" />
                              <span className="text-gray-400 text-sm">No image available</span>
                              {service.images && service.images.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">Image data exists but URL is missing</p>
                              )}
                            </div>
                          </div>
                        )}
                        {service.availability === 'available' && (
                          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                            ✓ Available
                          </div>
                        )}
                      </div>

                      {/* Service Info */}
                      <div className="p-4">
                        {/* Title and Price */}
                        <div className="mb-2">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                            {service.serviceName}
                          </h3>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            ₹{service.price.toLocaleString()}
                            {service.priceType === 'hourly' && <span className="text-sm">/hr</span>}
                          </p>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {service.description}
                        </p>

                        {/* Category and Delivery */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                            {service.category}
                          </span>
                          <span className="inline-block bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
                            {service.deliveryTime} days
                          </span>
                        </div>

                        {/* Provider Info */}
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {service.provider.userId.avatar ? (
                                <Image
                                  src={service.provider.userId.avatar}
                                  alt={service.provider.userId.fullName}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full" />
                              )}
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {service.provider.userId.companyName ||
                                    service.provider.userId.fullName}
                                </p>
                                {service.provider.isVerified && (
                                  <p className="text-xs text-green-600 font-medium">✓ Verified</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <HiOutlineStar className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-semibold text-gray-900">
                                {service.ratings.average.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({service.ratings.total})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mb-8">
                    <button
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setPagination((prev) => ({ ...prev, page }))}
                        className={`px-3 py-2 rounded-lg font-medium transition ${
                          pagination.page === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Service CTA */}
      <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Offer Your B2B Services & Products</h2>
          <p className="text-blue-100 mb-8">
            Connect with thousands of businesses looking for manufacturing, logistics, quality testing, and other B2B solutions
          </p>
          <Link
            href="/services/create"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            List Your Services
          </Link>
        </div>
      </div>
    </div>
  );
}
