'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';
import { resolveImageUrl } from '@/lib/imageUrl';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineXMark,
  HiOutlineShieldCheck,
  HiOutlineXCircle,
  HiOutlineArrowPath,
} from '@/lib/icons';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: { url: string }[];
  category: { _id: string; name: string };
  seller: { _id: string; name: string; companyName: string; email?: string };
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  stock: number;
  sku?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductDetail extends Product {
  rejectionReason?: string;
  seller: Product['seller'] & { phone?: string; isVerified?: boolean };
}

interface ProductStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const PAGE_SIZE = 10;

const ProductManagementPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    draft: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'draft' | 'pending' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [detailProduct, setDetailProduct] = useState<ProductDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showSuspendBox, setShowSuspendBox] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { setPage(1); }, [filter, debouncedSearch]);

  useEffect(() => { fetchProducts(); }, [filter, debouncedSearch, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ filter, page: String(page), limit: String(PAGE_SIZE) });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await axios.get(`/admin/products?${params.toString()}`);
      if (res.data?.success) {
        setProducts(res.data.data.products);
        setStats(res.data.data.stats);
        if (res.data.data.pagination) setPagination(res.data.data.pagination);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (productId: string) => {
    setDetailLoading(true);
    setShowSuspendBox(false);
    setSuspendReason('');
    try {
      const res = await axios.get(`/admin/products/${productId}`);
      if (res.data?.success) {
        setDetailProduct(res.data.data.product);
      }
    } catch (err: any) {
      console.error('Error fetching product details:', err);
      toast.error('Failed to load product details');
    } finally {
      setDetailLoading(false);
    }
  };

  const suspendProduct = async () => {
    if (!detailProduct) return;
    if (!suspendReason.trim()) { toast.error('Enter a reason for suspending this product'); return; }
    setActing(true);
    try {
      await axios.patch(`/admin/products/${detailProduct._id}/reject`, { notes: suspendReason });
      toast.success('Product suspended — removed from the public feed');
      setProducts(prev => prev.map(p => p._id === detailProduct._id ? { ...p, status: 'rejected' } : p));
      setDetailProduct(prev => prev ? { ...prev, status: 'rejected', rejectionReason: suspendReason } : prev);
      setShowSuspendBox(false);
      setSuspendReason('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to suspend product');
    } finally {
      setActing(false);
    }
  };

  const restoreProduct = async () => {
    if (!detailProduct) return;
    setActing(true);
    try {
      await axios.patch(`/admin/products/${detailProduct._id}/approve`);
      toast.success('Product restored to the feed');
      setProducts(prev => prev.map(p => p._id === detailProduct._id ? { ...p, status: 'approved' } : p));
      setDetailProduct(prev => prev ? { ...prev, status: 'approved', rejectionReason: undefined } : prev);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to restore product');
    } finally {
      setActing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-200 text-gray-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Live';
      case 'rejected': return 'Suspended';
      case 'pending': return 'Pending Review';
      case 'draft': return 'Draft (not published)';
      default: return status;
    }
  };

  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
        <p className="text-gray-600 mt-2">Verified sellers publish directly — review any listing and suspend if needed</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📦</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Live</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">✅</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Drafts (unpublished)</p>
              <p className="text-2xl font-bold text-gray-500">{stats.draft}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📝</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">🚫</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Products' },
              { value: 'approved', label: 'Live' },
              { value: 'draft', label: 'Drafts' },
              { value: 'pending', label: 'Pending Review' },
              { value: 'rejected', label: 'Suspended' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value as any)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid — most-recent-first (server sorts by createdAt desc) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>No products found</p>
          </div>
        ) : (
          products.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="bg-gray-100">
                {product.images.length > 0 ? (
                  <img
                    src={resolveImageUrl(product.images[0]?.url)}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-200">
                    <span className="text-gray-400 text-4xl">📷</span>
                  </div>
                )}
              </div>

              {/* Product Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{product.name}</h3>
                  <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(product.status)}`}>
                    {getStatusText(product.status)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-medium text-gray-900">₹{product.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Stock:</span>
                    <span className="font-medium text-gray-900">{product.stock} units</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium text-gray-900">{product.category?.name || 'Uncategorized'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Listed by:</span>
                    <span className="font-medium text-gray-900">{product.seller?.companyName || product.seller?.name || 'Unknown Seller'}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  <p>Created: {formatDate(product.createdAt)}</p>
                </div>

                <button
                  onClick={() => openDetails(product._id)}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-lg shadow-sm border px-6 py-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-800">{rangeStart}-{rangeEnd}</span> of{' '}
            <span className="font-semibold text-gray-800">{pagination.total}</span> products
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 px-2">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page >= pagination.pages}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {(detailProduct || detailLoading) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {detailLoading || !detailProduct ? (
              <div className="p-12 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
                  <h2 className="text-lg font-bold text-gray-900">Product Details</h2>
                  <button onClick={() => setDetailProduct(null)} className="text-gray-400 hover:text-gray-600">
                    <HiOutlineXMark className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Image + title/status */}
                  <div className="flex gap-4">
                    <div className="w-28 h-28 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {detailProduct.images?.[0]?.url ? (
                        <img src={resolveImageUrl(detailProduct.images[0].url)} alt={detailProduct.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📷</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-xl text-gray-900">{detailProduct.name}</h3>
                        <span className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(detailProduct.status)}`}>
                          {getStatusText(detailProduct.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">₹{detailProduct.price} · {detailProduct.stock} units · {detailProduct.category?.name || 'Uncategorized'}</p>
                      {detailProduct.sku && <p className="text-xs text-gray-400 mt-1">SKU: {detailProduct.sku}</p>}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">{detailProduct.description}</p>

                  {/* Who + when */}
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Listed By</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{detailProduct.seller?.companyName || detailProduct.seller?.name || 'Unknown Seller'}</p>
                      <p className="text-xs text-gray-500">{detailProduct.seller?.email}</p>
                      {detailProduct.seller?.isVerified !== undefined && (
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${detailProduct.seller.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {detailProduct.seller.isVerified ? '✓ Verified Seller' : 'Unverified Seller'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Created On</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDate(detailProduct.createdAt)}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-2">Last Updated</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDate(detailProduct.updatedAt)}</p>
                    </div>
                  </div>

                  {detailProduct.status === 'rejected' && detailProduct.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                      <strong>Suspension reason:</strong> {detailProduct.rejectionReason}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-100">
                    {detailProduct.status === 'approved' && !showSuspendBox && (
                      <button
                        onClick={() => setShowSuspendBox(true)}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl text-sm transition"
                      >
                        <HiOutlineXCircle className="w-4 h-4" />
                        Suspend Product (remove from feed)
                      </button>
                    )}

                    {detailProduct.status === 'approved' && showSuspendBox && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-600">Reason for suspension (shown to seller):</p>
                        <textarea
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                          placeholder="e.g. Misleading listing, prohibited item..."
                          rows={3}
                          autoFocus
                          className="w-full border-2 border-red-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={suspendProduct}
                            disabled={acting}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition"
                          >
                            {acting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                            Confirm Suspend
                          </button>
                          <button
                            onClick={() => { setShowSuspendBox(false); setSuspendReason(''); }}
                            className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {detailProduct.status === 'rejected' && (
                      <button
                        onClick={restoreProduct}
                        disabled={acting}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition"
                      >
                        {acting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiOutlineArrowPath className="w-4 h-4" />}
                        Restore to Feed
                      </button>
                    )}

                    {(detailProduct.status === 'draft' || detailProduct.status === 'pending') && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                        <HiOutlineShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
                        Not live yet — this product isn't visible in the public feed, no action needed.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagementPage;
