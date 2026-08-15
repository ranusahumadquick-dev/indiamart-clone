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

const WALLETS = [
  { name: "PayTM Wallet", icon: "🔵", id: "paytm", balance: 2500 },
  { name: "Amazon Pay", icon: "🟠", balance: 5000, id: "amazonpay" },
  { name: "Google Pay Balance", icon: "🔴", balance: 1000, id: "googlepay" },
  { name: "PhonePe Wallet", icon: "🟣", balance: 3000, id: "phonepe" },
];

export default function WalletPaymentPage() {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
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

  const handlePayment = async () => {
    if (!selectedWallet) {
      toast.error("Please select a wallet");
      return;
    }

    if (!order) {
      toast.error("Order details not found");
      return;
    }

    const wallet = WALLETS.find((w) => w.id === selectedWallet);
    if (!wallet || wallet.balance < order.totalAmount) {
      toast.error("Insufficient balance in selected wallet");
      return;
    }

    setProcessing(true);
    try {
      // Simulate wallet payment processing
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
              <h1 className="font-bold text-gray-900">Wallet Payment</h1>
              <p className="text-xs text-gray-400">PayTM, Amazon Pay, etc.</p>
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
                  Your wallet payment of ₹{order.totalAmount.toLocaleString()} has been processed.
                </p>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800">
                  Sample request sent to seller. You'll receive updates in your notifications.
                </div>
              </div>
            </div>
          ) : (
            // Wallet selection
            <div className="space-y-5">
              {/* Select Wallet */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">
                  Select Wallet
                </h2>
                <div className="space-y-3">
                  {WALLETS.map((wallet) => {
                    const canUse = wallet.balance >= order.totalAmount;
                    return (
                      <button
                        key={wallet.id}
                        onClick={() => canUse && setSelectedWallet(wallet.id)}
                        disabled={!canUse}
                        className={`w-full p-4 rounded-xl border-2 transition text-left ${
                          selectedWallet === wallet.id
                            ? "border-[var(--primary)] bg-blue-50"
                            : !canUse
                            ? "border-red-100 bg-red-50"
                            : "border-gray-100 hover:border-gray-200"
                        } ${!canUse ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{wallet.icon}</span>
                            <div>
                              <p className="font-semibold text-sm text-gray-800">{wallet.name}</p>
                              <p className={`text-xs ${
                                canUse ? "text-gray-500" : "text-red-600 font-medium"
                              }`}>
                                Balance: ₹{wallet.balance.toLocaleString()}
                                {!canUse && " (Insufficient)"}
                              </p>
                            </div>
                          </div>
                          {selectedWallet === wallet.id && (
                            <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs">
                              ✓
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
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

              {/* Rewards Info */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <p className="text-sm font-semibold text-amber-800 mb-2">💰 Earn Rewards</p>
                <p className="text-xs text-amber-700">
                  Use wallet payment and earn up to 5% cashback!
                </p>
              </div>

              {/* Security Info */}
              <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-start gap-3">
                <HiOutlineShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Secure Payment</p>
                  <p className="text-xs text-green-700 mt-1">
                    Your wallet is protected with two-factor authentication.
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
                  disabled={processing || !selectedWallet}
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
