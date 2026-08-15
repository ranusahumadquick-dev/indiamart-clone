"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { HiOutlineXCircle, HiOutlineArrowPath, HiOutlineHome } from "@/lib/icons";

declare global { interface Window { Razorpay: any; } }

function PaymentFailedContent() {
  const params    = useSearchParams();
  const router    = useRouter();
  const paymentId = params.get("paymentId");
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!paymentId) return;
    setRetrying(true);
    try {
      const res = await api.post(`/payments/retry/${paymentId}`);
      const { orderId, amount, key } = res.data.data;
      const options = {
        key, amount, currency: "INR",
        name: "IndiaMART Clone", description: "Retry Payment", order_id: orderId,
        handler: async (response: any) => {
          try {
            await api.post("/payments/verify-checkout", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentId,
            });
            router.push(`/buyer/payment/success?paymentId=${paymentId}`);
          } catch { toast.error("Payment verification failed"); }
        },
        modal: { ondismiss: () => setRetrying(false) },
        theme: { color: "#0052cc" },
      };
      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to retry payment");
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <HiOutlineXCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Payment Failed</h1>
        <p className="text-gray-500 text-sm mb-2">Your payment could not be processed.</p>
        <p className="text-xs text-gray-400 mb-8">No amount has been deducted. You can retry or contact support.</p>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-red-700 mb-1">Possible reasons:</p>
          <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
            <li>Insufficient funds</li>
            <li>Card/UPI authentication failed</li>
            <li>Bank server timeout</li>
            <li>Transaction declined by bank</li>
          </ul>
        </div>
        <div className="space-y-3">
          {paymentId && (
            <button onClick={handleRetry} disabled={retrying}
              className="w-full flex items-center justify-center gap-2 bg-[#0052cc] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-60">
              {retrying ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" /> : <HiOutlineArrowPath className="w-4 h-4" />}
              {retrying ? "Processing…" : "Retry Payment"}
            </button>
          )}
          <Link href="/buyer/transactions"
            className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
            View Transaction History
          </Link>
          <Link href="/"
            className="w-full flex items-center justify-center gap-2 text-gray-400 py-2 text-sm hover:text-gray-600 transition">
            <HiOutlineHome className="w-4 h-4" /> Back to Home
          </Link>
        </div>
        <p className="mt-6 text-xs text-gray-400">
          Need help? <Link href="/contact" className="text-[#0052cc] hover:underline">Contact Support</Link>
        </p>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
