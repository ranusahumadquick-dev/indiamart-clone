"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineReceiptPercent, HiOutlineCheckCircle, HiOutlineClock,
  HiOutlineXCircle, HiOutlineArrowPath, HiOutlineMagnifyingGlass,
  HiOutlineArrowDownTray, HiOutlineCurrencyRupee, HiOutlineShoppingBag,
  HiOutlineChevronLeft, HiOutlineChevronRight,
} from "@/lib/icons";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string; icon: React.ReactNode }> = {
  completed: { label: "Success",   color: "text-emerald-700", bg: "bg-emerald-50",  dot: "bg-emerald-500", icon: <HiOutlineCheckCircle className="w-3.5 h-3.5" /> },
  pending:   { label: "Pending",   color: "text-amber-700",   bg: "bg-amber-50",    dot: "bg-amber-400",   icon: <HiOutlineClock className="w-3.5 h-3.5" />       },
  failed:    { label: "Failed",    color: "text-red-600",     bg: "bg-red-50",      dot: "bg-red-500",     icon: <HiOutlineXCircle className="w-3.5 h-3.5" />     },
  refunded:  { label: "Refunded",  color: "text-violet-700",  bg: "bg-violet-50",   dot: "bg-violet-500",  icon: <HiOutlineArrowPath className="w-3.5 h-3.5" />   },
  cancelled: { label: "Cancelled", color: "text-gray-500",    bg: "bg-gray-100",    dot: "bg-gray-400",    icon: <HiOutlineXCircle className="w-3.5 h-3.5" />     },
};

const FOR_LABELS: Record<string, string> = {
  product: "Product Purchase", subscription: "Subscription", listing: "Listing",
  advertisement: "Advertisement", buyer_subscription: "Buyer Plan", other: "Other",
};

const FILTER_TABS = [
  { id: "all",       label: "All"      },
  { id: "completed", label: "Success"  },
  { id: "pending",   label: "Pending"  },
  { id: "failed",    label: "Failed"   },
  { id: "refunded",  label: "Refunded" },
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, icon, gradient }: { label: string; value: string | number; icon: React.ReactNode; gradient: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-white mt-1">{value}</p>
        </div>
        <div className="p-2.5 bg-white/20 rounded-xl text-white">{icon}</div>
      </div>
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i}>
          {[80, 140, 80, 80, 90, 60].map((w, j) => (
            <td key={j} className="px-5 py-4">
              <div className={`h-3.5 bg-gray-100 rounded-full animate-pulse`} style={{ width: w }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function TransactionsContent() {
  const [payments, setPayments] = useState<any[]>([]);
  const [stats,    setStats]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [total,    setTotal]    = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (filter !== "all") params.set("status", filter);
      const res = await api.get(`/payments/my-transactions?${params}`);
      const d = res.data.data;
      setPayments(d.payments || []);
      setStats(d.stats    || []);
      setTotal(d.total    || 0);
      setPages(d.pages    || 1);
    } catch { toast.error("Failed to load transactions"); }
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getStat = (s: string) => stats.find(x => x._id === s);
  const totalSpent = stats.filter(s => s._id === "completed").reduce((a, s) => a + s.total, 0);

  const displayed = search
    ? payments.filter(p =>
        p.razorpayPaymentId?.includes(search) ||
        p.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
        FOR_LABELS[p.paymentFor]?.toLowerCase().includes(search.toLowerCase()))
    : payments;

  const STAT_CARDS = [
    { label: "Total Spent",  value: `₹${totalSpent.toLocaleString("en-IN")}`, icon: <HiOutlineCurrencyRupee className="w-5 h-5" />, gradient: "bg-gradient-to-br from-[#0052cc] to-blue-400"    },
    { label: "Successful",   value: getStat("completed")?.count ?? 0,          icon: <HiOutlineCheckCircle   className="w-5 h-5" />, gradient: "bg-gradient-to-br from-emerald-500 to-green-400"  },
    { label: "Pending",      value: getStat("pending")?.count   ?? 0,          icon: <HiOutlineClock          className="w-5 h-5" />, gradient: "bg-gradient-to-br from-amber-500 to-yellow-400"  },
    { label: "Failed",       value: getStat("failed")?.count    ?? 0,          icon: <HiOutlineXCircle        className="w-5 h-5" />, gradient: "bg-gradient-to-br from-red-500 to-rose-400"       },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] py-7 px-4">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2.5">
            <div className="w-10 h-10 bg-[#0052cc] rounded-xl flex items-center justify-center">
              <HiOutlineReceiptPercent className="w-5 h-5 text-white" />
            </div>
            Transaction History
          </h1>
          <p className="text-sm text-gray-400 mt-1 ml-[52px]">All your payment records in one place</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by invoice, type, payment ID…"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:outline-none" />
            </div>
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
                  {["Date", "Type", "Amount", "Method", "Status", "Invoice"].map(h => (
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
                          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                            <HiOutlineCurrencyRupee className="w-8 h-8 text-gray-200" />
                          </div>
                          <p className="text-sm font-semibold text-gray-400">No transactions found</p>
                          <p className="text-xs text-gray-300">Your payment history will appear here</p>
                          <Link href="/products"
                            className="mt-2 text-xs text-[#0052cc] font-bold hover:underline flex items-center gap-1">
                            <HiOutlineShoppingBag className="w-3.5 h-3.5" /> Browse Products
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : displayed.map(p => (
                    <tr key={p._id} className="hover:bg-blue-50/30 transition group">
                      <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-800 text-sm">{FOR_LABELS[p.paymentFor] || p.paymentFor}</p>
                        {p.invoiceNumber && (
                          <p className="text-[10px] text-gray-400 mt-0.5">{p.invoiceNumber}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 font-black text-gray-900">
                        ₹{p.amount?.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 font-semibold capitalize">
                          {p.paymentMethod || "Razorpay"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-5 py-4">
                        {p.status === "completed" && (
                          <a href={`/api/payments/invoice/${p._id}`} target="_blank"
                            className="inline-flex items-center gap-1.5 text-xs text-[#0052cc] border border-blue-200 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 font-semibold transition">
                            <HiOutlineArrowDownTray className="w-3.5 h-3.5" /> PDF
                          </a>
                        )}
                        {p.status === "failed" && (
                          <Link href={`/buyer/payment/failed?paymentId=${p._id}`}
                            className="inline-flex items-center gap-1.5 text-xs text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 font-semibold transition">
                            <HiOutlineArrowPath className="w-3.5 h-3.5" /> Retry
                          </Link>
                        )}
                        {(p.status === "pending" || p.status === "refunded") && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">{total} total transactions</p>
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
      </div>
    </div>
  );
}

export default function BuyerTransactionsPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "seller", "premium", "admin"]}>
      <TransactionsContent />
    </ProtectedRoute>
  );
}
