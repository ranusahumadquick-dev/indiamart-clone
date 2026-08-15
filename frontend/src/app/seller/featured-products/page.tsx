'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import { resolveImageUrl } from '@/lib/imageUrl';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { HiOutlineStar, HiStar, HiOutlineTrash, HiOutlineExclamationCircle, HiOutlineCheckCircle } from "@/lib/icons";

interface Product {
  _id: string;
  name: string;
  price: number;
  images: Array<{ url: string }>;
  city: string;
  state: string;
  isFeatured: boolean;
  featuredUntil: string | null;
  isFeaturedExpired?: boolean;
  createdAt: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export default function FeaturedProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [page, setPage] = useState(1);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [showDurationModal, setShowDurationModal] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`/products/seller/featured/manage?page=${page}&limit=12`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProducts(response.data.data.products || []);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (productId: string, currentStatus: boolean) => {
    if (currentStatus) {
      // Unfeature product
      await toggleFeatured(productId, false);
    } else {
      // Feature product - show duration modal
      setShowDurationModal(productId);
    }
  };

  const toggleFeatured = async (productId: string, isFeatured: boolean, durationDays: number = 30) => {
    try {
      setToggling(productId);
      const token = localStorage.getItem('authToken');
      await axios.put(
        `/products/${productId}/featured`,
        { isFeatured, durationDays },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(isFeatured ? 'Product featured successfully!' : 'Product unfeatured');
      setShowDurationModal(null);
      setSelectedDuration(30);
      await fetchProducts();
    } catch (error: any) {
      console.error('Error toggling featured:', error);
      toast.error(error.response?.data?.message || 'Failed to update featured status');
    } finally {
      setToggling(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['seller']}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  const activeFeaturedCount = products.filter(p => p.isFeatured && !p.isFeaturedExpired).length;

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Featured Products</h1>
            <p className="text-gray-600 mt-2">Boost visibility of your products by featuring them</p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Currently featured:</strong> {activeFeaturedCount} product{activeFeaturedCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600 mb-4">You don't have any products yet</p>
              <Link
                href="/seller/products/new"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first product →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100">
                    {product.images && product.images[0]?.url ? (
                      <img
                        src={resolveImageUrl(product.images[0].url)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <span className="text-gray-500 text-sm">No image</span>
                      </div>
                    )}

                    {/* Featured Badge */}
                    {product.isFeatured && !product.isFeaturedExpired && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <HiStar className="w-3 h-3" />
                        FEATURED
                      </div>
                    )}

                    {product.isFeaturedExpired && product.isFeatured && (
                      <div className="absolute top-2 left-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <HiOutlineExclamationCircle className="w-3 h-3" />
                        EXPIRED
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-2">
                      {product.name}
                    </h3>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-lg font-bold text-gray-900">
                        ₹{product.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 mb-4">
                      {product.city && product.state && `${product.city}, ${product.state}`}
                    </div>

                    {/* Featured Status Info */}
                    {product.isFeatured && product.featuredUntil && !product.isFeaturedExpired && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                        <p className="text-xs text-blue-900 font-medium">
                          Featured until {formatDate(product.featuredUntil)}
                        </p>
                        <p className="text-xs text-blue-700">
                          {getDaysRemaining(product.featuredUntil)} days remaining
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {product.isFeatured && !product.isFeaturedExpired ? (
                        <button
                          onClick={() => handleToggleFeatured(product._id, true)}
                          disabled={toggling === product._id}
                          className="flex-1 px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm font-medium transition disabled:opacity-50"
                        >
                          {toggling === product._id ? 'Removing...' : 'Unfeature'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleFeatured(product._id, false)}
                          disabled={toggling === product._id}
                          className="flex-1 px-3 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <HiOutlineStar className="w-4 h-4" />
                          {toggling === product._id ? 'Processing...' : 'Feature'}
                        </button>
                      )}
                      <Link
                        href={`/seller/products/${product._id}`}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition text-center"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-2 rounded-lg ${
                      page === p
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          {/* Duration Modal */}
          {showDurationModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-sm w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Feature Product</h2>
                <p className="text-gray-600 mb-6">
                  How long would you like to feature this product?
                </p>

                <div className="space-y-3 mb-6">
                  {[7, 14, 30, 60, 90].map(days => (
                    <label
                      key={days}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                        selectedDuration === days
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="duration"
                        value={days}
                        checked={selectedDuration === days}
                        onChange={() => setSelectedDuration(days)}
                        className="w-4 h-4"
                      />
                      <span className="ml-3 flex-1">
                        <span className="font-medium text-gray-900">{days} days</span>
                        {days === 30 && <span className="text-xs text-blue-600 ml-2">(Most popular)</span>}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDurationModal(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      toggleFeatured(showDurationModal, true, selectedDuration);
                    }}
                    disabled={toggling === showDurationModal}
                    className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50"
                  >
                    {toggling === showDurationModal ? 'Processing...' : 'Feature Now'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
