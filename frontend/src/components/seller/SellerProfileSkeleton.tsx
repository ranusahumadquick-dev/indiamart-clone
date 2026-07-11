'use client';

export default function SellerProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Logo Skeleton */}
            <div className="flex-shrink-0 w-32 h-32 rounded-lg bg-gray-300 animate-pulse" />

            {/* Seller Info Skeleton */}
            <div className="flex-1 space-y-4 w-full">
              <div className="h-8 bg-gray-300 rounded w-2/3 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 bg-gray-300 rounded w-32 animate-pulse" />
                <div className="h-6 bg-gray-300 rounded w-32 animate-pulse" />
              </div>
              <div className="h-5 bg-gray-300 rounded w-3/4 animate-pulse" />
              <div className="flex gap-3">
                <div className="h-10 bg-gray-300 rounded w-32 animate-pulse" />
                <div className="h-10 bg-gray-300 rounded w-32 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content - 2 cols */}
          <div className="lg:col-span-2">
            {/* Tabs Skeleton */}
            <div className="mb-8 border-b border-gray-200 flex gap-8">
              <div className="h-6 bg-gray-300 rounded w-32 animate-pulse" />
              <div className="h-6 bg-gray-300 rounded w-32 animate-pulse" />
              <div className="h-6 bg-gray-300 rounded w-32 animate-pulse" />
            </div>

            {/* Product Grid Skeleton */}
            <div className="space-y-6">
              {/* Category Filter Skeleton */}
              <div className="flex gap-2 pb-6 border-b border-gray-200">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-300 rounded-full w-24 animate-pulse" />
                ))}
              </div>

              {/* Product Cards Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-48 bg-gray-300 rounded-lg animate-pulse" />
                    <div className="h-5 bg-gray-300 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse" />
                    <div className="h-6 bg-gray-300 rounded w-1/3 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Contact Card Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-4">
              <div className="border-b pb-4">
                <div className="h-6 bg-gray-300 rounded w-3/4 animate-pulse mb-2" />
                <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse" />
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/3 animate-pulse" />
                  <div className="h-10 bg-gray-300 rounded animate-pulse" />
                </div>
              ))}
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-300 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
