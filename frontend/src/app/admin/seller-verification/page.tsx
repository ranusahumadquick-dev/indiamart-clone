"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineMapPin,
  HiOutlineBuildingOffice2,
  HiOutlineCurrencyRupee,
  HiOutlineCalendarDays,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineArrowLeft,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

interface Seller {
  _id: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  gstNumber?: string;
  gstRegDate?: string;
  gstAge?: number;
  gstVerified?: boolean;
  annualTurnover?: string;
  sellerStatus: "pending" | "under_review" | "approved" | "rejected";
  sellerStatusNote?: string;
  sellerDocs?: {
    itr?: string;
    caCertificate?: string;
    bankStatement?: string;
    uploadedAt?: string;
  };
  createdAt: string;
  updatedAt?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

const STATUS_CONFIG = {
  pending:      { label: "Pending",      bg: "bg-gray-100",    text: "text-gray-700",    dot: "bg-gray-400",    border: "border-gray-300"   },
  under_review: { label: "Under Review", bg: "bg-yellow-50",   text: "text-yellow-700",  dot: "bg-yellow-400",  border: "border-yellow-300" },
  approved:     { label: "Approved",     bg: "bg-green-50",    text: "text-green-700",   dot: "bg-green-500",   border: "border-green-300"  },
  rejected:     { label: "Rejected",     bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500",     border: "border-red-300"    },
};

function Detail({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">{label}</p>
      <p className={`text-sm text-gray-800 font-semibold ${mono ? "font-mono" : ""}`}>{value || <span className="text-gray-400 font-normal italic">Not provided</span>}</p>
    </div>
  );
}

function DocLink({ label, url, color }: { label: string; url?: string; color: string }) {
  if (!url || url.trim() === "") {
    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm`}>
        <HiOutlineDocumentText className="w-5 h-5" />
        <span>{label}</span>
        <span className="ml-auto text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Not uploaded</span>
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${color} text-sm font-semibold hover:opacity-80 transition`}>
      <HiOutlineDocumentText className="w-5 h-5" />
      <span>{label}</span>
      <span className="ml-auto text-xs underline">View →</span>
    </a>
  );
}

export default function AdminSellerVerificationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [sellers,       setSellers]       = useState<Seller[]>([]);
  const [fetching,      setFetching]      = useState(true);
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [selected,      setSelected]      = useState<Seller | null>(null);
  const [rejectReason,  setRejectReason]  = useState("");
  const [acting,        setActing]        = useState(false);
  const [counts,        setCounts]        = useState({ all:0, pending:0, under_review:0, approved:0, rejected:0 });

  useEffect(() => {
    if (!loading && user?.role !== "admin") router.push("/");
  }, [user, loading, router]);

  const fetchSellers = async (status = filterStatus) => {
    setFetching(true);
    try {
      const res = await api.get(`/seller-verify/admin/list?status=${status}&limit=100`);
      setSellers(res.data?.data?.sellers || []);
      const [all, p, r, a, rej] = await Promise.all([
        api.get("/seller-verify/admin/list?status=all&limit=1"),
        api.get("/seller-verify/admin/list?status=pending&limit=1"),
        api.get("/seller-verify/admin/list?status=under_review&limit=1"),
        api.get("/seller-verify/admin/list?status=approved&limit=1"),
        api.get("/seller-verify/admin/list?status=rejected&limit=1"),
      ]);
      setCounts({
        all:          all.data?.data?.total || 0,
        pending:      p.data?.data?.total   || 0,
        under_review: r.data?.data?.total   || 0,
        approved:     a.data?.data?.total   || 0,
        rejected:     rej.data?.data?.total || 0,
      });
    } catch { toast.error("Failed to fetch sellers"); }
    finally { setFetching(false); }
  };

  useEffect(() => { fetchSellers(); }, [filterStatus]);

  const approve = async () => {
    if (!selected) return;
    setActing(true);
    try {
      await api.patch(`/seller-verify/admin/${selected._id}/approve`);
      toast.success(`✅ ${selected.companyName || selected.name} approved!`);
      setSelected(null);
      fetchSellers();
    } catch (err: any) { toast.error(err?.message || "Failed to approve"); }
    finally { setActing(false); }
  };

