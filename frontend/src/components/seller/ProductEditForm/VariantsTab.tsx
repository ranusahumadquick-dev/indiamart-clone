"use client";

import React, { useState, useEffect } from "react";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from "@/lib/icons";
import toast from "react-hot-toast";

interface VariantType {
  name: string;
  values: string[];
}

interface Variant {
  id: string;
  sku: string;
  attributeValues: Record<string, string>;
  price: number;
  stock: number;
  status: "active" | "inactive";
}

interface VariantsTabProps {
  productName: string;
  basePrice: number;
  baseStock: number;
  variantTypes: VariantType[];
  variants: Variant[];
  onVariantTypesChange: (types: VariantType[]) => void;
  onVariantsChange: (variants: Variant[]) => void;
  categoryVariantTemplate?: VariantType[];
  baseWeight?: number; // Base weight in grams (default: 500g)
  categorySlug?: string; // Category slug for fetching pricing template
  subcategorySlug?: string; // Subcategory slug for fetching pricing template
}

// Categories that use Weight-Based Pricing
const WEIGHT_BASED_CATEGORIES = ["food", "agriculture"];

// Categories that use Attribute-Based Pricing
const ATTRIBUTE_BASED_CATEGORIES = ["electronics", "clothing", "footwear", "furniture", "jewelry", "cosmetics", "sports"];

// Determine which pricing mode to use
function getPricingMode(categorySlug?: string): "weight" | "attribute" | "none" {
  if (!categorySlug) return "none";

  const slug = categorySlug.toLowerCase();

  if (WEIGHT_BASED_CATEGORIES.includes(slug)) {
    return "weight";
  }

  if (ATTRIBUTE_BASED_CATEGORIES.includes(slug)) {
    return "attribute";
  }

  return "none";
}

