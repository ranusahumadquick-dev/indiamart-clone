"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineArrowUpTray,
  HiOutlineChevronDown,
} from "@/lib/icons";
import {
  ProductVariant,
  VariantGroup,
  VariantType,
  ProductWithVariants,
  SelectedVariantState,
} from "@/types/product-variants";

interface ProductVariantsSelectorProps {
  product: ProductWithVariants;
  onVariantChange?: (variant: ProductVariant, state: SelectedVariantState) => void;
  onAddToCart?: (variant: ProductVariant, quantity: number) => void;
}

export default function ProductVariantsSelector({
  product,
  onVariantChange,
  onAddToCart,
}: ProductVariantsSelectorProps) {
  const defaultVariant =
    product.variants.find((v) => v.id === product.defaultVariantId) ||
    product.variants[0];

  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariant?.id || "");
  const [selectedOptions, setSelectedOptions] = useState<Record<VariantType, string>>({
    color: "",
    size: "",
    material: "",
    style: "",
  });
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [recentVariants, setRecentVariants] = useState<string[]>([]);
  const [liked, setLiked] = useState(false);

  // Get current selected variant
  const selectedVariant = useMemo(
    () => product.variants.find((v) => v.id === selectedVariantId) || defaultVariant,
    [selectedVariantId, product.variants, defaultVariant]
  );

  // Get available variant combinations
  const availableVariantsByOption = useMemo(() => {
    const map: Record<string, Set<string>> = {};

    product.variantGroups.forEach((group) => {
      map[group.type] = new Set();
    });

    product.variants
      .filter((v) => v.available)
      .forEach((variant) => {
        variant.options.forEach((opt) => {
          if (map[opt.type]) {
            map[opt.type].add(opt.value);
          }
        });
      });

    return map;
  }, [product]);

  // Initialize selected options from default variant
  useEffect(() => {
    if (selectedVariant) {
      const opts: Record<VariantType, string> = {
        color: "",
        size: "",
        material: "",
        style: "",
      };

      selectedVariant.options.forEach((opt) => {
        opts[opt.type] = opt.value;
      });

      setSelectedOptions(opts);
      setSelectedImageIndex(0);
    }
  }, [selectedVariant]);

  // Handle variant option selection
  const handleOptionChange = (type: VariantType, value: string) => {
    const newOptions = { ...selectedOptions, [type]: value };
    setSelectedOptions(newOptions);

    // Find matching variant
    const matchingVariant = product.variants.find((variant) => {
      return variant.options.every((opt) => {
        const optionValue = newOptions[opt.type];
        if (!optionValue) return true;
        return opt.value === optionValue;
      });
    });

    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
      setSelectedImageIndex(0);

      // Add to recent variants
      setRecentVariants((prev) => {
        const updated = [matchingVariant.id, ...prev.filter((id) => id !== matchingVariant.id)];
        return updated.slice(0, 5); // Keep last 5
      });

      onVariantChange?.(matchingVariant, {
        variantId: matchingVariant.id,
        selectedOptions: newOptions,
        selectedImageIndex: 0,
      });
    }
  };

  const isVariantAvailable = (type: VariantType, value: string) => {
    return availableVariantsByOption[type]?.has(value) ?? false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedVariant) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const discount = selectedVariant?.originalPrice
    ? Math.round(
        ((selectedVariant.originalPrice - selectedVariant.price) /
          selectedVariant.originalPrice) *
          100
      )
    : 0;

  const stockStatus =
    selectedVariant?.stock > 10
      ? "In Stock"
      : selectedVariant?.stock > 0
        ? "Limited Stock"
        : "Out of Stock";

  const stockColor =
    selectedVariant?.stock > 10
      ? "text-green-600"
      : selectedVariant?.stock > 0
        ? "text-orange-600"
        : "text-red-600";

  const stockBg =
    selectedVariant?.stock > 10
      ? "bg-green-50"
      : selectedVariant?.stock > 0
        ? "bg-orange-50"
        : "bg-red-50";

  if (!selectedVariant) return null;

  const currentImage = selectedVariant.images[selectedImageIndex] || selectedVariant.thumbnail;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT SECTION: Image Gallery */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Image with Zoom */}
          <div
            className="relative w-full bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <div className="relative w-full aspect-square">
              <Image
                src={currentImage}
                alt={selectedVariant?.title || 'Product variant'}
                fill
                className={`object-contain transition-transform duration-300 ${
                  isZoomed ? "scale-150" : "scale-100"
                }`}
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      }
                    : {}
                }
                priority
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discount > 0 && (
                  <div className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold">
                    -{discount}%
                  </div>
                )}
                {selectedVariant.isNew && (
                  <div className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold">
                    New
                  </div>
                )}
                {selectedVariant.isBestSeller && (
                  <div className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold">
                    Bestseller
                  </div>
                )}
                {selectedVariant.badge && (
                  <div className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold">
                    {selectedVariant.badge}
                  </div>
                )}
              </div>

              {/* Stock Badge */}
              <div
                className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${stockBg} ${stockColor}`}
              >
                {selectedVariant.stock > 0 ? (
                  <HiOutlineCheckCircle className="w-4 h-4" />
                ) : (
                  <HiOutlineExclamationTriangle className="w-4 h-4" />
                )}
                {stockStatus}
              </div>
            </div>
          </div>

          {/* Thumbnail Gallery */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {selectedVariant.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                  selectedImageIndex === idx
                    ? "border-blue-500 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Image
                  src={img}
                  alt={`View ${idx + 1}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* SKU and Details */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">SKU</p>
                <p className="font-semibold text-gray-900">{selectedVariant.sku}</p>
              </div>
              {selectedVariant.weight && (
                <div>
                  <p className="text-gray-600">Weight</p>
                  <p className="font-semibold text-gray-900">{selectedVariant.weight}</p>
                </div>
              )}
              {selectedVariant.dimensions && (
                <div>
                  <p className="text-gray-600">Dimensions</p>
                  <p className="font-semibold text-gray-900">{selectedVariant.dimensions}</p>
                </div>
              )}
              {selectedVariant.estimatedDelivery && (
                <div>
                  <p className="text-gray-600">Delivery</p>
                  <p className="font-semibold text-gray-900">{selectedVariant.estimatedDelivery}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Details & Options */}
        <div className="space-y-6">
          {/* Title and Rating */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{selectedVariant.title}</h1>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.baseRating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                <span className="font-semibold">{product.baseRating}</span> ({product.baseReviews}{" "}
                reviews)
              </span>
            </div>
            {selectedVariant.description && (
              <p className="text-gray-600 text-sm">{selectedVariant.description}</p>
            )}
          </div>

          {/* Pricing Section */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl font-bold text-gray-900">
                ₹{selectedVariant.price.toLocaleString("en-IN")}
              </span>
              {selectedVariant.originalPrice && (
                <span className="text-lg text-gray-500 line-through">
                  ₹{selectedVariant.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            {discount > 0 && (
              <p className="text-sm text-green-600 font-semibold">
                Save ₹{(selectedVariant.originalPrice! - selectedVariant.price).toLocaleString("en-IN")} ({discount}% off)
              </p>
            )}
          </div>

          {/* Variant Options */}
          <div className="space-y-4">
            {product.variantGroups.map((group) => (
              <div key={group.type}>
                <label className="block text-sm font-semibold text-gray-900 mb-2 capitalize">
                  {group.name} {group.isRequired && <span className="text-red-500">*</span>}
                </label>

                {group.displayMode === "swatch" ? (
                  // Color Swatches
                  <div className="flex flex-wrap gap-3">
                    {group.values.map((option) => (
                      <button
                        key={option.id}
                        onClick={() =>
                          isVariantAvailable(group.type, option.value) &&
                          handleOptionChange(group.type, option.value)
                        }
                        disabled={!isVariantAvailable(group.type, option.value)}
                        className={`group relative flex items-center justify-center transition-all duration-200 ${
                          selectedOptions[group.type] === option.value
                            ? "ring-2 ring-blue-500 ring-offset-2"
                            : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-1"
                        } ${
                          !isVariantAvailable(group.type, option.value)
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        title={option.name}
                      >
                        {option.hexCode ? (
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                            style={{ backgroundColor: option.hexCode }}
                          />
                        ) : option.displayImage ? (
                          <Image
                            src={option.displayImage}
                            alt={option.name || 'Option'}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg object-cover border-2 border-gray-300"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 border-2 border-gray-300" />
                        )}

                        {/* Disabled overlay */}
                        {!isVariantAvailable(group.type, option.value) && (
                          <div className="absolute inset-0 rounded-lg bg-black/20" />
                        )}

                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                          {option.name}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : group.displayMode === "button" ? (
                  // Button Selection
                  <div className="flex flex-wrap gap-2">
                    {group.values.map((option) => (
                      <button
                        key={option.id}
                        onClick={() =>
                          isVariantAvailable(group.type, option.value) &&
                          handleOptionChange(group.type, option.value)
                        }
                        disabled={!isVariantAvailable(group.type, option.value)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 text-sm ${
                          selectedOptions[group.type] === option.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        } ${
                          !isVariantAvailable(group.type, option.value)
                            ? "opacity-50 cursor-not-allowed line-through"
                            : "cursor-pointer"
                        }`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  // Dropdown Selection
                  <select
                    value={selectedOptions[group.type]}
                    onChange={(e) =>
                      isVariantAvailable(group.type, e.target.value) &&
                      handleOptionChange(group.type, e.target.value)
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-gray-900 font-medium"
                  >
                    <option value="">Select {group.name}</option>
                    {group.values.map((option) => (
                      <option
                        key={option.id}
                        value={option.value}
                        disabled={!isVariantAvailable(group.type, option.value)}
                      >
                        {option.name}
                        {!isVariantAvailable(group.type, option.value) && " (Unavailable)"}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          {/* MOQ Info */}
          {selectedVariant.moq > 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              Minimum order quantity: <span className="font-bold">{selectedVariant.moq}</span> units
            </div>
          )}

          {/* Quantity Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(selectedVariant.moq || 1, quantity - 1))}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(selectedVariant.moq || 1, parseInt(e.target.value) || 1))}
                className="w-16 px-3 py-2 rounded-lg border border-gray-300 text-center font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                +
              </button>
              <span className="text-sm text-gray-600">
                {selectedVariant.stock > 0 ? `${selectedVariant.stock} in stock` : "Out of stock"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onAddToCart?.(selectedVariant, quantity)}
              disabled={selectedVariant.stock === 0}
              className={`flex-1 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                selectedVariant.stock > 0
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:scale-105 active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <HiOutlineShoppingBag className="w-6 h-6" />
              {selectedVariant.stock > 0 ? "Add to Cart" : "Out of Stock"}
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className="px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-red-300 hover:text-red-500 transition-colors duration-200"
            >
              <HiOutlineHeart
                className={`w-6 h-6 transition-transform ${liked ? "fill-red-500 text-red-500" : ""}`}
              />
            </button>
            <button className="px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 transition-colors duration-200">
              <HiOutlineArrowUpTray className="w-6 h-6" />
            </button>
          </div>

          {/* Specifications */}
          {selectedVariant.specifications && selectedVariant.specifications.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3">Specifications</h3>
              <div className="space-y-2 text-sm">
                {selectedVariant.specifications.map((spec, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-gray-600">{spec.label}</span>
                    <span className="font-semibold text-gray-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seller Info */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h3 className="font-bold text-gray-900 mb-3">Sold By</h3>
            <div className="flex items-center gap-3">
              {product.seller?.image && (
                <Image
                  src={product.seller.image}
                  alt={product.seller?.name || 'Seller'}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-gray-900">{product.seller.name}</p>
                <p className="text-sm text-gray-600">
                  ⭐ {product.seller.rating} {product.seller.verified && "✓ Verified"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Variants */}
      {recentVariants.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">Recently Viewed Variants</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentVariants.map((variantId) => {
              const variant = product.variants.find((v) => v.id === variantId);
              if (!variant) return null;
              return (
                <button
                  key={variantId}
                  onClick={() => setSelectedVariantId(variantId)}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors">
                    <Image
                      src={variant.thumbnail}
                      alt={variant.title || 'Variant'}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-200"
                    />
                  </div>
                  <p className="text-xs text-center mt-2 text-gray-600 line-clamp-2">{variant.title}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
