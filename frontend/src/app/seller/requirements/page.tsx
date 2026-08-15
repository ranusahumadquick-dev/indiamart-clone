'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CityDropdown } from "@/components/common/LocationDropdown";
import Link from 'next/link';
import { resolveImageUrl } from '@/lib/imageUrl';
import { HiOutlineDocumentText, HiOutlineMagnifyingGlass } from "@/lib/icons";

interface BuyRequirement {
  _id: string;
  productName: string;
  category: string | { _id: string; name: string };
  subCategory: string | { _id: string; name: string };
  description: string;
  quantityRequired: number;
  unit: string;
  budgetMin: number;
  budgetMax: number;
  deliveryLocation: {
    city: string;
    state: string;
  };
  deliveryTimeline: string;
  status: 'active' | 'closed';
  buyer: {
    _id: string;
    name: string;
    companyName: string;
    avatar: string;
  };
  responses?: any[];
  createdAt: string;
}

const DELIVERY_TIMELINES = ['Urgent', '1-2 weeks', '1 month', 'Flexible'];
const CATEGORIES = [
  'Food & Beverages',
  'Electronics',
  'Clothing & Fashion',
  'Home & Furnishings',
  'Industrial Equipment',
  'Raw Materials',
  'Others'
];

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<BuyRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [minBudget, setMinBudget] = useState<number>(0);
  const [maxBudget, setMaxBudget] = useState<number>(1000000);
  const [selectedTimeline, setSelectedTimeline] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('active');

  const fetchRequirements = useCallback(async () => {
    try {
      setLoading(true);

      const params: Record<string, string> = {};
      if (selectedCity) params.city = selectedCity;
      if (selectedTimeline) params.deliveryTimeline = selectedTimeline;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await axios.get('/buy-requirements', { params });

      // Backend returns { buyRequirements, pagination } — key is buyRequirements
      let all: BuyRequirement[] = response.data.data?.buyRequirements || [];

      // Client-side filter: search by productName
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        all = all.filter(r => r.productName.toLowerCase().includes(q));
      }

      // Client-side filter: category name match
      if (selectedCategory) {
        all = all.filter(r => {
          const catName = typeof r.category === 'object' ? (r.category as any)?.name : r.category;
          return catName?.toLowerCase().includes(selectedCategory.toLowerCase());
        });
      }

      setRequirements(all);
      console.log(`[RFQ] Fetched ${all.length} requirements`);
    } catch (error: any) {
      console.error('[RFQ] Error fetching requirements:', error?.response?.data || error.message);
      toast.error('Failed to load requirements');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedCity, minBudget, maxBudget, selectedTimeline, statusFilter, searchQuery]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatBudget = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineDocumentText className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Buyer Requirements</h1>
            </div>
            <p className="text-gray-600">Browse and respond to buyer posted requirements (RFQs)</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>

                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <HiOutlineMagnifyingGlass className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Product name..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div className="mb-6">
                  <CityDropdown label="City" value={selectedCity} onChange={setSelectedCity} />
                </div>

                {/* Budget Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      value={minBudget}
                      onChange={(e) => setMinBudget(Number(e.target.value))}
                      placeholder="Min budget"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <input
                      type="number"
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(Number(e.target.value))}
                      placeholder="Max budget"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Delivery Timeline */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Timeline</label>
                  <select
                    value={selectedTimeline}
                    onChange={(e) => setSelectedTimeline(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Timelines</option>
                    {DELIVERY_TIMELINES.map((timeline) => (
                      <option key={timeline} value={timeline}>
                        {timeline}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="space-y-2">
                    {(['all', 'active', 'closed'] as const).map((status) => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value={status}
                          checked={statusFilter === status}
                          onChange={(e) => setStatusFilter(e.target.value as any)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 capitalize">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                    setSelectedCity('');
                    setMinBudget(0);
                    setMaxBudget(1000000);
                    setSelectedTimeline('');
                    setStatusFilter('active');
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Requirements List */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : requirements.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg">
                  <HiOutlineDocumentText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements found</h3>
                  <p className="text-gray-500">Try adjusting your filters to see more opportunities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requirements.map((req) => (
                    <div
                      key={req._id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{req.productName}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {typeof req.category === 'object' ? (req.category as any)?.name : req.category}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            req.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {req.status === 'active' ? 'Open' : 'Closed'}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4">{req.description.substring(0, 120)}...</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Quantity</p>
                          <p className="text-sm font-medium text-gray-900">
                            {req.quantityRequired} {req.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatBudget(req.budgetMin)} - {formatBudget(req.budgetMax)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="text-sm font-medium text-gray-900">{req.deliveryLocation.city}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Timeline</p>
                          <p className="text-sm font-medium text-gray-900">{req.deliveryTimeline}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveImageUrl(req.buyer.avatar) || '/avatar-placeholder.png'}
                            alt={req.buyer.name}
                            className="w-10 h-10 rounded-full object-cover bg-gray-100"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.buyer.name || 'B')}&background=3b82f6&color=fff&size=40`; }}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{req.buyer.companyName || req.buyer.name}</p>
                            <p className="text-xs text-gray-500">{formatDate(req.createdAt)}</p>
                          </div>
                        </div>
                        <Link
                          href={`/seller/requirements/${req._id}`}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                        >
                          View &amp; Respond
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