export const VariantsTab: React.FC<VariantsTabProps> = ({
  productName,
  basePrice,
  baseStock,
  variantTypes,
  variants,
  onVariantTypesChange,
  onVariantsChange,
  categoryVariantTemplate,
  categorySlug,
  subcategorySlug,
}) => {
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeValue, setNewTypeValue] = useState("");
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [editingVariantPrice, setEditingVariantPrice] = useState("");
  const [editingVariantStock, setEditingVariantStock] = useState("");
  const [showAddType, setShowAddType] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [baseWeight, setBaseWeight] = useState<number>(500); // Base weight in grams
  const [attributePricingMap, setAttributePricingMap] = useState<Record<string, Record<string, number>>>({});
  const [showAttributePricing, setShowAttributePricing] = useState(false);
  const [editingAttributeName, setEditingAttributeName] = useState("");
  const [editingAttributeValues, setEditingAttributeValues] = useState<Record<string, number>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateMessage, setTemplateMessage] = useState("");
  const [pricingMode, setPricingMode] = useState<"weight" | "attribute" | "none">("none");

  // Determine pricing mode based on category
  useEffect(() => {
    const mode = getPricingMode(categorySlug);
    setPricingMode(mode);

    // If switching to weight-based, clear attribute pricing
    if (mode === "weight") {
      setAttributePricingMap({});
      setTemplateMessage("");
    }

    // If switching to attribute-based, fetch template
    if (mode === "attribute" && subcategorySlug) {
      fetchAttributePricingTemplate(categorySlug || "", subcategorySlug);
    }
  }, [categorySlug, subcategorySlug]);

  // Fetch attribute pricing template from API
  useEffect(() => {
    if (pricingMode === "attribute" && categorySlug && subcategorySlug) {
      fetchAttributePricingTemplate(categorySlug, subcategorySlug);
    }
  }, [pricingMode]);

  const fetchAttributePricingTemplate = async (catSlug: string, subCatSlug: string) => {
    try {
      setLoadingTemplate(true);
      const response = await fetch(`/api/products/pricing/template/${catSlug}/${subCatSlug}`);
      const data = await response.json();

      if (response.ok && data.data) {
        setAttributePricingMap(data.data);
        setTemplateMessage(`✅ Loaded pricing template for ${catSlug}/${subCatSlug}`);
        setTimeout(() => setTemplateMessage(""), 3000);
      } else {
        setTemplateMessage("ℹ️ No predefined pricing template - configure manually");
        setAttributePricingMap({});
      }
    } catch (error) {
      console.log("No predefined template available - manual configuration enabled");
      setAttributePricingMap({});
    } finally {
      setLoadingTemplate(false);
    }
  };

  // Add attribute pricing cost
  const handleAddAttributePricingCost = (attrName: string, value: string, cost: number) => {
    setAttributePricingMap(prev => ({
      ...prev,
      [attrName]: {
        ...prev[attrName],
        [value]: cost
      }
    }));
  };

  // Remove attribute pricing
  const handleRemoveAttributePricing = (attrName: string) => {
    const newMap = { ...attributePricingMap };
    delete newMap[attrName];
    setAttributePricingMap(newMap);
  };

  // Add new variant type
  const handleAddVariantType = () => {
    if (!newTypeName.trim()) {
      toast.error("Variant type name is required");
      return;
    }

    const existingType = variantTypes.find(
      (vt) => vt.name.toLowerCase() === newTypeName.toLowerCase()
    );

    if (existingType) {
      toast.error("Variant type already exists");
      return;
    }

    const newType: VariantType = {
      name: newTypeName.trim(),
      values: newTypeValue.split(",").map((v) => v.trim()).filter(Boolean),
    };

    onVariantTypesChange([...variantTypes, newType]);
    setNewTypeName("");
    setNewTypeValue("");
    setShowAddType(false);
    toast.success("Variant type added");
  };

  // Remove variant type
  const handleRemoveVariantType = (typeName: string) => {
    onVariantTypesChange(variantTypes.filter((vt) => vt.name !== typeName));
    toast.success("Variant type removed");
  };

  // Generate variants from types
  const handleGenerateVariants = () => {
    try {
      if (!variantTypes || variantTypes.length === 0) {
        toast.error("Add at least one variant type first");
        return;
      }

      // Validate that each variant type has values
      const hasValidValues = variantTypes.every(
        (vt) => vt && vt.values && Array.isArray(vt.values) && vt.values.length > 0
      );

      if (!hasValidValues) {
        toast.error("Each variant type must have at least one value");
        return;
      }

      // Validate base data
      if (!productName || productName.trim() === "") {
        toast.error("Product name is required");
        return;
      }

      if (!basePrice || basePrice <= 0) {
        toast.error("Product price must be greater than 0");
        return;
      }

      if (!baseStock || baseStock <= 0) {
        toast.error("Product stock must be greater than 0");
        return;
      }

      // Check if using attribute-based pricing (if attributePricingMap is configured)
      const hasAttributePricing = Object.keys(attributePricingMap).length > 0;

      let generatedVariants;
      if (hasAttributePricing) {
        // Use attribute-based pricing
        generatedVariants = generateVariantCombinationsWithAttributePricing(
          variantTypes,
          productName,
          basePrice,
          baseStock,
          attributePricingMap
        );
      } else {
        // Use weight-based pricing
        generatedVariants = generateVariantCombinations(
          variantTypes,
          productName,
          basePrice,
          baseStock,
          baseWeight
        );
      }

      if (!generatedVariants || generatedVariants.length === 0) {
        toast.error("Could not generate variants. Please check your variant types and values.");
        return;
      }

      onVariantsChange(generatedVariants);
      toast.success(`Generated ${generatedVariants.length} variants`);
    } catch (error) {
      console.error("Error generating variants:", error);
      toast.error("Error generating variants. Please try again.");
    }
  };

  // Edit variant
  const handleEditVariant = (e: React.MouseEvent, variant: Variant) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🔧 [VariantsTab] Edit clicked for variant:", variant.sku);
    setEditingVariant(variant);
    setEditingVariantPrice(variant.price.toString());
    setEditingVariantStock(variant.stock.toString());
    setShowEditModal(true);
    console.log("🔧 [VariantsTab] showEditModal set to true");
  };

  // Save variant changes
  const handleSaveVariant = () => {
    if (!editingVariant) return;

    const price = parseFloat(editingVariantPrice);
    const stock = parseInt(editingVariantStock);

    if (isNaN(price) || price < 0) {
      toast.error("Invalid price");
      return;
    }

    if (isNaN(stock) || stock < 0) {
      toast.error("Invalid stock");
      return;
    }

    const updatedVariants = variants.map((v) =>
      v.id === editingVariant.id
        ? { ...v, price, stock }
        : v
    );

    onVariantsChange(updatedVariants);
    setShowEditModal(false);
    setEditingVariant(null);
    toast.success("Variant updated");
  };

  // Delete variant
  const handleDeleteVariant = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onVariantsChange(variants.filter((v) => v.id !== id));
    toast.success("Variant deleted");
  };

  // Remove all variants
  const handleClearVariants = () => {
    if (confirm("Delete all variants? This cannot be undone.")) {
      onVariantsChange([]);
      toast.success("All variants deleted");
    }
  };

  // Add error boundary
  try {
    return (
    <div className="space-y-6">
      {/* Variant Types Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Variant Types</h3>

        {categoryVariantTemplate && categoryVariantTemplate.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Category defaults available: {categoryVariantTemplate.map((vt) => vt.name).join(", ")}
            </p>
          </div>
        )}

        {/* Existing Variant Types */}
        <div className="space-y-2 mb-4">
          {variantTypes.map((type) => (
            <div
              key={type.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div>
                <p className="font-medium text-gray-900">{type.name}</p>
                <p className="text-sm text-gray-600">{type.values.join(", ")}</p>
              </div>
              <button
                onClick={() => handleRemoveVariantType(type.name)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition"
              >
                <HiOutlineTrash size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Type Form */}
        {!showAddType ? (
          <button
            onClick={() => setShowAddType(true)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <HiOutlinePlus size={18} />
            Add Variant Type
          </button>
        ) : (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type Name (e.g., Size, Color)
              </label>
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g., Size"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Values (comma-separated)
              </label>
              <input
                type="text"
                value={newTypeValue}
                onChange={(e) => setNewTypeValue(e.target.value)}
                placeholder="e.g., S, M, L, XL"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddVariantType}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
              >
                Add Type
              </button>
              <button
                onClick={() => {
                  setShowAddType(false);
                  setNewTypeName("");
                  setNewTypeValue("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Base Weight Configuration for Price Calculation */}
      {variantTypes.length > 0 && pricingMode !== "attribute" && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-900">
              🔢 Base Weight (for automatic price calculation)
            </label>
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
              {categorySlug}
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={baseWeight}
              onChange={(e) => setBaseWeight(Math.max(1, parseInt(e.target.value) || 500))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter base weight in grams"
              min="1"
            />
            <span className="text-sm text-gray-600">grams</span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            💡 Set your base weight (e.g., 500g). Prices will auto-calculate: 1kg = ₹{Math.round(basePrice * 2)}, 5kg = ₹{Math.round(basePrice * 10)}, etc.
          </p>
        </div>
      )}

      {/* Info for non-weight categories */}
      {variantTypes.length > 0 && pricingMode === "attribute" && (
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <p className="text-xs text-green-800">
            ✅ <strong>Attribute-Based Pricing</strong> enabled for {categorySlug}. Configure attribute costs below →
          </p>
        </div>
      )}

      {/* Attribute-Based Pricing Configuration */}
      {variantTypes.length > 0 && (pricingMode === "attribute" || pricingMode === "none") && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-900">
              💰 Attribute-Based Pricing
              {loadingTemplate && <span className="ml-2 text-xs animate-spin">⏳</span>}
            </label>
            <button
              type="button"
              onClick={() => setShowAttributePricing(!showAttributePricing)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {showAttributePricing ? "Hide" : "Setup"}
            </button>
          </div>

          {templateMessage && (
            <div className={`mb-3 p-2 rounded text-xs ${
              templateMessage.includes("✅")
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {templateMessage}
            </div>
          )}

          <div className="text-xs text-purple-700 bg-white p-2 rounded border border-purple-200 mb-4">
            📦 <strong>Category:</strong> {categorySlug || "Not selected"} / <strong>Subcategory:</strong> {subcategorySlug || "Not selected"}
            {categorySlug && <span className="ml-2 text-green-600">✅ Template available</span>}
          </div>

          {showAttributePricing && (
            <div className="space-y-4">
              <p className="text-xs text-gray-600">
                Set additional costs for each attribute value (e.g., 16GB RAM = +₹15,000, Gold color = +₹2,000)
              </p>

              {/* Attribute Pricing Configuration */}
              {variantTypes.map((type) => (
                <div key={type.name} className="bg-white p-3 rounded border border-purple-200">
                  <h4 className="font-medium text-gray-900 mb-2">{type.name}</h4>
                  <div className="space-y-2">
                    {type.values.map((value) => (
                      <div key={value} className="flex gap-2 items-center">
                        <span className="text-sm text-gray-700 flex-1 max-w-[150px]">{value}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600">+₹</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={attributePricingMap[type.name]?.[value] || 0}
                            onChange={(e) =>
                              handleAddAttributePricingCost(type.name, value, parseInt(e.target.value) || 0)
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <p className="text-xs text-purple-700 bg-purple-100 p-2 rounded">
                📌 Example: Base ₹50,000 + RAM (16GB: +15k) + Storage (512GB: +5k) + Color (Gold: +2k) = ₹72,000
              </p>
            </div>
          )}
        </div>
      )}

      {/* Generate Variants Section */}
      {variantTypes.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={handleGenerateVariants}
            className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
          >
            Generate Variants ({calculateVariantCount(variantTypes)} combinations)
          </button>
          {variants.length > 0 && (
            <button
              onClick={handleClearVariants}
              className="px-6 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg transition font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Variants Table */}
      {variants.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">SKU</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Combination</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Price (₹)</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Stock</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {variants.map((variant) => (
                  <tr key={variant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{variant.sku}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {Object.values(variant.attributeValues).join(" - ")}
                    </td>
                    <td className="px-4 py-3 text-gray-900">₹{variant.price}</td>
                    <td className="px-4 py-3 text-gray-900">{variant.stock}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        variant.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {variant.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleEditVariant(e, variant)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                      >
                        <HiOutlinePencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteVariant(e, variant.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            Total Variants: <span className="font-semibold">{variants.length}</span>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingVariant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Variant</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  value={editingVariant.sku}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingVariantPrice}
                  onChange={(e) => setEditingVariantPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={editingVariantStock}
                  onChange={(e) => setEditingVariantStock(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVariant}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      {variants.length === 0 && variantTypes.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ℹ️ Add variant types above or use category defaults, then click "Generate Variants"
          </p>
        </div>
      )}

      {/* Category Selection Reminder */}
      {pricingMode === "none" && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            ⚠️ Please select a category first to enable pricing features:
            <br />
            <span className="text-xs mt-2 block">
              • <strong>Weight-Based:</strong> Food, Agriculture
              <br />
              • <strong>Attribute-Based:</strong> Electronics, Clothing, Footwear, Furniture, Jewelry, Cosmetics, Sports
            </span>
          </p>
        </div>
      )}
    </div>
    );
  } catch (error) {
    console.error("Error rendering VariantsTab:", error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">
          Error loading variants. Please try refreshing the page.
        </p>
      </div>
    );
  }
};

// Helper functions

function calculateVariantCount(variantTypes: VariantType[]): number {
  return variantTypes.reduce((acc, vt) => acc * (vt.values.length || 1), 1);
}

// Helper function to extract weight in grams from a string like "500g", "1kg", etc.
function extractWeightInGrams(weightStr: string): number | null {
  const str = weightStr.toLowerCase().trim();

  // Match patterns like "500g", "1kg", "5kg", etc.
  const match = str.match(/^([\d.]+)\s*(g|kg|ml|l)?$/i);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = (match[2] || "g").toLowerCase();

  switch (unit) {
    case "kg":
      return value * 1000;
    case "l":
      return value * 1000; // Treat liters like kg
    case "g":
    case "ml":
    default:
      return value;
  }
}

// Helper function to find weight variant type and calculate price
function calculateVariantPrice(
  attributeValues: Record<string, string>,
  variantTypes: VariantType[],
  basePrice: number,
  baseWeight: number = 500 // Default to 500g
): number {
  // Look for a weight/quantity variant type
  const weightTypes = ["Weight", "Size", "Quantity", "Volume", "Pack Size"];

  for (const variantType of variantTypes) {
    if (weightTypes.some(wt => variantType.name.toLowerCase().includes(wt.toLowerCase()))) {
      const value = attributeValues[variantType.name];
      if (value) {
        const weightInGrams = extractWeightInGrams(value);
        if (weightInGrams !== null && weightInGrams > 0) {
          // Calculate proportional price: (variantWeight / baseWeight) * basePrice
          return Math.round((weightInGrams / baseWeight) * basePrice * 100) / 100;
        }
      }
    }
  }

  // If no weight variant found, return basePrice
  return basePrice;
}

// Helper function to calculate variant price based on attribute pricing
function calculateAttributeBasedPrice(
  attributeValues: Record<string, string>,
  attributePricingMap: Record<string, Record<string, number>>,
  basePrice: number
): number {
  let totalPrice = basePrice;

  for (const [attrName, attrValue] of Object.entries(attributeValues)) {
    const pricingForAttr = attributePricingMap[attrName];
    if (pricingForAttr && pricingForAttr[attrValue] !== undefined) {
      totalPrice += pricingForAttr[attrValue];
    }
  }

  return Math.max(basePrice, totalPrice);
}

function generateVariantCombinationsWithAttributePricing(
  variantTypes: VariantType[] | undefined | null,
  productName: string,
  basePrice: number,
  baseStock: number,
  attributePricingMap: Record<string, Record<string, number>>
): Variant[] {
  // Defensive checks
  if (!variantTypes || !Array.isArray(variantTypes) || variantTypes.length === 0) {
    return [];
  }

  try {
    const typeNames = variantTypes.map((vt) => vt?.name || "").filter(Boolean);
    const valueArrays = variantTypes.map((vt) => {
      const values = vt?.values || [];
      return Array.isArray(values) ? values : [];
    });

    if (valueArrays.some((arr) => !arr || arr.length === 0)) {
      return [];
    }

    // Generate Cartesian product
    const cartesianProduct: any[][] = valueArrays.reduce((acc: any[][], current: any[]) => {
      if (!Array.isArray(acc) || acc.length === 0) {
        return current.map((val) => [val]);
      }
      return acc.flatMap((a) =>
        current.map((b) => {
          const aArray = Array.isArray(a) ? a : [a];
          return [...aArray, b];
        })
      );
    }, []);

    if (!Array.isArray(cartesianProduct) || cartesianProduct.length === 0) {
      return [];
    }

    const stockPerVariant = cartesianProduct.length > 0 ? Math.floor(baseStock / cartesianProduct.length) : 0;

    const variants = cartesianProduct.map((combo, index) => {
      if (!Array.isArray(combo)) {
        console.warn("Invalid combo at index:", index, combo);
        return null;
      }

      const attributeValues: Record<string, string> = {};
      combo.forEach((value, i) => {
        if (i < typeNames.length) {
          const stringValue = typeof value === "string" ? value : String(value || "");
          attributeValues[typeNames[i]] = stringValue;
        }
      });

      // Create SKU
      const skuSuffix = combo
        .map((v) => {
          const stringVal = typeof v === "string" ? v : String(v || "");
          return stringVal.substring(0, 3).toUpperCase();
        })
        .join("-");

      const nameSuffix = combo
        .map((v) => {
          const stringVal = typeof v === "string" ? v : String(v || "");
          return stringVal;
        })
        .join(" - ");

      // Calculate price with attribute-based pricing
      const calculatedPrice = calculateAttributeBasedPrice(
        attributeValues,
        attributePricingMap,
        basePrice
      );

      return {
        id: `${index}-${skuSuffix}`,
        sku: `${productName.substring(0, 3).toUpperCase()}-${skuSuffix}-${String(index + 1).padStart(3, "0")}`,
        attributeValues,
        price: calculatedPrice,
        stock: stockPerVariant,
        status: "active" as const,
      };
    }).filter((v): v is Variant => v !== null);

    return variants;
  } catch (error) {
    console.error("Error generating attribute-based variants:", error);
    return [];
  }
}

function generateVariantCombinations(
  variantTypes: VariantType[] | undefined | null,
  productName: string,
  basePrice: number,
  baseStock: number,
  baseWeight: number = 500 // Default to 500g
): Variant[] {
  // Defensive checks - return empty array if no variant types
  if (!variantTypes || !Array.isArray(variantTypes) || variantTypes.length === 0) {
    return [];
  }

  try {
    const typeNames = variantTypes.map((vt) => vt?.name || "").filter(Boolean);
    const valueArrays = variantTypes.map((vt) => {
      const values = vt?.values || [];
      // Ensure it's an array
      return Array.isArray(values) ? values : [];
    });

    // If any type has no values, return empty array
    if (valueArrays.some((arr) => !arr || arr.length === 0)) {
      return [];
    }

    // Generate Cartesian product with proper initial value
    const cartesianProduct: any[][] = valueArrays.reduce((acc: any[][], current: any[]) => {
      if (!Array.isArray(acc) || acc.length === 0) {
        // Initialize with first dimension
        return current.map((val) => [val]);
      }
      return acc.flatMap((a) =>
        current.map((b) => {
          // Ensure a is an array
          const aArray = Array.isArray(a) ? a : [a];
          return [...aArray, b];
        })
      );
    }, []);

    // Verify cartesianProduct is valid
    if (!Array.isArray(cartesianProduct) || cartesianProduct.length === 0) {
      return [];
    }

    const variants = cartesianProduct.map((combo, index) => {
      // Defensive check - ensure combo is array
      if (!Array.isArray(combo)) {
        console.warn("Invalid combo at index:", index, combo);
        return null;
      }

      const attributeValues: Record<string, string> = {};
      combo.forEach((value, i) => {
        if (i < typeNames.length) {
          // Handle both string and object value formats
          const stringValue = typeof value === "string" ? value : String(value || "");
          attributeValues[typeNames[i]] = stringValue;
        }
      });

      // Create SKU - handle both string and object values
      const skuSuffix = combo
        .map((v) => {
          const stringVal = typeof v === "string" ? v : String(v || "");
          return stringVal.substring(0, 3).toUpperCase();
        })
        .join("-");

      const productNamePrefix = productName
        ? productName.substring(0, 3).toUpperCase().replace(/\s/g, "")
        : "SKU";
      const sku = `${productNamePrefix}-${skuSuffix}-${String(index + 1).padStart(3, "0")}`;

      return {
        id: Math.random().toString(36).substr(2, 9),
        sku,
        name: Object.values(attributeValues).join(" - "),
        attributeValues,
        price: calculateVariantPrice(attributeValues, variantTypes || [], basePrice, baseWeight),
        stock: Math.floor(baseStock / cartesianProduct.length) || 0,
        status: "active" as const,
      };
    }).filter((v): v is Variant => v !== null);

    return variants;
  } catch (error) {
    console.error("Error in generateVariantCombinations:", error);
    return [];
  }
}
