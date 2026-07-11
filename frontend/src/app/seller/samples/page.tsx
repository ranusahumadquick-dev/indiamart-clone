"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import { resolveImageUrl } from "@/lib/imageUrl";
import toast from "react-hot-toast";
import {
  HiOutlineBeaker,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTruck,
  HiOutlineClock,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";

interface SampleRequest {
  _id: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  buyerNote?: string;
  sellerNote?: string;
  trackingNumber?: string;
  courierName?: string;
  shippingAddress: { street: string; city: string; state: string; pincode: string };
  createdAt: string;
  product?: { _id: string; name: string; images: { url: string }[] };
  buyer?: { _id: string; name: string; email: string; phone: string };
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const TABS = ["All", "Pending", "Accepted", "Shipped", "Delivered"];

function SellerSamplesContent() {
  const [samples, setSamples] = useState<SampleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("All");
  const [shipModal, setShipModal] = useState<string | null>(null);
  const [shipData, setShipData] = useState({ trackingNumber: "", courierName: "", estimatedDelivery: "" });
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchSamples = async () => {
    try {
      const res = await api.get("/samples/seller?limit=100");
      setSamples(res.data.data?.samples || []);
    } catch { toast.error("Failed to load samples"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSamples(); }, []);

  const filtered = tab === "All" ? samples : samples.filter((s) => s.status.toLowerCase() === tab.toLowerCase());

  const handleAccept = async (id: string, note: string = "") => {
    setProcessing(id);
    try {
      await api.put(`/samples/${id}/accept`, { sellerNote: note });
      setSamples((prev) => prev.map((s) => s._id === id ? { ...s, status: "accepted" } : s));
      toast.success("Sample request accepted!");
    } catch (e: any) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setProcessing(null); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Reason for rejection (optional):");
    if (reason === null) return;
    setProcessing(id);
    try {
      await api.put(`/samples/${id}/reject`, { rejectionReason: reason });
      setSamples((prev) => prev.map((s) => s._id === id ? { ...s, status: "rejected", rejectionReason: reason } : s));
      toast.success("Request rejected");
    } catch (e: any) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setProcessing(null); }
  };

  const handleShip = async (id: string) => {
    if (!shipData.trackingNumber || !shipData.courierName) {
      toast.error("Tracking number and courier name are required");
      return;
    }
    setProcessing(id);
    try {
      await api.put(`/samples/${id}/ship`, shipData);
      setSamples((prev) => prev.map((s) => s._id === id ? { ...s, status: "shipped", ...shipData } : s));
      toast.success("Marked as shipped!");
      setShipModal(null);
      setShipData({ trackingNumber: "", courierName: "", estimatedDelivery: "" });
    } catch (e: any) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setProcessing(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Sample Requests</h1>
        <span className="text-sm text-gray-500">{samples.filter(s => s.status === "pending").length} pending</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              tab === t ? "bg-[var(--primary)] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
          <HiOutlineBeaker className="w-10 h-10 mx-auto mb-2" />
          <p>No {tab !== "All" ? tab.toLowerCase() : ""} sample requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div key={s._id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {s.product?.images?.[0]?.url ? (
                    <img src={resolveImageUrl(s.product.images[0].url)} alt="" className="w-full h-full object-cover" />
                  ) : <HiOutlineBeaker className="w-5 h-5 m-auto mt-4 text-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{s.product?.name || "Product"}</p>
                      <p className="text-sm text-gray-500">{s.buyer?.name} — {s.buyer?.email}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[s.status]}`}>{s.status}</span>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>{s.quantity} unit{s.quantity > 1 ? "s" : ""}</span>
                    <span>₹{s.totalAmount.toLocaleString()}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${s.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {s.paymentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Ship to: {s.shippingAddress.city}, {s.shippingAddress.state} — {s.shippingAddress.pincode}
                  </p>
                  {s.buyerNote && <p className="text-xs text-gray-500 mt-1 italic">"{s.buyerNote}"</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {s.status === "pending" && (
                  <>
                    <button onClick={() => handleAccept(s._id)} disabled={processing === s._id}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50">
                      <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button onClick={() => handleReject(s._id)} disabled={processing === s._id}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition disabled:opacity-50">
                      <HiOutlineXCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}
                {s.status === "accepted" && s.paymentStatus === "paid" && (
                  <button onClick={() => setShipModal(s._id)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition">
                    <HiOutlineTruck className="w-3.5 h-3.5" /> Mark Shipped
                  </button>
                )}
                {s.status === "accepted" && s.paymentStatus !== "paid" && (
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <HiOutlineClock className="w-3.5 h-3.5" /> Waiting for buyer payment
                  </span>
                )}
              </div>

              {/* Ship Modal */}
              {shipModal === s._id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-medium text-sm text-gray-700 mb-3">Shipping Details</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <input value={shipData.trackingNumber} onChange={(e) => setShipData({ ...shipData, trackingNumber: e.target.value })}
                      placeholder="Tracking Number *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                    <input value={shipData.courierName} onChange={(e) => setShipData({ ...shipData, courierName: e.target.value })}
                      placeholder="Courier Name *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                    <input type="date" value={shipData.estimatedDelivery} onChange={(e) => setShipData({ ...shipData, estimatedDelivery: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleShip(s._id)} disabled={processing === s._id}
                      className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50">
                      {processing === s._id ? "Saving..." : "Confirm Ship"}
                    </button>
                    <button onClick={() => setShipModal(null)} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">Cancel</button>
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

export default function SellerSamplesPage() {
  return (
    <ProtectedRoute allowedRoles={["seller", "admin"]}>
      <SellerSamplesContent />
    </ProtectedRoute>
  );
}
