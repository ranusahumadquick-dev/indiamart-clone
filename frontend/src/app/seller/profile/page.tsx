"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlinePencilSquare,
  HiOutlineCheckCircle,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineCpuChip,
  HiOutlineShieldCheck,
  HiOutlineGlobeAlt,
  HiOutlineXMark,
  HiOutlinePlusCircle,
  HiOutlineArrowUpTray,
  HiMiniShieldCheck,
  HiOutlineArrowPath,
  HiOutlineDocument,
  HiOutlineTrash,
  HiOutlineStar,
  HiOutlineVideoCamera,
  HiOutlinePlay,
  HiOutlineLink,
} from "@/lib/icons";

// ─── Constants ────────────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { value: "manufacturer",    label: "Manufacturer" },
  { value: "wholesaler",      label: "Wholesaler" },
  { value: "retailer",        label: "Retailer" },
  { value: "distributor",     label: "Distributor" },
  { value: "service_provider",label: "Service Provider" },
  { value: "other",           label: "Other" },
];
const TURNOVER_OPTIONS = [
  { value: "below_1cr",  label: "< ₹1 Cr" },
  { value: "1_5cr",      label: "₹1–5 Cr" },
  { value: "5_10cr",     label: "₹5–10 Cr" },
  { value: "10_50cr",    label: "₹10–50 Cr" },
  { value: "50_100cr",   label: "₹50–100 Cr" },
  { value: "above_100cr",label: "> ₹100 Cr" },
];
const EMPLOYEE_OPTIONS = [
  { value: "1-10",  label: "1–10" },
  { value: "11-50", label: "11–50" },
  { value: "51-200",label: "51–200" },
  { value: "201-500",label: "201–500" },
  { value: "500+",  label: "500+" },
];
const EXPORT_OPTIONS = [
  { value: "domestic_only", label: "Domestic Only" },
  { value: "export_only",   label: "Export Only" },
  { value: "both",          label: "Both" },
];
const PAYMENT_TERMS = [
  { value: "advance", label: "Advance" },
  { value: "lc",      label: "LC" },
  { value: "dp",      label: "DP" },
  { value: "da",      label: "DA" },
  { value: "net30",   label: "Net 30" },
  { value: "net60",   label: "Net 60" },
  { value: "cod",     label: "COD" },
];
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
];
const COMMON_CERTS = ["ISO 9001","ISO 14001","CE","FDA","BIS","FSSAI","MSME","NSIC","ZED","GMP"];

// ─── Score tier ───────────────────────────────────────────────────────────────
function scoreTier(score: number) {
  if (score >= 80) return { label: "Excellent", color: "text-green-600", bg: "bg-green-500" };
  if (score >= 50) return { label: "Good",      color: "text-blue-600",  bg: "bg-blue-500" };
  if (score >= 25) return { label: "Fair",       color: "text-amber-600", bg: "bg-amber-500" };
  return { label: "Incomplete",                  color: "text-red-500",   bg: "bg-red-500" };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface CertDoc {
  _id: string;
  name: string;
  issuingBody?: string;
  certNumber?: string;
  issuedDate?: string;
  expiryDate?: string;
  imageUrl?: string;
  fileType?: "image" | "pdf";
  isAdminVerified?: boolean;
}

interface Seller {
  _id: string; name: string; email: string; phone: string;
  companyName?: string; businessType?: string; yearEstablished?: number;
  businessLogo?: string; businessDescription?: string;
  city?: string; state?: string; pincode?: string; website?: string;
  socialLinks?: { linkedin?: string; facebook?: string; instagram?: string };
  mainProducts?: string[]; annualTurnover?: string; employeeCount?: string;
  exportCapability?: string; productionCapacity?: string; minOrderValue?: number;
  gstNumber?: string; certifications?: string[]; certificationDocs?: CertDoc[];
  paymentTerms?: string[];
  isVerified?: boolean; verificationRequested?: boolean; profileCompleted?: boolean;
  avgResponseTime?: number;
  companyVideo?: string;
  companyVideos?: { url: string; title: string; description: string }[];
  uploadedVideos?: { url: string; title: string }[];
  virtualTourUrl?: string;
}

// ─── Video entry types ──────────────────────────────────────────────────────
interface VideoLinkEntry  { url: string; title: string; description: string }
interface UploadedVideoEntry { url: string; title: string }
interface PendingVideoEntry  { id: string; file: File; title: string }

// ─── YouTube helpers ───────────────────────────────────────────────────────────
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|avi)(\?|$)/i.test(url) || url.includes("cloudinary.com/video");
}

