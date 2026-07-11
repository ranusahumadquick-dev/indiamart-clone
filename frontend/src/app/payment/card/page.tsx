"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineCurrencyRupee,
  HiMiniCheckCircle,
} from "react-icons/hi2";

interface OrderDetails {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  sellerId: string;
  sellerName: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  buyerNote: string;
}

const CARD_TYPES = [
  { name: "Visa", icon: "💳", id: "visa" },
  { name: "Mastercard", icon: "💳", id: "mastercard" },
  { name: "RuPay", icon: "💳", id: "rupay" },
];

export default function CardPaymentPage() {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const orderData = sessionStorage.getItem("pendingOrder");
    if (!orderData) {
      toast.error("Order details not found");
      router.push("/buyer/procurement");
      return;
    }
    setOrder(JSON.parse(orderData));
  }, [router]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const validateCardNumber = (num: string): boolean => {
    const digits = num.replace(/\s/g, "");
    return /^\d{13,19}$/.test(digits);
  };

  const validateCVV = (cvv: string): boolean => {
    return /^\d{3,4}$/.test(cvv);
  };

  const validateExpiry = (): boolean => {
    if (!expiryMonth || !expiryYear) return false;
    const now = new Date();
    const month = parseInt(expiryMonth);
    const year = parseInt(expiryYear);
    const expiry = new Date(year, month);
    return expiry > now;
  };

  const handlePayment = async () => {
    // Validation
    if (!validateCardNumber(cardNumber)) {
      toast.error("Invalid card number (13-19 digits)");
      return;
    }

    if (!cardHolder.trim()) {
      toast.error("Please enter cardholder name");
      return;
    }

    if (!validateExpiry()) {
      toast.error("Card has expired or invalid expiry date");
      return;
    }

    if (!validateCVV(cvv)) {
      toast.error("CVV must be 3-4 digits");
      return;
    }

    if (!order) {
      toast.error("Order details not found");
      return;
    }

    setProcessing(true);
    try {
      // Simulate card payment processing
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Create sample request
      const payload = {
        productId: order.productId,
        quantity: order.quantity,
        shippingAddress: order.shippingAddress,
        buyerNote: order.buyerNote,
      };

      const response = await api.post("/samples", payload);
      setPaymentSuccess(true);

      // Clear session storage
      sessionStorage.removeItem("pendingOrder");

      setTimeout(() => {
        toast.success("Payment successful! Redirecting...");
        router.push("/buyer/samples");
      }, 2000);
    } catch (err: any) {
      console.error("❌ Payment error:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Payment failed";
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setProcessing(false);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-200 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["buyer", "premium", "admin"]}>
      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"
            >
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-gray-900">Card Payment</h1>
              <p className="text-xs text-gray-400">Visa, Mastercard, RuPay</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          {paymentSuccess ? (
            // Success state
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiOutlineCheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Payment Successful!
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Your card payment of ₹{order.totalAmount.toLocaleString()} has been processed.
                </p>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800">
                  Sample request sent to seller. You'll receive updates in your notifications.
                </div>
              </div>
            </div>
          ) : (
            // Payment form
            <div className="space-y-5">
              {/* Card Details */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-5">
                  Card Details
                </h2>

                {/* Card Number */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>

                {/* Cardholder Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="John Doe"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Expiry Month */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Month
                    </label>
                    <select
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                          {String(i + 1).padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Expiry Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Year
                    </label>
                    <select
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    >
                      <option value="">YY</option>
                      {Array.from({ length: 15 }, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <option key={year} value={String(year).slice(-2)}>
                            {String(year).slice(-2)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* CVV */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                      placeholder="123"
                      maxLength={4}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 font-mono"
                    />
                  </div>
                </div>

                {/* Save Card */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="saveCard"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-200"
                  />
                  <label htmlFor="saveCard" className="text-sm text-gray-600">
                    Save this card for future payments
                  </label>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">
                  Order Summary
                </h2>
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <span className="text-lg">📦</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">{order.productName}</p>
                    <p className="text-xs text-gray-500">
                      {order.quantity} unit{order.quantity > 1 ? "s" : ""} × ₹{order.unitPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold text-gray-900 text-base">
                    <span>Total Payable</span>
                    <span className="text-[var(--primary)]">
                      ₹{order.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-start gap-3">
                <HiOutlineShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Secure Payment</p>
                  <p className="text-xs text-green-700 mt-1">
                    Your card details are encrypted with 256-bit SSL. Your card number is never stored on our servers.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.back()}
                  className="flex-1 border border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={processing || !cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv}
                  className="flex-1 bg-[var(--primary)] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <HiOutlineCurrencyRupee className="w-4 h-4" />
                      Pay ₹{order.totalAmount.toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
