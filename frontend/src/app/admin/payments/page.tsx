"use client";
import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineCurrencyRupee, HiOutlineCheckCircle, HiOutlineClock,
  HiOutlineXCircle, HiOutlineArrowPath, HiOutlineMagnifyingGlass,
  HiOutlineArrowTrendingUp, HiOutlineArrowDownTray,
  HiOutlineUsers, HiOutlineShieldCheck, HiOutlineChartBar,
  HiOutlineChevronLeft, HiOutlineChevronRight,
} from "@/lib/icons";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  completed: { label: "Success",   color: "text-emerald-700", bg: "bg-emerald-50",  dot: "bg-emerald-500" },
  pending:   { label: "Pending",   color: "text-amber-700",   bg: "bg-amber-50",    dot: "bg-amber-400"   },
  failed:    { label: "Failed",    color: "text-red-600",     bg: "bg-red-50",      dot: "bg-red-500"     },
  refunded:  { label: "Refunded",  color: "text-violet-700",  bg: "bg-violet-50",   dot: "bg-violet-500"  },
  cancelled: { label: "Cancelled", color: "text-gray-500",    bg: "bg-gray-100",    dot: "bg-gray-400"    },
};

const STATUS_BAR: Record<string, string> = {
  completed: "bg-gradient-to-r from-emerald-400 to-green-500",
  pending:   "bg-gradient-to-r from-amber-400 to-yellow-400",
  failed:    "bg-gradient-to-r from-red-500 to-rose-500",
  refunded:  "bg-gradient-to-r from-violet-400 to-purple-500",
  cancelled: "bg-gradient-to-r from-gray-300 to-gray-400",
};

