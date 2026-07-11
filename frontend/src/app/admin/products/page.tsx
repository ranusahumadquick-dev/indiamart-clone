'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';
import { resolveImageUrl } from '@/lib/imageUrl';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: { url: string }[];
  category: { _id: string; name: string };
  seller: { _id: string; name: string; companyName: string };
  status: 'pending' | 'approved' | 'rejected';
  stock: number;
  sku?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const ProductManagementPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/admin/products?filter=${filter}`);
      if (res.data?.success) {
        setProducts(res.data.data.products);
        setStats(res.data.data.stats);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const approveProduct = async (productId: string) => {
    try {
      const res = await axios.patch(`/admin/products/${productId}/approve`, { 
        status: 'approved',
        notes: reviewNotes
      });
      if (res.data?.success) {
        setProducts(prev => prev.map(product => 
          product._id === productId ? { ...product, status: 'approved' as const } : product
        ));
        toast.success('Product approved successfully');
        setShowReviewModal(false);
        setReviewNotes('');
      }
    } catch (err: any) {
      console.error('Error approving product:', err);
      toast.error('Failed to approve product');
    }
  };

  const rejectProduct = async (productId: string) => {
    try {
      const res = await axios.patch(`/admin/products/${productId}/reject`, { 
        status: 'rejected',
        notes: reviewNotes
      });
      if (res.data?.success) {
        setProducts(prev => prev.map(product => 
          product._id === productId ? { ...product, status: 'rejected' as const } : product
        ));
        toast.success('Product rejected successfully');
        setShowReviewModal(false);
        setReviewNotes('');
      }
    } catch (err: any) {
      console.error('Error rejecting product:', err);
      toast.error('Failed to reject product');
    }
  };

  const reviewProduct = (product: Product) => {
    setSelectedProduct(product);
    setReviewAction('approve');
    setReviewNotes('');
    setShowReviewModal(true);
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending Review';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
        <p className="text-gray-600 mt-2">Review, approve, and manage product listings</p>
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
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">⏳</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
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
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">❌</span>
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
              { value: 'pending', label: 'Pending Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' }
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

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>No products found</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="aspect-w-16 aspect-h-12 bg-gray-100">
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
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{product.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(product.status)}`}>
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
                    <span className="text-gray-500">Seller:</span>
                    <span className="font-medium text-gray-900">{product.seller?.companyName || 'Unknown Seller'}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  <p>SKU: {product.sku}</p>
                  <p>Submitted: {formatDate(product.createdAt)}</p>
                </div>

                <div className="flex space-x-2">
                  {product.status === 'pending' && (
                    <>
                      <button
                        onClick={() => reviewProduct(product)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Review Product
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => window.open(`/products/${product._id}`, '_blank')}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Review Product - {selectedProduct.name}</h2>
            
            {/* Product Preview */}
            <div className="mb-6">
              <div className="aspect-w-16 aspect-h-12 bg-gray-100 rounded-lg">
                {selectedProduct.images.length > 0 ? (
                  <img
                    src={resolveImageUrl(selectedProduct.images[0]?.url)}
                    alt={selectedProduct.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-200 rounded-lg">
                    <span className="text-gray-400 text-4xl">📷</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900">Product Information</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedProduct.description}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Pricing & Inventory</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Price: ₹{selectedProduct.price} | Stock: {selectedProduct.stock} units
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Seller Information</h3>
              <p className="text-sm text-gray-600">
                {selectedProduct.seller?.name || 'Unknown'} | {selectedProduct.seller?.companyName || 'No Company'}
              </p>
            </div>

            {/* Review Form */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Review Decision</h3>
              <div className="flex space-x-4 mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="action"
                    value="approve"
                    checked={reviewAction === 'approve'}
                    onChange={(e) => setReviewAction('approve')}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium text-green-700">Approve Product</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="action"
                    value="reject"
                    checked={reviewAction === 'reject'}
                    onChange={(e) => setReviewAction('reject')}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium text-red-700">Reject Product</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes (Optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={reviewAction === 'approve' 
                    ? 'Add any notes about your approval (optional)'
                    : 'Provide reasons for rejection (required)'}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewNotes('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (reviewAction === 'approve') {
                    approveProduct(selectedProduct._id);
                  } else {
                    rejectProduct(selectedProduct._id);
                  }
                }}
                disabled={!reviewNotes && reviewAction === 'reject'}
                className={`px-4 py-2 text-white font-medium rounded-lg transition-colors ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                }`}
              >
                {reviewAction === 'approve' ? 'Approve Product' : 'Reject Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagementPage;