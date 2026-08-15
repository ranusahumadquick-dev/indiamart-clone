'use client';

import { HiOutlineCheckCircle, HiOutlineExclamationTriangle, HiOutlineClock } from "@/lib/icons";

interface StockStatusDisplayProps {
  status: 'in_stock' | 'out_of_stock' | 'made_to_order';
  stock?: number;
  leadTime?: string;
  onStatusChange?: (status: 'in_stock' | 'out_of_stock' | 'made_to_order') => void;
  isEditable?: boolean;
}

export default function StockStatusDisplay({
  status,
  stock,
  leadTime = '1-2 days',
  onStatusChange,
  isEditable = false,
}: StockStatusDisplayProps) {
  const statusConfig = {
    in_stock: {
      label: 'In Stock',
      icon: HiOutlineCheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
    },
    out_of_stock: {
      label: 'Out of Stock',
      icon: HiOutlineExclamationTriangle,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
    },
    made_to_order: {
      label: 'Made to Order',
      icon: HiOutlineClock,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (isEditable) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📦 Stock Availability</h3>

        <div className="space-y-4">
          {/* Stock Status Radio Buttons */}
          <div className="space-y-3">
            {Object.entries(statusConfig).map(([key, value]) => (
              <label key={key} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="stockStatus"
                  value={key}
                  checked={status === key}
                  onChange={() => onStatusChange?.(key as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <Icon className={`w-5 h-5 ml-3 text-${value.color}-600`} />
                <span className="ml-3 font-semibold text-gray-700">{value.label}</span>
                <span className="ml-auto text-sm text-gray-500">
                  {key === 'in_stock' && stock && `(${stock} units)`}
                  {key === 'made_to_order' && `(${leadTime})`}
                </span>
              </label>
            ))}
          </div>

          {/* Lead Time for Made to Order */}
          {status === 'made_to_order' && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lead Time</label>
              <input
                type="text"
                value={leadTime}
                onChange={(e) => {}}
                placeholder="e.g., 3-5 days, 1 week, 15 days"
                className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-sm text-orange-600 mt-2">
                Tell customers how long it will take to manufacture and deliver
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <p>
              <strong>💡 Tip:</strong> Set status as "Made to Order" if you manufacture products after receiving orders.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Display Mode (Read-only)
  return (
    <div className={`${config.bgColor} border ${config.borderColor} p-4 rounded-lg flex items-center gap-3`}>
      <Icon className={`w-6 h-6 ${config.textColor}`} />
      <div>
        <p className={`font-semibold ${config.textColor}`}>{config.label}</p>
        {status === 'in_stock' && stock !== undefined && (
          <p className="text-sm text-gray-600">{stock} units available</p>
        )}
        {status === 'made_to_order' && (
          <p className="text-sm text-gray-600">Lead time: {leadTime}</p>
        )}
      </div>
    </div>
  );
}
