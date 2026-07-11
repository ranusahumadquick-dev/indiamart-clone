"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import { resolveImageUrl } from "@/lib/imageUrl";
import toast from "react-hot-toast";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineMagnifyingGlass,
  HiOutlineXCircle,
  HiOutlineInboxArrowDown,
  HiOutlineEnvelope,
  HiOutlineCheckBadge,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineArchiveBox,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

interface Inquiry {
  _id: string;
  subject?: string;
  message: string;
  quantityRequired?: number;
  unit?: string;
  status: "new" | "read" | "replied" | "closed";
  createdAt: string;
  sellerReply?: string;
  repliedAt?: string;
  product?: { _id: string; name: string; images?: { url: string }[] };
  seller?: { _id: string; name: string; companyName?: string; avatar?: string };
}

interface Stats { all: number; new: number; read: number; replied: number; closed: number; }
type FilterTab = "all" | "new" | "read" | "replied" | "closed";

const STATUS_CFG: Record<string, { color: string; dot: string; label: string }> = {
  new:     { color: "bg-blue-100 text-blue-700",   dot: "bg-blue-500",   label: "Pending"  },
  read:    { color: "bg-gray-100 text-gray-600",   dot: "bg-gray-400",   label: "Seen"     },
  replied: { color: "bg-green-100 text-green-700", dot: "bg-green-500",  label: "Replied"  },
  closed:  { color: "bg-red-100 text-red-600",     dot: "bg-red-400",    label: "Closed"   },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Avatar({ name, img, size = 10 }: { name: string; img?: string; size?: number }) {
  const s = `w-${size} h-${size}`;
  if (img) return <img src={img} className={`${s} rounded-full object-cover shrink-0`} alt="" />;
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-[#0052cc] to-indigo-500 flex items-center justify-center text-white font-black text-sm shrink-0`}>
      {name?.[0]?.toUpperCase() || "S"}
    </div>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────────────
function Timeline({ status }: { status: string }) {
  const steps = [
    { key: "new", label: "Sent" },
    { key: "read", label: "Seen by Seller" },
    { key: "replied", label: "Replied" },
  ];
  const ORDER = ["new", "read", "replied", "closed"];
  const cur = ORDER.indexOf(status);
  return (
    <div className="flex items-center gap-0 my-4">
      {steps.map((step, i) => {
        const idx  = ORDER.indexOf(step.key);
        const done = cur >= idx && status !== "closed";
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] mt-1 whitespace-nowrap font-medium ${done ? "text-green-600" : "text-gray-400"}`}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-12 mx-1 mb-4 ${cur > idx && status !== "closed" ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
      {status === "closed" && (
        <>
          <div className="h-0.5 w-12 mx-1 mb-4 bg-gray-200" />
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-red-400 text-white flex items-center justify-center text-xs">✕</div>
            <span className="text-[10px] mt-1 text-red-400 font-medium">Closed</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Left panel — inquiry row ─────────────────────────────────────────────────
function InquiryRow({ inq, selected, onClick }: { inq: Inquiry; selected: boolean; onClick: () => void }) {
  const cfg = STATUS_CFG[inq.status] || STATUS_CFG.new;
  const sellerName = inq.seller?.companyName || inq.seller?.name || "Seller";
  const productName = inq.product?.name || inq.subject || "Product Inquiry";

  return (
    <button onClick={onClick} className={`w-full text-left px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selected ? "bg-blue-50 border-l-4 border-l-[#0052cc]" : "border-l-4 border-l-transparent"}`}>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0 mt-0.5">
          <Avatar name={sellerName} img={inq.product?.images?.[0]?.url} size={10} />
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${cfg.dot}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="font-bold text-sm text-gray-800 truncate">{sellerName}</p>
            <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(inq.createdAt)}</span>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{productName}</p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{inq.sellerReply || inq.message}</p>
        </div>
        {inq.status === "new" && (
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
        )}
      </div>
    </button>
  );
}

// ─── Right panel — detail ─────────────────────────────────────────────────────
function InquiryDetail({ inq, onClose }: { inq: Inquiry | null; onClose: (id: string) => void }) {
  const [closing, setClosing] = useState(false);

  const handleClose = async () => {
    if (!inq) return;
    if (!confirm("Close this inquiry? Seller won't be able to reply after this.")) return;
    setClosing(true);
    try {
      await api.put(`/inquiries/${inq._id}/close`);
      toast.success("Inquiry closed");
      onClose(inq._id);
    } catch { toast.error("Failed to close"); }
    finally { setClosing(false); }
  };

  if (!inq) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md mb-5">
          <HiOutlineEnvelope className="w-10 h-10 text-[#0052cc]" />
        </div>
        <h3 className="text-xl font-black text-gray-800 mb-2">Select an Inquiry</h3>
        <p className="text-sm text-gray-500 max-w-xs">Click on any inquiry from the left to view details and track its status</p>
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-5 text-left max-w-xs w-full">
          <p className="text-sm font-black text-gray-700 mb-3">💡 Tips for Better Responses</p>
          <div className="space-y-2">
            {["Mention exact quantity needed", "Ask for samples if available", "Inquire about delivery timeline", "Compare multiple sellers"].map(tip => (
              <div key={tip} className="flex items-start gap-2">
                <HiOutlineCheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span className="text-xs text-gray-600">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CFG[inq.status] || STATUS_CFG.new;
  const sellerName = inq.seller?.companyName || inq.seller?.name || "Seller";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Detail header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={sellerName} img={inq.product?.images?.[0]?.url} size={10} />
            <div>
              <p className="font-black text-gray-900">{sellerName}</p>
              <p className="text-xs text-gray-400">{inq.product?.name || "Product Inquiry"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50">

        {/* Product info */}
        {inq.product && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
              {inq.product.images?.[0]?.url
                ? <img src={resolveImageUrl(inq.product.images[0].url)} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 truncate">{inq.product.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">Product Inquiry</p>
            </div>
            <Link href={`/products/${inq.product._id}`}
              className="text-xs text-[#0052cc] font-semibold flex items-center gap-1 hover:underline shrink-0">
              View <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Inquiry Status</p>
          <Timeline status={inq.status} />
          <p className="text-xs text-gray-400 mt-1">
            Sent on {new Date(inq.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Your message */}
        <div>
          <div className="flex items-center justify-end mb-1.5">
            <span className="text-xs text-gray-400">You · {timeAgo(inq.createdAt)}</span>
          </div>
          <div className="bg-[#0052cc] text-white rounded-2xl rounded-tr-sm px-4 py-3 ml-12">
            <p className="text-sm leading-relaxed">{inq.message}</p>
            {inq.quantityRequired && (
              <p className="text-xs text-blue-200 mt-2">📦 Qty: {inq.quantityRequired} {inq.unit || "pcs"}</p>
            )}
          </div>
        </div>

        {/* Seller reply */}
        {inq.sellerReply ? (
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Avatar name={sellerName} size={6} />
              <span className="text-xs text-gray-500 font-semibold">{sellerName}</span>
              {inq.repliedAt && <span className="text-xs text-gray-400">· {timeAgo(inq.repliedAt)}</span>}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 mr-12">
              <p className="text-sm text-gray-700 leading-relaxed">{inq.sellerReply}</p>
            </div>
          </div>
        ) : inq.status !== "closed" ? (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3">
            <HiOutlineClock className="w-5 h-5 text-yellow-500 shrink-0" />
            <p className="text-sm text-yellow-700 font-medium">Waiting for seller to reply…</p>
          </div>
        ) : null}

        {/* Closed notice */}
        {inq.status === "closed" && (
          <div className="flex items-center gap-3 bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3">
            <HiOutlineLockClosed className="w-5 h-5 text-gray-400 shrink-0" />
            <p className="text-sm text-gray-500">This inquiry has been closed</p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          {inq.seller?._id && (
            <Link href={`/sellers/${inq.seller._id}`}
              className="flex items-center gap-2 text-sm border-2 border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 font-semibold transition">
              <HiOutlineShieldCheck className="w-4 h-4" />
              Seller Profile
            </Link>
          )}
          {inq.seller?._id && inq.status !== "closed" && (
            <Link href={`/sellers/${inq.seller._id}`}
              className="flex items-center gap-2 text-sm bg-[#0052cc] text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-semibold transition">
              <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
              Chat with Seller
            </Link>
          )}
          {inq.status !== "closed" && (
            <button onClick={handleClose} disabled={closing}
              className="ml-auto flex items-center gap-2 text-sm border-2 border-red-200 text-red-500 px-4 py-2.5 rounded-xl hover:bg-red-50 font-semibold transition disabled:opacity-50">
              <HiOutlineXCircle className="w-4 h-4" />
              {closing ? "Closing…" : "Close Inquiry"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
function InquiriesContent() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats,     setStats]     = useState<Stats>({ all: 0, new: 0, read: 0, replied: 0, closed: 0 });
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search,    setSearch]    = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected,  setSelected]  = useState<Inquiry | null>(null);

  const fetchInquiries = useCallback(async (tab: FilterTab, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab !== "all") params.set("status", tab);
      if (q) params.set("search", q);
      const res = await api.get(`/inquiries/buyer/my-inquiries?${params}`);
      const list = res.data?.data?.inquiries || [];
      setInquiries(list);
      if (res.data?.data?.stats) setStats(res.data.data.stats);
      // auto-select first
      if (list.length > 0 && !selected) setSelected(list[0]);
    } catch { toast.error("Failed to load inquiries"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInquiries(activeTab, search); }, [activeTab, search, fetchInquiries]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); };

  const handleClosed = (id: string) => {
    setInquiries(prev => prev.map(inq => inq._id === id ? { ...inq, status: "closed" as const } : inq));
    setSelected(prev => prev?._id === id ? { ...prev, status: "closed" as const } : prev);
    setStats(prev => ({ ...prev, closed: prev.closed + 1, new: Math.max(0, prev.new - 1) }));
  };

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "all",     label: "All",      count: stats.all },
    { key: "new",     label: "Pending",  count: stats.new },
    { key: "replied", label: "Replied",  count: stats.replied },
    { key: "closed",  label: "Closed",   count: stats.closed },
  ];

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-100">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-gray-900">My Inquiries</h1>
          <p className="text-xs text-gray-400">{stats.all} total · {stats.new} pending response</p>
        </div>
        <Link href="/products"
          className="text-sm font-semibold text-[#0052cc] hover:underline flex items-center gap-1">
          Browse Products <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL ── */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <form onSubmit={handleSearch} className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Search inquiries…"
                className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(""); setSearch(""); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <HiOutlineXCircle className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-2 pt-2 gap-1">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-bold rounded-t-lg transition border-b-2 ${activeTab === tab.key ? "border-[#0052cc] text-[#0052cc] bg-blue-50" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.key ? "bg-[#0052cc] text-white" : "bg-gray-200 text-gray-600"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="px-4 py-3 border-b border-gray-100 flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : inquiries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <HiOutlineArchiveBox className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-500">No inquiries found</p>
                <p className="text-xs text-gray-400 mt-1">Send inquiries from any product page</p>
              </div>
            ) : (
              inquiries.map(inq => (
                <InquiryRow key={inq._id} inq={inq} selected={selected?._id === inq._id}
                  onClick={() => setSelected(inq)} />
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <InquiryDetail inq={selected} onClose={handleClosed} />
      </div>
    </div>
  );
}

export default function BuyerInquiriesPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "premium", "admin"]}>
      <InquiriesContent />
    </ProtectedRoute>
  );
}
