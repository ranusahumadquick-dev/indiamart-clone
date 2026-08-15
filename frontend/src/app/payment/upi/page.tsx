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
  HiMiniXMark,
} from "@/lib/icons";

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

const UPI_APPS = [
  { name: "Google Pay", icon: "🔵", id: "googlepay" },
  { name: "PhonePe", icon: "🟣", id: "phonepe" },
  { name: "PayTM", icon: "🔵", id: "paytm" },
  { name: "WhatsApp Pay", icon: "🟢", id: "whatsapp" },
  { name: "Amazon Pay", icon: "🟠", id: "amazonpay" },
];

export default function UPIPaymentPage() {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [upiId, setUpiId] = useState("");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
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

  const validateUPIId = (id: string): boolean => {
    // UPI ID format: username@bankname
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    return upiRegex.test(id.trim());
  };

  const handlePayment = async () => {
    if (!upiId.trim()) {
      toast.error("Please enter your UPI ID");
      return;
    }

    if (!validateUPIId(upiId)) {
      toast.error("Invalid UPI ID format (e.g., user@okhdfcbank)");
      return;
    }

    if (!selectedApp) {
      toast.error("Please select a UPI app");
      return;
    }

    if (!order) {
      toast.error("Order details not found");
      return;
    }

    setProcessing(true);
    try {
      // Simulate UPI payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

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
              <h1 className="font-bold text-gray-900">UPI Payment</h1>
              <p className="text-xs text-gray-400">Secure payment via UPI</p>
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
                  Your UPI payment of ₹{order.totalAmount.toLocaleString()} has been processed.
                </p>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800">
                  Sample request sent to seller. You'll receive updates in your notifications.
                </div>
              </div>
            </div>
          ) : (
            // Payment form
            <div className="space-y-5">
              {/* UPI ID Input */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">
                  Enter UPI ID
                </h2>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@bankname"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Format: username@bankname (e.g., john@okhdfcbank)
                </p>
              </div>

              {/* Select UPI App */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">
                  Select UPI App
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {UPI_APPS.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setSelectedApp(app.id)}
                      className={`p-4 rounded-xl border-2 transition text-center ${
                        selectedApp === app.id
                          ? "border-[var(--primary)] bg-blue-50"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="text-2xl mb-2">{app.icon}</div>
                      <p className="text-xs font-medium text-gray-800">{app.name}</p>
                    </button>
                  ))}
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
                    Your UPI payment is encrypted and secured by RazorPay.
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
                  disabled={processing || !upiId || !selectedApp}
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

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800">
                <p className="font-semibold mb-2">💡 How UPI works:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Enter your UPI ID and select your preferred app</li>
                  <li>Click "Pay Now" to initiate the transaction</li>
                  <li>Authenticate with your PIN in the selected app</li>
                  <li>Payment will be processed automatically</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
