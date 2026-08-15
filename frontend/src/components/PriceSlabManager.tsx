'use client';

import { useState } from 'react';
import { HiOutlinePlus, HiOutlineTrash } from "@/lib/icons";

interface PricingSlab {
  minQty: number;
  maxQty?: number;
  price: number;
}

interface PriceSlabManagerProps {
  slabs: PricingSlab[];
  onSlabsChange: (slabs: PricingSlab[]) => void;
  currency?: string;
}

export default function PriceSlabManager({ slabs, onSlabsChange, currency = '₹' }: PriceSlabManagerProps) {
  const [slabsList, setSlabsList] = useState<PricingSlab[]>(slabs || []);

  const addSlab = () => {
    const lastSlab = slabsList[slabsList.length - 1];
    const newMinQty = lastSlab ? (lastSlab.maxQty || lastSlab.minQty) + 1 : 1;

    const newSlab: PricingSlab = {
      minQty: newMinQty,
      maxQty: undefined,
      price: 0,
    };

    const updated = [...slabsList, newSlab];
    setSlabsList(updated);
    onSlabsChange(updated);
  };

  const removeSlab = (index: number) => {
    const updated = slabsList.filter((_, i) => i !== index);
    setSlabsList(updated);
    onSlabsChange(updated);
  };

  const updateSlab = (index: number, field: keyof PricingSlab, value: any) => {
    const updated = [...slabsList];
    updated[index] = {
      ...updated[index],
      [field]: field === 'price' || field === 'minQty' || field === 'maxQty' ? Number(value) || 0 : value,
    };
    setSlabsList(updated);
    onSlabsChange(updated);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">💰 Tiered Pricing (Volume Discounts)</h3>
        <button
          onClick={addSlab}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <HiOutlinePlus className="w-4 h-4" /> Add Slab
        </button>
      </div>

      {slabsList.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No pricing slabs added yet</p>
          <p className="text-sm">Add slabs to enable volume discounts</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-3 pb-3 border-b border-gray-200 text-sm font-semibold text-gray-700">
            <div className="col-span-3">Min Qty</div>
            <div className="col-span-3">Max Qty</div>
            <div className="col-span-4">Price</div>
            <div className="col-span-2">Action</div>
          </div>

          {slabsList.map((slab, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-center bg-gray-50 p-3 rounded-lg">
              {/* Min Qty */}
              <input
                type="number"
                min="1"
                value={slab.minQty}
                onChange={(e) => updateSlab(index, 'minQty', e.target.value)}
                className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 100"
              />

              {/* Max Qty */}
              <input
                type="number"
                min={slab.minQty}
                value={slab.maxQty || ''}
                onChange={(e) => updateSlab(index, 'maxQty', e.target.value || undefined)}
                className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for unlimited"
              />

              {/* Price */}
              <div className="col-span-4 flex items-center gap-2">
                <span className="text-gray-500">{currency}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={slab.price}
                  onChange={(e) => updateSlab(index, 'price', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                <span className="text-gray-500 text-sm">each</span>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => removeSlab(index)}
                className="col-span-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <HiOutlineTrash className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>💡 Example:</strong> 100 qty = ₹50, 500 qty = ₹45, 1000+ = ₹40
        </p>
        <p className="text-sm text-blue-700 mt-2">
          Buyers will automatically get the best price based on their order quantity
        </p>
      </div>
    </div>
  );
}
