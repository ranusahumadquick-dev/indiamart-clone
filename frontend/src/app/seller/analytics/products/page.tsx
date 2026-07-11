'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import { resolveImageUrl } from '@/lib/imageUrl';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { HiOutlineEye, HiOutlineEnvelope, HiOutlineArrowRight } from 'react-icons/hi2';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Product {
  name: string;
  price: number;
  images: Array<{ url: string }>;
  totalViews: number;
  totalClicks: number;
  totalInquiries: number;
  avgClickThroughRate: number;
  avgInquiryRate: number;
  avgConversionRate: number;
  avgPerformanceScore: number;
  productDetails?: any[];
}

export default function ProductAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [productDetail, setProductDetail] = useState<any>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchTopProducts();
  }, [days]);

  const fetchTopProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`/analytics/seller/top-products`, {
        params: { days, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });

      setProducts(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load product analytics');
    } finally {
      setLoading(false);
    }
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

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Product Performance</h1>
            <p className="text-gray-600 mt-2">Analyze each product's views, clicks, and conversion rates</p>
          </div>

          {/* Date Range Selector */}
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Last:</span>
              {[7, 14, 30, 60, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    days === d
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Views</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Clicks</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Click Rate</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Inquiries</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Conv. Rate</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.productDetails?.[0]?.images?.[0]?.url && (
                            <img
                              src={resolveImageUrl(product.productDetails[0].images[0].url)}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 max-w-xs truncate">
                              {product.productDetails?.[0]?.name || 'Product'}
                            </p>
                            <p className="text-xs text-gray-500">
                              ₹{product.productDetails?.[0]?.price || 0}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <HiOutlineEye className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-gray-900">{product.totalViews.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{product.totalClicks.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{Number(product.avgClickThroughRate).toFixed(2)}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <HiOutlineEnvelope className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-gray-900">{product.totalInquiries}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{Number(product.avgConversionRate).toFixed(2)}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${product.avgPerformanceScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {Math.round(product.avgPerformanceScore)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No products with analytics data</p>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>📊 Metric Definitions:</strong>
            </p>
            <ul className="text-sm text-blue-900 list-disc list-inside mt-2 space-y-1">
              <li><strong>Click Rate:</strong> Clicks as % of product views</li>
              <li><strong>Conv. Rate:</strong> Inquiries as % of clicks (conversion rate)</li>
              <li><strong>Score:</strong> Overall performance ranking (0-100)</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
