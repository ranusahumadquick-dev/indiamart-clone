"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import { resolveImageUrl } from "@/lib/imageUrl";
import toast from "react-hot-toast";
import {
  HiOutlineShoppingBag,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineCalendarDays,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineBuildingStorefront,
  HiOutlineReceiptPercent,
  HiOutlineArrowRight,
  HiMiniShieldCheck,
  HiOutlineBeaker,
  HiOutlineExclamationCircle,
  HiOutlinePhone,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import CallSellerModal from "@/components/orders/CallSellerModal";

// ─── Types ────────────────────────────────────────────────────────────

interface Address {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

interface Order {
  _id: string;
  type: string;
  product?: {
    _id: string;
    name: string;
    images?: { url: string }[];
    category?: string;
    unit?: string;
  };
  seller?: {
    _id: string;
    name: string;
    companyName?: string;
    businessLogo?: string;
    city?: string;
    state?: string;
    isVerified?: boolean;
    phone?: string;
    email?: string;
  };
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  shippingAddress?: Address;
  status: string;
  paymentStatus: string;
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
  buyerNote?: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────

const TABS = [
  { key: "", label: "All Orders" },
  { key: "delivered", label: "Delivered" },
  { key: "shipped", label: "Shipped" },
  { key: "accepted", label: "Confirmed" },
  { key: "pending", label: "Pending" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "Pending",    color: "bg-yellow-100 text-yellow-700", icon: HiOutlineClock },
  accepted:  { label: "Confirmed",  color: "bg-blue-100 text-blue-700",     icon: HiOutlineCheckCircle },
  paid:      { label: "Paid",       color: "bg-green-100 text-green-700",   icon: HiOutlineCurrencyRupee },
  shipped:   { label: "Shipped",    color: "bg-indigo-100 text-indigo-700", icon: HiOutlineTruck },
  delivered: { label: "Delivered",  color: "bg-emerald-100 text-emerald-700", icon: HiOutlineCheckCircle },
  cancelled: { label: "Cancelled",  color: "bg-red-100 text-red-700",       icon: HiOutlineXCircle },
  rejected:  { label: "Rejected",   color: "bg-red-100 text-red-700",       icon: HiOutlineXCircle },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  pending:  { label: "Unpaid",   color: "text-amber-600" },
  paid:     { label: "Paid",     color: "text-green-600" },
  refunded: { label: "Refunded", color: "text-blue-600" },
  failed:   { label: "Failed",   color: "text-red-600" },
};

// ─── Helpers ──────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtAddr(a?: Address) {
  if (!a) return "—";
  return [a.street, a.city, a.state, a.pincode].filter(Boolean).join(", ");
}

// ─── Reorder Modal ────────────────────────────────────────────────────

interface ReorderModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: (newId: string) => void;
}

function ReorderModal({ order, onClose, onSuccess }: ReorderModalProps) {
  const [qty, setQty] = useState(order.quantity);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = qty * order.unitPrice;

  const handleReorder = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post(`/orders/${order._id}/reorder`, {
        quantity: qty,
        buyerNote: note || undefined,
      });
      onSuccess(res.data.data._id);
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to place reorder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--primary)] to-blue-700 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <HiOutlineArrowPath className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Repeat This Order</h2>
              <p className="text-blue-100 text-xs">One click to reorder — same seller, same product</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Product summary */}
          <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
            <div className="w-14 h-14 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
              {order.product?.images?.[0]?.url
                ? <img src={resolveImageUrl(order.product.images[0].url)} alt="" className="w-full h-full object-cover" />
                : <HiOutlineBeaker className="w-6 h-6 m-4 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{order.product?.name || "Product"}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {order.seller?.companyName || order.seller?.name}
                {order.seller?.isVerified && <span className="ml-1 text-blue-500">✓</span>}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Last ordered: {fmtDate(order.createdAt)} · ₹{order.unitPrice.toLocaleString("en-IN")}/{order.product?.unit || "Pc"}
              </p>
            </div>
          </div>

          {/* Qty selector */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600 text-xl font-bold hover:bg-gray-50 transition flex items-center justify-center"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-center border border-gray-200 rounded-xl py-2.5 text-lg font-bold text-gray-800 focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600 text-xl font-bold hover:bg-gray-50 transition flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Shipping address preview */}
          {order.shippingAddress && (
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <HiOutlineMapPin className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
              <span>Delivering to: <span className="text-gray-700 font-medium">{fmtAddr(order.shippingAddress)}</span></span>
            </div>
          )}

          {/* Optional note */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
              Special Instructions <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g. urgent delivery, specific packaging..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          {/* Order total */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Order Total</span>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-800">₹{total.toLocaleString("en-IN")}</span>
              <span className="text-xs text-gray-400 ml-1">+ shipping</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <HiOutlineExclamationCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              onClick={handleReorder}
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-[var(--primary)] to-blue-700 text-white rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <HiOutlineArrowPath className="w-4 h-4" />
              )}
              {loading ? "Placing..." : "Confirm Reorder"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Success Toast ────────────────────────────────────────────────────

function SuccessToast({ onView, onClose }: { onView: () => void; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-4 min-w-[320px]">
      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
        <HiOutlineCheckCircle className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-sm">Reorder placed!</p>
        <p className="text-emerald-100 text-xs">Pay now to confirm with seller</p>
      </div>
      <button
        onClick={onView}
        className="bg-white text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition whitespace-nowrap"
      >
        View
      </button>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────

function OrderCard({ order, onReorder, onCancel }: { order: Order; onReorder: (o: Order) => void; onCancel: (o: Order) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, color: "bg-gray-100 text-gray-600", icon: HiOutlineClock };
  const paymentCfg = PAYMENT_CONFIG[order.paymentStatus] || { label: order.paymentStatus, color: "text-gray-500" };
  const StatusIcon = statusCfg.icon;

  const canReorder = ["delivered", "cancelled", "rejected"].includes(order.status);
  const canCancel = order.status === "pending";

  return (
    <Link href={`/buyer/orders/${order._id}`} className="block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer">
      {/* Top strip */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 bg-gray-50/60">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">#{order._id.slice(-8).toUpperCase()}</span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-400">{fmtDate(order.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${paymentCfg.color}`}>{paymentCfg.label}</span>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
            <StatusIcon className="w-3 h-3" />
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Product image */}
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
            {order.product?.images?.[0]?.url
              ? <img src={resolveImageUrl(order.product.images[0].url)} alt="" className="w-full h-full object-cover" />
              : <HiOutlineBeaker className="w-7 h-7 m-auto mt-4 text-gray-300" />}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">
              {order.product?.name || "Product"}
            </p>

            {/* Seller */}
            <div className="flex items-center gap-1.5 mt-1">
              <HiOutlineBuildingStorefront className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 truncate">
                {order.seller?.companyName || order.seller?.name}
              </span>
              {order.seller?.isVerified && <HiMiniShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
              {(order.seller?.city || order.seller?.state) && (
                <span className="text-xs text-gray-400">· {[order.seller.city, order.seller.state].filter(Boolean).join(", ")}</span>
              )}
            </div>

            {/* Qty + price */}
            <div className="flex items-center gap-4 mt-2.5">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <HiOutlineReceiptPercent className="w-3.5 h-3.5" />
                <span>{order.quantity} {order.product?.unit || "Pc"} × ₹{order.unitPrice.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-gray-800">
                <HiOutlineCurrencyRupee className="w-4 h-4" />
                {order.totalAmount.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            {canCancel && (
              <button
                onClick={() => onCancel(order)}
                className="flex items-center gap-1.5 border border-red-200 text-red-600 text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-50 transition whitespace-nowrap"
              >
                <HiOutlineXCircle className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}
            {canReorder && (
              <button
                onClick={() => onReorder(order)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-[var(--primary)] to-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl hover:opacity-90 transition whitespace-nowrap"
              >
                <HiOutlineArrowPath className="w-3.5 h-3.5" />
                Reorder
              </button>
            )}
            {/* Call Seller */}
            {order.seller && (
              <button
                onClick={() => setShowCallModal(true)}
                className="flex items-center gap-1.5 border border-green-200 text-green-600 text-xs font-bold px-3 py-2 rounded-xl hover:bg-green-50 transition whitespace-nowrap"
              >
                <HiOutlinePhone className="w-3.5 h-3.5" />
                Call
              </button>
            )}
            {/* Chat with Seller */}
            {order.seller && (
              <Link
                href="/buyer/messages"
                className="flex items-center gap-1.5 border border-blue-200 text-blue-600 text-xs font-bold px-3 py-2 rounded-xl hover:bg-blue-50 transition whitespace-nowrap"
              >
                <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
                Chat
              </Link>
            )}
            {order.product?._id && (
              <Link
                href={`/products/${order.product._id}`}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs font-medium px-3 py-2 rounded-xl hover:bg-gray-50 transition whitespace-nowrap"
              >
                <HiOutlineShoppingBag className="w-3.5 h-3.5" />
                Product
              </Link>
            )}
          </div>
        </div>

        {/* Tracking badge */}
        {order.trackingNumber && order.status === "shipped" && (
          <div className="mt-3 flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
            <HiOutlineTruck className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-indigo-700 font-medium">{order.courierName} · {order.trackingNumber}</span>
              {order.estimatedDelivery && (
                <span className="text-xs text-indigo-400 ml-2">ETA: {fmtDate(order.estimatedDelivery)}</span>
              )}
            </div>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
        >
          {expanded ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Hide details" : "Show details"}
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-50 grid sm:grid-cols-2 gap-3 text-xs text-gray-500">
            <div>
              <p className="font-semibold text-gray-600 mb-1 flex items-center gap-1">
                <HiOutlineMapPin className="w-3.5 h-3.5" /> Shipping Address
              </p>
              <p className="leading-relaxed">{fmtAddr(order.shippingAddress)}</p>
            </div>
            {order.buyerNote && (
              <div>
                <p className="font-semibold text-gray-600 mb-1">Note</p>
                <p className="leading-relaxed">{order.buyerNote}</p>
              </div>
            )}
            {order.product?.category && (
              <div>
                <p className="font-semibold text-gray-600 mb-1">Category</p>
                <p>{order.product.category}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call Seller Modal */}
      {showCallModal && order.seller && (
        <CallSellerModal
          seller={order.seller}
          onClose={() => setShowCallModal(false)}
        />
      )}
      </div>
    </Link>
  );
}

// ─── Main content ─────────────────────────────────────────────────────

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reorderTarget, setReorderTarget] = useState<Order | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetchOrders = useCallback(async (tab: string, pg: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: pg, limit: 10 };
      if (tab) params.status = tab;
      console.log("🔍 [fetchOrders] Fetching with params:", params);
      const res = await api.get("/orders/buyer", { params });
      const d = res.data.data;
      console.log("✅ [fetchOrders] Got response:", d);
      setOrders(d?.orders || []);
      setTotalPages(d?.pagination?.totalPages || 1);
    } catch (err) {
      console.error("❌ [fetchOrders] Error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(activeTab, page);
  }, [activeTab, page, fetchOrders]);

  const handleTabChange = (key: string) => {
    console.log("📋 [handleTabChange] Tab clicked:", key);
    setActiveTab(key);
    setPage(1);
  };

  const handleReorderSuccess = (newId: string) => {
    setReorderTarget(null);
    setSuccessId(newId);
    fetchOrders(activeTab, page);
  };

  const handleCancelOrder = async (order: Order) => {
    if (!window.confirm(`Cancel order for ${order.product?.name}?`)) return;

    try {
      console.log("🔍 [handleCancelOrder] Cancelling order:", order._id);
      await api.post(`/orders/${order._id}/cancel`, {
        reason: cancelReason || "Buyer requested cancellation"
      });

      toast.success("Order cancelled successfully");
      setCancelTarget(null);
      setCancelReason("");
      fetchOrders(activeTab, page);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to cancel order";
      toast.error(`❌ ${msg}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <HiOutlineShoppingBag className="w-6 h-6 text-[var(--primary)]" />
            My Orders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your sample orders and reorder with one click</p>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
        >
          <HiOutlineShoppingBag className="w-4 h-4" />
          Browse Products
        </Link>
      </div>

      {/* Repeat order banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white flex items-center gap-5">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          <HiOutlineArrowPath className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg">Repeat Order Shortcuts</p>
          <p className="text-blue-100 text-sm mt-0.5">
            Click <span className="bg-white/20 px-1.5 py-0.5 rounded font-semibold text-xs">Reorder</span> on any delivered order to instantly place it again — same seller, same product, editable quantity.
          </p>
        </div>
        <HiOutlineCheckCircle className="w-8 h-8 text-white/30 shrink-0" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white text-gray-800 shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <HiOutlineShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">
            {activeTab ? `No ${activeTab} orders` : "No orders yet"}
          </p>
          <p className="text-gray-400 text-sm mt-1 mb-5">
            {activeTab ? "Try a different filter above" : "Browse products and request samples to place your first order"}
          </p>
          <Link href="/products" className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition">
            Browse Products <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} onReorder={setReorderTarget} onCancel={setCancelTarget} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
          >
            Next
          </button>
        </div>
      )}

      {/* Reorder modal */}
      {reorderTarget && (
        <ReorderModal
          order={reorderTarget}
          onClose={() => setReorderTarget(null)}
          onSuccess={handleReorderSuccess}
        />
      )}

      {/* Cancel modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCancelTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <HiOutlineXCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Cancel Order</h2>
                  <p className="text-red-100 text-xs">This action cannot be undone</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Product summary */}
              <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                <div className="w-14 h-14 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                  {cancelTarget.product?.images?.[0]?.url
                    ? <img src={resolveImageUrl(cancelTarget.product.images[0].url)} alt="" className="w-full h-full object-cover" />
                    : <HiOutlineBeaker className="w-6 h-6 m-4 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{cancelTarget.product?.name || "Product"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {cancelTarget.quantity} unit{cancelTarget.quantity > 1 ? "s" : ""} × ₹{cancelTarget.unitPrice.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                  Reason for Cancellation (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Tell us why you're cancelling this order..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none"
                />
              </div>

              {/* Info */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-800">
                <p className="font-semibold mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Order will be marked as cancelled</li>
                  <li>Seller will be notified</li>
                  <li>You can place a new order anytime</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCancelTarget(null)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Keep Order
                </button>
                <button
                  onClick={() => handleCancelOrder(cancelTarget)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition flex items-center justify-center gap-2"
                >
                  <HiOutlineXCircle className="w-4 h-4" />
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {successId && (
        <SuccessToast
          onView={() => {
            setSuccessId(null);
            setActiveTab("pending");
            setPage(1);
          }}
          onClose={() => setSuccessId(null)}
        />
      )}
    </div>
  );
}

export default function BuyerOrdersPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "premium", "admin"]}>
      <OrdersContent />
    </ProtectedRoute>
  );
}
