"use client";

import { useState } from "react";
import AdvancedProductDetailPage from "@/components/ProductDetail/AdvancedProductDetailPage";

const ADVANCED_DEMO_PRODUCTS: any[] = [
  {
    id: "premium-tshirt-001",
    name: "Premium Cotton T-Shirt",
    category: "Textiles & Apparel",
    description:
      "High-quality 100% organic cotton t-shirt with premium comfort and durability",
    basePrice: 499,
    averageRating: 4.6,
    totalReviews: 1250,
    seller: {
      id: "seller-001",
      name: "Raj Kumar",
      companyName: "Fashion Pro Industries",
      verified: true,
      rating: 4.8,
      responseTime: "< 2 hours",
      location: "Mumbai, Maharashtra",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    variantTypes: [
      {
        name: "Color",
        type: "swatch" as const,
        values: [
          { label: "Black", value: "black", hex: "#000000" },
          { label: "White", value: "white", hex: "#FFFFFF" },
          { label: "Navy", value: "navy", hex: "#001F3F" },
          { label: "Red", value: "red", hex: "#FF4136" },
          { label: "Green", value: "green", hex: "#2ECC40" },
        ],
      },
      {
        name: "Size",
        type: "button" as const,
        values: [
          { label: "XS", value: "xs" },
          { label: "S", value: "s" },
          { label: "M", value: "m" },
          { label: "L", value: "l" },
          { label: "XL", value: "xl" },
          { label: "XXL", value: "xxl" },
        ],
      },
      {
        name: "Fabric",
        type: "dropdown" as const,
        values: [
          { label: "100% Cotton", value: "cotton100" },
          { label: "Cotton-Blend", value: "cottonblend" },
          { label: "Organic Cotton", value: "organiccotton" },
        ],
      },
    ],
    variants: [
      {
        id: "var-001",
        sku: "TSHIRT-BLK-S-CTN",
        name: "Premium Cotton T-Shirt - Black, Size S, Cotton",
        attributeValues: { Color: "black", Size: "s", Fabric: "cotton100" },
        images: [
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
          "https://images.unsplash.com/photo-1529260830199-42541ea45f97?w=500&h=500&fit=crop",
          "https://images.unsplash.com/photo-1552062407-291d714cad13?w=500&h=500&fit=crop",
        ],
        thumbnail:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop",
        price: 499,
        originalPrice: 799,
        stock: 45,
        moq: 1,
        available: true,
        badge: "Best Seller",
        specifications: [
          { label: "Material", value: "100% Organic Cotton" },
          { label: "Size", value: "S (Chest: 36 inches)" },
          { label: "Weight", value: "180g" },
          { label: "Fit", value: "Regular" },
          { label: "Care", value: "Machine wash cold" },
        ],
      },
      {
        id: "var-002",
        sku: "TSHIRT-BLK-M-CTN",
        name: "Premium Cotton T-Shirt - Black, Size M, Cotton",
        attributeValues: { Color: "black", Size: "m", Fabric: "cotton100" },
        images: [
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
        ],
        thumbnail:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop",
        price: 499,
        originalPrice: 799,
        stock: 52,
        moq: 1,
        available: true,
        specifications: [
          { label: "Material", value: "100% Organic Cotton" },
          { label: "Size", value: "M (Chest: 38 inches)" },
          { label: "Weight", value: "190g" },
          { label: "Fit", value: "Regular" },
        ],
      },
      {
        id: "var-003",
        sku: "TSHIRT-RED-M-CTN",
        name: "Premium Cotton T-Shirt - Red, Size M, Cotton",
        attributeValues: { Color: "red", Size: "m", Fabric: "cotton100" },
        images: [
          "https://images.unsplash.com/photo-1506629082632-9514191e851d?w=500&h=500&fit=crop",
        ],
        thumbnail:
          "https://images.unsplash.com/photo-1506629082632-9514191e851d?w=100&h=100&fit=crop",
        price: 599,
        originalPrice: 899,
        stock: 8,
        moq: 1,
        available: true,
        specifications: [
          { label: "Material", value: "100% Organic Cotton" },
          { label: "Size", value: "M (Chest: 38 inches)" },
          { label: "Weight", value: "190g" },
          { label: "Fit", value: "Regular" },
        ],
      },
      {
        id: "var-004",
        sku: "TSHIRT-WHT-L-ORG",
        name: "Premium Cotton T-Shirt - White, Size L, Organic",
        attributeValues: { Color: "white", Size: "l", Fabric: "organiccotton" },
        images: [
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
        ],
        thumbnail:
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&h=100&fit=crop",
        price: 699,
        originalPrice: 999,
        stock: 0,
        moq: 1,
        available: false,
        specifications: [
          { label: "Material", value: "100% Organic Cotton" },
          { label: "Size", value: "L (Chest: 40 inches)" },
          { label: "Weight", value: "200g" },
          { label: "Fit", value: "Regular" },
        ],
      },
      {
        id: "var-005",
        sku: "TSHIRT-NAVY-S-BLEND",
        name: "Premium Cotton T-Shirt - Navy, Size S, Cotton-Blend",
        attributeValues: { Color: "navy", Size: "s", Fabric: "cottonblend" },
        images: [
          "https://images.unsplash.com/photo-1572302292398-0f89624d5f5a?w=500&h=500&fit=crop",
        ],
        thumbnail:
          "https://images.unsplash.com/photo-1572302292398-0f89624d5f5a?w=100&h=100&fit=crop",
        price: 449,
        originalPrice: 699,
        stock: 35,
        moq: 1,
        available: true,
        badge: "New",
        specifications: [
          { label: "Material", value: "Cotton-Polyester Blend" },
          { label: "Size", value: "S (Chest: 36 inches)" },
          { label: "Weight", value: "175g" },
          { label: "Fit", value: "Regular" },
        ],
      },
      {
        id: "var-006",
        sku: "TSHIRT-GREEN-XL-CTN",
        name: "Premium Cotton T-Shirt - Green, Size XL, Cotton",
        attributeValues: { Color: "green", Size: "xl", Fabric: "cotton100" },
        images: [
          "https://images.unsplash.com/photo-1583395838336-acd977736f90?w=500&h=500&fit=crop",
        ],
        thumbnail:
          "https://images.unsplash.com/photo-1583395838336-acd977736f90?w=100&h=100&fit=crop",
        price: 549,
        originalPrice: 849,
        stock: 28,
        moq: 1,
        available: true,
        specifications: [
          { label: "Material", value: "100% Organic Cotton" },
          { label: "Size", value: "XL (Chest: 44 inches)" },
          { label: "Weight", value: "210g" },
          { label: "Fit", value: "Regular" },
        ],
      },
    ],
    tags: ["Cotton", "Premium", "Eco-Friendly", "Comfortable"],
    warranty: "2 years against manufacturing defects",
    returnPolicy: "30 days easy return policy",
    deliveryInfo: "Free delivery on orders above ₹999. Delivery in 2-3 days",
  },

  {
    id: "sneakers-001",
    name: "Professional Running Sneakers",
    category: "Textiles & Apparel",
    description: "Advanced running shoes with premium comfort and support",
    basePrice: 2999,
    averageRating: 4.8,
    totalReviews: 3500,
    seller: {
      id: "seller-002",
      name: "Amit Patel",
      companyName: "Athletic Gear Pro",
      verified: true,
      rating: 4.9,
      responseTime: "< 1 hour",
      location: "Bangalore, Karnataka",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    },
    variantTypes: [
      {
        name: "Color",
        type: "swatch" as const,
        values: [
          { label: "Black/White", value: "bw", hex: "#000000" },
          { label: "Blue/White", value: "bluew", hex: "#0066FF" },
          { label: "Red/White", value: "rw", hex: "#FF0000" },
        ],
      },
      {
        name: "Size (UK)",
        type: "dropdown" as const,
        values: [
          { label: "5", value: "5" },
          { label: "6", value: "6" },
          { label: "7", value: "7" },
          { label: "8", value: "8" },
          { label: "9", value: "9" },
          { label: "10", value: "10" },
          { label: "11", value: "11" },
          { label: "12", value: "12" },
        ],
      },
    ],
    variants: [
      {
        id: "shoe-var-001",
        sku: "SHOE-BW-8",
        name: "Professional Running Sneakers - Black/White, Size 8",
        attributeValues: { "Color": "bw", "Size (UK)": "8" },
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        thumbnail:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop",
        price: 2999,
        originalPrice: 4999,
        stock: 60,
        moq: 1,
        available: true,
        badge: "Best Seller",
        specifications: [
          { label: "Size", value: "8 (UK)" },
          { label: "Upper", value: "Breathable Mesh + Synthetic" },
          { label: "Sole", value: "Rubber" },
          { label: "Type", value: "Running" },
          { label: "Weight", value: "450g (per pair)" },
        ],
      },
      {
        id: "shoe-var-002",
        sku: "SHOE-BW-9",
        name: "Professional Running Sneakers - Black/White, Size 9",
        attributeValues: { "Color": "bw", "Size (UK)": "9" },
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
        ],
        thumbnail:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop",
        price: 2999,
        originalPrice: 4999,
        stock: 45,
        moq: 1,
        available: true,
        specifications: [
          { label: "Size", value: "9 (UK)" },
          { label: "Upper", value: "Breathable Mesh + Synthetic" },
          { label: "Sole", value: "Rubber" },
          { label: "Weight", value: "460g" },
        ],
      },
      {
        id: "shoe-var-003",
        sku: "SHOE-BLUEW-8",
        name: "Professional Running Sneakers - Blue/White, Size 8",
        attributeValues: { "Color": "bluew", "Size (UK)": "8" },
        images: [
          "https://images.unsplash.com/photo-1556906781-9a412961b049?w=500&h=500&fit=crop",
        ],
        thumbnail:
          "https://images.unsplash.com/photo-1556906781-9a412961b049?w=100&h=100&fit=crop",
        price: 3099,
        originalPrice: 5099,
        stock: 38,
        moq: 1,
        available: true,
        badge: "New",
        specifications: [
          { label: "Size", value: "8 (UK)" },
          { label: "Upper", value: "Breathable Mesh + Synthetic" },
          { label: "Sole", value: "Rubber" },
          { label: "Weight", value: "450g" },
        ],
      },
      {
        id: "shoe-var-004",
        sku: "SHOE-RW-10",
        name: "Professional Running Sneakers - Red/White, Size 10",
        attributeValues: { "Color": "rw", "Size (UK)": "10" },
        images: [
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop",
        ],
        thumbnail:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&h=100&fit=crop",
        price: 2799,
        originalPrice: 4799,
        stock: 8,
        moq: 1,
        available: true,
        specifications: [
          { label: "Size", value: "10 (UK)" },
          { label: "Upper", value: "Breathable Mesh + Synthetic" },
          { label: "Sole", value: "Rubber" },
          { label: "Weight", value: "480g" },
        ],
      },
    ],
    tags: ["Running", "Sports", "Premium", "Comfortable"],
    warranty: "6 months manufacturer warranty",
    returnPolicy: "60 days hassle-free returns",
    deliveryInfo: "Express delivery available. Standard delivery in 2-3 days",
  },
];

