"use client";

import ProductGallery from "@/components/ProductShowcase/ProductGallery";

export default function ProductShowcasePage() {
  // Sample Product Data with Color Variants
  const sampleProduct = {
    productId: "prod_001",
    productName: "Premium Stainless Steel Water Bottle",
    productCategory: "Kitchen & Dining",
    price: 1499,
    originalPrice: 2499,
    rating: 4.8,
    reviews: 2547,
    stock: 156,
    description:
      "Premium quality stainless steel water bottle with double-wall insulation technology. Keeps beverages cold for 24 hours or hot for 12 hours. Lightweight, durable, and eco-friendly. Perfect for office, gym, and outdoor activities. Comes with leak-proof cap and ergonomic design for comfortable grip.",
    tags: ["Bestseller", "Eco-Friendly", "Free Shipping", "30-Day Returns"],
    colorVariants: [
      {
        id: "color_1",
        name: "Midnight Black",
        hexCode: "#1a1a1a",
        image: "https://images.unsplash.com/photo-1602527336146-ff266650deab?w=600&h=600&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1602527336146-ff266650deab?w=100&h=100&fit=crop",
      },
      {
        id: "color_2",
        name: "Silver Steel",
        hexCode: "#c0c0c0",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop",
      },
      {
        id: "color_3",
        name: "Rose Gold",
        hexCode: "#b76e79",
        image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=600&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=100&h=100&fit=crop",
      },
      {
        id: "color_4",
        name: "Ocean Blue",
        hexCode: "#0066cc",
        image: "https://images.unsplash.com/photo-1591004174900-c333cd0c4442?w=600&h=600&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1591004174900-c333cd0c4442?w=100&h=100&fit=crop",
      },
      {
        id: "color_5",
        name: "Forest Green",
        hexCode: "#2d5016",
        image: "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=600&h=600&fit=crop",
        thumbnail: "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=100&h=100&fit=crop",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Product Showcase</h2>
              <p className="text-sm text-gray-500">Modern B2B Product Gallery with Color Variants</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">In Stock:</span> 156 units
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-8">
        <ProductGallery {...sampleProduct} />

        {/* Features Showcase */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">✨ Key Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            {[
              {
                icon: "🎨",
                title: "Color Selection",
                description: "Interactive color variants with visual swatches and hex codes",
              },
              {
                icon: "🖼️",
                title: "Image Gallery",
                description: "Thumbnail gallery with smooth image transitions and zoom functionality",
              },
              {
                icon: "📱",
                title: "Mobile Responsive",
                description: "Perfect display on all devices - desktop, tablet, and mobile",
              },
              {
                icon: "⚡",
                title: "Fast Loading",
                description: "Optimized images and lazy loading for superior performance",
              },
              {
                icon: "🎯",
                title: "Product Details",
                description: "Complete pricing, stock status, ratings, and trust badges",
              },
              {
                icon: "🔄",
                title: "Dynamic Updates",
                description: "Instant image updates when color variants are selected",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="max-w-6xl mx-auto px-4 py-16 border-t border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">🛠️ Technical Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Frontend Stack</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Next.js 16 with App Router</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>React 19 with Hooks</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Tailwind CSS 3</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>HeroIcons (hi2) Component Library</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Next.js Image Optimization</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Component Features</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Image Zoom on Hover</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Smooth Animations</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>State Management</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Responsive Design</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>Accessibility Support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Example */}
        <div className="max-w-6xl mx-auto px-4 py-16 border-t border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">📝 How to Use</h3>

          <div className="bg-gray-900 rounded-2xl p-6 overflow-x-auto">
            <pre className="text-gray-100 text-sm font-mono">
{`import ProductGallery from "@/components/ProductShowcase/ProductGallery";

const MyPage = () => {
  const product = {
    productId: "prod_001",
    productName: "Your Product",
    price: 1499,
    originalPrice: 2499,
    rating: 4.8,
    reviews: 2547,
    stock: 156,
    description: "Your product description",
    tags: ["Bestseller", "Free Shipping"],
    colorVariants: [
      {
        id: "color_1",
        name: "Black",
        hexCode: "#1a1a1a",
        image: "image-url",
        thumbnail: "thumbnail-url"
      },
      // ... more colors
    ]
  };

  return <ProductGallery {...product} />;
};`}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
