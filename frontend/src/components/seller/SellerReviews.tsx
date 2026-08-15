'use client';

import { useState } from 'react';
import { HiStar, HiOutlineStar, HiOutlineEllipsisVertical } from "@/lib/icons";

interface Review {
  _id: string;
  buyerName: string;
  buyerAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  productName?: string;
  images?: string[];
  verified?: boolean;
  createdAt: string;
  sellerResponse?: {
    text: string;
    createdAt: string;
  };
  helpful?: number;
}

interface SellerReviewsProps {
  reviews?: Review[];
  averageRating?: number;
  totalReviews?: number;
  ratingDistribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function SellerReviews({
  reviews = [],
  averageRating = 4.2,
  totalReviews = 128,
  ratingDistribution = { 5: 85, 4: 28, 3: 10, 2: 3, 1: 2 },
}: SellerReviewsProps) {
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');

  const filteredReviews = filterRating
    ? reviews.filter(r => r.rating === filterRating)
    : reviews;

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'helpful') return (b.helpful || 0) - (a.helpful || 0);
    return b.rating - a.rating;
  });

  const renderStars = (rating: number, size: string = 'w-4 h-4') => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        i < rating ? (
          <HiStar key={i} className={`${size} text-yellow-400`} />
        ) : (
          <HiOutlineStar key={i} className={`${size} text-gray-300`} />
        )
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 Reviews & Ratings</h2>
      </div>

      {/* Rating Summary Card */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Overall Rating */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-6xl font-black text-yellow-600 mb-3">{averageRating.toFixed(1)}</div>
            <div className="mb-4">{renderStars(Math.round(averageRating), 'w-6 h-6')}</div>
            <p className="text-gray-600 font-semibold">Based on {totalReviews} reviews</p>
            <p className="text-sm text-gray-500 mt-2">⭐ Highly Rated Seller</p>
          </div>

          {/* Right: Rating Distribution */}
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star as keyof typeof ratingDistribution] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700 w-6">{star}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 font-semibold w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Filter by Rating */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterRating(null)}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition ${
              filterRating === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Reviews ({totalReviews})
          </button>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution[star as keyof typeof ratingDistribution] || 0;
            return (
              <button
                key={star}
                onClick={() => setFilterRating(star)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition ${
                  filterRating === star
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {star}★ ({count})
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-sm font-semibold"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="rating">Highest Rating</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {sortedReviews.length > 0 ? (
          sortedReviews.map((review) => (
            <div key={review._id} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {review.buyerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{review.buyerName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('en-IN')}
                      {review.verified && <span className="ml-2 text-green-600">✓ Verified Purchase</span>}
                    </p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <HiOutlineEllipsisVertical className="w-5 h-5" />
                </button>
              </div>

              {/* Rating & Title */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(review.rating, 'w-5 h-5')}
                  <span className="font-bold text-gray-900">{review.rating}.0</span>
                </div>
                <h4 className="font-bold text-gray-900 text-lg">{review.title}</h4>
              </div>

              {/* Review Comment */}
              <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {review.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 cursor-pointer"
                    >
                      <img src={img} alt={`Review image ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Seller Response */}
              {review.sellerResponse && (
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg mt-4">
                  <p className="text-xs font-bold text-blue-700 mb-2">SELLER RESPONSE</p>
                  <p className="text-gray-700 text-sm">{review.sellerResponse.text}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Replied {new Date(review.sellerResponse.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
              )}

              {/* Helpful & Reply */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                <button className="text-sm text-gray-600 hover:text-blue-600 font-semibold">
                  👍 Helpful ({review.helpful || 0})
                </button>
                {!review.sellerResponse && (
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-semibold">
                    💬 Reply
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-gray-200">
            <p className="text-gray-500 text-lg font-semibold">No reviews yet</p>
            <p className="text-gray-400 text-sm mt-2">Be the first to review this seller!</p>
          </div>
        )}
      </div>
    </div>
  );
}
