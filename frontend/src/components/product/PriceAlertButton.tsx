"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineBell,
  HiBell,
  HiXMark,
  HiOutlineCurrencyRupee,
  HiOutlineCubeTransparent,
} from "@/lib/icons";

interface Props {
  productId: string;
  currentPrice: number;
  priceUnit?: string;
  currentStock?: number;
}

interface AlertStatus {
  hasPriceAlert: boolean;
  hasStockAlert: boolean;
  priceAlert: { _id: string; targetPrice: number } | null;
  stockAlert: { _id: string } | null;
}

export default function PriceAlertButton({ productId, currentPrice, priceUnit, currentStock = 1 }: Props) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<AlertStatus>({ hasPriceAlert: false, hasStockAlert: false, priceAlert: null, stockAlert: null });
  const [showModal, setShowModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const hasAnyAlert = status.hasPriceAlert || status.hasStockAlert;

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get(`/price-alerts/check/${productId}`)
      .then((res) => setStatus(res.data.data))
      .catch(() => {});
  }, [isAuthenticated, productId]);

  const handleClick = () => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    setTargetPrice(String(Math.floor(currentPrice * 0.9)));
    setShowModal(true);
  };

  const setPriceAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) { toast.error("Enter a valid price"); return; }
    if (price >= currentPrice) { toast.error(`Must be below ₹${currentPrice}`); return; }
    setLoading(true);
    try {
      await api.post("/price-alerts", { productId, targetPrice: price, alertType: "price" });
      setStatus((prev) => ({ ...prev, hasPriceAlert: true, priceAlert: { _id: "set", targetPrice: price } }));
      toast.success(`Alert set! Notify when price drops to ₹${price}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to set alert");
    } finally {
      setLoading(false);
    }
  };

  const setStockAlert = async () => {
    setLoading(true);
    try {
      await api.post("/price-alerts", { productId, alertType: "stock" });
      setStatus((prev) => ({ ...prev, hasStockAlert: true, stockAlert: { _id: "set" } }));
      toast.success("You'll be notified when back in stock!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to set alert");
    } finally {
      setLoading(false);
    }
  };

  const removeAlert = async (alertId: string, type: "price" | "stock") => {
    try {
      await api.delete(`/price-alerts/${alertId}`);
      if (type === "price") setStatus((prev) => ({ ...prev, hasPriceAlert: false, priceAlert: null }));
      else setStatus((prev) => ({ ...prev, hasStockAlert: false, stockAlert: null }));
      toast.success("Alert removed");
    } catch { toast.error("Failed"); }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 w-full py-2.5 rounded-lg font-semibold text-sm transition mt-2 justify-center border ${
          hasAnyAlert
            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50"
        }`}
      >
        {hasAnyAlert ? <HiBell className="w-4 h-4" /> : <HiOutlineBell className="w-4 h-4" />}
        {hasAnyAlert
          ? status.hasPriceAlert && status.priceAlert
            ? `Price alert: ₹${status.priceAlert.targetPrice}`
            : "Stock alert active"
          : "Set Price / Stock Alert"}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <HiOutlineBell className="w-5 h-5 text-amber-500" />
                Price & Stock Alerts
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Price Alert */}
            <div className="mb-4 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-semibold text-blue-700 flex items-center gap-1.5 mb-1">
                <HiOutlineCurrencyRupee className="w-4 h-4" /> Price Drop Alert
              </p>
              <p className="text-xs text-blue-600 mb-3">
                Current: <strong>₹{currentPrice}/{priceUnit || "Pc"}</strong> — alert when it drops to your target
              </p>
              {status.hasPriceAlert && status.priceAlert ? (
                <div className="flex items-center justify-between bg-white rounded-lg p-2.5">
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <HiBell className="w-4 h-4 text-amber-500" />
                    Alert at ₹{status.priceAlert.targetPrice}
                  </span>
                  <button onClick={() => removeAlert(status.priceAlert!._id, "price")}
                    className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              ) : (
                <form onSubmit={setPriceAlert} className="flex gap-2">
                  <div className="relative flex-1">
                    <HiOutlineCurrencyRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="number" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)}
                      min={1} max={currentPrice - 1} step={1} required
                      className="w-full pl-8 pr-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      placeholder={`Below ₹${currentPrice}`} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    Set
                  </button>
                </form>
              )}
              {parseFloat(targetPrice) > 0 && parseFloat(targetPrice) < currentPrice && !status.hasPriceAlert && (
                <p className="text-xs text-green-600 mt-1.5">
                  You'll save ₹{(currentPrice - parseFloat(targetPrice)).toFixed(0)} ({Math.round((1 - parseFloat(targetPrice) / currentPrice) * 100)}% off)
                </p>
              )}
            </div>

            {/* Stock Alert */}
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm font-semibold text-green-700 flex items-center gap-1.5 mb-1">
                <HiOutlineCubeTransparent className="w-4 h-4" /> Back in Stock Alert
              </p>
              {currentStock > 0 ? (
                <p className="text-xs text-green-600">This product is currently in stock.</p>
              ) : status.hasStockAlert ? (
                <div className="flex items-center justify-between bg-white rounded-lg p-2.5">
                  <span className="text-sm text-gray-700">Watching for availability</span>
                  <button onClick={() => removeAlert(status.stockAlert!._id, "stock")}
                    className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-green-600 mb-2">Out of stock — get notified when available again.</p>
                  <button onClick={setStockAlert} disabled={loading}
                    className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                    Notify When Available
                  </button>
                </>
              )}
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              In-app + email notifications · <a href="/buyer/alerts" className="text-[var(--primary)] hover:underline">Manage all alerts →</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
