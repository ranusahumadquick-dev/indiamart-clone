"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { HiOutlineCheckCircle, HiOutlineArrowDownTray, HiOutlineReceiptPercent, HiOutlineHome } from "react-icons/hi2";

function PaymentSuccessContent() {
  const params     = useSearchParams();
  const orderId    = params.get("orderId");
  const paymentId  = params.get("paymentId");
  const [order,    setOrder]   = useState<any>(null);
  const [loading,  setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      api.get(`/orders/${orderId}`).then(r => setOrder(r.data.data)).catch(() => {}).finally(() => setLoading(false));
    } else setLoading(false);
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <HiOutlineCheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Payment Successful!</h1>
        <p className="text-gray-500 text-sm mb-6">Your order has been confirmed. We'll notify you when it ships.</p>

        {loading ? (
          <div className="space-y-2 mb-6">{[1,2,3].map(i => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-3">
            {orderId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order ID</span>
                <span className="font-bold text-gray-800 text-xs">#{orderId.slice(-8).toUpperCase()}</span>
              </div>
            )}
            {order?.totalAmount && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-black text-green-600">₹{order.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            {order?.status && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order Status</span>
                <span className="font-semibold text-blue-600 capitalize">{order.status}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Status</span>
              <span className="font-semibold text-green-600 flex items-center gap-1"><HiOutlineCheckCircle className="w-3.5 h-3.5" />Paid</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {paymentId && (
            <a href={`/api/payments/invoice/${paymentId}`} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 border-2 border-[#0052cc] text-[#0052cc] py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition">
              <HiOutlineArrowDownTray className="w-4 h-4" /> Download Invoice (PDF)
            </a>
          )}
          <Link href="/buyer/orders"
            className="w-full flex items-center justify-center gap-2 bg-[#0052cc] text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition">
            <HiOutlineReceiptPercent className="w-4 h-4" /> View My Orders
          </Link>
          <Link href="/"
            className="w-full flex items-center justify-center gap-2 text-gray-500 py-2 text-sm hover:text-gray-700 transition">
            <HiOutlineHome className="w-4 h-4" /> Back to Home
          </Link>
        </div>
        <p className="mt-6 text-xs text-gray-400">A confirmation email has been sent to your registered email address.</p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
