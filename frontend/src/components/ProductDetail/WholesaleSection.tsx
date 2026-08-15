'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineShoppingCart, HiOutlinePhone, HiOutlineChatBubbleLeftRight } from "@/lib/icons";
import toast from 'react-hot-toast';

interface WholesaleSectionProps {
  moq?: number;
  price: number;
  bulkPrices?: Array<{ quantity: number; price: number }>;
  productId: string;
  productName: string;
  sellerId: string;
  stock: number;
}

export const WholesaleSection: React.FC<WholesaleSectionProps> = ({
  moq = 100,
  price,
  bulkPrices = [],
  productId,
  productName,
  sellerId,
  stock
}) => {
  const router = useRouter();
  const [quantity, setQuantity] = useState(moq);
  const [loading, setLoading] = useState(false);

  // Calculate bulk price based on quantity
  const calculatePrice = (qty: number) => {
    if (!bulkPrices.length) return price;

    for (let i = bulkPrices.length - 1; i >= 0; i--) {
      if (qty >= bulkPrices[i].quantity) {
        return bulkPrices[i].price;
      }
    }
    return price;
  };

  const currentPrice = calculatePrice(quantity);
  const totalAmount = currentPrice * quantity;
  const savings = (price - currentPrice) * quantity;

  const handleQuantityChange = (value: number) => {
    const newQty = Math.max(moq, Math.min(value, stock));
    setQuantity(newQty);
  };

  const handleStartOrder = async () => {
    if (quantity < moq) {
      toast.error(`Minimum order quantity is ${moq}`);
      return;
    }

    setLoading(true);
    try {
      // Navigate to checkout with product details
      router.push(`/checkout?product=${productId}&quantity=${quantity}&mode=wholesale`);
    } catch (error) {
      toast.error('Failed to start order');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (quantity < moq) {
      toast.error(`Minimum order quantity is ${moq}`);
      return;
    }

    // Add to cart logic
    toast.success(`Added ${quantity} units to cart`);
  };

  const handleChatNow = () => {
    // Open chat with seller
    router.push(`/chat/${sellerId}`);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-900">🏭 Wholesale Purchase</h3>
        <p className="text-sm text-gray-600 mt-1">
          Best prices for bulk orders. Minimum order: {moq} units
        </p>
      </div>

      {/* Pricing Table */}
      {bulkPrices.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Bulk Pricing Tiers</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">1-{bulkPrices[0]?.quantity - 1 || moq - 1} units</span>
              <span className="font-semibold">₹{price.toLocaleString()}/unit</span>
            </div>
            {bulkPrices.map((tier, idx) => (
              <div key={idx} className="flex justify-between text-sm bg-white rounded p-2">
                <span className="text-gray-700">
                  {tier.quantity}+ units
                </span>
                <span className="font-semibold text-green-600">
                  ₹{tier.price.toLocaleString()}/unit
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-900">
          Quantity Required
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleQuantityChange(quantity - 10)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            -10
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || moq)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
            min={moq}
            max={stock}
          />
          <button
            onClick={() => handleQuantityChange(quantity + 10)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            +10
          </button>
        </div>
        <p className="text-xs text-gray-600">Available: {stock} units</p>
      </div>

      {/* Price Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">Unit Price</span>
          <span className="font-medium">₹{currentPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">Quantity</span>
          <span className="font-medium">{quantity} units</span>
        </div>
        {savings > 0 && (
          <div className="flex justify-between text-sm bg-green-100 rounded px-2 py-1">
            <span className="text-green-700">Savings</span>
            <span className="font-semibold text-green-700">₹{savings.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t pt-2 flex justify-between">
          <span className="text-gray-900 font-semibold">Total Amount</span>
          <span className="text-2xl font-bold text-blue-600">₹{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Primary: Start Order */}
        <button
          onClick={handleStartOrder}
          disabled={loading || quantity < moq}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-semibold rounded-lg transition transform hover:scale-105 active:scale-95"
        >
          {loading ? 'Processing...' : '🚀 Start Order'}
        </button>

        {/* Secondary: Add to Cart */}
        <button
          onClick={handleAddToCart}
          className="w-full py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition flex items-center justify-center gap-2"
        >
          <HiOutlineShoppingCart size={20} />
          Add to Cart
        </button>

        {/* Tertiary: Chat Now */}
        <button
          onClick={handleChatNow}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
        >
          <HiOutlineChatBubbleLeftRight size={20} />
          💬 Chat Now
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-sm text-yellow-800">
          📞 <strong>Need custom pricing?</strong> Chat with our sales team to get quotes for larger quantities.
        </p>
      </div>
    </div>
  );
};

export default WholesaleSection;
