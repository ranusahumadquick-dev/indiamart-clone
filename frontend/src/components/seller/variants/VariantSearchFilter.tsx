"use client";

import React from "react";
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from "react-icons/hi2";

interface VariantSearchFilterProps {
  search: string;
  status: string;
  stockFilter: string;
  sortBy: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  onStockFilterChange: (filter: string) => void;
  onSortChange: (sort: string) => void;
  onReset: () => void;
}

export const VariantSearchFilter: React.FC<VariantSearchFilterProps> = ({
  search,
  status,
  stockFilter,
  sortBy,
  onSearchChange,
  onStatusChange,
  onStockFilterChange,
  onSortChange,
  onReset,
}) => {
  const hasFilters = search || status || stockFilter || sortBy !== "sku";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search by SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search SKU
          </label>
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Enter SKU..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Stock Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Level
          </label>
          <select
            value={stockFilter}
            onChange={(e) => onStockFilterChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Levels</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (≤10)</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="sku">SKU</option>
            <option value="price">Price (Low to High)</option>
            <option value="stock">Stock (High to Low)</option>
            <option value="status">Status</option>
            <option value="created">Recently Created</option>
          </select>
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          {hasFilters && (
            <button
              onClick={onReset}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center justify-center gap-2"
            >
              <HiOutlineXMark size={18} />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
