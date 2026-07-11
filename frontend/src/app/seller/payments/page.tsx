"use client";
import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineCurrencyRupee, HiOutlineCheckCircle, HiOutlineClock,
  HiOutlineArrowTrendingUp, HiOutlineShoppingBag, HiOutlineMagnifyingGlass,
  HiOutlineCalendarDays, HiOutlineArrowPath, HiOutlineXCircle,
  HiOutlineChevronLeft, HiOutlineChevronRight,
} from "react-icons/hi2";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_CFG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  paid:     { color: "text-emerald-700", bg: "bg-emerald-50",  dot: "bg-emerald-500", label: "Paid"     },
  pending:  { color: "text-amber-700",   bg: "bg-amber-50",    dot: "bg-amber-400",   label: "Pending"  },
  refunded: { color: "text-violet-700",  bg: "bg-violet-50",   dot: "bg-violet-500",  label: "Refunded" },
  failed:   { color: "text-red-700",     bg: "bg-red-50",      dot: "bg-red-500",     label: "Failed"   },
};

const ORDER_STATUS_CFG: Record<string, { color: string; bg: string }> = {
  confirmed:  { color: "text-blue-700",   bg: "bg-blue-50"   },
  processing: { color: "text-orange-700", bg: "bg-orange-50" },
  shipped:    { color: "text-indigo-700", bg: "bg-indigo-50" },
  delivered:  { color: "text-green-700",  bg: "bg-green-50"  },
  cancelled:  { color: "text-red-700",    bg: "bg-red-50"    },
  pending:    { color: "text-gray-600",   bg: "bg-gray-100"  },
};

