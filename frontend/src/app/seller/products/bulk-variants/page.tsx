"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { HiOutlineArrowLeft, HiOutlineCheck, HiOutlineXMark } from "@/lib/icons";

interface ProductData {
  _id: string;
  name: string;
  price: number;
  category?: { name: string; _id: string } | string;
}

interface VariantConfig {
  productId: string;
  weights: string; // "500g,1kg,5kg,10kg,25kg"
  baseWeight: number; // 500g for first item
  enabled: boolean;
}

// Helper function to extract weight in grams from strings like "500g", "1kg"
function extractWeightInGrams(weightStr: string): number | null {
  const str = weightStr.toLowerCase().trim();
  const match = str.match(/^([\d.]+)\s*(g|kg|ml|l)?$/i);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = (match[2] || "g").toLowerCase();

  switch (unit) {
    case "kg":
      return value * 1000;
    case "l":
      return value * 1000;
    case "g":
    case "ml":
    default:
      return value;
  }
}

// Calculate prices for variant weights
function calculateVariantPrices(basePrice: number, baseWeight: number, weightStr: string): Record<string, number> {
  const prices: Record<string, number> = {};
  const weights = weightStr.split(",").map((w) => w.trim());

  weights.forEach((weight) => {
    const weightInGrams = extractWeightInGrams(weight);
    if (weightInGrams !== null && weightInGrams > 0) {
      const calculatedPrice = Math.round((weightInGrams / baseWeight) * basePrice * 100) / 100;
      prices[weight] = calculatedPrice;
    }
  });

  return prices;
}

export default function BulkVariantsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [configs, setConfigs] = useState<Record<string, VariantConfig>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<Record<string, { status: "success" | "error"; message: string }>>({});

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get("/sellers/products");
        const prods = res.data.data || [];
        setProducts(prods);

        // Initialize configs for all products
        const initialConfigs: Record<string, VariantConfig> = {};
        prods.forEach((p: ProductData) => {
          initialConfigs[p._id] = {
            productId: p._id,
            weights: "500g,1kg,5kg,10kg,25kg",
            baseWeight: 500,
            enabled: false,
          };
        });
        setConfigs(initialConfigs);
      } catch (error) {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Toggle product selection
  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Update weight config
  const updateConfig = (productId: string, weights: string) => {
    setConfigs((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], weights },
    }));
  };

  // Generate variants for selected products
  const handleBulkGenerate = async () => {
    const toGenerate = selectedProducts.filter((id) => configs[id]?.enabled);

    if (toGenerate.length === 0) {
      toast.error("Select at least one product and enable it");
      return;
    }

    setGenerating(true);
    const newResults: Record<string, { status: "success" | "error"; message: string }> = {};

    for (const productId of toGenerate) {
      try {
        const config = configs[productId];
        const product = products.find((p) => p._id === productId);

        if (!product) continue;

        // Call API to generate variants
        const res = await api.post(`/products/${productId}/generate-variants`, {
          weights: config.weights.split(",").map((w) => w.trim()),
          baseWeight: config.baseWeight,
        });

        newResults[productId] = {
          status: "success",
          message: `Generated ${res.data.data?.length || 0} variants`,
        };
      } catch (error: any) {
        newResults[productId] = {
          status: "error",
          message: error.message || "Failed to generate variants",
        };
      }
    }

    setResults(newResults);
    setGenerating(false);

    const successCount = Object.values(newResults).filter((r) => r.status === "success").length;
    toast.success(`Generated variants for ${successCount}/${toGenerate.length} products`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">⏳</div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <HiOutlineArrowLeft /> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">🔢 Bulk Variant Generator</h1>
          <p className="text-gray-600 mt-2">Generate variants for multiple products with automatic pricing</p>
        </div>

        {/* Products List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(products.map((p) => p._id));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Base Price</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Base Weight</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Weights</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Price Preview</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => toggleProduct(product._id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {typeof product.category === "object" ? product.category.name : product.category || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-900">₹{product.price}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={configs[product._id]?.baseWeight || 500}
                          onChange={(e) => {
                            setConfigs((prev) => ({
                              ...prev,
                              [product._id]: { ...prev[product._id], baseWeight: Math.max(1, parseInt(e.target.value) || 500) },
                            }));
                          }}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                        />
                        <span className="text-xs text-gray-600">g</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={configs[product._id]?.weights || ""}
                        onChange={(e) => updateConfig(product._id, e.target.value)}
                        placeholder="500g,1kg,5kg..."
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs space-y-1">
                        {configs[product._id]?.weights && selectedProducts.includes(product._id) ? (
                          Object.entries(calculateVariantPrices(product.price, configs[product._id].baseWeight, configs[product._id].weights)).map(
                            ([weight, price]) => (
                              <div key={weight} className="bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                {weight}: <strong>₹{price}</strong>
                              </div>
                            )
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {results[product._id] ? (
                        <div className="flex items-center gap-1">
                          {results[product._id].status === "success" ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <HiOutlineCheck size={16} /> Success
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600">
                              <HiOutlineXMark size={16} /> Error
                            </span>
                          )}
                        </div>
                      ) : selectedProducts.includes(product._id) ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={configs[product._id]?.enabled || false}
                            onChange={(e) => {
                              setConfigs((prev) => ({
                                ...prev,
                                [product._id]: { ...prev[product._id], enabled: e.target.checked },
                              }));
                            }}
                            className="rounded"
                          />
                          <span className="text-xs text-gray-600">Enable</span>
                        </label>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkGenerate}
            disabled={generating || selectedProducts.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
          >
            {generating ? "Generating..." : `Generate for ${selectedProducts.length} products`}
          </button>
        </div>

        {/* Summary */}
        {selectedProducts.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              Selected: {selectedProducts.length} product{selectedProducts.length > 1 ? "s" : ""}
              {" | "}
              Enabled: {selectedProducts.filter((id) => configs[id]?.enabled).length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
