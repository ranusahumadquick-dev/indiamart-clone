"use client";

import { useState } from "react";
import ProductVariantsSelector from "@/components/ProductVariants/ProductVariantsSelector";
import {
  ProductWithVariants,
  ProductVariant,
  SelectedVariantState,
} from "@/types/product-variants";

export default function ProductVariantsDemoPage() {
  const [selectedDemo, setSelectedDemo] = useState(0);

  const demoProducts: ProductWithVariants[] = [
    {
      id: "tshirt-001",
      name: "Premium Cotton T-Shirt",
      category: "Apparel",
      basePrice: 499,
      baseRating: 4.6,
      baseReviews: 1250,
      seller: {
        name: "Fashion Pro Store",
        rating: 4.8,
        verified: true,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      },
      defaultVariantId: "v1",
      baseSpecifications: [
        { label: "Material", value: "100% Organic Cotton" },
        { label: "Care", value: "Machine wash cold" },
        { label: "Fit", value: "Regular" },
      ],
      warranty: "12 months quality guarantee",
      returnPolicy: "30 days easy returns",
      deliveryInfo: "Free delivery on orders above ₹999",

      variantGroups: [
        {
          type: "color",
          name: "Color",
          displayMode: "swatch",
          isRequired: true,
          values: [
            { id: "c1", type: "color", name: "Black", value: "black", hexCode: "#000000" },
            { id: "c2", type: "color", name: "White", value: "white", hexCode: "#FFFFFF" },
            { id: "c3", type: "color", name: "Navy", value: "navy", hexCode: "#001F3F" },
            { id: "c4", type: "color", name: "Red", value: "red", hexCode: "#FF4136" },
            { id: "c5", type: "color", name: "Green", value: "green", hexCode: "#2ECC40" },
          ],
        },
        {
          type: "size",
          name: "Size",
          displayMode: "button",
          isRequired: true,
          values: [
            { id: "s1", type: "size", name: "XS", value: "xs" },
            { id: "s2", type: "size", name: "S", value: "s" },
            { id: "s3", type: "size", name: "M", value: "m" },
            { id: "s4", type: "size", name: "L", value: "l" },
            { id: "s5", type: "size", name: "XL", value: "xl" },
            { id: "s6", type: "size", name: "XXL", value: "xxl" },
          ],
        },
      ],

      variants: [
        // Black variants
        {
          id: "v1",
          sku: "TSH-BLK-S",
          title: "Premium Cotton T-Shirt - Black, Size S",
          description: "Classic black t-shirt perfect for everyday wear",
          price: 499,
          originalPrice: 799,
          stock: 45,
          moq: 1,
          images: [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1529260830199-42541ea45f97?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1552062407-291d714cad13?w=500&h=500&fit=crop",
          ],
          thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop",
          available: true,
          isNew: false,
          isBestSeller: true,
          badge: "Best Seller",
          weight: "180g",
          dimensions: "25 x 35 x 2 cm",
          estimatedDelivery: "2-3 days",
          options: [
            { id: "c1", type: "color", name: "Black", value: "black", hexCode: "#000000" },
            { id: "s2", type: "size", name: "S", value: "s" },
          ],
          specifications: [
            { label: "Size", value: "S (Chest: 36 inches)" },
            { label: "Material", value: "100% Organic Cotton" },
            { label: "Weight", value: "180g" },
            { label: "Fit", value: "Regular" },
            { label: "Care", value: "Machine wash cold" },
          ],
        },
        {
          id: "v2",
          sku: "TSH-BLK-M",
          title: "Premium Cotton T-Shirt - Black, Size M",
          price: 499,
          originalPrice: 799,
          stock: 52,
          moq: 1,
          images: [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1529260830199-42541ea45f97?w=500&h=500&fit=crop",
          ],
          thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop",
          available: true,
          isBestSeller: true,
          weight: "190g",
          dimensions: "26 x 36 x 2 cm",
          estimatedDelivery: "2-3 days",
          options: [
            { id: "c1", type: "color", name: "Black", value: "black", hexCode: "#000000" },
            { id: "s3", type: "size", name: "M", value: "m" },
          ],
          specifications: [
            { label: "Size", value: "M (Chest: 38 inches)" },
            { label: "Material", value: "100% Organic Cotton" },
            { label: "Weight", value: "190g" },
            { label: "Fit", value: "Regular" },
          ],
        },
        {
          id: "v3",
          sku: "TSH-BLK-L",
          title: "Premium Cotton T-Shirt - Black, Size L",
          price: 499,
          originalPrice: 799,
          stock: 38,
          moq: 1,
          images: [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
          ],
          thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop",
          available: true,
          isBestSeller: true,
          weight: "200g",
          dimensions: "27 x 37 x 2 cm",
          estimatedDelivery: "2-3 days",
          options: [
            { id: "c1", type: "color", name: "Black", value: "black", hexCode: "#000000" },
            { id: "s4", type: "size", name: "L", value: "l" },
          ],
          specifications: [
            { label: "Size", value: "L (Chest: 40 inches)" },
            { label: "Material", value: "100% Organic Cotton" },
            { label: "Weight", value: "200g" },
            { label: "Fit", value: "Regular" },
          ],
        },
        // White variants
        {
          id: "v4",
          sku: "TSH-WHT-S",
          title: "Premium Cotton T-Shirt - White, Size S",
          price: 499,
          originalPrice: 799,
          stock: 35,
          moq: 1,
          images: [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop&crop=entropy&cs=tinysrgb&fill=fff",
          ],
          thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop",
          available: true,
          weight: "180g",
          dimensions: "25 x 35 x 2 cm",
          estimatedDelivery: "2-3 days",
          options: [
            { id: "c2", type: "color", name: "White", value: "white", hexCode: "#FFFFFF" },
            { id: "s2", type: "size", name: "S", value: "s" },
          ],
          specifications: [
            { label: "Size", value: "S (Chest: 36 inches)" },
            { label: "Material", value: "100% Organic Cotton" },
            { label: "Weight", value: "180g" },
          ],
        },
        {
          id: "v5",
          sku: "TSH-WHT-M",
          title: "Premium Cotton T-Shirt - White, Size M",
          price: 449,
          originalPrice: 749,
          stock: 48,
          moq: 1,
          images: [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
          ],
          thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop",
          available: true,
          weight: "190g",
          dimensions: "26 x 36 x 2 cm",
          estimatedDelivery: "2-3 days",
          options: [
            { id: "c2", type: "color", name: "White", value: "white", hexCode: "#FFFFFF" },
            { id: "s3", type: "size", name: "M", value: "m" },
          ],
          specifications: [
            { label: "Size", value: "M (Chest: 38 inches)" },
            { label: "Material", value: "100% Organic Cotton" },
            { label: "Weight", value: "190g" },
          ],
        },
        // Navy variants
        {
          id: "v6",
          sku: "TSH-NVY-S",
          title: "Premium Cotton T-Shirt - Navy, Size S",
          price: 499,
          originalPrice: 799,
          stock: 28,
          moq: 1,
          images: [
            "https://images.unsplash.com/photo-1572302292398-0f89624d5f5a?w=500&h=500&fit=crop",
          ],
          thumbnail: "https://images.unsplash.com/photo-1572302292398-0f89624d5f5a?w=100&h=100&fit=crop",
          available: true,
          isNew: true,
          weight: "180g",
          dimensions: "25 x 35 x 2 cm",
          estimatedDelivery: "2-3 days",
          options: [
            { id: "c3", type: "color", name: "Navy", value: "navy", hexCode: "#001F3F" },
            { id: "s2", type: "size", name: "S", value: "s" },
          ],
          specifications: [
            { label: "Size", value: "S (Chest: 36 inches)" },
            { label: "Material", value: "100% Organic Cotton" },
            { label: "Weight", value: "180g" },
          ],
        },
        // Red and Green (limited stock)
        {
          id: "v7",
          sku: "TSH-RED-M",
          title: "Premium Cotton T-Shirt - Red, Size M",
          price: 599,
          originalPrice: 899,
          stock: 5,
          moq: 1,
          images: [
            "https://images.unsplash.com/photo-1506629082632-9514191e851d?w=500&h=500&fit=crop",
          ],
          thumbnail: "https://images.unsplash.com/photo-1506629082632-9514191e851d?w=100&h=100&fit=crop",
          available: true,
          weight: "190g",
          dimensions: "26 x 36 x 2 cm",
          estimatedDelivery: "3-4 days",
          options: [
            { id: "c4", type: "color", name: "Red", value: "red", hexCode: "#FF4136" },
            { id: "s3", type: "size", name: "M", value: "m" },
          ],
          specifications: [
            { label: "Size", value: "M (Chest: 38 inches)" },
            { label: "Material", value: "100% Organic Cotton" },
            { label: "Weight", value: "190g" },
          ],
        },
        {
          id: "v8",
          sku: "TSH-GRN-L",
          title: "Premium Cotton T-Shirt - Green, Size L",
          price: 449,
          originalPrice: 799,
          stock: 0,
          moq: 1,
          images: [
            "https://images.unsplash.com/photo-1583395838336-acd977736f90?w=500&h=500&fit=crop",
          ],
          thumbnail: "https://images.unsplash.com/photo-1583395838336-acd977736f90?w=100&h=100&fit=crop",
          available: false,
          weight: "200g",
          dimensions: "27 x 37 x 2 cm",
          options: [
            { id: "c5", type: "color", name: "Green", value: "green", hexCode: "#2ECC40" },
            { id: "s4", type: "size", name: "L", value: "l" },
          ],
          specifications: [
            { label: "Size", value: "L (Chest: 40 inches)" },
            { label: "Material", value: "100% Organic Cotton" },
            { label: "Weight", value: "200g" },
          ],
        },
      ],
    },

    {
      id: "sneaker-001",
      name: "Professional Running Sneakers",
      category: "Footwear",
      basePrice: 2999,
      baseRating: 4.8,
      baseReviews: 3500,
      seller: {
        name: "Athletic Gear Pro",
        rating: 4.9,
        verified: true,
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      },
      defaultVariantId: "shoe-v1",

      baseSpecifications: [
        { label: "Upper Material", value: "Mesh + Synthetic" },
        { label: "Sole", value: "Rubber" },
        { label: "Type", value: "Running" },
      ],
      warranty: "6 months manufacturer warranty",
      returnPolicy: "60 days hassle-free returns",

      variantGroups: [
        {
          type: "color",
          name: "Color",
          displayMode: "swatch",
          isRequired: true,
          values: [
            { id: "sc1", type: "color", name: "Black/White", value: "bw", hexCode: "#000000" },
            { id: "sc2", type: "color", name: "Blue/White", value: "bluew", hexCode: "#0066FF" },
            { id: "sc3", type: "color", name: "Red/White", value: "rw", hexCode: "#FF0000" },
          ],
        },
        {
          type: "size",
          name: "Size (UK)",
          displayMode: "dropdown",
          isRequired: true,
          values: [
            { id: "ss1", type: "size", name: "5", value: "5" },
            { id: "ss2", type: "size", name: "6", value: "6" },
            { id: "ss3", type: "size", name: "7", value: "7" },
            { id: "ss4", type: "size", name: "8", value: "8" },
            { id: "ss5", type: "size", name: "9", value: "9" },
            { id: "ss6", type: "size", name: "10", value: "10" },
            { id: "ss7", type: "size", name: "11", value: "11" },
            { id: "ss8", type: "size", name: "12", value: "12" },
          ],
        },
      ],

      variants: [
        {
          id: "shoe-v1",
          sku: "SHOE-BW-8",
          title: "Professional Running Sneakers - Black/White, Size 8",
          price: 2999,
          originalPrice: 4999,
          stock: 60,
          moq: 1,
          images: [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
          ],
          thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop",
          available: true,
          isBestSeller: true,
          badge: "Best Seller",
          weight: "450g",
          dimensions: "30 x 12 x 10 cm",
          estimatedDelivery: "3-4 days",
          options: [
            { id: "sc1", type: "color", name: "Black/White", value: "bw", hexCode: "#000000" },
            { id: "ss4", type: "size", name: "8", value: "8" },
          ],
          specifications: [
            { label: "Size", value: "8 (UK)" },
            { label: "Upper", value: "Breathable Mesh + Synthetic" },
            { label: "Sole", value: "Rubber" },
            { label: "Type", value: "Running" },
            { label: "Weight", value: "450g (per pair)" },
          ],
        },
        {
          id: "shoe-v2",
          sku: "SHOE-BW-9",
          title: "Professional Running Sneakers - Black/White, Size 9",
          price: 2999,
          originalPrice: 4999,
          stock: 45,
          moq: 1,
          images: [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
          ],
          thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop",
          available: true,
          weight: "460g",
          dimensions: "30 x 12 x 10 cm",
          estimatedDelivery: "3-4 days",
          options: [
            { id: "sc1", type: "color", name: "Black/White", value: "bw" },
            { id: "ss5", type: "size", name: "9", value: "9" },
          ],
          specifications: [
            { label: "Size", value: "9 (UK)" },
            { label: "Upper", value: "Breathable Mesh + Synthetic" },
            { label: "Sole", value: "Rubber" },
            { label: "Weight", value: "460g" },
          ],
        },
        {
          id: "shoe-v3",
          sku: "SHOE-BLUEW-8",
          title: "Professional Running Sneakers - Blue/White, Size 8",
          price: 3099,
          originalPrice: 5099,
          stock: 38,
          moq: 1,
          images: [
            "https://images.unsplash.com/photo-1556906781-9a412961b049?w=500&h=500&fit=crop",
          ],
          thumbnail: "https://images.unsplash.com/photo-1556906781-9a412961b049?w=100&h=100&fit=crop",
          available: true,
          isNew: true,
          weight: "450g",
          dimensions: "30 x 12 x 10 cm",
          estimatedDelivery: "3-4 days",
          options: [
            { id: "sc2", type: "color", name: "Blue/White", value: "bluew" },
            { id: "ss4", type: "size", name: "8", value: "8" },
          ],
          specifications: [
            { label: "Size", value: "8 (UK)" },
            { label: "Upper", value: "Breathable Mesh + Synthetic" },
            { label: "Sole", value: "Rubber" },
            { label: "Weight", value: "450g" },
          ],
        },
        {
          id: "shoe-v4",
          sku: "SHOE-RW-10",
          title: "Professional Running Sneakers - Red/White, Size 10",
          price: 2799,
          originalPrice: 4799,
          stock: 8,
          moq: 1,
          images: [
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop",
          ],
          thumbnail: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&h=100&fit=crop",
          available: true,
          weight: "480g",
          dimensions: "30 x 12 x 10 cm",
          estimatedDelivery: "4-5 days",
          options: [
            { id: "sc3", type: "color", name: "Red/White", value: "rw" },
            { id: "ss6", type: "size", name: "10", value: "10" },
          ],
          specifications: [
            { label: "Size", value: "10 (UK)" },
            { label: "Upper", value: "Breathable Mesh + Synthetic" },
            { label: "Sole", value: "Rubber" },
            { label: "Weight", value: "480g" },
          ],
        },
      ],
    },
  ];

  const handleVariantChange = (variant: ProductVariant, state: SelectedVariantState) => {
    console.log("Variant changed:", variant.sku, state);
  };

  const handleAddToCart = (variant: ProductVariant, quantity: number) => {
    console.log(`Added ${quantity}x ${variant.sku} to cart`);
    alert(`✅ Added ${quantity}x ${variant.title} to cart!`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Product Variants System Demo</h1>
          <p className="text-gray-600 mt-2">
            Complete variant management with color swatches, sizes, dynamic pricing & stock updates
          </p>
        </div>
      </div>

      {/* Demo Selector */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {demoProducts.map((product, idx) => (
              <button
                key={product.id}
                onClick={() => setSelectedDemo(idx)}
                className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  selectedDemo === idx
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {product.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProductVariantsSelector
          product={demoProducts[selectedDemo]}
          onVariantChange={handleVariantChange}
          onAddToCart={handleAddToCart}
        />

        {/* Features Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="text-2xl font-bold text-blue-600 mb-2">🎨</div>
            <h3 className="font-bold text-gray-900 mb-1">Color Swatches</h3>
            <p className="text-sm text-gray-600">Visual color representation with hex codes</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="text-2xl font-bold text-green-600 mb-2">📏</div>
            <h3 className="font-bold text-gray-900 mb-1">Multiple Sizes</h3>
            <p className="text-sm text-gray-600">Button and dropdown selection modes</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="text-2xl font-bold text-orange-600 mb-2">💰</div>
            <h3 className="font-bold text-gray-900 mb-1">Dynamic Pricing</h3>
            <p className="text-sm text-gray-600">Price updates with variant selection</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="text-2xl font-bold text-purple-600 mb-2">📦</div>
            <h3 className="font-bold text-gray-900 mb-1">Stock Management</h3>
            <p className="text-sm text-gray-600">Real-time availability tracking</p>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">✨ Features Implemented</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Core Features</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Multiple variant types (Color, Size, Material, Style)</li>
                <li>✅ Dynamic image switching per variant</li>
                <li>✅ Price updates automatically</li>
                <li>✅ Stock quantity tracking</li>
                <li>✅ SKU management</li>
                <li>✅ Variant-specific specifications</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">UX & Visual</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Color swatches with hex codes</li>
                <li>✅ Highlighted active variant border</li>
                <li>✅ Disabled unavailable variants</li>
                <li>✅ Hover effects and animations</li>
                <li>✅ Thumbnail gallery per variant</li>
                <li>✅ Quantity selector with MOQ</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Advanced Features</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Variant-wise pricing tiers</li>
                <li>✅ Minimum Order Quantity (MOQ)</li>
                <li>✅ Estimated delivery times</li>
                <li>✅ Recently viewed variants memory</li>
                <li>✅ Wishlist support</li>
                <li>✅ Share product variant</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Display Modes</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Swatch mode (Colors)</li>
                <li>✅ Button mode (Sizes)</li>
                <li>✅ Dropdown mode (Detailed options)</li>
                <li>✅ Mobile responsive layout</li>
                <li>✅ Image zoom functionality</li>
                <li>✅ Professional badges support</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border border-blue-100">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Try it:</strong> Click different colors and sizes to see how everything updates
              instantly - prices, images, stock, specifications, and all details!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