const FOR_LABELS: Record<string, string> = {
  product: "Product", subscription: "Subscription", listing: "Listing",
  advertisement: "Ads", buyer_subscription: "Buyer Plan", other: "Other",
};

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "completed", label: "Success" },
  { id: "pending",   label: "Pending" },
  { id: "failed",    label: "Failed"  },
  { id: "refunded",  label: "Refunded"},
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || { label: status, color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function RevenueChart({ data }: { data: any[] }) {
  if (!data.length) {
    return (
      <div className="h-40 flex flex-col items-center justify-center gap-2 text-gray-300">
        <HiOutlineChartBar className="w-8 h-8" />
        <p className="text-sm">No revenue data yet</p>
      </div>
    );
  }
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-2 h-40 pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="relative">
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
              ₹{(d.revenue/1000).toFixed(1)}k
            </div>
          </div>
          <div className="w-full bg-gradient-to-t from-[#0052cc] to-blue-400 rounded-t-lg hover:from-[#003d99] hover:to-blue-500 transition-all cursor-pointer"
            style={{ height: `${Math.max((d.revenue / max) * 100, 4)}px` }} />
          <span className="text-[9px] text-gray-400 font-semibold">{MONTHS[(d._id?.month||1)-1]}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, icon, gradient }: { label: string; value: string | number; icon: React.ReactNode; gradient: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-white/70 uppercase tracking-widest">{label}</p>
          <p className="text-xl font-black text-white mt-1">{value}</p>
        </div>
        <div className="p-2.5 bg-white/20 rounded-xl text-white">{icon}</div>
      </div>
      <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
    </div>
  );
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <tr key={i}>
          {[...Array(cols)].map((_, j) => (
            <td key={j} className="px-5 py-4">
              <div className="h-3.5 bg-gray-100 rounded-full animate-pulse" style={{ width: j === 1 ? 140 : 80 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function AdminPaymentsContent() {
  const [payments,    setPayments]    = useState<any[]>([]);
  const [stats,       setStats]       = useState<any[]>([]);
  const [chartData,   setChartData]   = useState<any[]>([]);
  const [totalRev,    setTotalRev]    = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("all");
  const [search,      setSearch]      = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page,        setPage]        = useState(1);
  const [pages,       setPages]       = useState(1);
  const [total,       setTotal]       = useState(0);
  const [refunding,   setRefunding]   = useState<string|null>(null);
  const [activeTab,   setActiveTab]   = useState<"transactions"|"analytics">("transactions");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);
      const res = await api.get(`/payments/admin/all?${params}`);
      const d = res.data.data;
      setPayments(d.payments    || []);
      setStats(d.stats          || []);
      setChartData(d.revenueChart || []);
      setTotalRev(d.totalRevenue || 0);
      setTotal(d.total           || 0);
      setPages(d.pages           || 1);
    } catch { toast.error("Failed to load payments"); }
    finally { setLoading(false); }
  }, [page, filter, search]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleRefund = async (paymentId: string) => {
    if (!confirm("Process refund for this payment?")) return;
    setRefunding(paymentId);
    try {
      await api.post(`/payments/admin/refund/${paymentId}`);
      toast.success("Refund processed");
      fetchPayments();
    } catch (e: any) { toast.error(e.response?.data?.message || "Refund failed"); }
    finally { setRefunding(null); }
  };

  const exportCSV = () => {
    const rows = [["Date","User","Email","Amount","Type","Method","Status","Invoice"]];
    payments.forEach(p => rows.push([
      new Date(p.createdAt).toLocaleDateString("en-IN"),
      p.userId?.name || "", p.userId?.email || "",
      p.amount, FOR_LABELS[p.paymentFor] || p.paymentFor,
      p.paymentMethod || "razorpay", p.status, p.invoiceNumber || "",
    ]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `payments_${Date.now()}.csv`;
    a.click();
    toast.success("CSV exported");
  };

  const getStat = (s: string) => stats.find(x => x._id === s);
  const fmt = (n: number) => n.toLocaleString("en-IN");

  const STAT_CARDS = [
    { label: "Total Revenue",      value: `₹${fmt(totalRev)}`,                  icon: <HiOutlineCurrencyRupee className="w-5 h-5" />, gradient: "bg-gradient-to-br from-[#0052cc] to-blue-400"    },
    { label: "Successful",         value: getStat("completed")?.count ?? 0,      icon: <HiOutlineCheckCircle   className="w-5 h-5" />, gradient: "bg-gradient-to-br from-emerald-500 to-green-400"  },
    { label: "Pending",            value: getStat("pending")?.count   ?? 0,      icon: <HiOutlineClock          className="w-5 h-5" />, gradient: "bg-gradient-to-br from-amber-500 to-yellow-400"  },
    { label: "Failed",             value: getStat("failed")?.count    ?? 0,      icon: <HiOutlineXCircle        className="w-5 h-5" />, gradient: "bg-gradient-to-br from-red-500 to-rose-400"       },
    { label: "Refunded",           value: getStat("refunded")?.count  ?? 0,      icon: <HiOutlineArrowPath      className="w-5 h-5" />, gradient: "bg-gradient-to-br from-violet-500 to-purple-400"  },
    { label: "Total Transactions", value: total,                                  icon: <HiOutlineUsers          className="w-5 h-5" />, gradient: "bg-gradient-to-br from-gray-500 to-gray-400"      },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] py-7 px-4">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2.5">
              <div className="w-10 h-10 bg-[#0052cc] rounded-xl flex items-center justify-center">
                <HiOutlineCurrencyRupee className="w-5 h-5 text-white" />
              </div>
              Payment Management
            </h1>
            <p className="text-sm text-gray-400 mt-1 ml-[52px]">Monitor all transactions, revenue analytics and refunds</p>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 shadow-sm transition">
            <HiOutlineArrowDownTray className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAT_CARDS.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-white border border-gray-100 p-1 rounded-2xl w-fit shadow-sm">
          {[
            { id: "transactions", label: "Transactions", icon: <HiOutlineCurrencyRupee className="w-4 h-4" /> },
            { id: "analytics",    label: "Analytics",    icon: <HiOutlineArrowTrendingUp className="w-4 h-4" /> },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${activeTab === t.id ? "bg-[#0052cc] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {activeTab === "analytics" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Revenue Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-gray-900 flex items-center gap-2">
                  <HiOutlineArrowTrendingUp className="w-5 h-5 text-[#0052cc]" />
                  Revenue Trend
                </h2>
                <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full font-semibold">Last 6 Months</span>
              </div>
              <RevenueChart data={chartData} />
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-black text-gray-900 mb-5">Payment Status Breakdown</h2>
              <div className="space-y-4">
                {stats.length === 0 ? (
                  <p className="text-sm text-gray-300 text-center py-8">No data available</p>
                ) : stats.map(s => {
                  const cfg = STATUS_CFG[s._id] || { label: s._id, color: "text-gray-600", bg: "bg-gray-100", dot: "bg-gray-400" };
                  const bar = STATUS_BAR[s._id] || "bg-gray-300";
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  return (
                    <div key={s._id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`flex items-center gap-1.5 text-sm font-bold ${cfg.color}`}>
                          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />{cfg.label}
                        </span>
                        <div className="text-right">
                          <span className="text-xs font-black text-gray-900">{s.count}</span>
                          <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 font-semibold">₹{fmt(s.total || 0)} collected</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GST Report */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2">
                <HiOutlineShieldCheck className="w-5 h-5 text-[#0052cc]" /> GST & Tax Report
              </h2>
              <div className="space-y-0">
                {[
                  { label: "Total Taxable Amount", value: `₹${fmt(Math.round(totalRev / 1.18))}`,          highlight: false },
                  { label: "CGST (9%)",             value: `₹${fmt(Math.round(totalRev * 0.09 / 1.18))}`,  highlight: false },
                  { label: "SGST (9%)",             value: `₹${fmt(Math.round(totalRev * 0.09 / 1.18))}`,  highlight: false },
                  { label: "Total GST Collected",   value: `₹${fmt(Math.round(totalRev * 0.18 / 1.18))}`,  highlight: true  },
                  { label: "Net Revenue (ex-GST)",  value: `₹${fmt(Math.round(totalRev / 1.18))}`,          highlight: false },
                ].map((r, i) => (
                  <div key={i} className={`flex justify-between py-3 border-b border-gray-50 ${r.highlight ? "mt-1" : ""}`}>
                    <span className="text-sm text-gray-500">{r.label}</span>
                    <span className={`text-sm font-black ${r.highlight ? "text-[#0052cc]" : "text-gray-900"}`}>{r.value}</span>
                  </div>
                ))}
              </div>
              <button onClick={exportCSV}
                className="mt-5 w-full border-2 border-[#0052cc] text-[#0052cc] py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2">
                <HiOutlineArrowDownTray className="w-4 h-4" /> Export GST Report
              </button>
            </div>

            {/* Commission Management */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-black text-gray-900 mb-5">Commission Management</h2>
              <div className="space-y-0">
                {[
                  { label: "Total Revenue",            value: `₹${fmt(totalRev)}`,                         pct: null  },
                  { label: "Platform Commission (5%)", value: `₹${fmt(Math.round(totalRev * 0.05))}`,      pct: "5%"  },
                  { label: "Payment Gateway Fee (2%)", value: `₹${fmt(Math.round(totalRev * 0.02))}`,      pct: "2%"  },
                  { label: "Net Payout to Sellers",    value: `₹${fmt(Math.round(totalRev * 0.93))}`,      pct: "93%" },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50">
                    <div>
                      <span className="text-sm text-gray-600 font-medium">{r.label}</span>
                      {r.pct && <span className="ml-2 text-[10px] bg-blue-50 text-[#0052cc] px-1.5 py-0.5 rounded font-bold">{r.pct}</span>}
                    </div>
                    <span className="text-sm font-black text-gray-900">{r.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 p-3.5 bg-blue-50 rounded-xl text-xs text-blue-700 font-medium leading-relaxed">
                💡 Commission rates can be configured in Admin → Settings → Plans & Billing
              </div>
            </div>
          </div>
        ) : (
          /* Transactions Table */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Toolbar */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="relative flex-1 min-w-52">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search by name, email, payment ID…"
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:outline-none" />
              </form>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                {FILTER_TABS.map(t => (
                  <button key={t.id} onClick={() => { setFilter(t.id); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filter === t.id ? "bg-white text-[#0052cc] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Date","User","Amount","Type","Method","Status","Actions"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? <SkeletonRows cols={7} /> : payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                            <HiOutlineCurrencyRupee className="w-8 h-8 text-gray-200" />
                          </div>
                          <p className="text-sm font-semibold text-gray-400">No transactions found</p>
                          <p className="text-xs text-gray-300">Try adjusting your search or filter</p>
                        </div>
                      </td>
                    </tr>
                  ) : payments.map(p => (
                    <tr key={p._id} className="hover:bg-blue-50/20 transition group">
                      <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0052cc] to-blue-400 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                            {p.userId?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{p.userId?.name || "—"}</p>
                            <p className="text-[11px] text-gray-400">{p.userId?.email}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${p.userId?.role === "seller" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"}`}>
                              {p.userId?.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-black text-gray-900">₹{fmt(p.amount)}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-semibold">
                          {FOR_LABELS[p.paymentFor] || p.paymentFor}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-500 capitalize">{p.paymentMethod || "razorpay"}</span>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {p.status === "completed" && (
                            <button onClick={() => handleRefund(p._id)} disabled={refunding === p._id}
                              className="inline-flex items-center gap-1.5 text-xs text-violet-600 border border-violet-200 px-2.5 py-1.5 rounded-lg hover:bg-violet-50 font-bold disabled:opacity-50 transition">
                              {refunding === p._id
                                ? <span className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
                                : <HiOutlineArrowPath className="w-3 h-3" />}
                              Refund
                            </button>
                          )}
                          {p.invoiceNumber && (
                            <a href={`/api/payments/invoice/${p._id}`} target="_blank"
                              className="inline-flex items-center gap-1.5 text-xs text-[#0052cc] border border-blue-200 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 font-bold transition">
                              <HiOutlineArrowDownTray className="w-3 h-3" /> PDF
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">{total} total payments</p>
              {pages > 1 && (
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPaymentsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminPaymentsContent />
    </ProtectedRoute>
  );
}
