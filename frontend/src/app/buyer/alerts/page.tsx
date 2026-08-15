"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import { resolveImageUrl } from "@/lib/imageUrl";
import toast from "react-hot-toast";
import {
  HiBell,
  HiOutlineBell,
  HiOutlineTrash,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineCurrencyRupee,
  HiOutlineCubeTransparent,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
} from "@/lib/icons";

interface Alert {
  _id: string;
  alertType: "price" | "stock";
  targetPrice?: number;
  currentPriceAtAlert?: number;
  notifyWhenInStock?: boolean;
  isActive: boolean;
  triggeredAt?: string;
  createdAt: string;
  product?: {
    _id: string;
    name: string;
    price: number;
    stock?: number;
    images?: { url: string }[];
    priceUnit?: string;
    isActive?: boolean;
  };
}

type Tab = "all" | "price" | "stock";

function StatusBadge({ alert }: { alert: Alert }) {
  if (!alert.isActive && alert.triggeredAt) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
        <HiOutlineCheckCircle className="w-3 h-3" /> Triggered
      </span>
    );
  }
  if (!alert.product?.isActive) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
        <HiOutlineXCircle className="w-3 h-3" /> Product Unavailable
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
      <HiOutlineClock className="w-3 h-3" /> Watching
    </span>
  );
}

function AlertCard({ alert, onDelete }: { alert: Alert; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const product = alert.product;

  const handleDelete = async () => {
    if (!confirm("Remove this alert?")) return;
    setDeleting(true);
    try {
      await api.delete(`/price-alerts/${alert._id}`);
      toast.success("Alert removed");
      onDelete(alert._id);
    } catch {
      toast.error("Failed to remove alert");
    } finally {
      setDeleting(false);
    }
  };

  const priceDrop = alert.alertType === "price" && product && alert.targetPrice
    ? Math.round(((product.price - alert.targetPrice) / product.price) * 100)
    : 0;

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 flex gap-4 transition-opacity ${!alert.isActive ? "opacity-70" : ""} ${alert.alertType === "price" ? "border-blue-100" : "border-green-100"}`}>
      {/* Product image */}
      <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
        {product?.images?.[0]?.url ? (
          <img src={resolveImageUrl(product.images[0].url)} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${alert.alertType === "price" ? "bg-blue-100" : "bg-green-100"}`}>
            {alert.alertType === "price"
              ? <HiOutlineCurrencyRupee className="w-6 h-6 text-blue-500" />
              : <HiOutlineCubeTransparent className="w-6 h-6 text-green-500" />}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">
              {product?.name || "Product"}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${alert.alertType === "price" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
                {alert.alertType === "price" ? "Price Alert" : "Stock Alert"}
              </span>
              <StatusBadge alert={alert} />
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-gray-300 hover:text-red-400 transition flex-shrink-0 disabled:opacity-50"
            title="Remove alert"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>

        {/* Alert details */}
        {alert.alertType === "price" && (
          <div className="flex items-center gap-3 text-xs mt-2">
            <span className="text-gray-500">Current: <strong className="text-gray-800">₹{product?.price?.toLocaleString("en-IN") ?? "—"}</strong></span>
            <span className="text-blue-600 font-medium">Target: ₹{alert.targetPrice?.toLocaleString("en-IN")}</span>
            {priceDrop > 0 && (
              <span className="text-gray-400">({priceDrop}% away)</span>
            )}
          </div>
        )}

        {alert.alertType === "stock" && (
          <div className="flex items-center gap-3 text-xs mt-2">
            <span className={`font-medium ${(product?.stock ?? 0) > 0 ? "text-green-600" : "text-red-500"}`}>
              {(product?.stock ?? 0) > 0 ? `In stock (${product?.stock} units)` : "Out of stock"}
            </span>
            {alert.isActive && <span className="text-gray-400">Watching for availability</span>}
          </div>
        )}

        {/* Triggered info */}
        {alert.triggeredAt && (
          <p className="text-[10px] text-green-600 mt-1.5 flex items-center gap-1">
            <HiOutlineCheckCircle className="w-3 h-3" />
            Triggered on {new Date(alert.triggeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}

        {/* Set date */}
        <p className="text-[10px] text-gray-400 mt-1">
          Set on {new Date(alert.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          {product?._id && (
            <Link href={`/products/${product._id}`}
              className="ml-2 text-[var(--primary)] hover:underline inline-flex items-center gap-0.5">
              View Product <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}

function AlertsContent() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/price-alerts");
      setAlerts(res.data.data || []);
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleDelete = (id: string) => setAlerts((prev) => prev.filter((a) => a._id !== id));

  const filtered = tab === "all" ? alerts : alerts.filter((a) => a.alertType === tab);
  const activeCount = alerts.filter((a) => a.isActive).length;
  const priceCount = alerts.filter((a) => a.alertType === "price").length;
  const stockCount = alerts.filter((a) => a.alertType === "stock").length;
  const triggeredCount = alerts.filter((a) => !a.isActive && a.triggeredAt).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <HiBell className="w-6 h-6 text-amber-500" />
            Price & Stock Alerts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Get notified when prices drop or items restock</p>
        </div>
        <Link href="/products"
          className="text-sm font-medium text-[var(--primary)] hover:underline flex items-center gap-1">
          Browse Products
          <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: alerts.length, color: "text-gray-800", bg: "bg-gray-50 border-gray-200" },
          { label: "Watching", value: activeCount, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
          { label: "Triggered", value: triggeredCount, color: "text-green-700", bg: "bg-green-50 border-green-200" },
          { label: "Stock", value: stockCount, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { key: "all" as Tab, label: "All Alerts", count: alerts.length },
          { key: "price" as Tab, label: "Price Drops", count: priceCount },
          { key: "stock" as Tab, label: "Back in Stock", count: stockCount },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
              ${tab === t.key ? "bg-[var(--primary)] text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                ${tab === t.key ? "bg-white/25 text-white" : "bg-white text-gray-600"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <HiOutlineBell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">No alerts yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Go to any product page and click "Set Alert" to track prices or stock
          </p>
          <Link href="/products"
            className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <AlertCard key={alert._id} alert={alert} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BuyerAlertsPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "premium", "admin"]}>
      <AlertsContent />
    </ProtectedRoute>
  );
}