// ── Revenue Bar Chart ────────────────────────────────────────────────────────
function RevenueChart({ data }: { data: any[] }) {
  if (!data.length) {
    return (
      <div className="h-36 flex flex-col items-center justify-center text-gray-300">
        <HiOutlineArrowTrendingUp className="w-10 h-10 mb-2" />
        <p className="text-sm">No revenue data yet</p>
      </div>
    );
  }
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-3 h-36 mt-4 px-2">
      {data.map((d, i) => {
        const h = Math.max((d.revenue / max) * 112, 4);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
            <div className="relative flex flex-col items-center w-full">
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                ₹{d.revenue.toLocaleString("en-IN")}
              </div>
              <div
                className="w-full bg-gradient-to-t from-[#0052cc] to-blue-400 rounded-t-lg hover:from-blue-700 hover:to-blue-500 transition-all duration-300 cursor-pointer"
                style={{ height: `${h}px` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-medium">{MONTHS[(d._id?.month || 1) - 1]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, gradient }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; gradient: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-white/60 mt-0.5">{sub}</p>}
        </div>
        <div className="p-2.5 bg-white/20 rounded-xl text-white">{icon}</div>
      </div>
      {/* decorative circle */}
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function Badge({ status, map }: { status: string; map: Record<string, any> }) {
  const cfg = map[status] || { color: "text-gray-600", bg: "bg-gray-100", dot: "bg-gray-400", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label || status}
    </span>
  );
}

// ── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i}>
          {[1,2,3,4,5,6].map(j => (
            <td key={j} className="px-5 py-4">
              <div className={`h-3.5 bg-gray-100 rounded-full animate-pulse ${j === 2 ? "w-32" : "w-20"}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
function SellerPaymentsContent() {
  const [dash,    setDash]    = useState<any>(null);
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashLoading, setDashLoading] = useState(true);
  const [tab,     setTab]     = useState<"received"|"pending"|"all">("received");
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);

  const fetchDash = useCallback(async () => {
    setDashLoading(true);
    try {
      const res = await api.get("/payments/seller/dashboard");
      setDash(res.data.data);
    } catch { toast.error("Failed to load dashboard"); }
    finally { setDashLoading(false); }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (tab === "received") params.paymentStatus = "paid";
      if (tab === "pending")  params.paymentStatus = "pending";
      const res = await api.get(`/payments/seller/orders?${new URLSearchParams(params)}`);
      setOrders(res.data.data.orders || []);
      setPages(res.data.data.pages  || 1);
      setTotal(res.data.data.total  || 0);
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  }, [tab, page]);

  useEffect(() => { fetchDash(); },   [fetchDash]);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const displayed = search
    ? orders.filter(o =>
        o.buyer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o._id?.toLowerCase().includes(search.toLowerCase()))
    : orders;

  const paidBreak  = dash?.statusBreakdown?.find((s: any) => s._id === "paid");
  const totalRevenue = dash?.statusBreakdown?.reduce((a: number, s: any) => s._id === "paid" ? a + s.total : a, 0) || 0;

  const STAT_CARDS = [
    {
      label: "Total Orders", value: dash?.totalOrders ?? 0, sub: "All time",
      icon: <HiOutlineShoppingBag className="w-5 h-5" />,
      gradient: "bg-gradient-to-br from-[#0052cc] to-blue-400",
    },
    {
      label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, sub: "Paid orders",
      icon: <HiOutlineCurrencyRupee className="w-5 h-5" />,
      gradient: "bg-gradient-to-br from-emerald-500 to-green-400",
    },
    {
      label: "This Month", value: dash?.monthlyOrders ?? 0, sub: `₹${(dash?.monthlyRevenue||0).toLocaleString("en-IN")} revenue`,
      icon: <HiOutlineCalendarDays className="w-5 h-5" />,
      gradient: "bg-gradient-to-br from-orange-500 to-amber-400",
    },
    {
      label: "Paid Orders", value: paidBreak?.count ?? 0, sub: `${dash?.totalOrders ? Math.round(((paidBreak?.count||0)/dash.totalOrders)*100) : 0}% success rate`,
      icon: <HiOutlineCheckCircle className="w-5 h-5" />,
      gradient: "bg-gradient-to-br from-violet-500 to-purple-400",
    },
  ];

  const TABS = [
    { id: "received", label: "Received", icon: <HiOutlineCheckCircle className="w-3.5 h-3.5" /> },
    { id: "pending",  label: "Pending",  icon: <HiOutlineClock className="w-3.5 h-3.5" />       },
    { id: "all",      label: "All Orders",icon: <HiOutlineShoppingBag className="w-3.5 h-3.5" />},
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] py-7 px-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Payment Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">Track your earnings, settlements & payment status</p>
          </div>
          <button onClick={() => { fetchDash(); fetchOrders(); }}
            className="flex items-center gap-2 text-sm border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 transition font-semibold text-gray-600">
            <HiOutlineArrowPath className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(s => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-black text-gray-900 flex items-center gap-2">
                  <HiOutlineArrowTrendingUp className="w-5 h-5 text-[#0052cc]" />
                  Revenue Trend
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Last 6 months · paid orders only</p>
              </div>
              {dash?.chartData?.length > 0 && (
                <span className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full">
                  ₹{dash.chartData.reduce((a: number, d: any) => a + d.revenue, 0).toLocaleString("en-IN")} total
                </span>
              )}
            </div>
            {dashLoading
              ? <div className="h-36 bg-gray-50 rounded-xl animate-pulse mt-4" />
              : <RevenueChart data={dash?.chartData || []} />
            }
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-black text-gray-900 mb-4">Payment Breakdown</h2>
            {dashLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : (dash?.statusBreakdown || []).length === 0 ? (
              <div className="text-center py-8 text-gray-300">
                <HiOutlineCurrencyRupee className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(dash?.statusBreakdown || []).map((s: any) => {
                  const cfg = STATUS_CFG[s._id] || { color: "text-gray-600", bg: "bg-gray-100", dot: "bg-gray-400", label: s._id };
                  const pct = dash?.totalOrders ? Math.round((s.count / dash.totalOrders) * 100) : 0;
                  return (
                    <div key={s._id} className={`flex items-center justify-between p-3 rounded-xl ${cfg.bg}`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-[10px] text-gray-400">({pct}%)</span>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${cfg.color}`}>{s.count} orders</p>
                        <p className="text-[10px] text-gray-400">₹{(s.total || 0).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Orders Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              {TABS.map(t => (
                <button key={t.id} onClick={() => { setTab(t.id as any); setPage(1); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${tab === t.id ? "bg-white text-[#0052cc] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{total} orders</span>
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search buyer or order ID…"
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:outline-none w-52" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Order ID", "Buyer", "Amount", "Date", "Payment", "Status"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? <SkeletonRows /> :
                  displayed.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-300">
                          <HiOutlineShoppingBag className="w-14 h-14" />
                          <p className="text-sm font-semibold text-gray-400">No orders found</p>
                          <p className="text-xs text-gray-300">Try changing the filter or search term</p>
                        </div>
                      </td>
                    </tr>
                  ) : displayed.map(o => {
                    const pCfg = STATUS_CFG[o.paymentStatus]   || STATUS_CFG.pending;
                    const sCfg = ORDER_STATUS_CFG[o.status]    || ORDER_STATUS_CFG.pending;
                    return (
                      <tr key={o._id} className="hover:bg-blue-50/30 transition group">
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                            #{o._id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0052cc] to-blue-400 flex items-center justify-center text-white text-xs font-black shrink-0">
                              {o.buyer?.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{o.buyer?.name || "—"}</p>
                              <p className="text-[11px] text-gray-400 truncate max-w-[150px]">{o.buyer?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-black text-gray-900">₹{o.totalAmount?.toLocaleString("en-IN")}</p>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-5 py-4">
                          <Badge status={o.paymentStatus || "pending"} map={STATUS_CFG} />
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${sCfg.bg} ${sCfg.color}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">Page {page} of {pages}</p>
              <div className="flex items-center gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition">
                  <HiOutlineChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(pages, 5))].map((_, i) => {
                  const pg = i + 1;
                  return (
                    <button key={pg} onClick={() => setPage(pg)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition ${pg === page ? "bg-[#0052cc] text-white" : "border border-gray-200 hover:bg-gray-50 text-gray-600"}`}>
                      {pg}
                    </button>
                  );
                })}
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition">
                  <HiOutlineChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SellerPaymentsPage() {
  return (
    <ProtectedRoute allowedRoles={["seller", "admin"]}>
      <SellerPaymentsContent />
    </ProtectedRoute>
  );
}
