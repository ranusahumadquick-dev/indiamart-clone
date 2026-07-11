"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import { resolveImageUrl } from "@/lib/imageUrl";
import toast from "react-hot-toast";
import {
  HiOutlineBeaker,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShoppingBag,
  HiOutlineCurrencyRupee,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineShieldCheck,
  HiOutlineMapPin,
  HiMiniCheckCircle,
} from "react-icons/hi2";

declare global { interface Window { Razorpay: any; } }

interface SampleRequest {
  _id: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: "pending" | "accepted" | "rejected" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "refunded";
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
  sellerNote?: string;
  rejectionReason?: string;
  conversation?: string;
  shippingAddress?: { city: string; state: string; pincode: string };
  createdAt: string;
  product?: { _id: string; name: string; images: { url: string }[]; sampleLeadTime: string };
  seller?: { _id: string; name: string; companyName: string };
}

const STATUS_STEPS = ["pending", "accepted", "shipped", "delivered"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:   { label: "Pending Review", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",  icon: HiOutlineClock },
  accepted:  { label: "Accepted",       color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",    icon: HiOutlineCheckCircle },
  rejected:  { label: "Rejected",       color: "text-red-700",    bg: "bg-red-50 border-red-200",      icon: HiOutlineXCircle },
  shipped:   { label: "Shipped",        color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: HiOutlineTruck },
  delivered: { label: "Delivered",      color: "text-green-700",  bg: "bg-green-50 border-green-200",  icon: HiMiniCheckCircle },
  cancelled: { label: "Cancelled",      color: "text-gray-500",   bg: "bg-gray-50 border-gray-200",    icon: HiOutlineXCircle },
};

const TABS = ["All", "Pending", "Accepted", "Shipped", "Delivered", "Rejected"];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function SamplesContent() {
  const [samples, setSamples] = useState<SampleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("All");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    api.get("/samples/buyer?limit=50")
      .then((res) => setSamples(res.data.data?.samples || []))
      .catch(() => toast.error("Failed to load samples"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === "All" ? samples : samples.filter((s) => s.status.toLowerCase() === tab.toLowerCase());

  const handleConfirmDelivery = async (id: string) => {
    if (!confirm("Confirm that you received the sample?")) return;
    setConfirming(id);
    try {
      await api.put(`/samples/${id}/deliver`);
      setSamples((prev) => prev.map((s) => s._id === id ? { ...s, status: "delivered" } : s));
      toast.success("Delivery confirmed! Ready to place bulk order.");
    } catch { toast.error("Failed to confirm delivery"); }
    finally { setConfirming(null); }
  };

  const handlePayNow = async (sample: SampleRequest) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) { toast.error("Payment gateway failed to load. Try again."); return; }

    setPaying(sample._id);
    try {
      const res = await api.post(`/samples/${sample._id}/pay`);
      const { orderId, amount, currency, key } = res.data.data;

      const options = {
        key,
        amount,
        currency,
        name: "IndiaMart Sample Payment",
        description: `Sample: ${sample.product?.name || "Product"}`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await api.post(`/samples/${sample._id}/verify-pay`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setSamples((prev) => prev.map((s) => s._id === sample._id ? { ...s, paymentStatus: "paid" } : s));
            toast.success("Payment successful! Seller will ship your sample soon.");
          } catch { toast.error("Payment verification failed. Contact support."); }
        },
        prefill: {},
        theme: { color: "#1a56db" },
        modal: { ondismiss: () => setPaying(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not initiate payment");
      setPaying(null);
    }
  };

  const pendingCount = samples.filter((s) => s.status === "pending").length;
  const acceptedUnpaid = samples.filter((s) => s.status === "accepted" && s.paymentStatus !== "paid").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Sample Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track, pay, and convert samples to bulk orders</p>
        </div>
        <Link href="/products" className="flex items-center gap-2 text-sm bg-[var(--primary)] text-white px-4 py-2.5 rounded-lg hover:bg-[var(--primary-dark)] transition font-medium">
          <HiOutlineShoppingBag className="w-4 h-4" /> Browse Products
        </Link>
      </div>

      {/* Alert banners */}
      {acceptedUnpaid > 0 && (
        <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <HiOutlineCurrencyRupee className="w-5 h-5 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-700 font-medium">
            {acceptedUnpaid} sample{acceptedUnpaid > 1 ? "s" : ""} accepted — complete payment so seller can ship
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
        {TABS.map((t) => {
          const count = t === "All" ? samples.length : samples.filter((s) => s.status.toLowerCase() === t.toLowerCase()).length;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                tab === t ? "bg-[var(--primary)] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              {t}
              {count > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t ? "bg-white/30" : "bg-gray-100"}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <HiOutlineBeaker className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No sample requests {tab !== "All" ? `with status "${tab}"` : "yet"}</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Find products with sample availability and request one</p>
          <Link href="/products" className="text-sm text-[var(--primary)] font-medium hover:underline">
            Browse products with samples →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => {
            const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const stepIdx = STATUS_STEPS.indexOf(s.status);
            const needsPayment = s.status === "accepted" && s.paymentStatus !== "paid";

            return (
              <div key={s._id} className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${needsPayment ? "border-blue-300" : "border-gray-100"}`}>
                {/* Payment due banner */}
                {needsPayment && (
                  <div className="bg-blue-600 text-white text-xs font-semibold px-5 py-2 flex items-center gap-1.5">
                    <HiOutlineCurrencyRupee className="w-3.5 h-3.5" />
                    Action required — Complete payment to proceed
                  </div>
                )}

                <div className="p-5">
                  <div className="flex gap-4">
                    {/* Product image */}
                    <div className="w-18 h-18 w-[72px] h-[72px] rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {s.product?.images?.[0]?.url ? (
                        <img src={resolveImageUrl(s.product.images[0].url)} alt="" className="w-full h-full object-cover" />
                      ) : <HiOutlineBeaker className="w-6 h-6 m-auto mt-6 text-gray-300" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="font-semibold text-gray-900">{s.product?.name || "Sample Request"}</p>
                          <p className="text-sm text-gray-500">{s.seller?.companyName || s.seller?.name}</p>
                        </div>
                        <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border shrink-0 ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <HiOutlineBeaker className="w-3.5 h-3.5" /> {s.quantity} unit{s.quantity > 1 ? "s" : ""} × ₹{s.unitPrice}
                        </span>
                        <span className="font-bold text-gray-800">₹{s.totalAmount.toLocaleString()}</span>
                        {s.paymentStatus === "paid" && (
                          <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                            <HiOutlineShieldCheck className="w-3.5 h-3.5" /> Paid
                          </span>
                        )}
                      </div>

                      {s.shippingAddress?.city && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <HiOutlineMapPin className="w-3 h-3" />
                          {s.shippingAddress.city}, {s.shippingAddress.state}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress stepper */}
                  {!["rejected", "cancelled"].includes(s.status) && (
                    <div className="mt-4 mb-1">
                      <div className="flex items-center">
                        {STATUS_STEPS.map((step, i) => (
                          <div key={step} className="flex items-center flex-1 last:flex-none">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 border-2 ${
                              i < stepIdx ? "bg-[var(--primary)] border-[var(--primary)] text-white" :
                              i === stepIdx ? "bg-white border-[var(--primary)] text-[var(--primary)]" :
                              "bg-white border-gray-200 text-gray-300"
                            }`}>
                              {i < stepIdx ? <HiMiniCheckCircle className="w-4 h-4" /> : i + 1}
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 ${i < stepIdx ? "bg-[var(--primary)]" : "bg-gray-200"}`} />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-1.5 px-0">
                        {STATUS_STEPS.map((step, i) => (
                          <span key={step} className={`text-[9px] capitalize font-medium ${i <= stepIdx ? "text-[var(--primary)]" : "text-gray-300"}`}>
                            {step}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seller note */}
                  {s.status === "accepted" && s.sellerNote && (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                      <strong>Seller note:</strong> {s.sellerNote}
                    </div>
                  )}

                  {/* Rejection reason */}
                  {s.status === "rejected" && (
                    <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700">
                      <strong>Reason:</strong> {s.rejectionReason || "No reason provided"}
                    </div>
                  )}

                  {/* Tracking */}
                  {s.status === "shipped" && s.trackingNumber && (
                    <div className="mt-3 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-xs text-purple-700 flex items-center gap-2">
                      <HiOutlineTruck className="w-4 h-4 shrink-0" />
                      <span>
                        <strong>{s.trackingNumber}</strong> via {s.courierName}
                        {s.estimatedDelivery && (
                          <span className="text-gray-500"> · ETA: {new Date(s.estimatedDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Delivered — Bulk order CTA */}
                  {s.status === "delivered" && s.product?._id && (
                    <div className="mt-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-green-800">Sample received! Ready to buy in bulk?</p>
                        <p className="text-xs text-green-600 mt-0.5">Contact seller to negotiate bulk pricing & MOQ</p>
                      </div>
                      <Link
                        href={`/products/${s.product._id}`}
                        className="flex items-center gap-1.5 text-xs font-bold bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition whitespace-nowrap shrink-0"
                      >
                        Place Bulk Order <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {/* Actions row */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {/* Pay Now */}
                    {needsPayment && (
                      <button
                        onClick={() => handlePayNow(s)}
                        disabled={paying === s._id}
                        className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
                      >
                        <HiOutlineCurrencyRupee className="w-4 h-4" />
                        {paying === s._id ? "Opening payment..." : `Pay ₹${s.totalAmount.toLocaleString()}`}
                      </button>
                    )}

                    {/* Confirm delivery */}
                    {s.status === "shipped" && (
                      <button onClick={() => handleConfirmDelivery(s._id)} disabled={confirming === s._id}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50">
                        <HiMiniCheckCircle className="w-3.5 h-3.5" />
                        {confirming === s._id ? "Confirming..." : "Confirm Delivery"}
                      </button>
                    )}

                    {/* Chat with seller */}
                    {s.conversation && (
                      <Link href="/buyer/messages"
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                        <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" /> Chat with Seller
                      </Link>
                    )}

                    {/* Request again if rejected */}
                    {s.status === "rejected" && s.product?._id && (
                      <Link href={`/checkout/sample?productId=${s.product._id}`}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                        <HiOutlineBeaker className="w-3.5 h-3.5" /> Request Again
                      </Link>
                    )}
                  </div>

                  <p className="text-[10px] text-gray-300 mt-3">
                    Requested {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BuyerSamplesPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "premium", "admin"]}>
      <SamplesContent />
    </ProtectedRoute>
  );
}
