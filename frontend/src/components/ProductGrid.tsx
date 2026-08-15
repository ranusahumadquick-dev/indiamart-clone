'use client';

import { useMemo } from 'react';
import ProductCardPro from './ui/ProductCardPro';

// ─── Types ──────────────────────────────────────────────────────────
interface Product {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number;
  images?: { url: string; alt?: string }[];
  city?: string;
  state?: string;
  companyName?: string;
  averageRating?: number;
  numReviews?: number;
  minOrderQuantity?: number;
  priceUnit?: string;
  isVerified?: boolean;
  category?: string | { _id: string; name: string };
  stock?: number;
  description?: string;
}

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  gridCols?: number;
  showFilters?: boolean;
}

// ─── Skeleton Loader ────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Image Skeleton */}
      <div className="w-full h-[250px] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />

      {/* Content Skeleton */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-4/6 animate-pulse" />
        </div>

        {/* Rating */}
        <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
        </div>

        {/* Button */}
        <div className="h-10 bg-blue-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
export default function ProductGrid({
  products,
  loading = false,
  gridCols = 4,
  showFilters = false,
}: ProductGridProps) {
  // Responsive grid columns
  const gridColsClass = useMemo(() => {
    switch (gridCols) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 5:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  }, [gridCols]);

  return (
    <div className="w-full bg-white">
      {/* Header Section */}
      {showFilters && (
        <div className="border-b border-gray-200 mb-6">
          <div className="max-w-full px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Products</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {products.length} products
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Sort By: <select className="border rounded px-2 py-1" defaultValue="newest">
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="w-full px-4 py-6">
        {products.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No products found
            </h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className={`grid ${gridColsClass} gap-4`}>
            {/* Loading State */}
            {loading &&
              Array.from({ length: gridCols }).map((_, i) => (
                <ProductSkeleton key={`skeleton-${i}`} />
              ))}

            {/* Product Cards */}
            {products.map((product) => (
              <ProductCardPro
                key={product._id}
                _id={product._id}
                name={product.name}
                price={product.price}
                comparePrice={product.comparePrice}
                images={product.images}
                city={product.city}
                state={product.state}
                companyName={product.companyName}
                averageRating={product.averageRating}
                numReviews={product.numReviews}
                minOrderQuantity={product.minOrderQuantity}
                priceUnit={product.priceUnit}
                isVerified={product.isVerified}
                category={product.category}
                stock={product.stock}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      {products.length > 0 && (
        <div className="border-t border-gray-200 mt-8 px-4 py-6 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-semibold text-gray-800">
                {products.length} Products
              </span>
              {' with verified sellers and authentic prices'}
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <span>✓ Quality Verified</span>
              <span>✓ Secure Payments</span>
              <span>✓ Fast Shipping</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
