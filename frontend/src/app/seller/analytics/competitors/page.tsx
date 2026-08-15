'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { HiOutlineTrophy, HiOutlineStar, HiOutlineShoppingBag, HiOutlineCheckCircle } from "@/lib/icons";

interface Competitor {
  rank: number;
  seller: {
    _id: string;
    name: string;
    companyName: string;
    avatar: string;
    isTrusted: boolean;
  };
  metrics: {
    productCount: number;
    avgRating: number;
    totalReviews: number;
  };
}

interface CompetitorData {
  yourMetrics: {
    productCount: number;
    avgRating: number;
    totalReviews: number;
  };
  competitors: Competitor[];
  categoryCount: number;
  rankingPosition: number;
}

export default function CompetitorInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [competitorData, setCompetitorData] = useState<CompetitorData | null>(null);

  useEffect(() => {
    fetchCompetitorInsights();
  }, []);

  const fetchCompetitorInsights = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get('/analytics/seller/competitors', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCompetitorData(response.data.data);
    } catch (error: any) {
      console.error('Error fetching competitors:', error);
      toast.error('Failed to load competitor insights');
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

  if (!competitorData) {
    return (
      <ProtectedRoute allowedRoles={['seller']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">Unable to load competitor data</p>
        </div>
      </ProtectedRoute>
    );
  }

  const { yourMetrics, competitors, categoryCount, rankingPosition } = competitorData;

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Competitor Insights</h1>
            <p className="text-gray-600 mt-2">Compare your performance with top sellers in your categories</p>
          </div>

          {/* Your Ranking Card */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-lg mb-2">Your Market Ranking</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-bold">{rankingPosition}</span>
                  <span className="text-2xl mb-2">
                    {rankingPosition === 1 && '👑'}
                    {rankingPosition <= 3 && rankingPosition > 1 && '🥈'}
                    {rankingPosition > 3 && '📈'}
                  </span>
                </div>
                <p className="text-blue-100 mt-2">
                  Out of {competitors.length} top competitors in {categoryCount} categor{categoryCount === 1 ? 'y' : 'ies'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-blue-100 text-sm mb-4">Your Metrics</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-lg font-semibold">{yourMetrics.productCount}</span>
                    <HiOutlineShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-lg font-semibold">{Number(yourMetrics.avgRating).toFixed(2)}★</span>
                    <HiOutlineStar className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm">{yourMetrics.totalReviews} reviews</span>
                    <HiOutlineCheckCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Competitors */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Competitors</h2>

            {competitors.map(competitor => (
              <div
                key={competitor.seller._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  {/* Competitor Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white font-bold text-lg">
                        #{competitor.rank}
                      </div>
                    </div>

                    {/* Seller Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {competitor.seller.companyName || competitor.seller.name}
                        </h3>
                        {competitor.seller.isTrusted && (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{competitor.seller.name}</p>
                    </div>
                  </div>

                  {/* Metrics Comparison */}
                  <div className="grid grid-cols-3 gap-6 ml-4">
                    {/* Products */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Products</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {competitor.metrics.productCount}
                      </p>
                      <div className="mt-2 flex items-center justify-end">
                        {competitor.metrics.productCount > yourMetrics.productCount ? (
                          <span className="text-xs text-red-600">
                            {competitor.metrics.productCount - yourMetrics.productCount} more
                          </span>
                        ) : (
                          <span className="text-xs text-green-600">
                            {yourMetrics.productCount - competitor.metrics.productCount} more (yours)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Rating</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Number(competitor.metrics.avgRating).toFixed(2)}★
                      </p>
                      <div className="mt-2">
                        {Number(competitor.metrics.avgRating) > Number(yourMetrics.avgRating) ? (
                          <span className="text-xs text-red-600">
                            {(Number(competitor.metrics.avgRating) - Number(yourMetrics.avgRating)).toFixed(2)} higher
                          </span>
                        ) : (
                          <span className="text-xs text-green-600">
                            {(Number(yourMetrics.avgRating) - Number(competitor.metrics.avgRating)).toFixed(2)} higher (yours)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reviews */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {competitor.metrics.totalReviews}
                      </p>
                      <div className="mt-2">
                        {competitor.metrics.totalReviews > yourMetrics.totalReviews ? (
                          <span className="text-xs text-red-600">
                            {competitor.metrics.totalReviews - yourMetrics.totalReviews} more
                          </span>
                        ) : (
                          <span className="text-xs text-green-600">
                            {yourMetrics.totalReviews - competitor.metrics.totalReviews} more (yours)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {competitors.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600">No competitors in your categories yet</p>
              </div>
            )}
          </div>

          {/* Insights Box */}
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900 font-semibold mb-2">💡 Key Insights:</p>
            <ul className="text-sm text-amber-900 space-y-2">
              <li>• Focus on adding more products to increase market visibility</li>
              <li>• Improve your product ratings by maintaining high quality and customer service</li>
              <li>• Encourage satisfied customers to leave reviews</li>
              <li>• Monitor competitor strategies and adapt accordingly</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
