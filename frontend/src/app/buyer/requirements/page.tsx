"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { StateDropdown, CityDropdown } from "@/components/common/LocationDropdown";
import {
  HiOutlineClipboardDocumentList,
  HiOutlinePlusCircle,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineTrash,
  HiOutlineCurrencyRupee,
  HiOutlineMapPin,
  HiOutlineArrowsUpDown,
  HiOutlineTrophy,
  HiOutlineBoltSlash,
  HiMiniCheckBadge,
  HiOutlineBolt,
  HiOutlineRocketLaunch,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineStar,
  HiOutlineSparkles,
  HiOutlineScale,
  HiOutlineCheckBadge,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineTruck,
  HiOutlineReceiptPercent,
  HiOutlineLockClosed,
  HiOutlineMagnifyingGlass,
  HiOutlineEyeSlash,
  HiMiniShieldCheck,
} from "react-icons/hi2";

interface SellerResponse {
  _id: string;
  supplier: {
    _id: string;
    name: string;
    companyName?: string;
    phone?: string;
    city?: string;
    state?: string;
    isVerified?: boolean;
    businessType?: string;
    yearEstablished?: number;
    averageRating?: number;
    numReviews?: number;
  };
  message: string;
  quotedPrice?: number;
  moq?: number;
  deliveryDays?: number;
  validityDays?: number;
  respondedAt: string;
}

interface Requirement {
  _id: string;
  productName: string;
  description?: string;
  quantityRequired: number;
  unit: string;
  budgetMin?: number;
  budgetMax?: number;
  deliveryLocation?: { city?: string; state?: string };
  deliveryTimeline?: string;
  status: "active" | "closed" | "fulfilled";
  category?: { name: string };
  responses?: SellerResponse[];
  selectedSupplier?: { _id: string; name: string; companyName?: string; email?: string } | null;
  createdAt: string;
  isPriority?: boolean;
  priorityExpiresAt?: string;
  priorityBoostedAt?: string;
  isPrivate?: boolean;
  invitedSellers?: { _id: string; name: string; companyName?: string; isVerified?: boolean }[];
  privateNote?: string;
}

interface SellerSearchResult {
  _id: string;
  name: string;
  companyName?: string;
  city?: string;
  state?: string;
  isVerified?: boolean;
}

interface Category {
  _id: string;
  name: string;
}

const UNITS = ["Piece", "Kg", "Ton", "Meter", "Liter", "Box", "Set", "Packet"];
const TIMELINES = ["Urgent", "1-2 weeks", "1 month", "Flexible"];

const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
  fulfilled: "bg-blue-100 text-blue-700",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  closed: "Closed",
  fulfilled: "Fulfilled",
};

type SortBy = "price_asc" | "price_desc" | "date_desc";

