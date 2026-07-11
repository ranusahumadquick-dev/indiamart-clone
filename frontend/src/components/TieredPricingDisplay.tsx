'use client';

import { useState } from 'react';
import { HiOutlineCheckCircle } from 'react-icons/hi2';

interface PricingSlab {
  minQty: number;
  maxQty?: number;
  price: number;
  label: string;
}

interface TieredPricingDisplayProps {
  slabs: PricingSlab[];
  selectedQuantity: number;
  onQuantityChange?: (qty: number) => void;
  currency?: string;
}

export default function TieredPricingDisplay({
  slabs,
  selectedQuantity,
  onQuantityChange,
  currency = '₹',
}: TieredPricingDisplayProps) {
  if (!slabs || slabs.length === 0) {
    return null;
  }

  const getApplicableSlab = (qty: number) => {
    return slabs.find((slab) => {
      const meetsMin = qty >= slab.minQty;
      const meetsMax = slab.maxQty ? qty <= slab.maxQty : true;
      return meetsMin && meetsMax;
    });
  };

  const currentSlab = getApplicableSlab(selectedQuantity);
  const savings = calculateSavings(selectedQuantity, currentSlab?.price, slabs[0].price);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Volume Pricing Tiers</h3>

      {/* Price Tiers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {slabs.map((slab, idx) => (
          <button
            key={idx}
            onClick={() => onQuantityChange?.(slab.minQty)}
            className={`p-3 rounded-lg transition text-center border-2 ${
              currentSlab?.label === slab.label
                ? 'border-blue-600 bg-white shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-center gap-1 mb-2">
              {currentSlab?.label === slab.label && (
                <HiOutlineCheckCircle className="w-4 h-4 text-blue-600" />
              )}
              <p className="text-xs font-semibold text-gray-600">{slab.minQty}+</p>
            </div>
            <p className="text-lg font-bold text-blue-600">
              {currency}{slab.price.toFixed(0)}
            </p>
            <p className="text-xs text-gray-600">each</p>
          </button>
        ))}
      </div>

      {/* Current Selection & Savings */}
      {currentSlab && (
        <div className="bg-white p-4 rounded-lg border border-green-200 bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-700">Your Current Price:</span>
            <span className="text-2xl font-bold text-green-600">
              {currency}{currentSlab.price.toFixed(0)}
            </span>
          </div>
          {savings > 0 && (
            <p className="text-sm text-green-700">
              ✓ You save {currency}{savings.toFixed(0)} per unit at this quantity
            </p>
          )}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-600 mt-4 text-center">
        Enter your order quantity to see the best price
      </p>
    </div>
  );
}

function calculateSavings(qty: number, currentPrice?: number, basePrice?: number): number {
  if (!currentPrice || !basePrice) return 0;
  return (basePrice - currentPrice) * qty;
}
