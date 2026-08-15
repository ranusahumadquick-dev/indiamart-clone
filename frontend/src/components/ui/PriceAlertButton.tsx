"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineBell,
  HiBell,
  HiOutlineXMark,
  HiOutlineCurrencyRupee,
  HiOutlineCubeTransparent,
} from "@/lib/icons";

interface Props {
  productId: string;
  currentPrice: number;
  currentStock?: number;
  className?: string;
}

interface AlertStatus {
  hasPriceAlert: boolean;
  hasStockAlert: boolean;
  priceAlert: { _id: string; targetPrice: number } | null;
  stockAlert: { _id: string } | null;
}

export default function PriceAlertButton({ productId, currentPrice, currentStock = 1, className = "" }: Props) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<AlertStatus>({ hasPriceAlert: false, hasStockAlert: false, priceAlert: null, stockAlert: null });
  const [targetPrice, setTargetPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const hasAnyAlert = status.hasPriceAlert || status.hasStockAlert;

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get(`/price-alerts/check/${productId}`)
      .then((res) => setStatus(res.data.data))
      .catch(() => {});
  }, [isAuthenticated, productId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    setOpen((v) => !v);
  };

  const setPriceAlert = async () => {
    const price = Number(targetPrice);
    if (!price || price <= 0) { toast.error("Enter a valid target price"); return; }
    if (price >= currentPrice) { toast.error(`Must be below current price ₹${currentPrice}`); return; }
    setLoading(true);
    try {
      await api.post("/price-alerts", { productId, targetPrice: price, alertType: "price" });
      setStatus((prev) => ({ ...prev, hasPriceAlert: true, priceAlert: { _id: "new", targetPrice: price } }));
      toast.success(`Alert set! You'll be notified when price drops to ₹${price}`);
      setTargetPrice("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to set alert");
    } finally {
      setLoading(false);
    }
  };

  const setStockAlert = async () => {
    setLoading(true);
    try {
      await api.post("/price-alerts", { productId, alertType: "stock" });
      setStatus((prev) => ({ ...prev, hasStockAlert: true, stockAlert: { _id: "new" } }));
      toast.success("You'll be notified when this product is back in stock!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to set alert");
    } finally {
      setLoading(false);
    }
  };

  const removeAlert = async (alertId: string, type: "price" | "stock") => {
    setLoading(true);
    try {
      await api.delete(`/price-alerts/${alertId}`);
      if (type === "price") setStatus((prev) => ({ ...prev, hasPriceAlert: false, priceAlert: null }));
      else setStatus((prev) => ({ ...prev, hasStockAlert: false, stockAlert: null }));
      toast.success("Alert removed");
    } catch {
      toast.error("Failed to remove alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      <button
        onClick={handleToggleClick}
        title={hasAnyAlert ? "Manage alerts" : "Set price/stock alert"}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all
          ${hasAnyAlert
            ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
            : "bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600"
          }`}
      >
        {hasAnyAlert
          ? <HiBell className="w-4 h-4 text-amber-500" />
          : <HiOutlineBell className="w-4 h-4" />}
        {hasAnyAlert ? "Alert Set" : "Set Alert"}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
              <HiOutlineBell className="w-4 h-4 text-amber-500" />
              Price & Stock Alerts
            </h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <HiOutlineXMark className="w-4 h-4" />
            </button>
          </div>

          {/* Price Alert Section */}
          <div className="mb-3 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-2">
              <HiOutlineCurrencyRupee className="w-3.5 h-3.5" />
              Price Drop Alert
            </p>
            <p className="text-[11px] text-blue-600 mb-2">
              Current price: <strong>₹{currentPrice.toLocaleString("en-IN")}</strong>
            </p>
            {status.hasPriceAlert && status.priceAlert ? (
              <div className="flex items-center justify-between bg-white rounded-lg p-2">
                <span className="text-xs text-gray-700">
                  Alert at <strong>₹{status.priceAlert.targetPrice.toLocaleString("en-IN")}</strong>
                </span>
                <button
                  onClick={() => removeAlert(status.priceAlert!._id, "price")}
                  disabled={loading}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                  <input
                    type="number"
                    placeholder={`Below ${currentPrice}`}
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && setPriceAlert()}
                    className="w-full pl-6 pr-2 py-1.5 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <button
                  onClick={setPriceAlert}
                  disabled={loading}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            )}
          </div>

          {/* Stock Alert Section */}
          <div className="p-3 bg-green-50 rounded-xl">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-2">
              <HiOutlineCubeTransparent className="w-3.5 h-3.5" />
              Back in Stock Alert
            </p>
            {currentStock > 0 ? (
              <p className="text-[11px] text-green-600">
                This product is currently in stock ({currentStock} units available).
              </p>
            ) : status.hasStockAlert ? (
              <div className="flex items-center justify-between bg-white rounded-lg p-2">
                <span className="text-xs text-gray-700">You'll be notified when in stock</span>
                <button
                  onClick={() => removeAlert(status.stockAlert!._id, "stock")}
                  disabled={loading}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-green-600 mb-2">Out of stock. Get notified when available.</p>
                <button
                  onClick={setStockAlert}
                  disabled={loading}
                  className="w-full py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Notify When Available
                </button>
              </>
            )}
          </div>

          <p className="text-[10px] text-gray-400 text-center mt-3">
            You'll receive in-app + email notifications
          </p>
        </div>
      )}
    </div>
  );
}
