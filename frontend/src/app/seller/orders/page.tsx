"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { HiOutlineShoppingBag, HiOutlineTruck, HiOutlineCheckCircle, HiOutlineChevronDown, HiOutlineXMark } from "@/lib/icons";

interface Order {
  _id: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  shippingAddress: { city: string; state: string; pincode: string };
  trackingInfo?: { trackingNumber?: string; courier?: string };
  items: { name: string; qty: number; unitPrice: number; image?: string }[];
  buyer?: { name: string; email: string; phone: string };
  sellerNote?: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  refunded: "bg-red-100 text-red-600",
};

const STATUS_FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"];
const COURIERS = ["Fedex", "DHL", "UPS", "India Post", "Blue Dart", "DTDC", "Ecom Express", "Other"];

function SellerOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updateData, setUpdateData] = useState<Record<string, any>>({});

  useEffect(() => {
    // Fetch orders from the dedicated orders API
    api.get("/orders/seller", { params: { page: 1, limit: 100 } })
      .then((res) => {
        const orders = res.data.data?.orders || [];
        console.log("✅ Fetched", orders.length, "orders for seller");
        setOrders(orders);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch orders:", err);
        toast.error("Failed to load orders");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateOrder = async (orderId: string) => {
    try {
      setUpdatingOrderId(orderId);
      const data = updateData[orderId] || {};

      const payload: any = {};
      if (data.status) payload.status = data.status;
      if (data.sellerNote) payload.sellerNote = data.sellerNote;

      const res = await api.put(`/orders/seller/${orderId}/status`, payload);

      const updatedOrder = res.data.data;
      setOrders(orders.map(o => o._id === orderId ? updatedOrder : o));
      setExpandedOrderId(null);
      setUpdateData(prev => {
        const newData = { ...prev };
        delete newData[orderId];
        return newData;
      });

      toast.success("✅ Order updated successfully");
    } catch (err: any) {
      console.error("❌ Failed to update order:", err);
      toast.error(err.response?.data?.message || "Failed to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const revenue = orders.filter(o => o.paymentStatus === "paid").reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Orders</h1>
        <div className="text-sm text-gray-500">
          Revenue: <span className="font-bold text-gray-800">₹{revenue.toLocaleString()}</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
          <HiOutlineShoppingBag className="w-10 h-10 mx-auto mb-2" />
          <p>No paid orders yet</p>
          <p className="text-xs mt-1">Orders appear here after buyers pay for sample requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{order.buyer?.name}</p>
                    <p className="text-xs text-gray-400">{order.buyer?.email} · {order.buyer?.phone}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[order.status]}`}>{order.status}</span>
                      <p className="text-sm font-bold text-gray-800 mt-1">₹{order.totalAmount.toLocaleString()}</p>
                    </div>
                    <HiOutlineChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedOrderId === order._id ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <div className="space-y-1">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded object-cover" />}
                      <span>{item.name}</span>
                      <span className="text-gray-400">×{item.qty}</span>
                      <span>₹{item.unitPrice}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                  <span>Ship to: {order.shippingAddress?.city}, {order.shippingAddress?.state}</span>
                  {order.trackingInfo?.trackingNumber && (
                    <span className="text-purple-600">Tracking: {order.trackingInfo.trackingNumber}</span>
                  )}
                </div>
              </div>

              {/* Expanded Details Section */}
              {expandedOrderId === order._id && (
                <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
                  {/* Status Update */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Order Status</label>
                    <select
                      value={updateData[order._id]?.status || order.status}
                      onChange={(e) => setUpdateData(prev => ({
                        ...prev,
                        [order._id]: { ...prev[order._id], status: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {STATUS_FLOW.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Seller Notes */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Seller Notes</label>
                    <textarea
                      value={updateData[order._id]?.sellerNote || order.sellerNote || ''}
                      onChange={(e) => setUpdateData(prev => ({
                        ...prev,
                        [order._id]: { ...prev[order._id], sellerNote: e.target.value }
                      }))}
                      placeholder="Add notes about this order..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Tracking Info */}
                  <div className="bg-white p-3 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-gray-700">📦 Tracking Information</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Courier</label>
                        <select
                          value={updateData[order._id]?.courier || order.trackingInfo?.courier || ''}
                          onChange={(e) => setUpdateData(prev => ({
                            ...prev,
                            [order._id]: { ...prev[order._id], courier: e.target.value }
                          }))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select courier</option>
                          {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Tracking Number</label>
                        <input
                          type="text"
                          value={updateData[order._id]?.trackingNumber || order.trackingInfo?.trackingNumber || ''}
                          onChange={(e) => setUpdateData(prev => ({
                            ...prev,
                            [order._id]: { ...prev[order._id], trackingNumber: e.target.value }
                          }))}
                          placeholder="Enter tracking #"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3">
                    <button
                      onClick={() => handleUpdateOrder(order._id)}
                      disabled={updatingOrderId === order._id}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                      {updatingOrderId === order._id ? '⏳ Updating...' : '✅ Save Changes'}
                    </button>
                    <button
                      onClick={() => setExpandedOrderId(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      <HiOutlineXMark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SellerOrdersPage() {
  return (
    <ProtectedRoute allowedRoles={["seller", "admin"]}>
      <SellerOrdersContent />
    </ProtectedRoute>
  );
}