// ─── Known cert presets with colors ───────────────────────────────────────────
const CERT_PRESETS: Record<string, { bg: string; text: string; abbr: string }> = {
  "ISO 9001": { bg: "bg-blue-100",   text: "text-blue-700",  abbr: "ISO" },
  "ISO 14001":{ bg: "bg-teal-100",   text: "text-teal-700",  abbr: "ENV" },
  "FSSAI":    { bg: "bg-orange-100", text: "text-orange-700",abbr: "FSS" },
  "BIS":      { bg: "bg-red-100",    text: "text-red-700",   abbr: "BIS" },
  "CE":       { bg: "bg-purple-100", text: "text-purple-700",abbr: "CE"  },
  "FDA":      { bg: "bg-green-100",  text: "text-green-700", abbr: "FDA" },
  "MSME":     { bg: "bg-indigo-100", text: "text-indigo-700",abbr: "MSM" },
  "NSIC":     { bg: "bg-cyan-100",   text: "text-cyan-700",  abbr: "NSI" },
  "ZED":      { bg: "bg-lime-100",   text: "text-lime-700",  abbr: "ZED" },
  "GMP":      { bg: "bg-pink-100",   text: "text-pink-700",  abbr: "GMP" },
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, action }: {
  title: string; icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Tag list ──────────────────────────────────────────────────────────────────
function TagList({ items, color = "blue" }: { items: string[]; color?: "blue" | "green" | "gray" }) {
  const cls = color === "blue" ? "bg-blue-50 text-blue-700 border-blue-100"
            : color === "green" ? "bg-green-50 text-green-700 border-green-100"
            : "bg-gray-50 text-gray-600 border-gray-100";
  if (!items.length) return <span className="text-sm text-gray-400 italic">Not specified</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i} className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${cls}`}>{i}</span>
      ))}
    </div>
  );
}

// ─── Edit modal base ──────────────────────────────────────────────────────────
function EditModal({ title, onClose, onSave, saving, children }: {
  title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <HiOutlineXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">{children}</div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SellerProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["seller"]}>
      <ProfileContent />
    </ProtectedRoute>
  );
}

type ModalKey = "identity" | "location" | "capabilities" | "trust" | "addCert" | "video" | null;

// ─── Cert upload form state ────────────────────────────────────────────────────
interface CertForm {
  name: string; issuingBody: string; certNumber: string;
  issuedDate: string; expiryDate: string; file: File | null;
}
const emptyCertForm = (): CertForm => ({
  name: "", issuingBody: "", certNumber: "", issuedDate: "", expiryDate: "", file: null,
});

function ProfileContent() {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [profileScore, setProfileScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState<ModalKey>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [certForm, setCertForm] = useState<CertForm>(emptyCertForm());
  const [deletingCertId, setDeletingCertId] = useState<string | null>(null);

  // Video modal state
  const [videoTab, setVideoTab]               = useState<'links' | 'upload'>('links');
  // Links tab
  const [savedLinks, setSavedLinks]           = useState<VideoLinkEntry[]>([]);
  const [newLink, setNewLink]                 = useState<VideoLinkEntry & { error: string | null }>({ url: '', title: '', description: '', error: null });
  const [editingLinkIdx, setEditingLinkIdx]   = useState<number | null>(null);
  // Upload tab
  const [savedUploads, setSavedUploads]       = useState<UploadedVideoEntry[]>([]);
  const [pendingVideos, setPendingVideos]     = useState<PendingVideoEntry[]>([]);
  const [uploadProgress, setUploadProgress]   = useState(0);
  const [videoDragOver, setVideoDragOver]     = useState(false);
  const [editingUploadIdx, setEditingUploadIdx] = useState<number | null>(null);
  // Shared
  const [virtualTourUrl, setVirtualTourUrl]   = useState('');
  const [uploadingVideo, setUploadingVideo]   = useState(false);

  // Modal-local state
  const [draft, setDraft] = useState<Partial<Seller & {
    socialLinkedin: string; socialFacebook: string; socialInstagram: string;
    productInput: string; certInput: string;
  }>>({});

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/sellers/me");
      setSeller(res.data.data.seller);
      setProfileScore(res.data.data.profileScore);
    } catch { toast.error("Failed to load profile"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const openEdit = (key: ModalKey) => {
    if (!seller) return;
    if (key === "video") {
      // Saved YouTube/Vimeo links (new format: objects; legacy: plain string)
      const links: VideoLinkEntry[] = (seller.companyVideos ?? []).map((v) =>
        typeof v === 'string' ? { url: v, title: '', description: '' } : v
      );
      // Merge legacy single companyVideo string
      if (seller.companyVideo && !isVideoUrl(seller.companyVideo) &&
          !links.find((l) => l.url === seller.companyVideo)) {
        links.push({ url: seller.companyVideo, title: '', description: '' });
      }
      setSavedLinks(links);
      setNewLink({ url: '', title: '', description: '', error: null });
      setEditingLinkIdx(null);

      const uploads: UploadedVideoEntry[] = (seller.uploadedVideos ?? []).map((v) =>
        typeof v === 'string' ? { url: v, title: '' } : v
      );
      setSavedUploads(uploads);
      setPendingVideos([]);
      setUploadProgress(0);
      setEditingUploadIdx(null);

      setVirtualTourUrl(seller.virtualTourUrl || '');
      setVideoTab('links');
      setOpenModal("video");
      return;
    }
    setDraft({
      ...seller,
      socialLinkedin: seller.socialLinks?.linkedin || "",
      socialFacebook: seller.socialLinks?.facebook || "",
      socialInstagram: seller.socialLinks?.instagram || "",
      productInput: "",
      certInput: "",
    });
    setOpenModal(key);
  };

  const setD = (k: string, v: unknown) => setDraft((prev) => ({ ...prev, [k]: v }));

  const toggleArr = (k: string, val: string) => {
    const arr = (draft[k as keyof typeof draft] as string[]) || [];
    setD(k, arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const addTag = (k: string, input: string, clearKey: string) => {
    const v = input.trim();
    if (!v) return;
    const arr = (draft[k as keyof typeof draft] as string[]) || [];
    if (!arr.includes(v)) setD(k, [...arr, v]);
    setD(clearKey, "");
  };

  const removeTag = (k: string, val: string) => {
    const arr = (draft[k as keyof typeof draft] as string[]) || [];
    setD(k, arr.filter((x) => x !== val));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: Record<string, unknown> = {};
      if (openModal === "identity") {
        payload.companyName     = draft.companyName;
        payload.businessType    = draft.businessType;
        payload.yearEstablished = draft.yearEstablished;
        payload.businessLogo    = draft.businessLogo;
      } else if (openModal === "location") {
        payload.businessDescription = draft.businessDescription;
        payload.city     = draft.city;
        payload.state    = draft.state;
        payload.pincode  = draft.pincode;
        payload.website  = draft.website;
        payload.socialLinks = {
          linkedin:  draft.socialLinkedin  || "",
          facebook:  draft.socialFacebook  || "",
          instagram: draft.socialInstagram || "",
        };
      } else if (openModal === "capabilities") {
        payload.mainProducts       = draft.mainProducts;
        payload.annualTurnover     = draft.annualTurnover;
        payload.employeeCount      = draft.employeeCount;
        payload.exportCapability   = draft.exportCapability;
        payload.productionCapacity = draft.productionCapacity;
        payload.minOrderValue      = draft.minOrderValue;
      } else if (openModal === "trust") {
        payload.gstNumber     = draft.gstNumber;
        payload.certifications= draft.certifications;
        payload.paymentTerms  = draft.paymentTerms;
      }

      const res = await api.put("/sellers/me", payload);
      setSeller(res.data.data.seller);
      setProfileScore(res.data.data.profileScore);
      setOpenModal(null);
      toast.success("Profile updated");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const validateLinkUrl = (url: string): string | null => {
    if (!url.trim()) return "URL is required";
    if (!extractYouTubeId(url) && !url.includes("vimeo.com")) return "Enter a valid YouTube or Vimeo URL";
    return null;
  };

  const handleAddLink = () => {
    const err = validateLinkUrl(newLink.url);
    if (err) { setNewLink((p) => ({ ...p, error: err })); return; }
    if (savedLinks.find((l) => l.url.trim() === newLink.url.trim())) {
      setNewLink((p) => ({ ...p, error: "This video URL is already added" })); return;
    }
    setSavedLinks((p) => [...p, { url: newLink.url.trim(), title: newLink.title.trim(), description: newLink.description.trim() }]);
    setNewLink({ url: '', title: '', description: '', error: null });
    toast.success("Video added to list");
  };

  const handleSaveVideo = async () => {
    const tourTrimmed = virtualTourUrl.trim();
    if (tourTrimmed) {
      try { new URL(tourTrimmed); } catch { toast.error("Please enter a valid Virtual Tour URL"); return; }
      if (!tourTrimmed.startsWith("http")) { toast.error("Virtual Tour URL must start with https://"); return; }
    }

    try {
      setSaving(true);

      // 1. Upload any pending video files
      let finalUploads = [...savedUploads];
      if (pendingVideos.length > 0) {
        setUploadingVideo(true);
        const fd = new FormData();
        pendingVideos.forEach((pv) => fd.append("videos", pv.file));
        fd.append("titles", JSON.stringify(pendingVideos.map((pv) => pv.title)));
        const res = await api.post("/sellers/me/video", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (evt) => {
            if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          },
        });
        finalUploads = res.data.data.seller.uploadedVideos ?? [];
        setUploadingVideo(false);
      }

      // 2. PUT all link + upload arrays + virtualTourUrl
      const payload: Record<string, unknown> = {
        companyVideos:  savedLinks,
        uploadedVideos: finalUploads,
        virtualTourUrl: tourTrimmed,
      };
      const res2 = await api.put("/sellers/me", payload);
      setSeller(res2.data.data.seller);
      setProfileScore(res2.data.data.profileScore);

      setOpenModal(null);
      setPendingVideos([]);
      setUploadProgress(0);
      toast.success("Videos saved successfully");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Failed to save videos");
      setUploadingVideo(false);
    } finally { setSaving(false); }
  };

  const handleRemoveUploadedVideo = async (url: string) => {
    if (!confirm("Remove this video?")) return;
    try {
      await api.delete("/sellers/me/video", { data: { url } });
      setSavedUploads((prev) => prev.filter((u) => u.url !== url));
      setSeller((prev) => prev ? { ...prev, uploadedVideos: (prev.uploadedVideos ?? []).filter((u) => u.url !== url) } : prev);
      toast.success("Video removed");
    } catch { toast.error("Failed to remove video"); }
  };

  const addPendingVideos = (files: File[]) => {
    const oversized = files.filter((f) => f.size > 100 * 1024 * 1024);
    oversized.forEach((f) => toast.error(`${f.name} exceeds 100 MB`));
    const valid = files.filter((f) => f.size <= 100 * 1024 * 1024);
    if (valid.length) {
      const entries: PendingVideoEntry[] = valid.map((f) => ({ id: `${f.name}-${f.size}-${Date.now()}`, file: f, title: '' }));
      setPendingVideos((prev) => [...prev, ...entries]);
    }
  };

  const handleAddCert = async () => {
    if (!certForm.name.trim()) { toast.error("Certification name is required"); return; }
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("name", certForm.name.trim());
      if (certForm.issuingBody) fd.append("issuingBody", certForm.issuingBody);
      if (certForm.certNumber)  fd.append("certNumber",  certForm.certNumber);
      if (certForm.issuedDate)  fd.append("issuedDate",  certForm.issuedDate);
      if (certForm.expiryDate)  fd.append("expiryDate",  certForm.expiryDate);
      if (certForm.file)        fd.append("certificate",  certForm.file);
      const res = await api.post("/sellers/me/certifications", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSeller(res.data.data.seller);
      setProfileScore(res.data.data.profileScore);
      setCertForm(emptyCertForm());
      setOpenModal(null);
      toast.success("Certification added");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Failed to add certification");
    } finally { setSaving(false); }
  };

  const handleDeleteCert = async (certId: string) => {
    if (!confirm("Remove this certification?")) return;
    try {
      setDeletingCertId(certId);
      const res = await api.delete(`/sellers/me/certifications/${certId}`);
      setSeller(res.data.data.seller);
      setProfileScore(res.data.data.profileScore);
      toast.success("Certification removed");
    } catch { toast.error("Failed to remove certification"); }
    finally { setDeletingCertId(null); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large (max 5MB)"); return; }
    try {
      setUploadingLogo(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");
      const r = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd }
      );
      const data = await r.json();
      if (data.secure_url) { setD("businessLogo", data.secure_url); toast.success("Logo uploaded"); }
    } catch { toast.error("Logo upload failed"); }
    finally { setUploadingLogo(false); }
  };

  const requestVerification = async () => {
    try {
      await api.post("/sellers/request-verification", { note: "Requesting profile verification" });
      toast.success("Verification request submitted. We'll review in 2–3 business days.");
      fetchProfile();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Request failed");
    }
  };

  const tier = scoreTier(profileScore);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-32" />
      ))}
    </div>
  );

  if (!seller) return null;

  const initials = (seller.name || "S").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const payTermLabels = (seller.paymentTerms || []).map(
    (v) => PAYMENT_TERMS.find((p) => p.value === v)?.label || v
  );

  return (
    <div className="space-y-5">
      {/* ── Profile header card ── */}
      <div className="bg-gradient-to-r from-[var(--primary)] to-blue-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full border-4 border-white translate-x-16 -translate-y-16" />
        </div>
        <div className="relative flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-white/20 shrink-0 overflow-hidden flex items-center justify-center text-2xl font-bold">
            {seller.businessLogo
              ? <img src={seller.businessLogo} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold truncate">{seller.companyName || seller.name}</h1>
              {seller.isVerified && (
                <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  <HiMiniShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <p className="text-blue-200 text-sm mt-0.5">
              {BUSINESS_TYPES.find((b) => b.value === seller.businessType)?.label || "Seller"}
              {seller.city && ` · ${seller.city}`}
              {seller.state && `, ${seller.state}`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Profile completeness ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Profile Strength</p>
            <p className={`text-xs font-medium ${tier.color}`}>{tier.label} — {profileScore}% complete</p>
          </div>
          <button onClick={fetchProfile} className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400">
            <HiOutlineArrowPath className="w-4 h-4" />
          </button>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${tier.bg}`} style={{ width: `${profileScore}%` }} />
        </div>
        {profileScore < 80 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {!seller.businessLogo      && <Tip text="Add company logo (+8)" />}
            {!seller.gstNumber         && <Tip text="Add GST number (+8)" />}
            {!seller.annualTurnover    && <Tip text="Add annual turnover (+6)" />}
            {!(seller.mainProducts?.length) && <Tip text="Add main products (+10)" />}
            {!seller.certifications?.length && <Tip text="Add certifications (+6)" />}
            {!seller.companyVideo && !(seller.companyVideos?.length) && !(seller.uploadedVideos?.length) && <Tip text="Add company video (+6)" />}
          </div>
        )}
        {!seller.isVerified && !seller.verificationRequested && profileScore >= 50 && (
          <button onClick={requestVerification}
            className="mt-3 w-full py-2 text-xs font-semibold text-blue-600 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 transition">
            Request Profile Verification
          </button>
        )}
        {seller.verificationRequested && !seller.isVerified && (
          <p className="mt-3 text-xs text-amber-600 font-medium text-center">
            Verification request pending — review in 2–3 business days
          </p>
        )}
      </div>

      {/* ── Business Identity ── */}
      <Section title="Business Identity" icon={HiOutlineBuildingOffice2}
        action={
          <button onClick={() => openEdit("identity")} className="text-xs font-medium text-blue-600 flex items-center gap-1 hover:underline">
            <HiOutlinePencilSquare className="w-3.5 h-3.5" /> Edit
          </button>
        }>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Company Name"   value={seller.companyName} />
          <Field label="Business Type"  value={BUSINESS_TYPES.find((b) => b.value === seller.businessType)?.label} />
          <Field label="Year Founded"   value={seller.yearEstablished?.toString()} />
          <Field label="Avg Response"   value={seller.avgResponseTime ? `${seller.avgResponseTime} min` : undefined} />
        </div>
      </Section>

      {/* ── Location & Contact ── */}
      <Section title="Location & Contact" icon={HiOutlineMapPin}
        action={
          <button onClick={() => openEdit("location")} className="text-xs font-medium text-blue-600 flex items-center gap-1 hover:underline">
            <HiOutlinePencilSquare className="w-3.5 h-3.5" /> Edit
          </button>
        }>
        <div className="space-y-4">
          {seller.businessDescription && (
            <p className="text-sm text-gray-600 leading-relaxed">{seller.businessDescription}</p>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="City"    value={seller.city} />
            <Field label="State"   value={seller.state} />
            <Field label="Pincode" value={seller.pincode} />
            {seller.website && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Website</p>
                <a href={seller.website} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                  <HiOutlineGlobeAlt className="w-3.5 h-3.5" /> Visit
                </a>
              </div>
            )}
          </div>
          {(seller.socialLinks?.linkedin || seller.socialLinks?.facebook || seller.socialLinks?.instagram) && (
            <div className="flex gap-2 flex-wrap">
              {seller.socialLinks.linkedin  && <SocialBadge label="LinkedIn"  href={seller.socialLinks.linkedin} />}
              {seller.socialLinks.facebook  && <SocialBadge label="Facebook"  href={seller.socialLinks.facebook} />}
              {seller.socialLinks.instagram && <SocialBadge label="Instagram" href={seller.socialLinks.instagram} />}
            </div>
          )}
        </div>
      </Section>

      {/* ── Capabilities ── */}
      <Section title="Business Capabilities" icon={HiOutlineCpuChip}
        action={
          <button onClick={() => openEdit("capabilities")} className="text-xs font-medium text-blue-600 flex items-center gap-1 hover:underline">
            <HiOutlinePencilSquare className="w-3.5 h-3.5" /> Edit
          </button>
        }>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Main Products</p>
            <TagList items={seller.mainProducts || []} color="blue" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Annual Turnover"  value={TURNOVER_OPTIONS.find((t) => t.value === seller.annualTurnover)?.label} />
            <Field label="Employees"        value={seller.employeeCount} />
            <Field label="Export"           value={EXPORT_OPTIONS.find((e) => e.value === seller.exportCapability)?.label} />
            <Field label="Production Cap."  value={seller.productionCapacity} />
            <Field label="Min. Order Value" value={seller.minOrderValue ? `₹${seller.minOrderValue.toLocaleString("en-IN")}` : undefined} />
          </div>
        </div>
      </Section>

      {/* ── Trust & Certifications ── */}
      <Section title="Trust & Compliance" icon={HiOutlineShieldCheck}
        action={
          <button onClick={() => openEdit("trust")} className="text-xs font-medium text-blue-600 flex items-center gap-1 hover:underline">
            <HiOutlinePencilSquare className="w-3.5 h-3.5" /> Edit
          </button>
        }>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${seller.gstNumber ? "bg-green-50" : "bg-gray-50"}`}>
              <HiOutlineCheckCircle className={`w-4 h-4 ${seller.gstNumber ? "text-green-600" : "text-gray-300"}`} />
            </div>
            <div>
              <p className="text-xs text-gray-400">GST Number</p>
              <p className="text-sm font-mono font-medium text-gray-700">
                {seller.gstNumber || <span className="text-gray-300 font-sans font-normal italic">Not added</span>}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Certifications</p>
            <TagList items={seller.certifications || []} color="green" />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Payment Terms</p>
            <TagList items={payTermLabels} color="gray" />
          </div>
        </div>
      </Section>

      {/* ── Certifications & Awards ── */}
      <Section title="Certifications & Awards" icon={HiOutlineStar}
        action={
          <button onClick={() => { setCertForm(emptyCertForm()); setOpenModal("addCert"); }}
            className="text-xs font-medium text-blue-600 flex items-center gap-1 hover:underline">
            <HiOutlinePlusCircle className="w-3.5 h-3.5" /> Add Certificate
          </button>
        }>
        {(!seller.certificationDocs || seller.certificationDocs.length === 0) ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3">
              <HiOutlineShieldCheck className="w-7 h-7 text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">No certifications uploaded yet</p>
            <p className="text-xs text-gray-400 mb-4">Upload ISO, FSSAI, BIS & other certificates to build buyer trust</p>
            <button onClick={() => { setCertForm(emptyCertForm()); setOpenModal("addCert"); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 transition">
              <HiOutlineArrowUpTray className="w-4 h-4" /> Upload First Certificate
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {seller.certificationDocs.map((doc) => {
              const preset = Object.entries(CERT_PRESETS).find(([k]) => doc.name.includes(k));
              const colors = preset?.[1] || { bg: "bg-gray-100", text: "text-gray-700", abbr: doc.name.slice(0, 3).toUpperCase() };
              const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
              return (
                <div key={doc._id}
                  className="relative border border-gray-100 rounded-2xl p-4 flex gap-3 group hover:border-green-200 hover:shadow-sm transition">
                  {/* Badge / image */}
                  <div className="shrink-0">
                    {doc.imageUrl && doc.fileType !== "pdf" ? (
                      <img src={doc.imageUrl} alt={doc.name}
                        className="w-14 h-14 rounded-xl object-contain border border-gray-100 bg-white" />
                    ) : doc.imageUrl && doc.fileType === "pdf" ? (
                      <a href={doc.imageUrl} target="_blank" rel="noopener noreferrer"
                        className="w-14 h-14 rounded-xl bg-red-50 border border-red-100 flex flex-col items-center justify-center gap-0.5">
                        <HiOutlineDocument className="w-6 h-6 text-red-500" />
                        <span className="text-[9px] text-red-400 font-bold">PDF</span>
                      </a>
                    ) : (
                      <div className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <span className={`text-xs font-bold ${colors.text}`}>{colors.abbr}</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-sm font-semibold text-gray-800 truncate">{doc.name}</p>
                      {doc.isAdminVerified && (
                        <span title="Admin verified">
                          <HiMiniShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        </span>
                      )}
                    </div>
                    {doc.issuingBody && <p className="text-xs text-gray-500 truncate">{doc.issuingBody}</p>}
                    {doc.certNumber  && <p className="text-xs text-gray-400 font-mono">#{doc.certNumber}</p>}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {doc.issuedDate && (
                        <span className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">
                          Issued: {new Date(doc.issuedDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        </span>
                      )}
                      {doc.expiryDate && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isExpired ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}>
                          {isExpired ? "Expired" : "Valid till"}: {new Date(doc.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Delete */}
                  <button onClick={() => handleDeleteCert(doc._id)}
                    disabled={deletingCertId === doc._id}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition text-gray-300 hover:text-red-500">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            {/* Add more button */}
            <button onClick={() => { setCertForm(emptyCertForm()); setOpenModal("addCert"); }}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-green-300 hover:text-green-600 transition min-h-[100px]">
              <HiOutlinePlusCircle className="w-6 h-6" />
              <span className="text-xs font-medium">Add Certificate</span>
            </button>
          </div>
        )}
      </Section>

      {/* ── Company Videos & Virtual Tour ── */}
      {(() => {
        // companyVideos is now {url,title,description}[] — normalize legacy string too
        const linkEntries: VideoLinkEntry[] = (seller.companyVideos ?? []).map((v) =>
          typeof v === 'string' ? { url: v, title: '', description: '' } : v
        );
        if (seller.companyVideo && !linkEntries.find((l) => l.url === seller.companyVideo)) {
          linkEntries.push({ url: seller.companyVideo, title: '', description: '' });
        }
        const uploadEntries: UploadedVideoEntry[] = (seller.uploadedVideos ?? []).map((v) =>
          typeof v === 'string' ? { url: v, title: '' } : v
        );
        const hasAny = linkEntries.length > 0 || uploadEntries.length > 0;
        return (
          <Section title="Company Videos & Virtual Tour" icon={HiOutlineVideoCamera}
            action={
              <button onClick={() => openEdit("video")}
                className="text-xs font-medium text-blue-600 flex items-center gap-1 hover:underline">
                <HiOutlinePencilSquare className="w-3.5 h-3.5" /> {hasAny ? "Edit" : "Add Video"}
              </button>
            }>
            {!hasAny ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
                  <HiOutlineVideoCamera className="w-7 h-7 text-purple-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">No videos added yet</p>
                <p className="text-xs text-gray-400 mb-4">Add factory tours, product demos — buyers trust suppliers they can see</p>
                <button onClick={() => openEdit("video")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl hover:bg-purple-700 transition">
                  <HiOutlineVideoCamera className="w-4 h-4" /> Add Company Video
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* YouTube / Vimeo links */}
                {linkEntries.map((entry) => {
                  const ytId = extractYouTubeId(entry.url);
                  return (
                    <div key={entry.url} className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                      {ytId ? (
                        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                          <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                            title={entry.title || 'Company Video'}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen className="absolute inset-0 w-full h-full" />
                        </div>
                      ) : (
                        <a href={entry.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 p-4 text-blue-600 hover:underline text-sm">
                          <HiOutlineLink className="w-4 h-4" /> {entry.url}
                        </a>
                      )}
                      <div className="px-4 py-2.5 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-700">{entry.title || (ytId ? 'YouTube Video' : 'Video Link')}</p>
                        {entry.description && <p className="text-[10px] text-gray-400 mt-0.5">{entry.description}</p>}
                      </div>
                    </div>
                  );
                })}
                {/* Uploaded videos */}
                {uploadEntries.map((entry) => (
                  <div key={entry.url} className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden">
                    <video controls className="w-full max-h-56 object-contain bg-black">
                      <source src={entry.url} />
                    </video>
                    <div className="px-4 py-2.5 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-700">{entry.title || 'Uploaded Video'}</p>
                    </div>
                  </div>
                ))}
                {/* Virtual tour */}
                {seller.virtualTourUrl && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <HiOutlineLink className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-indigo-700 mb-0.5">Virtual Tour / 360°</p>
                      <a href={seller.virtualTourUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-500 hover:underline truncate block">{seller.virtualTourUrl}</a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Section>
        );
      })()}

      {/* ────────────── MODALS ────────────── */}

      {/* Identity modal */}
      {openModal === "identity" && (
        <EditModal title="Edit Business Identity" onClose={() => setOpenModal(null)} onSave={handleSave} saving={saving}>
          {/* Logo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Company Logo</label>
            <div className="flex items-center gap-4">
              {draft.businessLogo ? (
                <div className="relative">
                  <img src={draft.businessLogo} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                  <button type="button" onClick={() => setD("businessLogo", "")}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <HiOutlineXMark className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <HiOutlineArrowUpTray className="w-5 h-5 text-gray-300" />
                </div>
              )}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
                <span className="text-sm text-blue-600 font-medium">
                  {uploadingLogo ? "Uploading…" : "Change logo"}
                </span>
              </label>
            </div>
          </div>
          {/* Company name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name *</label>
            <input value={draft.companyName || ""} onChange={(e) => setD("companyName", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          {/* Business type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Business Type</label>
            <div className="grid grid-cols-2 gap-2">
              {BUSINESS_TYPES.map((bt) => (
                <button key={bt.value} type="button" onClick={() => setD("businessType", bt.value)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border transition text-left ${
                    draft.businessType === bt.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
                  }`}>
                  {bt.label}
                </button>
              ))}
            </div>
          </div>
          {/* Year */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year Established</label>
            <input type="number" value={draft.yearEstablished || ""} onChange={(e) => setD("yearEstablished", Number(e.target.value))}
              min="1900" max={new Date().getFullYear()}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
        </EditModal>
      )}

      {/* Location modal */}
      {openModal === "location" && (
        <EditModal title="Edit Location & Contact" onClose={() => setOpenModal(null)} onSave={handleSave} saving={saving}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Description</label>
            <textarea rows={4} value={draft.businessDescription || ""} onChange={(e) => setD("businessDescription", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(["city", "state", "pincode"] as const).map((k) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-gray-600 mb-1 capitalize">{k}</label>
                {k === "state" ? (
                  <select value={draft[k] || ""} onChange={(e) => setD(k, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none bg-white">
                    <option value="">Select</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={draft[k] || ""} onChange={(e) => setD(k, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none" />
                )}
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Website</label>
            <input type="url" value={draft.website || ""} onChange={(e) => setD("website", e.target.value)}
              placeholder="https://…"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Social Links</label>
            {[
              { key: "socialLinkedin" as const, placeholder: "LinkedIn URL" },
              { key: "socialFacebook" as const, placeholder: "Facebook URL" },
              { key: "socialInstagram" as const, placeholder: "Instagram URL" },
            ].map(({ key, placeholder }) => (
              <input key={key} value={(draft[key] as string) || ""} onChange={(e) => setD(key, e.target.value)}
                placeholder={placeholder} type="url"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none text-sm mb-2" />
            ))}
          </div>
        </EditModal>
      )}

      {/* Capabilities modal */}
      {openModal === "capabilities" && (
        <EditModal title="Edit Capabilities" onClose={() => setOpenModal(null)} onSave={handleSave} saving={saving}>
          {/* Main products */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Main Products</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {((draft.mainProducts as string[]) || []).map((p) => (
                <span key={p} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-lg">
                  {p} <button type="button" onClick={() => removeTag("mainProducts", p)}><HiOutlineXMark className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={(draft.productInput as string) || ""} onChange={(e) => setD("productInput", e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("mainProducts", (draft.productInput as string) || "", "productInput"); } }}
                placeholder="Add product (Enter to add)"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none" />
              <button type="button" onClick={() => addTag("mainProducts", (draft.productInput as string) || "", "productInput")}
                className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl">
                <HiOutlinePlusCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Turnover */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Annual Turnover</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TURNOVER_OPTIONS.map((t) => (
                <button key={t.value} type="button" onClick={() => setD("annualTurnover", t.value)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border transition ${
                    draft.annualTurnover === t.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
                  }`}>{t.label}</button>
              ))}
            </div>
          </div>
          {/* Employees */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Employees</label>
            <div className="flex flex-wrap gap-1.5">
              {EMPLOYEE_OPTIONS.map((e) => (
                <button key={e.value} type="button" onClick={() => setD("employeeCount", e.value)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition ${
                    draft.employeeCount === e.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
                  }`}>{e.label}</button>
              ))}
            </div>
          </div>
          {/* Export */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Export Capability</label>
            <div className="flex gap-2">
              {EXPORT_OPTIONS.map((e) => (
                <button key={e.value} type="button" onClick={() => setD("exportCapability", e.value)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition ${
                    draft.exportCapability === e.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
                  }`}>{e.label}</button>
              ))}
            </div>
          </div>
          {/* Production + MOV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Production Capacity</label>
              <input value={(draft.productionCapacity as string) || ""} onChange={(e) => setD("productionCapacity", e.target.value)}
                placeholder="e.g. 5000 units/month"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Min. Order Value (₹)</label>
              <input type="number" min="0" value={(draft.minOrderValue as number) || ""} onChange={(e) => setD("minOrderValue", Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none" />
            </div>
          </div>
        </EditModal>
      )}

      {/* Video modal */}
      {openModal === "video" && (
        <EditModal title="Company Videos & Virtual Tour" onClose={() => setOpenModal(null)} onSave={handleSaveVideo} saving={saving}>

          {/* ── Tab switcher ── */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-1">
            {([['links', '🎬', 'YouTube / Vimeo Links'], ['upload', '📁', 'Upload Video Files']] as const).map(([tab, icon, label]) => (
              <button key={tab} type="button"
                onClick={() => setVideoTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                  videoTab === tab
                    ? 'bg-white text-purple-700 shadow-sm border border-purple-100'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                <span>{icon}</span>
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{tab === 'links' ? 'Links' : 'Upload'}</span>
              </button>
            ))}
          </div>

          {/* ══════════════ TAB 1: YouTube / Vimeo Links ══════════════ */}
          {videoTab === 'links' && (
            <div className="space-y-4">
              {/* Add new link form */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add New Video</p>

                {/* URL */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Video URL *</label>
                  <input
                    value={newLink.url}
                    onChange={(e) => setNewLink((p) => ({ ...p, url: e.target.value, error: null }))}
                    placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 ${newLink.error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                  />
                  {newLink.error && <p className="text-xs text-red-500 mt-1">{newLink.error}</p>}
                  {/* Live preview thumbnail */}
                  {newLink.url && extractYouTubeId(newLink.url) && !newLink.error && (
                    <div className="mt-2 flex items-center gap-3 p-2.5 bg-purple-50 border border-purple-100 rounded-xl">
                      <img
                        src={`https://img.youtube.com/vi/${extractYouTubeId(newLink.url)}/mqdefault.jpg`}
                        alt="thumbnail" className="w-20 h-12 object-cover rounded-lg shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-purple-700">YouTube video detected ✓</p>
                        <p className="text-[10px] text-gray-400 truncate">{newLink.url}</p>
                      </div>
                    </div>
                  )}
                  {newLink.url && newLink.url.includes('vimeo.com') && !newLink.error && (
                    <div className="mt-2 flex items-center gap-3 p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                      <span className="text-2xl shrink-0">🎞️</span>
                      <div>
                        <p className="text-xs font-medium text-blue-700">Vimeo video detected ✓</p>
                        <p className="text-[10px] text-gray-400 truncate">{newLink.url}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Video Title</label>
                  <input
                    value={newLink.title}
                    onChange={(e) => setNewLink((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Factory Tour 2024"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    value={newLink.description}
                    onChange={(e) => setNewLink((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of the video…"
                    rows={2}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white resize-none"
                  />
                </div>

                <button type="button" onClick={handleAddLink}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition">
                  <HiOutlinePlusCircle className="w-4 h-4" /> Add Video
                </button>
              </div>

              {/* Saved links list */}
              {savedLinks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Added Videos ({savedLinks.length})</p>
                  {savedLinks.map((link, idx) => {
                    const ytId = extractYouTubeId(link.url);
                    const isEditing = editingLinkIdx === idx;
                    return (
                      <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden">
                        {/* Card header with thumbnail */}
                        <div className="flex items-center gap-3 p-3 bg-white">
                          {ytId ? (
                            <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                              alt="thumb" className="w-16 h-10 object-cover rounded-lg shrink-0" />
                          ) : (
                            <div className="w-16 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                              <span className="text-lg">🎞️</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{link.title || 'Untitled Video'}</p>
                            <p className="text-[10px] text-gray-400 truncate">{link.url}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button type="button" onClick={() => setEditingLinkIdx(isEditing ? null : idx)}
                              className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-500 text-xs font-medium">
                              {isEditing ? 'Done' : '✏️'}
                            </button>
                            <button type="button"
                              onClick={() => setSavedLinks((p) => p.filter((_, i) => i !== idx))}
                              className="p-1.5 hover:bg-red-50 rounded-lg">
                              <HiOutlineTrash className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                        {/* Inline edit form */}
                        {isEditing && (
                          <div className="border-t border-gray-100 p-3 bg-gray-50 space-y-2">
                            <input value={link.title}
                              onChange={(e) => setSavedLinks((p) => p.map((l, i) => i === idx ? { ...l, title: e.target.value } : l))}
                              placeholder="Video Title"
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
                            <textarea value={link.description}
                              onChange={(e) => setSavedLinks((p) => p.map((l, i) => i === idx ? { ...l, description: e.target.value } : l))}
                              placeholder="Description (optional)"
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white resize-none" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Virtual Tour — inside links tab */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Virtual Tour / 360° Link <span className="text-gray-400 font-normal">(optional)</span></label>
                <p className="text-xs text-gray-400 mb-2">Google Street View, Matterport, or any 360° tour URL.</p>
                <div className="flex gap-2">
                  <input value={virtualTourUrl} onChange={(e) => setVirtualTourUrl(e.target.value)}
                    placeholder="https://tour.matterport.com/…"
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  {virtualTourUrl && (
                    <button type="button" onClick={() => setVirtualTourUrl("")}
                      className="px-3 text-xs text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition">Clear</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ TAB 2: Upload Video Files ══════════════ */}
          {videoTab === 'upload' && (
            <div className="space-y-4">

              {/* Drag & Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setVideoDragOver(true); }}
                onDragLeave={() => setVideoDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setVideoDragOver(false); addPendingVideos(Array.from(e.dataTransfer.files)); }}>
                <label className={`cursor-pointer block border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  videoDragOver ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}>
                  <input type="file" accept="video/mp4,video/quicktime,video/webm,video/avi,video/x-msvideo"
                    multiple className="hidden" disabled={uploadingVideo}
                    onChange={(e) => { addPendingVideos(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <HiOutlineVideoCamera className="w-7 h-7 text-purple-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Drag & Drop videos here</p>
                  <p className="text-xs text-gray-400 mb-3">or</p>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl hover:bg-purple-700 transition">
                    <HiOutlinePlusCircle className="w-4 h-4" /> Browse Files
                  </span>
                  <p className="text-[10px] text-gray-400 mt-3">MP4 · MOV · AVI · WebM · max 100 MB each</p>
                </label>
              </div>

              {/* Upload progress */}
              {uploadingVideo && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Uploading…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Pending videos queue */}
              {pendingVideos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ready to Upload ({pendingVideos.length})</p>
                  {pendingVideos.map((pv, i) => (
                    <div key={pv.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-3 p-3 bg-gray-50">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                          <HiOutlineVideoCamera className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{pv.file.name}</p>
                          <p className="text-[10px] text-gray-400">{(pv.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                        </div>
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium shrink-0">Queued</span>
                        <button type="button"
                          onClick={() => setPendingVideos((p) => p.filter((_, j) => j !== i))}
                          className="p-1.5 hover:bg-red-50 rounded-lg shrink-0">
                          <HiOutlineXMark className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                      {/* Title input per pending file */}
                      <div className="border-t border-gray-100 p-3">
                        <input
                          value={pv.title}
                          onChange={(e) => setPendingVideos((p) => p.map((v, j) => j === i ? { ...v, title: e.target.value } : v))}
                          placeholder="Video title (optional)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Already-saved uploaded videos */}
              {savedUploads.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploaded Videos ({savedUploads.length})</p>
                  {savedUploads.map((uv, idx) => {
                    const isEditing = editingUploadIdx === idx;
                    return (
                      <div key={uv.url} className="border border-gray-200 rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-3 p-3 bg-white">
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                            <HiOutlineVideoCamera className="w-5 h-5 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">{uv.title || uv.url.split('/').pop()}</p>
                            <p className="text-[10px] text-gray-400 truncate">{uv.url}</p>
                          </div>
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">Saved</span>
                          <button type="button" onClick={() => setEditingUploadIdx(isEditing ? null : idx)}
                            className="p-1.5 hover:bg-purple-50 rounded-lg text-xs">
                            {isEditing ? '✓' : '✏️'}
                          </button>
                          <button type="button" onClick={() => handleRemoveUploadedVideo(uv.url)}
                            className="p-1.5 hover:bg-red-50 rounded-lg shrink-0">
                            <HiOutlineTrash className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                        {isEditing && (
                          <div className="border-t border-gray-100 p-3 bg-gray-50">
                            <input value={uv.title}
                              onChange={(e) => setSavedUploads((p) => p.map((v, i) => i === idx ? { ...v, title: e.target.value } : v))}
                              placeholder="Video Title"
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {savedUploads.length === 0 && pendingVideos.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-2">No uploaded videos yet. Add files above.</p>
              )}
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
            <strong>Tip:</strong> Factory tour videos increase buyer trust by 3× and inquiries by 40%. Keep videos under 3 minutes.
          </div>
        </EditModal>
      )}

      {/* Add Certification modal */}
      {openModal === "addCert" && (
        <EditModal title="Add Certification / Award" onClose={() => setOpenModal(null)} onSave={handleAddCert} saving={saving}>
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Certificate Name *</label>
            <input value={certForm.name} onChange={(e) => setCertForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. ISO 9001:2015, FSSAI License…"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Object.keys(CERT_PRESETS).map((c) => (
                <button key={c} type="button"
                  onClick={() => setCertForm((f) => ({ ...f, name: c }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    certForm.name === c ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500 hover:border-green-300"
                  }`}>{c}</button>
              ))}
            </div>
          </div>
          {/* Issuing body */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Issuing Authority</label>
            <input value={certForm.issuingBody} onChange={(e) => setCertForm((f) => ({ ...f, issuingBody: e.target.value }))}
              placeholder="e.g. Bureau of Indian Standards, FSSAI…"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
          </div>
          {/* Cert number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Certificate / License Number</label>
            <input value={certForm.certNumber} onChange={(e) => setCertForm((f) => ({ ...f, certNumber: e.target.value }))}
              placeholder="e.g. ISO-2024-XXXX"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-mono" />
          </div>
          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Issue Date</label>
              <input type="date" value={certForm.issuedDate}
                onChange={(e) => setCertForm((f) => ({ ...f, issuedDate: e.target.value }))}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Expiry Date</label>
              <input type="date" value={certForm.expiryDate}
                onChange={(e) => setCertForm((f) => ({ ...f, expiryDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none" />
            </div>
          </div>
          {/* File upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Certificate</label>
            <p className="text-xs text-gray-400 mb-2">JPG, PNG, WebP or PDF — max 10 MB. Buyers see this as proof.</p>
            {certForm.file ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                {certForm.file.type === "application/pdf" ? (
                  <HiOutlineDocument className="w-8 h-8 text-red-500" />
                ) : (
                  <img src={URL.createObjectURL(certForm.file)} alt=""
                    className="w-10 h-10 object-cover rounded-lg border border-white" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{certForm.file.name}</p>
                  <p className="text-[10px] text-gray-400">{(certForm.file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button type="button" onClick={() => setCertForm((f) => ({ ...f, file: null }))}
                  className="p-1 hover:bg-red-100 rounded-lg">
                  <HiOutlineXMark className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input type="file" accept="image/*,application/pdf"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setCertForm((prev) => ({ ...prev, file: f })); }}
                  className="hidden" />
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-green-400 hover:bg-green-50 transition">
                  <HiOutlineArrowUpTray className="w-8 h-8 text-gray-300" />
                  <p className="text-sm font-medium text-gray-400">Click to upload certificate</p>
                  <p className="text-xs text-gray-300">Image or PDF supported</p>
                </div>
              </label>
            )}
          </div>
        </EditModal>
      )}

      {/* Trust modal */}
      {openModal === "trust" && (
        <EditModal title="Edit Trust & Compliance" onClose={() => setOpenModal(null)} onSave={handleSave} saving={saving}>
          {/* GST */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">GST Number</label>
            <input value={(draft.gstNumber as string) || ""} onChange={(e) => setD("gstNumber", e.target.value.toUpperCase())}
              maxLength={15} placeholder="27AABCT1234H1Z5"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono" />
          </div>
          {/* Certs */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Certifications</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_CERTS.map((c) => (
                <button key={c} type="button" onClick={() => toggleArr("certifications", c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    ((draft.certifications as string[]) || []).includes(c)
                      ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500"
                  }`}>{c}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {((draft.certifications as string[]) || []).filter((c) => !COMMON_CERTS.includes(c)).map((c) => (
                <span key={c} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-lg">
                  {c} <button type="button" onClick={() => removeTag("certifications", c)}><HiOutlineXMark className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={(draft.certInput as string) || ""} onChange={(e) => setD("certInput", e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("certifications", (draft.certInput as string) || "", "certInput"); } }}
                placeholder="Custom certification…"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none" />
              <button type="button" onClick={() => addTag("certifications", (draft.certInput as string) || "", "certInput")}
                className="px-3 py-2 bg-green-50 text-green-600 rounded-xl">
                <HiOutlinePlusCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Payment terms */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Terms</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_TERMS.map((pt) => (
                <button key={pt.value} type="button" onClick={() => toggleArr("paymentTerms", pt.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition ${
                    ((draft.paymentTerms as string[]) || []).includes(pt.value)
                      ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
                  }`}>{pt.label}</button>
              ))}
            </div>
          </div>
        </EditModal>
      )}
    </div>
  );
}

// ─── Helper sub-components ────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-700">{value || <span className="text-gray-300 italic font-normal">—</span>}</p>
    </div>
  );
}

function SocialBadge({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition">
      {label}
    </a>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md font-medium">
      {text}
    </span>
  );
}