function QuoteCompare({
  req,
  onSelect,
}: {
  req: Requirement;
  onSelect: (reqId: string, supplierId: string, supplierName: string) => void;
}) {
  const [sort, setSort] = useState<SortBy>("price_asc");
  const [selecting, setSelecting] = useState<string | null>(null);
  const responses = req.responses ?? [];

  const sorted = [...responses].sort((a, b) => {
    if (sort === "price_asc") {
      if (!a.quotedPrice && !b.quotedPrice) return 0;
      if (!a.quotedPrice) return 1;
      if (!b.quotedPrice) return -1;
      return a.quotedPrice - b.quotedPrice;
    }
    if (sort === "price_desc") {
      if (!a.quotedPrice && !b.quotedPrice) return 0;
      if (!a.quotedPrice) return 1;
      if (!b.quotedPrice) return -1;
      return b.quotedPrice - a.quotedPrice;
    }
    return new Date(b.respondedAt).getTime() - new Date(a.respondedAt).getTime();
  });

  const withPrice = sorted.filter((r) => r.quotedPrice);
  const cheapest = withPrice.length > 0 ? withPrice[0]._id : null;
  const mostExpensive = withPrice.length > 0 ? withPrice[withPrice.length - 1]._id : null;

  const handleSelect = async (resp: SellerResponse) => {
    const name = resp.supplier?.companyName || resp.supplier?.name || "Supplier";
    if (!confirm(`Select "${name}" as your supplier? This will close the requirement.`)) return;
    setSelecting(resp._id);
    try {
      await onSelect(req._id, resp.supplier._id, name);
    } finally {
      setSelecting(null);
    }
  };

  if (responses.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <HiMiniCheckBadge className="w-4 h-4 text-blue-500" />
          {responses.length} Quote{responses.length > 1 ? "s" : ""} Received
        </p>
        {responses.length > 1 && (
          <div className="flex items-center gap-1">
            <HiOutlineArrowsUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortBy)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[var(--primary)] text-gray-600"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="date_desc">Latest First</option>
            </select>
          </div>
        )}
      </div>

      {/* Quote cards — horizontal scroll on mobile, wrap on desktop */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {sorted.map((resp, idx) => {
          const isBest = sort === "price_asc" && resp._id === cheapest && withPrice.length > 1;
          const isMostExp = sort === "price_desc" && resp._id === mostExpensive && withPrice.length > 1;
          const sellerName = resp.supplier?.companyName || resp.supplier?.name || "Supplier";
          const initial = sellerName.charAt(0).toUpperCase();
          const isSelected = req.selectedSupplier?._id === resp.supplier._id;

          return (
            <div
              key={resp._id}
              className={`flex-shrink-0 w-64 rounded-xl border-2 p-4 flex flex-col transition-all ${
                isSelected
                  ? "border-blue-400 bg-blue-50"
                  : isBest
                  ? "border-green-300 bg-green-50"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              {/* Badge row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isSelected ? "bg-blue-200 text-blue-700" :
                    isBest ? "bg-green-200 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">{sellerName}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(resp.respondedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <HiOutlineCheckCircle className="w-3 h-3" /> Selected
                  </span>
                )}
                {!isSelected && isBest && (
                  <span className="text-[10px] font-bold bg-green-600 text-white px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <HiOutlineTrophy className="w-3 h-3" /> Best Price
                  </span>
                )}
              </div>

              {/* Price */}
              {resp.quotedPrice ? (
                <div className="mb-2">
                  <p className={`text-xl font-bold ${isBest ? "text-green-700" : isSelected ? "text-blue-700" : "text-gray-800"}`}>
                    ₹{resp.quotedPrice.toLocaleString("en-IN")}
                  </p>
                  {req.quantityRequired && (
                    <p className="text-[10px] text-gray-400">
                      per {req.unit} · Total ~₹{(resp.quotedPrice * req.quantityRequired).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic mb-2">No price quoted</p>
              )}

              {/* Message */}
              <p className="text-xs text-gray-600 flex-1 line-clamp-3 mb-3">{resp.message}</p>

              {/* Action */}
              {req.status === "active" && !isSelected && (
                <button
                  onClick={() => handleSelect(resp)}
                  disabled={selecting === resp._id}
                  className={`w-full py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-60 ${
                    isBest
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
                  }`}
                >
                  {selecting === resp._id ? "Selecting..." : "Select This Supplier"}
                </button>
              )}
              {isSelected && (
                <div className="w-full py-1.5 rounded-lg text-xs font-semibold text-center bg-blue-600 text-white">
                  ✓ Supplier Selected
                </div>
              )}
              {req.status !== "active" && !isSelected && (
                <div className="w-full py-1.5 rounded-lg text-xs text-center text-gray-400 bg-gray-50 border border-gray-100">
                  Requirement Closed
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Budget comparison hint */}
      {withPrice.length >= 2 && req.budgetMax && (
        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
          <HiOutlineBoltSlash className="w-3.5 h-3.5" />
          Your budget: ₹{req.budgetMax.toLocaleString("en-IN")} max ·{" "}
          {withPrice.filter((r) => (r.quotedPrice ?? 0) <= (req.budgetMax ?? Infinity)).length} quote
          {withPrice.filter((r) => (r.quotedPrice ?? 0) <= (req.budgetMax ?? Infinity)).length !== 1 ? "s" : ""} within budget
        </div>
      )}
    </div>
  );
}

// ─── Supplier Comparison Modal ────────────────────────────────────────────────

function SupplierComparisonModal({
  req,
  onClose,
  onSelectSupplier,
}: {
  req: Requirement;
  onClose: () => void;
  onSelectSupplier: (reqId: string, supplierId: string, name: string) => void;
}) {
  const responses = (req.responses ?? []).slice(0, 4); // max 4
  const [selecting, setSelecting] = useState<string | null>(null);

  const prices = responses.map(r => r.quotedPrice).filter(Boolean) as number[];
  const deliveries = responses.map(r => r.deliveryDays).filter(Boolean) as number[];
  const bestPrice = prices.length ? Math.min(...prices) : null;
  const fastestDelivery = deliveries.length ? Math.min(...deliveries) : null;

  const colWidth = responses.length <= 2 ? "w-52" : "w-44";

  const handleSelect = async (resp: SellerResponse) => {
    const name = resp.supplier?.companyName || resp.supplier?.name || "Supplier";
    if (!confirm(`Select "${name}" as your supplier? This will close the requirement.`)) return;
    setSelecting(resp._id);
    try {
      await onSelectSupplier(req._id, resp.supplier._id, name);
      onClose();
    } finally {
      setSelecting(null);
    }
  };

  const rows: { label: string; icon: React.ReactNode; render: (r: SellerResponse) => React.ReactNode; highlight?: (r: SellerResponse) => boolean }[] = [
    {
      label: "Quoted Price",
      icon: <HiOutlineCurrencyRupee className="w-4 h-4" />,
      render: (r) => r.quotedPrice
        ? <span className={`text-lg font-bold ${r.quotedPrice === bestPrice ? "text-green-600" : "text-gray-800"}`}>₹{r.quotedPrice.toLocaleString("en-IN")}</span>
        : <span className="text-gray-400 text-sm italic">Not quoted</span>,
      highlight: (r) => r.quotedPrice === bestPrice && !!bestPrice,
    },
    {
      label: "Total Cost",
      icon: <HiOutlineReceiptPercent className="w-4 h-4" />,
      render: (r) => r.quotedPrice
        ? <span className="text-sm font-semibold text-gray-700">₹{(r.quotedPrice * req.quantityRequired).toLocaleString("en-IN")}</span>
        : <span className="text-gray-400 text-sm italic">—</span>,
    },
    {
      label: `MOQ (${req.unit})`,
      icon: <HiOutlineClipboardDocumentList className="w-4 h-4" />,
      render: (r) => r.moq
        ? <span className="text-sm font-semibold text-gray-700">{r.moq.toLocaleString("en-IN")} {req.unit}</span>
        : <span className="text-gray-400 text-sm italic">Not specified</span>,
    },
    {
      label: "Delivery",
      icon: <HiOutlineTruck className="w-4 h-4" />,
      render: (r) => r.deliveryDays
        ? <span className={`text-sm font-semibold ${r.deliveryDays === fastestDelivery ? "text-blue-600" : "text-gray-700"}`}>{r.deliveryDays} days</span>
        : <span className="text-gray-400 text-sm italic">Not specified</span>,
      highlight: (r) => r.deliveryDays === fastestDelivery && !!fastestDelivery,
    },
    {
      label: "Quote Validity",
      icon: <HiOutlineCalendarDays className="w-4 h-4" />,
      render: (r) => r.validityDays
        ? <span className="text-sm text-gray-700">{r.validityDays} days</span>
        : <span className="text-gray-400 text-sm italic">—</span>,
    },
    {
      label: "Location",
      icon: <HiOutlineMapPin className="w-4 h-4" />,
      render: (r) => r.supplier?.city
        ? <span className="text-sm text-gray-700">{r.supplier.city}{r.supplier.state ? `, ${r.supplier.state}` : ""}</span>
        : <span className="text-gray-400 text-sm italic">—</span>,
    },
    {
      label: "Business Type",
      icon: <HiOutlineBuildingOffice2 className="w-4 h-4" />,
      render: (r) => r.supplier?.businessType
        ? <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{r.supplier.businessType.replace("_", " ")}</span>
        : <span className="text-gray-400 text-sm italic">—</span>,
    },
    {
      label: "Est. Since",
      icon: <HiOutlineClock className="w-4 h-4" />,
      render: (r) => r.supplier?.yearEstablished
        ? <span className="text-sm text-gray-700">{r.supplier.yearEstablished}</span>
        : <span className="text-gray-400 text-sm italic">—</span>,
    },
    {
      label: "Message",
      icon: <HiMiniCheckBadge className="w-4 h-4" />,
      render: (r) => <p className="text-xs text-gray-600 line-clamp-3">{r.message}</p>,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <HiOutlineScale className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-gray-900">Supplier Comparison</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">{req.productName} · {req.quantityRequired} {req.unit}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-6 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 shrink-0">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-100 border border-green-300 inline-block" /> Best Price</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-300 inline-block" /> Fastest Delivery</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-100 border border-indigo-300 inline-block" /> Selected</span>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                {/* Row label col */}
                <th className="bg-gray-50 border-b border-r border-gray-100 px-5 py-3 text-left w-36 shrink-0">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Attribute</span>
                </th>
                {responses.map((resp) => {
                  const isSelected = req.selectedSupplier?._id === resp.supplier?._id;
                  const isBestPrice = resp.quotedPrice === bestPrice && !!bestPrice;
                  const isFastest = resp.deliveryDays === fastestDelivery && !!fastestDelivery;
                  const supplierName = resp.supplier?.companyName || resp.supplier?.name || "Supplier";
                  return (
                    <th
                      key={resp._id}
                      className={`border-b border-r border-gray-100 px-4 py-3 text-center ${colWidth} ${
                        isSelected ? "bg-indigo-50" : "bg-white"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          isSelected ? "bg-indigo-200 text-indigo-700" :
                          isBestPrice ? "bg-green-200 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {supplierName.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-800 leading-tight">{supplierName}</p>
                          {resp.supplier?.isVerified && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-medium">
                              <HiOutlineCheckBadge className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 flex-wrap justify-center">
                          {isBestPrice && (
                            <span className="text-[9px] font-bold bg-green-600 text-white px-1.5 py-0.5 rounded-full">Best Price</span>
                          )}
                          {isFastest && (
                            <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">Fastest</span>
                          )}
                          {isSelected && (
                            <span className="text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">Selected</span>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="hover:bg-gray-50/50">
                  {/* Label */}
                  <td className="border-b border-r border-gray-100 px-5 py-3 bg-gray-50/60">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <span className="text-gray-400">{row.icon}</span>
                      {row.label}
                    </div>
                  </td>
                  {responses.map((resp) => {
                    const isSelected = req.selectedSupplier?._id === resp.supplier?._id;
                    const highlighted = row.highlight?.(resp) ?? false;
                    return (
                      <td
                        key={resp._id}
                        className={`border-b border-r border-gray-100 px-4 py-3 text-center align-top ${
                          isSelected ? "bg-indigo-50/40" :
                          highlighted ? (row.label === "Quoted Price" || row.label === "Total Cost" ? "bg-green-50/40" : "bg-blue-50/40") : ""
                        }`}
                      >
                        {row.render(resp)}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Action row */}
              {req.status === "active" && (
                <tr>
                  <td className="px-5 py-4 bg-gray-50/60 border-r border-gray-100">
                    <span className="text-xs font-semibold text-gray-500">Action</span>
                  </td>
                  {responses.map((resp) => {
                    const isSelected = req.selectedSupplier?._id === resp.supplier?._id;
                    return (
                      <td key={resp._id} className={`px-4 py-4 text-center ${isSelected ? "bg-indigo-50/40" : ""}`}>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-lg">
                            <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Selected
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelect(resp)}
                            disabled={selecting === resp._id}
                            className="text-xs font-semibold bg-[var(--primary)] text-white px-4 py-1.5 rounded-lg hover:bg-[var(--primary-dark)] transition disabled:opacity-60"
                          >
                            {selecting === resp._id ? "Selecting..." : "Select Supplier"}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Requirements Content ─────────────────────────────────────────────────────

function RequirementsContent() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [boostTarget, setBoostTarget] = useState<Requirement | null>(null);
  const [boosting, setBoosting] = useState(false);
  const [compareTarget, setCompareTarget] = useState<Requirement | null>(null);

  const [form, setForm] = useState({
    productName: "",
    categoryId: "",
    description: "",
    quantityRequired: "",
    unit: "Piece",
    budgetMin: "",
    budgetMax: "",
    city: "",
    state: "",
    deliveryTimeline: "Flexible",
    isPrivate: false,
    privateNote: "",
  });
  const [invitedSellers, setInvitedSellers] = useState<SellerSearchResult[]>([]);
  const [sellerSearch, setSellerSearch] = useState("");
  const [sellerResults, setSellerResults] = useState<SellerSearchResult[]>([]);
  const [searchingSellerss, setSearchingSellers] = useState(false);

  // Reset form helper
  const emptyForm = { productName: "", categoryId: "", description: "", quantityRequired: "", unit: "Piece", budgetMin: "", budgetMax: "", city: "", state: "", deliveryTimeline: "Flexible", isPrivate: false, privateNote: "" };

  const searchSellers = async (q: string) => {
    if (!q.trim() || q.length < 2) { setSellerResults([]); return; }
    setSearchingSellers(true);
    try {
      const res = await api.get(`/sellers?search=${encodeURIComponent(q)}&limit=6`);
      const sellers = (res.data?.data?.sellers || res.data?.data || []) as SellerSearchResult[];
      setSellerResults(sellers.filter((s) => !invitedSellers.find((inv) => inv._id === s._id)));
    } catch { setSellerResults([]); }
    finally { setSearchingSellers(false); }
  };

  const addInvitedSeller = (seller: SellerSearchResult) => {
    if (invitedSellers.find((s) => s._id === seller._id)) return;
    setInvitedSellers((prev) => [...prev, seller]);
    setSellerSearch("");
    setSellerResults([]);
  };

  const removeInvitedSeller = (id: string) => setInvitedSellers((prev) => prev.filter((s) => s._id !== id));

  useEffect(() => {
    Promise.all([
      api.get("/buy-requirements/user/my-requirements"),
      api.get("/categories/tree"),
    ])
      .then(([reqRes, catRes]) => {
        setRequirements(reqRes.data?.data?.buyRequirements || []);
        setCategories(catRes.data?.data || []);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName || !form.categoryId || !form.quantityRequired) {
      toast.error("Product name, category and quantity are required");
      return;
    }
    if (form.isPrivate && invitedSellers.length === 0) {
      toast.error("Add at least one supplier to invite for a private requirement");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/buy-requirements", {
        productName: form.productName,
        categoryId: form.categoryId,
        description: form.description,
        quantityRequired: Number(form.quantityRequired),
        unit: form.unit,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        deliveryLocation: form.city ? { city: form.city, state: form.state } : undefined,
        deliveryTimeline: form.deliveryTimeline,
        isPrivate: form.isPrivate,
        invitedSellers: form.isPrivate ? invitedSellers.map((s) => s._id) : [],
        privateNote: form.isPrivate && form.privateNote ? form.privateNote : undefined,
      });
      setRequirements((prev) => [res.data.data, ...prev]);
      toast.success(form.isPrivate
        ? `Private requirement sent to ${invitedSellers.length} supplier(s)!`
        : "Requirement posted! Suppliers will reach out.");
      setShowForm(false);
      setForm(emptyForm);
      setInvitedSellers([]);
      setSellerSearch("");
      setSellerResults([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to post requirement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this requirement?")) return;
    try {
      await api.delete(`/buy-requirements/${id}`);
      setRequirements((prev) => prev.filter((r) => r._id !== id));
      toast.success("Requirement deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleSelectSupplier = async (reqId: string, supplierId: string, supplierName: string) => {
    try {
      const res = await api.put(`/buy-requirements/${reqId}/close`, { selectedSupplierId: supplierId });
      setRequirements((prev) =>
        prev.map((r) =>
          r._id === reqId
            ? { ...r, status: "fulfilled", selectedSupplier: res.data.data?.selectedSupplier ?? { _id: supplierId, name: supplierName } }
            : r
        )
      );
      toast.success(`${supplierName} selected as your supplier!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to select supplier");
    }
  };

  const handleBoost = async () => {
    if (!boostTarget) return;
    setBoosting(true);
    try {
      const res = await api.post(`/buy-requirements/${boostTarget._id}/boost`, { duration: 7 });
      const updated = res.data.data;
      setRequirements((prev) =>
        prev.map((r) =>
          r._id === boostTarget._id
            ? { ...r, isPriority: true, priorityBoostedAt: updated.priorityBoostedAt, priorityExpiresAt: updated.priorityExpiresAt }
            : r
        )
      );
      toast.success("Your requirement is now featured at the top!");
      setBoostTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to activate boost");
    } finally {
      setBoosting(false);
    }
  };

  const activeCount = requirements.filter((r) => r.status === "active").length;
  const fulfilledCount = requirements.filter((r) => r.status === "fulfilled").length;
  const totalResponses = requirements.reduce((sum, r) => sum + (r.responses?.length ?? 0), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">RFQ Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Post requirements · Compare quotes · Select suppliers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--primary-dark)] transition"
        >
          <HiOutlinePlusCircle className="w-4 h-4" />
          Post RFQ
        </button>
      </div>

      {/* Stats */}
      {!loading && requirements.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Active RFQs", value: activeCount, color: "text-green-700", bg: "bg-green-50 border-green-200" },
            { label: "Quotes Received", value: totalResponses, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
            { label: "Fulfilled", value: fulfilledCount, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Post Requirement Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">Post a Buy Requirement</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                <input
                  type="text"
                  required
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                  placeholder="e.g. Stainless Steel Pipes 304 Grade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)] resize-none"
                  placeholder="Specifications, quality standards, preferred brands..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity Required *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.quantityRequired}
                    onChange={(e) => setForm({ ...form, quantityRequired: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                  >
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Budget (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.budgetMin}
                    onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                    placeholder="10,000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Budget (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.budgetMax}
                    onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                    placeholder="50,000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <StateDropdown label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v, city: "" })} />
                </div>
                <div>
                  <CityDropdown label="Delivery City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} state={form.state} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Timeline</label>
                <select
                  value={form.deliveryTimeline}
                  onChange={(e) => setForm({ ...form, deliveryTimeline: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                >
                  {TIMELINES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* ── Private Requirement Toggle ── */}
              <div className={`rounded-xl border-2 transition-all ${form.isPrivate ? "border-purple-300 bg-purple-50" : "border-gray-200 bg-gray-50"} p-4`}>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isPrivate: !form.isPrivate })}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${form.isPrivate ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                      <HiOutlineLockClosed className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${form.isPrivate ? "text-purple-800" : "text-gray-700"}`}>Private Requirement</p>
                      <p className="text-xs text-gray-400">Share only with selected suppliers — hidden from public listing</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${form.isPrivate ? "bg-purple-600" : "bg-gray-300"}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isPrivate ? "left-5.5 translate-x-0.5" : "left-0.5"}`} style={{ left: form.isPrivate ? "calc(100% - 1.375rem)" : "0.125rem" }} />
                  </div>
                </button>

                {form.isPrivate && (
                  <div className="mt-4 space-y-3">
                    {/* Seller search */}
                    <div>
                      <label className="block text-xs font-semibold text-purple-700 mb-1.5 uppercase tracking-wide">Invite Suppliers *</label>
                      <div className="relative">
                        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={sellerSearch}
                          onChange={(e) => {
                            setSellerSearch(e.target.value);
                            searchSellers(e.target.value);
                          }}
                          placeholder="Search by company name..."
                          className="w-full border border-purple-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white"
                        />
                        {searchingSellerss && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                        )}
                      </div>

                      {/* Search results dropdown */}
                      {sellerResults.length > 0 && (
                        <div className="mt-1 bg-white border border-purple-200 rounded-xl shadow-lg overflow-hidden z-10 relative">
                          {sellerResults.map((seller) => (
                            <button
                              key={seller._id}
                              type="button"
                              onClick={() => addInvitedSeller(seller)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 transition text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold shrink-0">
                                {(seller.companyName || seller.name || "S").charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{seller.companyName || seller.name}</p>
                                <p className="text-xs text-gray-400">{[seller.city, seller.state].filter(Boolean).join(", ")}</p>
                              </div>
                              {seller.isVerified && <HiMiniShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Invited sellers chips */}
                    {invitedSellers.length > 0 && (
                      <div>
                        <p className="text-xs text-purple-600 font-medium mb-2">{invitedSellers.length} supplier(s) invited:</p>
                        <div className="flex flex-wrap gap-2">
                          {invitedSellers.map((s) => (
                            <span key={s._id} className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded-full">
                              {s.companyName || s.name}
                              {s.isVerified && <HiMiniShieldCheck className="w-3 h-3 text-blue-500" />}
                              <button type="button" onClick={() => removeInvitedSeller(s._id)} className="hover:text-red-500 transition">
                                <HiOutlineXMark className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Private note */}
                    <div>
                      <label className="block text-xs font-semibold text-purple-700 mb-1.5 uppercase tracking-wide">Confidential Note <span className="font-normal">(optional)</span></label>
                      <textarea
                        rows={2}
                        value={form.privateNote}
                        onChange={(e) => setForm({ ...form, privateNote: e.target.value })}
                        placeholder="Additional context visible only to invited suppliers..."
                        className="w-full border border-purple-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400 bg-white resize-none"
                        maxLength={500}
                      />
                    </div>

                    <div className="flex items-start gap-2 bg-purple-100 rounded-lg px-3 py-2.5">
                      <HiOutlineEyeSlash className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-purple-700">This requirement will <strong>not appear</strong> in the public marketplace. Only your invited suppliers will see it.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[var(--primary)] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[var(--primary-dark)] transition disabled:opacity-60"
                >
                  {submitting ? "Posting..." : "Post Requirement"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Comparison Modal */}
      {compareTarget && (
        <SupplierComparisonModal
          req={compareTarget}
          onClose={() => setCompareTarget(null)}
          onSelectSupplier={handleSelectSupplier}
        />
      )}

      {/* Priority Response Pro Boost Modal */}
      {boostTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 p-6 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <HiOutlineRocketLaunch className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Priority Response Pro</h2>
              <p className="text-white/90 text-sm mt-1">Get more supplier quotes faster</p>
            </div>

            {/* Requirement preview */}
            <div className="mx-5 mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl">
              <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">Boosting</p>
              <p className="font-semibold text-gray-800 truncate">{boostTarget.productName}</p>
              <p className="text-xs text-gray-500">{boostTarget.quantityRequired} {boostTarget.unit} · {boostTarget.category?.name}</p>
            </div>

            {/* Benefits */}
            <div className="px-5 py-4 space-y-3">
              {[
                { icon: HiOutlineSparkles, color: "text-orange-500 bg-orange-50", title: "Top Placement", desc: "Appears first in the supplier feed for 7 days" },
                { icon: HiOutlineUserGroup, color: "text-blue-500 bg-blue-50", title: "10x More Visibility", desc: "Reach verified suppliers looking for your category" },
                { icon: HiOutlineBolt, color: "text-amber-500 bg-amber-50", title: "Urgent Badge", desc: "\"PRIORITY\" tag makes suppliers respond faster" },
                { icon: HiOutlineShieldCheck, color: "text-green-500 bg-green-50", title: "7 Days Featured", desc: "Active boost period — cancel anytime" },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{title}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price + CTA */}
            <div className="px-5 pb-5">
              <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs text-gray-500">7-day Priority Boost</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">₹99</span>
                    <span className="text-xs text-gray-400 line-through">₹299</span>
                    <span className="text-xs text-green-600 font-semibold">67% off</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">Secure Payment</p>
                  <p className="text-[10px] text-gray-400">via Razorpay</p>
                </div>
              </div>
              <button
                onClick={handleBoost}
                disabled={boosting}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-bold text-sm hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {boosting ? (
                  <>Activating...</>
                ) : (
                  <><HiOutlineRocketLaunch className="w-4 h-4" /> Activate Priority — ₹99</>
                )}
              </button>
              <button
                onClick={() => setBoostTarget(null)}
                className="w-full mt-2 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requirements List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : requirements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <HiOutlineClipboardDocumentList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">No requirements posted yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Post an RFQ — multiple suppliers will send you quotes to compare</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--primary-dark)] transition"
          >
            <HiOutlinePlusCircle className="w-4 h-4" />
            Post First RFQ
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requirements.map((req) => {
            const isExpanded = expandedId === req._id;
            const responseCount = req.responses?.length ?? 0;

            return (
              <div key={req._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {req.isPriority && req.priorityExpiresAt && new Date(req.priorityExpiresAt) > new Date() && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2 py-0.5 rounded-full">
                            <HiOutlineBolt className="w-3 h-3" /> PRIORITY
                          </span>
                        )}
                        {req.isPrivate && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                            <HiOutlineLockClosed className="w-3 h-3" /> PRIVATE
                          </span>
                        )}
                        <h3 className="font-semibold text-gray-800">{req.productName}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[req.status]}`}>
                          {STATUS_LABEL[req.status] ?? req.status}
                        </span>
                      </div>
                      {req.category && (
                        <p className="text-xs text-gray-400 mt-0.5">{req.category.name}</p>
                      )}
                      {req.isPriority && req.priorityExpiresAt && new Date(req.priorityExpiresAt) > new Date() && (
                        <p className="text-[10px] text-orange-500 mt-0.5">
                          Featured until {new Date(req.priorityExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      )}
                      {req.isPrivate && req.invitedSellers && req.invitedSellers.length > 0 && (
                        <p className="text-[10px] text-purple-600 mt-0.5 flex items-center gap-1">
                          <HiOutlineEyeSlash className="w-3 h-3" />
                          Shared with {req.invitedSellers.length} supplier{req.invitedSellers.length > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {req.status === "active" && !(req.isPriority && req.priorityExpiresAt && new Date(req.priorityExpiresAt) > new Date()) && (
                        <button
                          onClick={() => setBoostTarget(req)}
                          className="flex items-center gap-1 text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2.5 py-1.5 rounded-lg hover:from-orange-600 hover:to-amber-600 transition"
                          title="Boost this requirement"
                        >
                          <HiOutlineBolt className="w-3.5 h-3.5" />
                          Boost
                        </button>
                      )}
                      {req.status === "active" && responseCount === 0 && (
                        <button
                          onClick={() => handleDelete(req._id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete requirement"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <HiOutlineClipboardDocumentList className="w-4 h-4" />
                      {req.quantityRequired} {req.unit}
                    </span>
                    {(req.budgetMin || req.budgetMax) && (
                      <span className="flex items-center gap-1">
                        <HiOutlineCurrencyRupee className="w-4 h-4" />
                        {req.budgetMin ? `₹${req.budgetMin.toLocaleString()}` : ""}
                        {req.budgetMin && req.budgetMax ? " – " : ""}
                        {req.budgetMax ? `₹${req.budgetMax.toLocaleString()}` : ""}
                      </span>
                    )}
                    {req.deliveryLocation?.city && (
                      <span className="flex items-center gap-1">
                        <HiOutlineMapPin className="w-4 h-4" />
                        {req.deliveryLocation.city}
                        {req.deliveryLocation.state ? `, ${req.deliveryLocation.state}` : ""}
                      </span>
                    )}
                    {req.deliveryTimeline && (
                      <span className="flex items-center gap-1">
                        <HiOutlineClock className="w-4 h-4" />
                        {req.deliveryTimeline}
                      </span>
                    )}
                  </div>

                  {req.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{req.description}</p>
                  )}

                  {/* Fulfilled: show selected supplier banner */}
                  {req.status === "fulfilled" && req.selectedSupplier && (
                    <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      <HiOutlineCheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                      <p className="text-sm text-blue-700">
                        <span className="font-semibold">
                          {req.selectedSupplier.companyName || req.selectedSupplier.name}
                        </span>
                        {" "}selected as supplier
                        {req.selectedSupplier.email && (
                          <span className="text-blue-500 text-xs ml-1">· {req.selectedSupplier.email}</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Toggle quotes + Compare button */}
                  {responseCount > 0 && (
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : req._id)}
                        className="text-sm font-medium text-[var(--primary)] flex items-center gap-1 hover:underline"
                      >
                        <HiMiniCheckBadge className="w-4 h-4" />
                        {responseCount} supplier quote{responseCount > 1 ? "s" : ""} — view &amp; select
                        <span className="text-gray-400 font-normal ml-1">
                          {isExpanded ? "▲ hide" : "▼ view"}
                        </span>
                      </button>
                      {responseCount >= 2 && (
                        <button
                          onClick={() => setCompareTarget(req)}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                        >
                          <HiOutlineScale className="w-3.5 h-3.5" />
                          Compare Suppliers
                        </button>
                      )}
                    </div>
                  )}

                  {responseCount === 0 && req.status === "active" && (
                    <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                      <HiOutlineClock className="w-3.5 h-3.5" />
                      Waiting for supplier quotes...
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-3">
                    Posted {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Quote Comparison Panel */}
                {isExpanded && responseCount > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 pb-5">
                    <QuoteCompare req={req} onSelect={handleSelectSupplier} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BuyerRequirementsPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "premium", "seller", "admin"]}>
      <RequirementsContent />
    </ProtectedRoute>
  );
}
