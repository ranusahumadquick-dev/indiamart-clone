"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineCalendarDays,
  HiOutlineXCircle,
  HiOutlineArrowLeft,
  HiOutlineStar,
  HiOutlineShieldCheck,
  HiOutlinePhone,
  HiOutlineChatBubbleLeftRight,
  HiMiniCheckCircle,
  HiOutlineHome,
  HiOutlineReceiptPercent,
  HiOutlineArrowDownTray,
  HiOutlineBeaker,
} from "@/lib/icons";
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
    phone?: string;
    email?: string;
    city?: string;
    state?: string;
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
  createdAt: string;
}

// ─── Timeline Configuration ────────────────────────────────────────────

const TIMELINE_STAGES = [
  {
    status: "pending",
    label: "Ordered",
    icon: HiOutlineCheckCircle,
    color: "bg-green-100 text-green-700",
    lineColor: "bg-green-300"
  },
  {
    status: "accepted",
    label: "Confirmed",
    icon: HiMiniCheckCircle,
    color: "bg-blue-100 text-blue-700",
    lineColor: "bg-blue-300"
  },
  {
    status: "processing",
    label: "Processing",
    icon: HiOutlineTruck,
    color: "bg-orange-100 text-orange-700",
    lineColor: "bg-orange-300"
  },
  {
    status: "shipped",
    label: "Shipped",
    icon: HiOutlineTruck,
    color: "bg-indigo-100 text-indigo-700",
    lineColor: "bg-indigo-300"
  },
  {
    status: "delivered",
    label: "Delivery",
    icon: HiMiniCheckCircle,
    color: "bg-emerald-100 text-emerald-700",
    lineColor: "bg-emerald-300"
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function fmtDateWithDay(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

function getTimelineDate(baseDate: Date, daysOffset: number) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysOffset);
  return date;
}

function fmtAddr(a?: Address) {
  if (!a) return "—";
  return [a.street, a.city, a.state, a.pincode].filter(Boolean).join(", ");
}

function getDeliveryDate(order: Order) {
  if (order.estimatedDelivery) {
    return new Date(order.estimatedDelivery);
  }
  // Calculate estimated delivery (5 days from order)
  const date = new Date(order.createdAt);
  date.setDate(date.getDate() + 5);
  return date;
}

function getCurrentStatus(status: string) {
  const statusMap: Record<string, string> = {
    "pending": "Order Confirmed",
    "accepted": "Order Confirmed",
    "processing": "Processing Soon!",
    "shipped": "Shipping Soon!",
    "out_for_delivery": "Out for Delivery",
    "delivered": "Delivered",
    "cancelled": "Order Cancelled",
  };
  return statusMap[status] || "In Progress";
}

// ─── Order Timeline Component ─────────────────────────────────────────

interface TimelineProps {
  order: Order;
}

function OrderTimeline({ order }: TimelineProps) {
  const statusIndex = TIMELINE_STAGES.findIndex(s => s.status === order.status);
  const orderDate = new Date(order.createdAt);

  // Calculate dates for each timeline stage
  const timelineDates = {
    pending: orderDate, // Today
    accepted: getTimelineDate(orderDate, 0), // Same day
    processing: getTimelineDate(orderDate, 1), // +1 day
    shipped: getTimelineDate(orderDate, 1), // +1 day
    delivered: getTimelineDate(orderDate, 5), // +5 days
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
        <HiOutlineCalendarDays className="w-5 h-5" />
        Order Timeline
      </h3>

      <div className="relative">
        {/* Timeline */}
        <div className="space-y-4">
          {TIMELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx <= statusIndex;
            const isCurrent = idx === statusIndex;
            const StageIcon = stage.icon;
            const stageDate = timelineDates[stage.status as keyof typeof timelineDates];

            return (
              <div key={stage.status} className="flex gap-4">
                {/* Timeline dot and line */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                    isCompleted ? stage.color : "bg-gray-100 text-gray-400"
                  }`}>
                    {isCompleted ? (
                      <HiMiniCheckCircle className="w-6 h-6" />
                    ) : (
                      <StageIcon className="w-5 h-5" />
                    )}
                  </div>
                  {idx < TIMELINE_STAGES.length - 1 && (
                    <div className={`w-1 h-12 my-1 ${
                      isCompleted ? stage.lineColor : "bg-gray-200"
                    }`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold ${
                        isCompleted ? "text-gray-800" : "text-gray-400"
                      }`}>
                        {stage.label}
                      </p>
                      <p className={`text-xs ${
                        isCompleted ? "text-gray-500" : "text-gray-300"
                      }`}>
                        {fmtDate(stageDate.toString())}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-blue-600 font-semibold mt-1">
                          • In Progress
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCallModal, setShowCallModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/buyer/${orderId}`);
      if (res.data.data) {
        setOrder(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto text-center py-20">
          <p className="text-gray-600 mb-4">Order not found</p>
          <Link href="/buyer/orders" className="text-blue-600 hover:underline">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const deliveryDate = getDeliveryDate(order);
  const currentStatus = getCurrentStatus(order.status);
  const productImage = order.product?.images?.[0]?.url || "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/buyer/orders" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <HiOutlineArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <p className="text-xs text-gray-500">Order #{order._id.slice(-8).toUpperCase()}</p>
            <p className="font-bold text-gray-800">{order.product?.name}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Order Status Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <HiMiniCheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">Order Placed</p>
                  <p className="text-gray-600 text-sm">Delivery by {fmtDateWithDay(deliveryDate)}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Payment Status</p>
              <p className={`font-bold ${
                order.paymentStatus === "paid" ? "text-green-600" : "text-amber-600"
              }`}>
                {order.paymentStatus === "paid" ? "✓ Paid" : "Pending"}
              </p>
            </div>
          </div>

          {/* Current Status Badge */}
          <div className="bg-gray-800 text-white rounded-full py-2 px-4 inline-flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-semibold">{currentStatus}</span>
          </div>

          {/* Timeline */}
          <OrderTimeline order={order} />
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Product Details</h3>

          <div className="flex gap-4 mb-6">
            {/* Product Image */}
            <div className="w-24 h-24 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
              {productImage ? (
                <img src={productImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <HiOutlineBeaker className="w-12 h-12 m-auto mt-6 text-gray-300" />
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1">
              <p className="font-bold text-gray-800 mb-2">{order.product?.name}</p>

              {/* Quantity and Price */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <HiOutlineReceiptPercent className="w-4 h-4" />
                  <span>{order.quantity} {order.product?.unit || "Pc"} × ₹{order.unitPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-gray-800">
                  <HiOutlineCurrencyRupee className="w-4 h-4" />
                  <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <HiOutlineStar key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-xs text-gray-600">4000+ Users rated 4 star</span>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-3">Sold by</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{order.seller?.companyName || order.seller?.name}</p>
                <p className="text-xs text-gray-500">{order.seller?.city}, {order.seller?.state}</p>
              </div>
              <div className="flex gap-2">
                {order.seller && (
                  <>
                    <button
                      onClick={() => setShowCallModal(true)}
                      className="flex items-center gap-1.5 border border-green-200 text-green-600 text-xs font-bold px-3 py-2 rounded-lg hover:bg-green-50 transition"
                    >
                      <HiOutlinePhone className="w-4 h-4" />
                      Call
                    </button>
                    <Link
                      href="/buyer/messages"
                      className="flex items-center gap-1.5 border border-blue-200 text-blue-600 text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-50 transition"
                    >
                      <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
                      Chat
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Payment</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm text-gray-600">Your payment mode:</p>
                <p className="font-bold text-gray-800">Cash on Delivery</p>
              </div>
              <p className="text-lg font-bold text-gray-800">₹{order.totalAmount.toLocaleString("en-IN")}</p>
            </div>

            {/* Switch Payment Method */}
            {order.paymentStatus === "pending" && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Switch to UPI</p>
                    <p className="text-xs text-blue-700">Quick & Secure Payment</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">Save ₹50</p>
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-xl hover:opacity-90 transition">
                  Pay Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <HiOutlineMapPin className="w-5 h-5" />
              Delivery Address
            </h3>
            <button className="text-purple-600 font-bold text-sm hover:underline">
              CHANGE
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="font-semibold text-gray-800">
              {(order.shippingAddress as any)?.name || "Buyer"}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {fmtAddr(order.shippingAddress)}
            </p>
            {(order.shippingAddress as any)?.phone && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <HiOutlinePhone className="w-4 h-4" />
                {(order.shippingAddress as any).phone}
              </p>
            )}
          </div>
        </div>

        {/* Cancellation Option */}
        {order.status === "pending" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-sm text-gray-600 mb-4">Cancellation available till shipping!</p>
            <button className="border-2 border-purple-600 text-purple-600 font-bold px-6 py-3 rounded-xl hover:bg-purple-50 transition">
              Cancel Order
            </button>
          </div>
        )}
      </div>

      {/* Call Modal */}
      {showCallModal && order.seller && (
        <CallSellerModal
          seller={order.seller}
          onClose={() => setShowCallModal(false)}
        />
      )}
    </div>
  );
}
