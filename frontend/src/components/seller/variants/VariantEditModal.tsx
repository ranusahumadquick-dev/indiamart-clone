"use client";

import React, { useState, useEffect } from "react";
import { HiOutlineXMark } from "react-icons/hi2";

interface Variant {
  _id: string;
  sku: string;
  name: string;
  attributeValues: Record<string, string>;
  price: number;
  stock: number;
  status: "active" | "inactive" | "out_of_stock";
}

interface VariantEditModalProps {
  isOpen: boolean;
  variant: Variant | null;
  loading: boolean;
  onClose: () => void;
  onSave: (variantId: string, data: { price: number; stock: number; status: string }) => Promise<void>;
}

export const VariantEditModal: React.FC<VariantEditModalProps> = ({
  isOpen,
  variant,
  loading,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    price: 0,
    stock: 0,
    status: "active" as const,
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (variant) {
      setFormData({
        price: variant.price,
        stock: variant.stock,
        status: variant.status,
      });
    }
  }, [variant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant) return;

    setSubmitting(true);
    try {
      await onSave(variant._id, formData);
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !variant) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Variant</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiOutlineXMark size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* SKU (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU
            </label>
            <input
              type="text"
              value={variant.sku}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          {/* Combination (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant Combination
            </label>
            <input
              type="text"
              value={Object.values(variant.attributeValues).join(" - ")}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "active" | "inactive" | "out_of_stock",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
