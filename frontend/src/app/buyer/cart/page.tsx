"use client";

import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  HiOutlineTrash,
  HiMinus,
  HiPlus,
} from "@/lib/icons";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { items, removeFromCart, updateQuantity, clearCart } = useCart();

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== "buyer" && user?.role !== "premium")) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) {
    return null;
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    // Navigate to checkout with cart items
    router.push("/checkout/sample");
  };

  const handleBulkInquiry = () => {
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    // Navigate to bulk inquiry page
    router.push("/buyer/inquiries");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Start adding products to your cart to get started
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <div
                      key={`${item._id}-${item.variantId || ""}`}
                      className="p-6 flex gap-6 hover:bg-gray-50 transition"
                    >
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.image || "/placeholder.jpg"}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg bg-gray-100"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.jpg";
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="text-lg font-bold text-blue-600 mt-1">
                          ₹{item.price.toLocaleString("en-IN")}
                        </p>
                        {item.variantId && (
                          <p className="text-sm text-gray-500 mt-1">
                            Variant: {item.variantId}
                          </p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item._id,
                              item.quantity - 1,
                              item.variantId
                            )
                          }
                          className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-600"
                          title="Decrease quantity"
                        >
                          <HiMinus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val > 0) {
                              updateQuantity(item._id, val, item.variantId);
                            }
                          }}
                          className="w-12 text-center border border-gray-300 rounded-lg py-1 text-sm font-semibold"
                        />
                        <button
                          onClick={() =>
                            updateQuantity(
                              item._id,
                              item.quantity + 1,
                              item.variantId
                            )
                          }
                          className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-600"
                          title="Increase quantity"
                        >
                          <HiPlus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="text-base font-bold text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </p>
                        <button
                          onClick={() => removeFromCart(item._id, item.variantId)}
                          className="p-2 rounded-lg hover:bg-red-50 transition text-red-600 hover:text-red-700"
                          title="Remove from cart"
                        >
                          <HiOutlineTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue Shopping Link */}
              <Link
                href="/products"
                className="inline-block mt-6 text-blue-600 hover:text-blue-700 font-semibold"
              >
                ← Continue Shopping
              </Link>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Order Summary
                </h2>

                {/* Summary Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total Items</span>
                    <span className="font-semibold text-gray-900">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span className="font-semibold text-gray-900">Free</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-xl text-blue-600">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:shadow-lg transition"
                  >
                    Place Order
                  </button>
                  <button
                    onClick={handleBulkInquiry}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold hover:shadow-lg transition"
                  >
                    Create Bulk Inquiry
                  </button>
                  <button
                    onClick={() => {
                      clearCart();
                      toast.success("Cart cleared");
                    }}
                    className="w-full py-2 border-2 border-red-200 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition"
                  >
                    Clear Cart
                  </button>
                </div>

                {/* Info Note */}
                <p className="text-[11px] text-gray-500 mt-4 text-center">
                  Prices may vary based on location and supplier
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
