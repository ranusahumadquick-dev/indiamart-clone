"use client";

import React, { useState } from "react";
import { HiOutlineSparkles } from "@/lib/icons";

interface BulkActionsPanelProps {
  selectedCount: number;
  onAction: (action: string, value: string | number) => Promise<void>;
  loading: boolean;
}

type ActionType = "price" | "stock" | "status" | "activate" | "deactivate" | "mark_out_of_stock";

export const BulkActionsPanel: React.FC<BulkActionsPanelProps> = ({
  selectedCount,
  onAction,
  loading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionType>("price");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleApply = async () => {
    if (!value && !["activate", "deactivate", "mark_out_of_stock"].includes(selectedAction)) {
      return;
    }

    setSubmitting(true);
    try {
      await onAction(selectedAction, value || "");
      setValue("");
      setIsExpanded(false);
    } finally {
      setSubmitting(false);
    }
  };

  const actions: Array<{ value: ActionType; label: string; needsValue: boolean }> = [
    { value: "price", label: "Update Price", needsValue: true },
    { value: "stock", label: "Update Stock", needsValue: true },
    { value: "status", label: "Change Status", needsValue: true },
    { value: "activate", label: "Activate All", needsValue: false },
    { value: "deactivate", label: "Deactivate All", needsValue: false },
    { value: "mark_out_of_stock", label: "Mark Out of Stock", needsValue: false },
  ];

  const currentAction = actions.find((a) => a.value === selectedAction);

  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HiOutlineSparkles size={20} className="text-blue-600" />
          <div>
            <p className="font-medium text-gray-900">{selectedCount} variant(s) selected</p>
            <p className="text-sm text-gray-600">Choose an action below</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {isExpanded ? "Hide" : "Show"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Action
            </label>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value as ActionType);
                setValue("");
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {actions.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value Input */}
          {currentAction?.needsValue && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedAction === "price"
                  ? "New Price (₹)"
                  : selectedAction === "stock"
                  ? "New Stock Quantity"
                  : "New Status"}
              </label>
              {selectedAction === "status" ? (
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status...</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              ) : (
                <input
                  type="number"
                  min="0"
                  step={selectedAction === "price" ? "0.01" : "1"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={
                    selectedAction === "price"
                      ? "Enter amount"
                      : "Enter quantity"
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          )}

          {/* Apply Button */}
          <div className="flex items-end">
            <button
              onClick={handleApply}
              disabled={
                submitting ||
                loading ||
                (currentAction?.needsValue && !value)
              }
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
            >
              {submitting ? "Applying..." : "Apply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
