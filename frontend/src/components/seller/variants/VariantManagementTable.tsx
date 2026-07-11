"use client";

import React from "react";
import {
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineEye,
} from "react-icons/hi2";

interface Variant {
  _id: string;
  sku: string;
  name: string;
  attributeValues: Record<string, string>;
  price: number;
  stock: number;
  status: "active" | "inactive" | "out_of_stock";
  source: "auto" | "manual";
  createdAt: string;
}

interface VariantManagementTableProps {
  variants: Variant[];
  loading: boolean;
  selectedIds: string[];
  onSelectVariant: (id: string) => void;
  onSelectAll: () => void;
  onEdit: (variant: Variant) => void;
  onDelete: (variantId: string) => void;
  isAllSelected: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-gray-100 text-gray-800";
    case "out_of_stock":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getSourceBadgeColor = (source: string) => {
  return source === "auto"
    ? "bg-blue-100 text-blue-800"
    : "bg-purple-100 text-purple-800";
};

export const VariantManagementTable: React.FC<VariantManagementTableProps> = ({
  variants,
  loading,
  selectedIds,
  onSelectVariant,
  onSelectAll,
  onEdit,
  onDelete,
  isAllSelected,
}) => {
  const formatVariantCombo = (attributeValues: Record<string, string>) => {
    return Object.values(attributeValues).join(" - ");
  };

  if (loading && variants.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="inline-block">
          <div className="animate-spin">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full"></div>
          </div>
        </div>
        <p className="mt-2 text-gray-600">Loading variants...</p>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">No variants found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Variant Combination
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {variants.map((variant) => (
              <tr
                key={variant._id}
                className={`hover:bg-gray-50 transition ${
                  selectedIds.includes(variant._id) ? "bg-blue-50" : ""
                }`}
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(variant._id)}
                    onChange={() => onSelectVariant(variant._id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {variant.sku}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatVariantCombo(variant.attributeValues)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  ₹{variant.price.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      variant.stock > 10
                        ? "bg-green-100 text-green-800"
                        : variant.stock > 0
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {variant.stock}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(variant.status)}`}>
                    {variant.status === "out_of_stock"
                      ? "Out of Stock"
                      : variant.status.charAt(0).toUpperCase() + variant.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getSourceBadgeColor(
                      variant.source
                    )}`}
                  >
                    {variant.source === "auto" ? "Auto" : "Manual"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(variant)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit variant"
                    >
                      <HiOutlinePencil size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(variant._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete variant"
                    >
                      <HiOutlineTrash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