  const reject = async () => {
    if (!selected) return;
    if (!rejectReason.trim()) { toast.error("Rejection reason required"); return; }
    setActing(true);
    try {
      await api.patch(`/seller-verify/admin/${selected._id}/reject`, { reason: rejectReason });
      toast.success(`${selected.companyName || selected.name} rejected`);
      setSelected(null);
      setRejectReason("");
      fetchSellers();
    } catch (err: any) { toast.error(err?.message || "Failed to reject"); }
    finally { setActing(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Detail Panel ──────────────────────────────────────────────────────────────
  if (selected) {
    const sc = STATUS_CONFIG[selected.sellerStatus] ?? STATUS_CONFIG.pending;
    const hasAnyDoc = (selected.sellerDocs?.itr && selected.sellerDocs.itr.trim()) ||
                      (selected.sellerDocs?.caCertificate && selected.sellerDocs.caCertificate.trim()) ||
                      (selected.sellerDocs?.bankStatement && selected.sellerDocs.bankStatement.trim());

    return (
      <div className="max-w-5xl mx-auto py-8 px-4">

        {/* Back button */}
        <button onClick={() => { setSelected(null); setRejectReason(""); }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052cc] mb-6 transition font-semibold">
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Seller List
        </button>

        {/* Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{selected.companyName || selected.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Seller ID: {selected._id}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm ${sc.bg} ${sc.text} ${sc.border}`}>
            <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
            {sc.label}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT — 2/3 width */}
          <div className="lg:col-span-2 space-y-5">

            {/* Contact Details */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
                <HiOutlineUser className="w-5 h-5 text-[#0052cc]" />
                <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Contact Details</h2>
              </div>
              <div className="px-5 grid grid-cols-2 gap-x-8">
                <Detail label="Owner / Contact Name" value={selected.name} />
                <Detail label="Company Name"         value={selected.companyName} />
                <Detail label="Phone Number"         value={selected.phone} />
                <Detail label="Email Address"        value={selected.email} />
              </div>
            </div>

            {/* Business Location */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
                <HiOutlineMapPin className="w-5 h-5 text-[#0052cc]" />
                <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Business Location</h2>
              </div>
              <div className="px-5 grid grid-cols-3 gap-x-8">
                <Detail label="City"    value={selected.city} />
                <Detail label="State"   value={selected.state} />
                <Detail label="Pincode" value={selected.pincode} />
              </div>
            </div>

            {/* GST & Verification */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
                <HiOutlineShieldCheck className="w-5 h-5 text-[#0052cc]" />
                <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">GST & Verification</h2>
              </div>
              <div className="px-5 grid grid-cols-2 gap-x-8">
                <Detail label="GST Number" value={selected.gstNumber} mono />
                <div className="py-3 border-b border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">GST Status</p>
                  {selected.gstVerified
                    ? <span className="text-sm font-bold text-green-600">✅ Verified</span>
                    : <span className="text-sm font-bold text-yellow-600">⏳ Pending Verification</span>}
                </div>
                <div className="py-3 border-b border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">GST Registration Date</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selected.gstRegDate
                      ? new Date(selected.gstRegDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                      : <span className="text-gray-400 font-normal italic">Not provided</span>}
                  </p>
                </div>
                <div className="py-3 border-b border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">GST Age</p>
                  {selected.gstAge != null
                    ? <span className={`text-sm font-bold ${selected.gstAge >= 2 ? "text-green-600" : "text-red-600"}`}>
                        {selected.gstAge} year{selected.gstAge !== 1 ? "s" : ""} {selected.gstAge >= 2 ? "✅" : "❌ (Below 2 years)"}
                      </span>
                    : <span className="text-sm text-gray-400 italic font-normal">Not verified yet</span>}
                </div>
                <Detail label="Annual Turnover (Self-Declared)" value={selected.annualTurnover || "Not provided"} />
                <Detail label="Registered On" value={new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <HiOutlineDocumentText className="w-5 h-5 text-[#0052cc]" />
                  <h2 className="font-black text-gray-800 text-sm uppercase tracking-wider">Uploaded Documents</h2>
                </div>
                {!hasAnyDoc && (
                  <span className="text-xs text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                    <HiOutlineExclamationTriangle className="w-3.5 h-3.5" /> No documents uploaded
                  </span>
                )}
              </div>
              <div className="p-5 space-y-3">
                <DocLink
                  label="ITR Certificate"
                  url={selected.sellerDocs?.itr}
                  color="bg-blue-50 border-blue-200 text-blue-700"
                />
                <DocLink
                  label="CA Certificate"
                  url={selected.sellerDocs?.caCertificate}
                  color="bg-purple-50 border-purple-200 text-purple-700"
                />
                <DocLink
                  label="Bank Statement"
                  url={selected.sellerDocs?.bankStatement}
                  color="bg-teal-50 border-teal-200 text-teal-700"
                />
                {selected.sellerDocs?.uploadedAt && (
                  <p className="text-xs text-gray-400 pt-1">
                    Documents uploaded on: {new Date(selected.sellerDocs.uploadedAt).toLocaleDateString("en-IN")}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT — 1/3 width: Actions */}
          <div className="space-y-4">

            {/* Status Card */}
            <div className={`rounded-2xl border p-5 ${sc.bg} ${sc.border}`}>
              <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Current Status</p>
              <div className={`flex items-center gap-2 font-black text-lg ${sc.text}`}>
                <span className={`w-3 h-3 rounded-full ${sc.dot}`} />
                {sc.label}
              </div>
              {selected.sellerStatusNote && (
                <p className="text-xs mt-3 text-gray-600 bg-white/60 rounded-xl p-3">
                  <strong>Note:</strong> {selected.sellerStatusNote}
                </p>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">Quick Info</p>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <HiOutlinePhone className="w-4 h-4 text-gray-400 shrink-0" />
                {selected.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 break-all">
                <HiOutlineEnvelope className="w-4 h-4 text-gray-400 shrink-0" />
                {selected.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <HiOutlineMapPin className="w-4 h-4 text-gray-400 shrink-0" />
                {[selected.city, selected.state, selected.pincode].filter(Boolean).join(", ") || "—"}
              </div>
              {selected.gstNumber && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <HiOutlineShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="font-mono text-xs">{selected.gstNumber}</span>
                </div>
              )}
            </div>

            {/* Action Card */}
            {selected.sellerStatus !== "approved" && selected.sellerStatus !== "rejected" && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">Admin Action</p>

                <button
                  onClick={approve}
                  disabled={acting}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition"
                >
                  {acting
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <HiOutlineCheckCircle className="w-5 h-5" />}
                  Approve Seller
                </button>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Rejection Reason</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    placeholder="Reason for rejection (required)..."
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
                  />
                  <button
                    onClick={reject}
                    disabled={acting}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition"
                  >
                    {acting
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <HiOutlineXCircle className="w-5 h-5" />}
                    Reject Seller
                  </button>
                </div>
              </div>
            )}

            {/* Already actioned */}
            {(selected.sellerStatus === "approved" || selected.sellerStatus === "rejected") && (
              <div className={`rounded-2xl border p-5 ${sc.bg} ${sc.border}`}>
                <p className={`text-sm font-bold ${sc.text}`}>
                  {selected.sellerStatus === "approved"
                    ? "✅ This seller has been approved"
                    : "❌ This seller has been rejected"}
                </p>
                {selected.sellerStatusNote && (
                  <p className="text-xs text-gray-500 mt-2">{selected.sellerStatusNote}</p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // ── List View ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">

      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Seller Verification</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve seller applications</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {([
          { key: "all",          label: "All",          count: counts.all },
          { key: "under_review", label: "Under Review", count: counts.under_review },
          { key: "pending",      label: "Pending",      count: counts.pending },
          { key: "approved",     label: "Approved",     count: counts.approved },
          { key: "rejected",     label: "Rejected",     count: counts.rejected },
        ] as const).map((tab) => (
          <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              filterStatus === tab.key
                ? "bg-[#0052cc] text-white border-[#0052cc]"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
            }`}>
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filterStatus === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {fetching ? (
          <div className="py-20 text-center text-gray-400">Loading sellers...</div>
        ) : sellers.length === 0 ? (
          <div className="py-20 text-center text-gray-400">No sellers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Seller", "GST Number", "Location", "Docs", "Status", "Registered", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sellers.map((seller) => {
                  const sc = STATUS_CONFIG[seller.sellerStatus] ?? STATUS_CONFIG.pending;
                  const hasDoc = (seller.sellerDocs?.itr && seller.sellerDocs.itr.trim()) ||
                                 (seller.sellerDocs?.caCertificate && seller.sellerDocs.caCertificate.trim()) ||
                                 (seller.sellerDocs?.bankStatement && seller.sellerDocs.bankStatement.trim());
                  return (
                    <tr key={seller._id}
                      onClick={() => { setSelected(seller); setRejectReason(""); }}
                      className="hover:bg-blue-50 transition-colors cursor-pointer">
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">{seller.companyName || <span className="text-gray-400 font-normal italic">No company</span>}</p>
                        <p className="text-xs text-gray-600">{seller.name}</p>
                        <p className="text-xs text-gray-400">{seller.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        {seller.gstNumber
                          ? <div>
                              <p className="font-mono text-xs text-gray-800">{seller.gstNumber}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${seller.gstVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                {seller.gstVerified ? "✓ Verified" : "⏳ Pending"}
                              </span>
                            </div>
                          : <span className="text-gray-400 text-xs italic">Not provided</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <p>{seller.city || "—"}</p>
                        <p className="text-gray-400">{seller.state}</p>
                      </td>
                      <td className="px-4 py-3">
                        {hasDoc
                          ? <div className="flex flex-col gap-1">
                              {seller.sellerDocs?.itr?.trim()           && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold w-fit">ITR</span>}
                              {seller.sellerDocs?.caCertificate?.trim() && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold w-fit">CA</span>}
                              {seller.sellerDocs?.bankStatement?.trim()  && <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded font-bold w-fit">Bank</span>}
                            </div>
                          : <span className="text-[10px] text-yellow-600 bg-yellow-50 px-2 py-1 rounded font-semibold">No docs</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(seller.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-[#0052cc] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#003d99] transition inline-block">
                          View Details
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
