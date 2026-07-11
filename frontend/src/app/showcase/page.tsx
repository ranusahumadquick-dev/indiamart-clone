'use client';

import { useState, useEffect } from 'react';
import ProductGrid from '@/components/ProductGrid';
import api from '@/lib/axios';

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
}

export default function ShowcasePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridCols, setGridCols] = useState(4);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products?page=1&limit=20');
      if (response.data?.data?.products) {
        setProducts(response.data.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Professional Product Grid
              </h1>
              <p className="text-gray-600 mt-2">
                Smart product images matched automatically to product titles
              </p>
            </div>

            {/* Grid Columns Selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Grid Columns:</label>
              <select
                value={gridCols}
                onChange={(e) => setGridCols(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
                <option value={5}>5 Columns</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Features Highlight */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              icon="🖼️"
              title="Smart Images"
              description="Images auto-match product titles using AI"
            />
            <FeatureCard
              icon="📐"
              title="Consistent Sizing"
              description="All images maintain 4:3 aspect ratio"
            />
            <FeatureCard
              icon="✨"
              title="Hover Effects"
              description="Smooth 1.05x zoom on hover"
            />
            <FeatureCard
              icon="📱"
              title="Responsive"
              description="Works perfectly on all devices"
            />
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto">
        <ProductGrid
          products={products}
          loading={loading}
          gridCols={gridCols}
          showFilters={true}
        />
      </div>

      {/* Technical Details */}
      <div className="bg-gray-900 text-white py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Technical Implementation</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Image Matching</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>✓ Keyword extraction from product titles</li>
                <li>✓ Category-based fallback images</li>
                <li>✓ 100+ product keywords mapped</li>
                <li>✓ Smart normalization of category names</li>
                <li>✓ Handles compound names (e.g., "Textiles & Apparel")</li>
              </ul>
            </div>

            {/* Right Column */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">CSS Optimization</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>✓ object-fit: cover (no stretching)</li>
                <li>✓ Fixed height: 250px (consistent cards)</li>
                <li>✓ Aspect ratio 4:3 (professional look)</li>
                <li>✓ transform: scale(1.05) on hover</li>
                <li>✓ Responsive grid: 1/2/3/4/5 columns</li>
              </ul>
            </div>
          </div>

          {/* Code Examples */}
          <div className="mt-8 space-y-4">
            <CodeBlock
              title="Image Container CSS"
              code={`<div className="w-full h-[250px] overflow-hidden">
  <img
    src={imageUrl}
    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
    alt="product"
  />
</div>`}
            />

            <CodeBlock
              title="Product Card Structure"
              code={`<div className="bg-white rounded-lg border border-gray-200 flex flex-col h-full">
  {/* Fixed height image section */}
  <div className="w-full h-[250px] overflow-hidden">
    <ProductImage title={name} category={category} />
  </div>

  {/* Content section */}
  <div className="flex-1 flex flex-col p-4">
    {/* Product info */}
  </div>
</div>`}
            />

            <CodeBlock
              title="Responsive Grid"
              code={`<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {products.map(product => (
    <ProductCardPro key={product._id} {...product} />
  ))}
</div>`}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>Professional product grid UI for IndiaMart Marketplace</p>
          <p className="text-sm mt-2">All images automatically matched to product titles</p>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-3xl">{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-blue-400 mb-2">{title}</h4>
      <pre className="text-xs text-gray-300 overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}
