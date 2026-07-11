"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  HiArrowUpTray,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlinePlusCircle,
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
  HiOutlineArrowDownTray,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineInformationCircle,
  HiOutlineCalendarDays,
  HiOutlineCurrencyRupee,
  HiOutlineBuildingOffice2,
} from "react-icons/hi2";

// ─── Types ──────────────────────────────────────────────────────────────────
interface ItrCertificate {
  _id: string;
  assessmentYear: string;
  financialYear: string;
  itrType: string;
  acknowledgementNumber: string;
  filingDate: string;
  totalIncome: number;
  totalTaxPaid: number;
  turnoverGrossReceipt: number;
  documentUrl: string;
  documentType: "pdf" | "image";
  status: "pending" | "under_review" | "verified" | "rejected" | "expired";
  rejectionReason?: string;
  adminNotes?: string;
  validUntil?: string;
  createdAt: string;
}

interface ItrStats {
  total: number;
  pending: number;
  underReview: number;
  verified: number;
  rejected: number;
  latestYear?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────
const ITR_TYPES = ["ITR-1", "ITR-2", "ITR-3", "ITR-4", "ITR-5", "ITR-6", "ITR-7"];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  pending:      { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", label: "Pending", icon: <HiOutlineClock className="w-4 h-4" /> },
  under_review: { color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",    label: "Under Review", icon: <HiOutlineArrowPath className="w-4 h-4" /> },
  verified:     { color: "text-green-700",   bg: "bg-green-50 border-green-200",   label: "Verified", icon: <HiOutlineCheckCircle className="w-4 h-4" /> },
  rejected:     { color: "text-red-700",     bg: "bg-red-50 border-red-200",       label: "Rejected", icon: <HiOutlineXCircle className="w-4 h-4" /> },
  expired:      { color: "text-gray-500",    bg: "bg-gray-50 border-gray-200",     label: "Expired", icon: <HiOutlineExclamationTriangle className="w-4 h-4" /> },
};

const formatCurrency = (amount?: number) => {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
};

const formatDate = (date?: string) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
};

// ─── Page Component ────────────────────────────────────────────────────────
export default function ItrCertificatePage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<ItrCertificate[]>([]);
  const [stats, setStats] = useState<ItrStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<ItrCertificate | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Upload form state
  const [form, setForm] = useState({
    assessmentYear: "",
    financialYear: "",
    itrType: "ITR-4",
    acknowledgementNumber: "",
    filingDate: "",
    totalIncome: "",
    totalTaxPaid: "",
    turnoverGrossReceipt: "",
    validUntil: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ── Fetch Data ──
  const fetchCertificates = useCallback(async () => {
    try {
      const { data } = await api.get("/itr-certificates");
      if (data.success) setCertificates(data.data.certificates);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch ITR certificates");
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get("/itr-certificates/stats");
      if (data.success) setStats(data.data);
    } catch (err: any) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchCertificates(), fetchStats()]);
      setLoading(false);
    };
    if (user) init();
  }, [user, fetchCertificates, fetchStats]);

  // ── Handlers ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      toast.error("Only PDF, JPG, and PNG files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!form.assessmentYear || !form.financialYear) {
      toast.error("Assessment Year and Financial Year are required");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a document to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (val) formData.append(key, val);
    });
    formData.append("document", selectedFile);

    try {
      const { data } = await api.post("/itr-certificates", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percent);
        },
      });

      if (data.success) {
        toast.success("ITR Certificate uploaded successfully!");
        setShowUploadModal(false);
        setSelectedFile(null);
        setForm({
          assessmentYear: "",
          financialYear: "",
          itrType: "ITR-4",
          acknowledgementNumber: "",
          filingDate: "",
          totalIncome: "",
          totalTaxPaid: "",
          turnoverGrossReceipt: "",
          validUntil: "",
        });
        await Promise.all([fetchCertificates(), fetchStats()]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload ITR Certificate");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ITR Certificate?")) return;

    try {
      const { data } = await api.delete(`/itr-certificates/${id}`);
      if (data.success) {
        toast.success("ITR Certificate deleted");
        await Promise.all([fetchCertificates(), fetchStats()]);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const viewCertificate = (cert: ItrCertificate) => {
    setSelectedCert(cert);
    setShowViewModal(true);
  };

  // ── Render ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HiOutlineDocumentText className="text-orange-500 w-7 h-7" />
            ITR Certificates
          </h1>
          <p className="text-gray-500 mt-1">Manage your Income Tax Return certificates for seller verification</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
          Upload ITR
        </button>
      </div>

      {/* ── Stats Cards ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "bg-gray-50 border-gray-200", text: "text-gray-800" },
            { label: "Pending", value: stats.pending, color: "bg-yellow-50 border-yellow-200", text: "text-yellow-700" },
            { label: "Under Review", value: stats.underReview, color: "bg-blue-50 border-blue-200", text: "text-blue-700" },
            { label: "Verified", value: stats.verified, color: "bg-green-50 border-green-200", text: "text-green-700" },
            { label: "Rejected", value: stats.rejected, color: "bg-red-50 border-red-200", text: "text-red-700" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl border p-4 ${item.color}`}>
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.text}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Info Banner ── */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <HiOutlineInformationCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold">Why upload ITR Certificates?</p>
          <p className="mt-1">ITR certificates strengthen your seller profile and increase buyer trust. Verified ITR documents confirm your business legitimacy and financial credibility. Upload ITRs for the last 2-3 financial years for best results.</p>
        </div>
      </div>

      {/* ── Certificates List ── */}
      {certificates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiOutlineDocumentText className="w-10 h-10 text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">No ITR Certificates Uploaded</h3>
          <p className="text-gray-500 mt-2 mb-6">Upload your Income Tax Return certificates to verify your business and build trust with buyers.</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            <HiArrowUpTray className="w-5 h-5" />
            Upload First ITR
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map((cert) => {
            const statusCfg = STATUS_CONFIG[cert.status] || STATUS_CONFIG.pending;
            return (
              <div key={cert._id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Certificate Info */}
                    <div className="flex items-start gap-4">
                      {/* Document Icon */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${cert.documentType === "pdf" ? "bg-red-50" : "bg-blue-50"}`}>
                        {cert.documentType === "pdf" ? (
                          <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                            <path d="M8 12h8v2H8zm0 4h8v2H8zm0-8h3v2H8z" />
                          </svg>
                        ) : (
                          <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-gray-900">AY {cert.assessmentYear}</h3>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${statusCfg.color} ${statusCfg.bg}`}>
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">FY {cert.financialYear} • {cert.itrType}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                          {cert.totalIncome && (
                            <span className="flex items-center gap-1">
                              <HiOutlineCurrencyRupee className="w-3.5 h-3.5" />
                              Income: {formatCurrency(cert.totalIncome)}
                            </span>
                          )}
                          {cert.totalTaxPaid && (
                            <span className="flex items-center gap-1">
                              <HiOutlineCurrencyRupee className="w-3.5 h-3.5" />
                              Tax: {formatCurrency(cert.totalTaxPaid)}
                            </span>
                          )}
                          {cert.filingDate && (
                            <span className="flex items-center gap-1">
                              <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                              Filed: {formatDate(cert.filingDate)}
                            </span>
                          )}
                          {cert.acknowledgementNumber && (
                            <span className="font-mono text-xs">
                              Ack: {cert.acknowledgementNumber}
                            </span>
                          )}
                        </div>
                        {cert.rejectionReason && (
                          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <p className="text-xs text-red-700">
                              <span className="font-semibold">Rejection Reason:</span> {cert.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => viewCertificate(cert)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <HiOutlineEye className="w-4 h-4" />
                        View
                      </button>
                      {cert.documentType === "pdf" && (
                        <a
                          href={cert.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <HiOutlineArrowDownTray className="w-4 h-4" />
                          PDF
                        </a>
                      )}
                      {(cert.status === "pending" || cert.status === "rejected") && (
                        <button
                          onClick={() => handleDelete(cert._id)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* UPLOAD MODAL */}
      {/* ══════════════════════════════════════════════ */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <HiArrowUpTray className="text-orange-500" />
                Upload ITR Certificate
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <HiOutlineXMark className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ITR Document *</label>
                <div
                  onClick={() => document.getElementById("itr-file-input")?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    selectedFile ? "border-orange-300 bg-orange-50" : "border-gray-300 hover:border-orange-400 hover:bg-orange-50/50"
                  }`}
                >
                  <input
                    id="itr-file-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <HiOutlineCheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                      <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <HiArrowUpTray className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600">Click to upload or drag & drop</p>
                      <p className="text-xs text-gray-400">PDF, JPG, PNG (Max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Assessment Year & Financial Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assessment Year *</label>
                  <input
                    type="text"
                    placeholder="e.g. 2025-26"
                    value={form.assessmentYear}
                    onChange={(e) => setForm({ ...form, assessmentYear: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Financial Year *</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024-25"
                    value={form.financialYear}
                    onChange={(e) => setForm({ ...form, financialYear: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              {/* ITR Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ITR Type</label>
                <select
                  value={form.itrType}
                  onChange={(e) => setForm({ ...form, itrType: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                >
                  {ITR_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Acknowledgement Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Acknowledgement Number</label>
                <input
                  type="text"
                  placeholder="e.g. 123456789012345"
                  value={form.acknowledgementNumber}
                  onChange={(e) => setForm({ ...form, acknowledgementNumber: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-mono"
                />
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total Income (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000000"
                    value={form.totalIncome}
                    onChange={(e) => setForm({ ...form, totalIncome: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total Tax Paid (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1000000"
                    value={form.totalTaxPaid}
                    onChange={(e) => setForm({ ...form, totalTaxPaid: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Turnover/Gross Receipt (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 10000000"
                    value={form.turnoverGrossReceipt}
                    onChange={(e) => setForm({ ...form, turnoverGrossReceipt: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Filing Date</label>
                  <input
                    type="date"
                    value={form.filingDate}
                    onChange={(e) => setForm({ ...form, filingDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <HiArrowUpTray className="w-5 h-5" />
                    Upload ITR Certificate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* VIEW MODAL */}
      {/* ══════════════════════════════════════════════ */}
      {showViewModal && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <HiOutlineDocumentText className="text-orange-500" />
                ITR Details — AY {selectedCert.assessmentYear}
              </h2>
              <button onClick={() => { setShowViewModal(false); setSelectedCert(null); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <HiOutlineXMark className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={`rounded-xl border p-4 flex items-center gap-3 ${STATUS_CONFIG[selectedCert.status].bg}`}>
                {STATUS_CONFIG[selectedCert.status].icon}
                <div>
                  <p className={`font-semibold text-sm ${STATUS_CONFIG[selectedCert.status].color}`}>
                    Status: {STATUS_CONFIG[selectedCert.status].label}
                  </p>
                  {selectedCert.status === "verified" && (
                    <p className="text-xs text-green-600 mt-0.5">Your ITR has been verified. This boosts your seller credibility.</p>
                  )}
                  {selectedCert.status === "under_review" && (
                    <p className="text-xs text-blue-600 mt-0.5">Our team is reviewing your document. This usually takes 3-5 business days.</p>
                  )}
                  {selectedCert.status === "rejected" && selectedCert.rejectionReason && (
                    <p className="text-xs text-red-600 mt-0.5">Reason: {selectedCert.rejectionReason}</p>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Assessment Year", value: selectedCert.assessmentYear },
                  { label: "Financial Year", value: selectedCert.financialYear },
                  { label: "ITR Type", value: selectedCert.itrType },
                  { label: "Acknowledgement No.", value: selectedCert.acknowledgementNumber || "N/A" },
                  { label: "Filing Date", value: formatDate(selectedCert.filingDate) },
                  { label: "Valid Until", value: formatDate(selectedCert.validUntil) },
                  { label: "Total Income", value: formatCurrency(selectedCert.totalIncome) },
                  { label: "Total Tax Paid", value: formatCurrency(selectedCert.totalTaxPaid) },
                  { label: "Turnover/Gross Receipt", value: formatCurrency(selectedCert.turnoverGrossReceipt) },
                  { label: "Uploaded On", value: formatDate(selectedCert.createdAt) },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Document Preview */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Document</p>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {selectedCert.documentType === "pdf" ? (
                    <div className="p-8 text-center bg-red-50">
                      <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                      </svg>
                      <p className="text-sm text-red-700 font-medium">PDF Document</p>
                      <a
                        href={selectedCert.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        <HiOutlineArrowDownTray className="w-4 h-4" />
                        View / Download PDF
                      </a>
                    </div>
                  ) : (
                    <div className="p-2">
                      <Image
                        src={selectedCert.documentUrl}
                        alt={`ITR Certificate AY ${selectedCert.assessmentYear}`}
                        width={500}
                        height={600}
                        className="w-full rounded-lg object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {selectedCert.adminNotes && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700">Admin Notes</p>
                  <p className="text-sm text-blue-600 mt-1">{selectedCert.adminNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
