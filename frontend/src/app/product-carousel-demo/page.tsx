"use client";

import { useState } from "react";
import RelatedProductsCarousel from "@/components/ProductDetail/RelatedProductsCarousel";

export default function ProductCarouselDemoPage() {
  const [selectedProductId, setSelectedProductId] = useState("prod_1");

  const relatedProducts = [
    {
      id: "prod_1",
      name: "Solar Panel 400W Monocrystalline Half Cut Cell",
      image: "https://images.unsplash.com/photo-1559056199-641a0ac8b3f7?w=400&h=400&fit=crop",
      price: 8500,
      originalPrice: 10000,
      rating: 4.4,
      reviews: 0,
      category: "Solar Panels",
      badge: "Featured",
    },
    {
      id: "prod_2",
      name: "Solar Panel 350W Polycrystalline High Efficiency",
      image: "https://images.unsplash.com/photo-1575373969207-2b94e3f3bf3a?w=400&h=400&fit=crop",
      price: 7200,
      originalPrice: 8500,
      rating: 4.6,
      reviews: 245,
      category: "Solar Panels",
      badge: "Best Price",
    },
    {
      id: "prod_3",
      name: "Solar Panel 550W Bifacial Double Glass Module",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
      price: 12500,
      originalPrice: 15000,
      rating: 4.8,
      reviews: 389,
      category: "Solar Panels",
    },
    {
      id: "prod_4",
      name: "Portable Solar Panel 100W Foldable Charger",
      image: "https://images.unsplash.com/photo-1607789841322-7bea47e2b648?w=400&h=400&fit=crop",
      price: 4999,
      originalPrice: 6999,
      rating: 4.3,
      reviews: 156,
      category: "Solar Accessories",
    },
    {
      id: "prod_5",
      name: "Solar Inverter 5KW Pure Sine Wave MPPT",
      image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop",
      price: 35000,
      originalPrice: 42000,
      rating: 4.7,
      reviews: 523,
      category: "Solar Equipment",
      badge: "Popular",
    },
    {
      id: "prod_6",
      name: "Solar Battery 48V 100AH LiFePO4 Storage",
      image: "https://images.unsplash.com/photo-1605559424843-9e4c3ca69dab?w=400&h=400&fit=crop",
      price: 65000,
      originalPrice: 78000,
      rating: 4.9,
      reviews: 412,
      category: "Solar Equipment",
    },
    {
      id: "prod_7",
      name: "Solar Mounting Structure Aluminum Rail 2KW",
      image: "https://images.unsplash.com/photo-1566081869857-e91b4b0fdbdd?w=400&h=400&fit=crop",
      price: 8900,
      originalPrice: 11000,
      rating: 4.5,
      reviews: 267,
      category: "Solar Accessories",
    },
    {
      id: "prod_8",
      name: "Solar Cable 6MM2 UV Resistant 100M Roll",
      image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=400&fit=crop",
      price: 3200,
      originalPrice: 4500,
      rating: 4.4,
      reviews: 178,
      category: "Solar Accessories",
      badge: "In Stock",
    },
  ];

  const handleProductClick = (productId: string) => {
    setSelectedProductId(productId);
    const product = relatedProducts.find((p) => p.id === productId);
    if (product) {
      console.log("Switched to product:", product.name);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const currentProduct = relatedProducts.find((p) => p.id === selectedProductId) || relatedProducts[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Product Carousel Demo</h1>
          <p className="text-sm text-gray-600 mt-1">
            Currently viewing: <span className="font-semibold text-blue-600">{currentProduct.name}</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Current Product Display */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-12 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image */}
            <div className="flex items-center justify-center">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                />
                {currentProduct.badge && (
                  <span className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                    {currentProduct.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{currentProduct.name}</h2>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-2xl ${
                        i < Math.round(currentProduct.rating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-lg text-gray-700">
                  <span className="font-bold">{currentProduct.rating}</span> (
                  {currentProduct.reviews} reviews)
                </span>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-100">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-blue-600">
                    ₹{currentProduct.price.toLocaleString("en-IN")}
                  </span>
                  {currentProduct.originalPrice && (
                    <span className="text-xl text-gray-500 line-through">
                      ₹{currentProduct.originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                {currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price && (
                  <p className="text-sm text-green-600 font-semibold">
                    Save ₹
                    {(currentProduct.originalPrice - currentProduct.price).toLocaleString("en-IN")} (
                    {Math.round(
                      ((currentProduct.originalPrice - currentProduct.price) /
                        currentProduct.originalPrice) *
                        100
                    )}
                    % off)
                  </p>
                )}
              </div>

              <p className="text-gray-600 mb-6 text-lg">
                Category: <span className="font-semibold text-gray-900">{currentProduct.category}</span>
              </p>

              <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all">
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Related Products Carousel */}
        <RelatedProductsCarousel
          products={relatedProducts}
          title="👇 Click Any Product Below to Switch View"
          onProductClick={handleProductClick}
        />

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">✨ How the Carousel Works:</h3>
          <ul className="space-y-2 text-gray-700">
            <li>✅ Click any product to instantly see its details above</li>
            <li>✅ Use left/right arrows to browse through products</li>
            <li>✅ Click pagination dots to jump to a specific page</li>
            <li>✅ Hover over products to see action buttons</li>
            <li>✅ Price updates dynamically based on selected product</li>
            <li>✅ No page reload - smooth instant switching</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
