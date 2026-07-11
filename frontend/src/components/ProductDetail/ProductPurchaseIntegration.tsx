'use client';

import React from 'react';
import DynamicPurchaseSystem from './DynamicPurchaseSystem';

/**
 * Example Usage of DynamicPurchaseSystem
 *
 * This component shows how to integrate the purchase system
 * into your product detail page
 */

// Sample Product Data (from your API)
const sampleProduct = {
  _id: '123456',
  name: 'Industrial Solar Panel System',
  price: 50000,
  stock: 500,
  moq: 10,
  bulkPrices: [
    { quantity: 10, price: 50000 },
    { quantity: 25, price: 48000 },
    { quantity: 50, price: 45000 },
    { quantity: 100, price: 42000 },
    { quantity: 500, price: 40000 }
  ],
  category: {
    name: 'Solar Products',
    slug: 'solar-products' // This determines which tabs show
  },
  subCategory: {
    name: 'Solar Panels',
    slug: 'solar-panels'
  }
};

const sampleSeller = {
  _id: 'seller123',
  name: 'Green Energy Solutions',
  companyName: 'Green Energy Solutions Pvt Ltd'
};

/**
 * USAGE INSTRUCTIONS:
 *
 * 1. In your ProductDetailPage component, import DynamicPurchaseSystem:
 *    import DynamicPurchaseSystem from '@/components/ProductDetail/DynamicPurchaseSystem';
 *
 * 2. Get product and seller data from your API or props
 *
 * 3. Add the component to your JSX:
 *    <DynamicPurchaseSystem product={product} seller={seller} />
 *
 * 4. The component will automatically:
 *    ✅ Detect the category
 *    ✅ Show appropriate tabs (Wholesale only OR Wholesale + Customization)
 *    ✅ Handle all purchase logic
 *    ✅ Be fully responsive on mobile
 */

// Example in ProductDetailPage
export const ProductDetailPageExample = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Images Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-4xl">🔆</span>
              </div>
              <p className="text-sm text-gray-600">Product Image Placeholder</p>
            </div>
          </div>

          {/* Product Info & Purchase System */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Header */}
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{sampleProduct.name}</h1>
                <p className="text-gray-600 mt-2">Perfect for commercial and industrial solar installations</p>
              </div>

              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-blue-600">₹{sampleProduct.price.toLocaleString()}</span>
                <span className="text-sm text-gray-600">Starting from</span>
              </div>

              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Minimum Order: </span>
                  <span className="font-semibold">{sampleProduct.moq} units</span>
                </div>
                <div>
                  <span className="text-gray-600">In Stock: </span>
                  <span className="font-semibold text-green-600">{sampleProduct.stock} units</span>
                </div>
              </div>
            </div>

            {/* Dynamic Purchase System - Main Component */}
            <DynamicPurchaseSystem
              product={sampleProduct}
              seller={sampleSeller}
            />

            {/* Additional Product Info */}
            <div className="bg-white rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">About Seller</h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  GE
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{sampleSeller.companyName}</h4>
                  <p className="text-sm text-gray-600">⭐ 4.8/5 (2,340 reviews)</p>
                  <p className="text-sm text-gray-600">📍 Bangalore, India</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                    View Profile →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPageExample;

/**
 * CATEGORY MAPPING EXAMPLES:
 *
 * ✅ SHOWS BOTH TABS (Wholesale + Customization):
 * - Industrial Machinery
 * - Hydraulic Equipment
 * - Solar Products
 * - Electronics Components
 * - LED Lights
 * - Packaging Machines
 * - Agriculture Equipment
 * - Furniture
 * - Apparel & Textiles
 * - Promotional Products
 *
 * ✅ SHOWS WHOLESALE ONLY:
 * - Laptops
 * - Mobile Accessories
 * - Water Bottles
 * - Kids Toys
 * - Home Appliances
 * - Consumer Electronics
 * - Grocery Products
 * - Office Supplies
 */