export default function AdvancedProductDemoPage() {
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const currentProduct = ADVANCED_DEMO_PRODUCTS[currentProductIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Advanced Product Variants & Dynamic Switching Demo
          </h1>
          <p className="text-gray-600 mt-2">
            Modern ecommerce experience like Amazon, Flipkart, Myntra & Alibaba
          </p>
        </div>
      </div>

      {/* Product Selector */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {ADVANCED_DEMO_PRODUCTS.map((product, idx) => (
              <button
                key={product.id}
                onClick={() => setCurrentProductIndex(idx)}
                className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  currentProductIndex === idx
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {product.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Product Detail */}
      <AdvancedProductDetailPage
        product={currentProduct}
        relatedProducts={ADVANCED_DEMO_PRODUCTS.filter(
          (p) => p.id !== currentProduct.id
        )}
        onProductSwitch={(product) => {
          const index = ADVANCED_DEMO_PRODUCTS.findIndex((p) => p.id === product.id);
          setCurrentProductIndex(index);
        }}
      />

      {/* Features Section */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">✨ Features</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "🎨",
                title: "Dynamic Color Swatches",
                desc: "Visual color representation with hex codes and instant preview",
              },
              {
                icon: "📏",
                title: "Multiple Variant Types",
                desc: "Color, Size, Material, Fabric - all in one component",
              },
              {
                icon: "⚡",
                title: "Instant Switching",
                desc: "Change product instantly with no page reload",
              },
              {
                icon: "📸",
                title: "Smart Image Gallery",
                desc: "Variant-wise images with zoom and fullscreen",
              },
              {
                icon: "💰",
                title: "Dynamic Pricing",
                desc: "Price updates automatically per variant",
              },
              {
                icon: "📦",
                title: "Stock Management",
                desc: "Real-time stock and availability tracking",
              },
              {
                icon: "🔍",
                title: "Image Zoom",
                desc: "Hover zoom with position tracking",
              },
              {
                icon: "📱",
                title: "Mobile Responsive",
                desc: "Perfect experience on all devices",
              },
              {
                icon: "🎯",
                title: "SKU & MOQ",
                desc: "Variant-specific SKU and minimum order quantity",
              },
              {
                icon: "⭐",
                title: "Seller Info",
                desc: "Complete seller verification and contact details",
              },
              {
                icon: "🛒",
                title: "Add to Cart",
                desc: "Smart cart with variant selection",
              },
              {
                icon: "❤️",
                title: "Wishlist Support",
                desc: "Add variants to wishlist instantly",
              },
            ].map((feature, idx) => (
              <div key={idx} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border-t border-blue-200">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Try It Out</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                step: "1",
                title: "Select a Product",
                desc: "Use the buttons at the top to switch between different products",
              },
              {
                step: "2",
                title: "Choose Variants",
                desc: "Click color swatches, size buttons, or select from dropdown",
              },
              {
                step: "3",
                title: "Watch Updates",
                desc: "See image, price, stock, and specs update instantly",
              },
              {
                step: "4",
                title: "Interact",
                desc: "Add to cart, wishlist, zoom images, or contact seller",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
