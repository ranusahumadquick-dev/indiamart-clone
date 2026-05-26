"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineShoppingBag,
  HiOutlineEye,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineXCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
} from "react-icons/hi2";

interface OrderItem {
  product: {
    _id: string;
    name: string;
    images: Array<{ url: string }>;
    price: number;
    category: string;
  };
  qty: number;
  unitPrice: number;
  total: number;
}

interface Order {
  _id: string;
  buyer: {
    _id: string;
    name: string;
    companyName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    businessLogo?: string;
    isVerified?: boolean;
  };
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "refunded" | "failed";
  createdAt: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  sellerNote?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

const statusColors = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  confirmed: { bg: "bg-blue-100", text: "text-blue-700" },
  processing: { bg: "bg-blue-100", text: "text-blue-700" },
  shipped: { bg: "bg-purple-100", text: "text-purple-700" },
  delivered: { bg: "bg-green-100", text: "text-green-700" },
  cancelled: { bg: "bg-red-100", text: "text-red-700" },
};

function SellerOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "10",
        });

        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }

        console.log("📦 Fetching seller orders:", params.toString());

        const res = await api.get(`/orders/seller?${params.toString()}`);
        const { orders: fetchedOrders, pagination } = res.data.data;

        console.log("✅ Orders fetched:", fetchedOrders.length);
        setOrders(fetchedOrders || []);
        setTotalOrders(pagination?.totalItems || 0);
        setTotalPages(pagination?.totalPages || 1);
        setCurrentPage(pagination?.currentPage || 1);
      } catch (err: any) {
        console.error("❌ Error:", err.message);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter, fetchOrders]);

  const filtered = orders.filter((order) =>
    !searchTerm ||
    order.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.buyer.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Buyer Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalOrders} order{totalOrders !== 1 ? "s" : ""} received
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by buyer name or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <HiOutlineShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-600 mb-2">No orders yet</h4>
          <p className="text-sm text-gray-400">You haven't received any orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Link
              key={order._id}
              href={`/seller/orders/${order._id}`}
              className="block bg-white rounded-xl border border-gray-100 hover:shadow-md transition p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800">
                    {order.buyer.companyName || order.buyer.name}
                  </h3>
                  <p className="text-xs text-gray-500">Order #{order._id.slice(-8)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">₹{order.totalAmount.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => fetchOrders(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => fetchOrders(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function SellerOrdersPage() {
  return (
    <ProtectedRoute allowedRoles={["seller"]}>
      <SellerOrdersContent />
    </ProtectedRoute>
  );
}
