"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { StateDropdown, CityDropdown } from "@/components/common/LocationDropdown";
import {
  HiArrowUpTray,
  HiArrowRight,
  HiArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineCpuChip,
  HiOutlineShieldCheck,
  HiOutlineXMark,
  HiOutlinePlusCircle,
  HiOutlineDocumentCheck,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineLockClosed,
  HiOutlineCheckBadge,
  HiOutlineCalendarDays,
} from "@/lib/icons";

// ─── Constants ───────────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { value: "manufacturer",     label: "Manufacturer",      icon: "🏭" },
  { value: "wholesaler",       label: "Wholesaler",        icon: "📦" },
  { value: "retailer",         label: "Retailer",          icon: "🏪" },
  { value: "distributor",      label: "Distributor",       icon: "🚚" },
  { value: "service_provider", label: "Service Provider",  icon: "🛠️" },
  { value: "other",            label: "Other",             icon: "📋" },
];

const TURNOVER_OPTIONS = [
  { value: "below_1cr",   label: "Below ₹1 Crore" },
  { value: "1_5cr",       label: "₹1 – 5 Crore" },
  { value: "5_10cr",      label: "₹5 – 10 Crore" },
  { value: "10_50cr",     label: "₹10 – 50 Crore" },
  { value: "50_100cr",    label: "₹50 – 100 Crore" },
  { value: "above_100cr", label: "Above ₹100 Crore" },
];

const EMPLOYEE_OPTIONS = [
  { value: "1-10",    label: "1 – 10 employees" },
  { value: "11-50",   label: "11 – 50 employees" },
  { value: "51-200",  label: "51 – 200 employees" },
  { value: "201-500", label: "201 – 500 employees" },
  { value: "500+",    label: "500+ employees" },
];

const EXPORT_OPTIONS = [
  { value: "domestic_only", label: "Domestic Only" },
  { value: "export_only",   label: "Export Only" },
  { value: "both",          label: "Domestic + Export" },
];

const PAYMENT_TERMS = [
  { value: "advance", label: "Advance" },
  { value: "lc",      label: "LC (Letter of Credit)" },
  { value: "dp",      label: "DP (Documents against Payment)" },
  { value: "da",      label: "DA (Documents against Acceptance)" },
  { value: "net30",   label: "Net 30 Days" },
  { value: "net60",   label: "Net 60 Days" },
  { value: "cod",     label: "Cash on Delivery" },
];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
];

const COMMON_CERTS = ["ISO 9001","ISO 14001","CE","FDA","BIS","FSSAI","MSME","NSIC","ZED","GMP"];

// GST State codes mapping
const GST_STATE_CODES: Record<string, string> = {
  "01":"Jammu & Kashmir","02":"Himachal Pradesh","03":"Punjab","04":"Chandigarh",
  "05":"Uttarakhand","06":"Haryana","07":"Delhi","08":"Rajasthan","09":"Uttar Pradesh",
  "10":"Bihar","11":"Sikkim","12":"Arunachal Pradesh","13":"Nagaland","14":"Manipur",
  "15":"Mizoram","16":"Tripura","17":"Meghalaya","18":"Assam","19":"West Bengal",
  "20":"Jharkhand","21":"Odisha","22":"Chhattisgarh","23":"Madhya Pradesh",
  "24":"Gujarat","26":"Dadra & Nagar Haveli","27":"Maharashtra","28":"Andhra Pradesh",
  "29":"Karnataka","30":"Goa","31":"Lakshadweep","32":"Kerala","33":"Tamil Nadu",
  "34":"Puducherry","35":"Andaman & Nicobar","36":"Telangana","37":"Andhra Pradesh (New)",
};

// GST regex: 2 digit state code + 10 char PAN + 1 entity + Z + 1 checksum
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// ─── Wizard steps ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Business Identity",  icon: HiOutlineBuildingOffice2 },
  { id: 2, label: "Location & Contact", icon: HiOutlineMapPin },
  { id: 3, label: "Capabilities",       icon: HiOutlineCpuChip },
  { id: 4, label: "GST Verification",   icon: HiOutlineDocumentCheck },
  { id: 5, label: "Trust & Certs",      icon: HiOutlineShieldCheck },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  companyName: string; businessType: string; yearEstablished: string; businessLogo: string;
  businessDescription: string; city: string; state: string; pincode: string;
  website: string; socialLinkedin: string; socialFacebook: string; socialInstagram: string;
  mainProducts: string[]; annualTurnover: string; employeeCount: string;
  exportCapability: string; productionCapacity: string; minOrderValue: string;
  gstNumber: string; gstRegistrationDate: string; gstBusinessName: string;
  gstVerified: boolean;
  certifications: string[]; paymentTerms: string[];
}

type GstStatus = "idle" | "checking" | "valid" | "invalid" | "age_error";

const EMPTY: FormData = {
  companyName: "", businessType: "manufacturer", yearEstablished: "", businessLogo: "",
  businessDescription: "", city: "", state: "", pincode: "", website: "",
  socialLinkedin: "", socialFacebook: "", socialInstagram: "",
  mainProducts: [], annualTurnover: "", employeeCount: "", exportCapability: "",
  productionCapacity: "", minOrderValue: "",
  gstNumber: "", gstRegistrationDate: "", gstBusinessName: "", gstVerified: false,
  certifications: [], paymentTerms: [],
};

// ─── GST Validator ────────────────────────────────────────────────────────────
function validateGST(gst: string, regDate: string): { status: GstStatus; message: string; stateInfo?: string } {
  const cleaned = gst.trim().toUpperCase();

  if (!cleaned) return { status: "invalid", message: "GST number is required" };
  if (cleaned.length !== 15) return { status: "invalid", message: `GST number must be 15 characters (${cleaned.length}/15)` };
  if (!GST_REGEX.test(cleaned)) return { status: "invalid", message: "Invalid GST format. Example: 27AABCT1234H1Z5" };

  const stateCode = cleaned.substring(0, 2);
  const stateName = GST_STATE_CODES[stateCode];
  if (!stateName) return { status: "invalid", message: `Unknown state code: ${stateCode}` };

  // Check registration date
  if (!regDate) return { status: "invalid", message: "GST registration date is required" };

  const regDateObj = new Date(regDate);
  const today = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(today.getFullYear() - 2);

  if (regDateObj > today) return { status: "invalid", message: "Registration date cannot be in the future" };
  if (regDateObj > twoYearsAgo) {
    const monthsOld = Math.floor((today.getTime() - regDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const needed = 24 - monthsOld;
    return {
      status: "age_error",
      message: `GST must be at least 2 years old. Your GST is ${monthsOld} months old — needs ${needed} more months.`,
    };
  }

  const yearsOld = Math.floor((today.getTime() - regDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365));
  return {
    status: "valid",
    message: `✓ Valid GST — ${stateCode} (${stateName}), registered ${yearsOld}+ years ago`,
    stateInfo: stateName,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [productInput, setProductInput] = useState("");
  const [certInput, setCertInput] = useState("");
  const [gstStatus, setGstStatus] = useState<GstStatus>("idle");
  const [gstMessage, setGstMessage] = useState("");
  const [gstStateInfo, setGstStateInfo] = useState("");

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) router.push("/auth/login?redirect=/seller/complete-profile");
      else if (user?.role !== "seller") { toast.error("Only sellers can access this page"); router.push("/"); }
      // Allow sellers to re-visit their profile even if already completed
    }
  }, [isAuthenticated, loading, user, router]);

  const set = (key: keyof FormData, val: string | string[] | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const toggleArray = (key: keyof FormData, val: string) => {
    const arr = form[key] as string[];
    set(key, arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const addTag = (key: keyof FormData, val: string, clearFn: () => void) => {
    const v = val.trim();
    if (!v) return;
    const arr = form[key] as string[];
    if (!arr.includes(v)) set(key, [...arr, v]);
    clearFn();
  };

  const removeTag = (key: keyof FormData, val: string) => {
    set(key, (form[key] as string[]).filter((x) => x !== val));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("File size must be less than 5MB"); return; }
    try {
      setUploadingLogo(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd }
      );
      const data = await res.json();
      if (data.secure_url) { set("businessLogo", data.secure_url); toast.success("Logo uploaded"); }
    } catch { toast.error("Failed to upload logo"); }
    finally { setUploadingLogo(false); }
  };

  // Live GST validation on input change
  const handleGstChange = (gst: string, date?: string) => {
    const regDate = date ?? form.gstRegistrationDate;
    set("gstNumber", gst.toUpperCase());
    set("gstVerified", false);
    setGstStatus("idle");
    setGstMessage("");

    if (gst.length === 15 && regDate) {
      const result = validateGST(gst, regDate);
      setGstStatus(result.status);
      setGstMessage(result.message);
      setGstStateInfo(result.stateInfo || "");
      if (result.status === "valid") {
        set("gstVerified", true);
      }
    }
  };

  const handleGstDateChange = (date: string) => {
    set("gstRegistrationDate", date);
    if (form.gstNumber.length === 15) {
      const result = validateGST(form.gstNumber, date);
      setGstStatus(result.status);
      setGstMessage(result.message);
      setGstStateInfo(result.stateInfo || "");
      set("gstVerified", result.status === "valid");
    }
  };

  const handleVerifyGST = () => {
    setGstStatus("checking");
    setTimeout(() => {
      const result = validateGST(form.gstNumber, form.gstRegistrationDate);
      setGstStatus(result.status);
      setGstMessage(result.message);
      setGstStateInfo(result.stateInfo || "");
      set("gstVerified", result.status === "valid");
      if (result.status === "valid") {
        toast.success("GST verified successfully!");
      } else if (result.status === "age_error") {
        toast.error("GST must be at least 2 years old");
      } else {
        toast.error("GST verification failed");
      }
    }, 1200);
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.companyName.trim()) { toast.error("Company name is required"); return false; }
      if (!form.businessType) { toast.error("Business type is required"); return false; }
    }
    if (step === 2) {
      if (!form.businessDescription.trim()) { toast.error("Business description is required"); return false; }
      if (form.businessDescription.length < 50) { toast.error("Description must be at least 50 characters"); return false; }
    }
    if (step === 4) {
      if (!form.gstNumber.trim()) { toast.error("GST number is required for seller verification"); return false; }
      if (!form.gstRegistrationDate) { toast.error("GST registration date is required"); return false; }
      if (!form.gstVerified) {
        const result = validateGST(form.gstNumber, form.gstRegistrationDate);
        if (result.status === "age_error") {
          toast.error("GST must be at least 2 years old to sell on IndiaMart");
          return false;
        }
        if (result.status !== "valid") {
          toast.error("Please enter a valid GST number");
          return false;
        }
      }
    }
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep((s) => Math.min(s + 1, 5)); };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    try {
      setSubmitting(true);
      await api.post("/sellers/complete-profile", {
        companyName: form.companyName,
        businessType: form.businessType,
        yearEstablished: form.yearEstablished ? Number(form.yearEstablished) : undefined,
        businessLogo: form.businessLogo,
        businessDescription: form.businessDescription,
        city: form.city, state: form.state, pincode: form.pincode, website: form.website,
        socialLinks: { linkedin: form.socialLinkedin, facebook: form.socialFacebook, instagram: form.socialInstagram },
        mainProducts: form.mainProducts,
        annualTurnover: form.annualTurnover, employeeCount: form.employeeCount,
        exportCapability: form.exportCapability, productionCapacity: form.productionCapacity,
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        gstNumber: form.gstNumber,
        gstRegistrationDate: form.gstRegistrationDate,
        gstVerified: form.gstVerified,
        certifications: form.certifications,
        paymentTerms: form.paymentTerms,
      });
      toast.success("Profile completed! Welcome to your dashboard.");
      setTimeout(() => router.push("/seller/dashboard"), 1000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#0052cc] text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4">
            🏷️ Seller Onboarding
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-1">Complete Your Business Profile</h1>
          <p className="text-gray-500 text-sm">Verified profiles get <strong>3× more buyer inquiries</strong></p>
        </div>

        {/* GST Requirement Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
          <HiOutlineInformationCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-800 mb-1">GST Verification Required</p>
            <p className="text-amber-700">
              To sell on IndiaMart, your GST registration must be <strong>at least 2 years old</strong> and valid.
              This ensures buyer trust and platform integrity.
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                    done ? "bg-green-500 text-white" :
                    active ? "bg-[#0052cc] text-white shadow-lg shadow-blue-200" :
                    "bg-white text-gray-400 border border-gray-200"
                  }`}>
                    {done ? <HiOutlineCheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[9px] mt-1.5 font-semibold hidden sm:block whitespace-nowrap ${
                    active ? "text-[#0052cc]" : done ? "text-green-600" : "text-gray-400"
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1.5 mb-4 rounded transition-all ${done ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* ── STEP 1 — Business Identity ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <HiOutlineBuildingOffice2 className="w-5 h-5 text-[#0052cc]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800">Business Identity</h2>
                  <p className="text-xs text-gray-500">Tell us about your company</p>
                </div>
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Company Logo</label>
                <div className="flex items-center gap-5">
                  {form.businessLogo ? (
                    <div className="relative">
                      <img src={form.businessLogo} alt="logo" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                      <button type="button" onClick={() => set("businessLogo", "")}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <HiOutlineXMark className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <HiArrowUpTray className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
                    <span className="text-sm font-semibold text-[#0052cc] hover:text-blue-700">
                      {uploadingLogo ? "Uploading…" : "Upload logo"}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 5MB</p>
                  </label>
                </div>
              </div>

              {/* Company name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name *</label>
                <input type="text" value={form.companyName} onChange={(e) => set("companyName", e.target.value)}
                  placeholder="e.g. Sharma Exports Pvt. Ltd."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
              </div>

              {/* Business type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BUSINESS_TYPES.map((bt) => (
                    <button key={bt.value} type="button" onClick={() => set("businessType", bt.value)}
                      className={`py-3 px-3 rounded-xl text-sm font-medium border transition flex items-center gap-2 ${
                        form.businessType === bt.value
                          ? "border-[#0052cc] bg-blue-50 text-[#0052cc]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>
                      <span>{bt.icon}</span>
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year established */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year Established</label>
                <input type="number" min="1900" max={new Date().getFullYear()}
                  value={form.yearEstablished} onChange={(e) => set("yearEstablished", e.target.value)}
                  placeholder="e.g. 2005"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
            </div>
          )}

          {/* ── STEP 2 — Location & Contact ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <HiOutlineMapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800">Location & Contact</h2>
                  <p className="text-xs text-gray-500">Where is your business located?</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Business Description *
                  <span className="text-gray-400 font-normal ml-1">({form.businessDescription.length}/1000)</span>
                </label>
                <textarea value={form.businessDescription} onChange={(e) => set("businessDescription", e.target.value)}
                  rows={4} placeholder="Describe your products, capabilities, target markets… (min 50 chars)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <CityDropdown value={form.city} onChange={(v) => set("city", v)} state={form.state} />
                </div>
                <div>
                  <StateDropdown value={form.state} onChange={(v) => { set("state", v); set("city", ""); }} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pincode</label>
                  <input value={form.pincode} onChange={(e) => set("pincode", e.target.value)}
                    placeholder="6-digit PIN" maxLength={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Website</label>
                <input type="url" value={form.website} onChange={(e) => set("website", e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Social Links</label>
                <div className="space-y-2.5">
                  {[
                    { key: "socialLinkedin" as const, placeholder: "LinkedIn URL", icon: "in" },
                    { key: "socialFacebook" as const, placeholder: "Facebook URL", icon: "f" },
                    { key: "socialInstagram" as const, placeholder: "Instagram URL", icon: "◉" },
                  ].map(({ key, placeholder, icon }) => (
                    <div key={key} className="flex gap-2 items-center">
                      <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">{icon}</span>
                      <input type="url" value={form[key] as string}
                        onChange={(e) => set(key, e.target.value)} placeholder={placeholder}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Capabilities ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <HiOutlineCpuChip className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800">Business Capabilities</h2>
                  <p className="text-xs text-gray-500">What can you offer to buyers?</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Main Products / Services</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {form.mainProducts.map((p) => (
                    <span key={p} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-lg font-medium border border-blue-100">
                      {p}
                      <button type="button" onClick={() => removeTag("mainProducts", p)}>
                        <HiOutlineXMark className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={productInput} onChange={(e) => setProductInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("mainProducts", productInput, () => setProductInput("")); } }}
                    placeholder="Type a product and press Enter…"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  <button type="button" onClick={() => addTag("mainProducts", productInput, () => setProductInput(""))}
                    className="px-3 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition">
                    <HiOutlinePlusCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Annual Turnover</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TURNOVER_OPTIONS.map((t) => (
                    <button key={t.value} type="button" onClick={() => set("annualTurnover", t.value)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition ${
                        form.annualTurnover === t.value
                          ? "border-[#0052cc] bg-blue-50 text-[#0052cc]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Employees</label>
                <div className="flex flex-wrap gap-2">
                  {EMPLOYEE_OPTIONS.map((e) => (
                    <button key={e.value} type="button" onClick={() => set("employeeCount", e.value)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition ${
                        form.employeeCount === e.value
                          ? "border-[#0052cc] bg-blue-50 text-[#0052cc]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Export Capability</label>
                <div className="flex gap-2 flex-wrap">
                  {EXPORT_OPTIONS.map((e) => (
                    <button key={e.value} type="button" onClick={() => set("exportCapability", e.value)}
                      className={`py-2.5 px-4 rounded-xl text-sm font-medium border transition ${
                        form.exportCapability === e.value
                          ? "border-[#0052cc] bg-blue-50 text-[#0052cc]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Production Capacity</label>
                  <input value={form.productionCapacity} onChange={(e) => set("productionCapacity", e.target.value)}
                    placeholder="e.g. 5000 units/month"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Min. Order Value (₹)</label>
                  <input type="number" min="0" value={form.minOrderValue}
                    onChange={(e) => set("minOrderValue", e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4 — GST VERIFICATION (New!) ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <HiOutlineDocumentCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800">GST Verification</h2>
                  <p className="text-xs text-gray-500">Required for all sellers on IndiaMart</p>
                </div>
              </div>

              {/* Why GST */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
                <div className="flex gap-3 mb-3">
                  <HiOutlineLockClosed className="w-5 h-5 shrink-0 mt-0.5 text-blue-200" />
                  <div>
                    <h3 className="font-bold text-sm mb-1">Why is GST Verification Mandatory?</h3>
                    <p className="text-xs text-blue-100 leading-relaxed">
                      IndiaMart verifies GST to ensure all sellers are legitimate businesses.
                      This protects buyers and maintains marketplace trust.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { icon: "🏆", text: "10L+ GST Verified Sellers" },
                    { icon: "✅", text: "2-Year GST Required" },
                    { icon: "🔒", text: "100% Secure Verification" },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                      <span className="text-xl block mb-1">{item.icon}</span>
                      <p className="text-[10px] text-blue-100 font-medium leading-tight">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* GST Number Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  GST Number *
                  <span className="ml-2 text-xs font-normal text-gray-400">15-character GSTIN</span>
                </label>
                <div className="relative">
                  <input
                    value={form.gstNumber}
                    onChange={(e) => handleGstChange(e.target.value)}
                    placeholder="e.g. 27AABCT1234H1Z5"
                    maxLength={15}
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-xl outline-none text-sm font-mono tracking-widest transition ${
                      gstStatus === "valid" ? "border-emerald-400 bg-emerald-50" :
                      gstStatus === "age_error" ? "border-red-400 bg-red-50" :
                      gstStatus === "invalid" ? "border-red-400 bg-red-50" :
                      "border-gray-200 focus:border-blue-400"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {gstStatus === "valid" && <HiOutlineCheckBadge className="w-5 h-5 text-emerald-500" />}
                    {(gstStatus === "invalid" || gstStatus === "age_error") && <HiOutlineExclamationTriangle className="w-5 h-5 text-red-500" />}
                    {gstStatus === "checking" && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-gray-400">Format: 2-digit state code + PAN + entity number (e.g. 27AABCT1234H1Z5)</p>
                  <span className={`text-xs font-mono ${form.gstNumber.length === 15 ? "text-blue-600" : "text-gray-400"}`}>
                    {form.gstNumber.length}/15
                  </span>
                </div>
              </div>

              {/* GST Registration Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                  <HiOutlineCalendarDays className="w-4 h-4 text-gray-500" />
                  GST Registration Date *
                </label>
                <input
                  type="date"
                  value={form.gstRegistrationDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => handleGstDateChange(e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl outline-none text-sm transition ${
                    gstStatus === "valid" ? "border-emerald-400 bg-emerald-50" :
                    gstStatus === "age_error" ? "border-red-400 bg-red-50" :
                    "border-gray-200 focus:border-blue-400"
                  }`}
                />
                <p className="text-xs text-gray-400 mt-1">
                  GST must be registered at least <strong>2 years ago</strong> (before{" "}
                  {new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })})
                </p>
              </div>

              {/* Business Name on GST */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name (as on GST Certificate)</label>
                <input
                  value={form.gstBusinessName}
                  onChange={(e) => set("gstBusinessName", e.target.value)}
                  placeholder="e.g. SHARMA EXPORTS PVT LTD"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={handleVerifyGST}
                disabled={!form.gstNumber || !form.gstRegistrationDate || gstStatus === "checking"}
                className="w-full flex items-center justify-center gap-2 bg-[#0052cc] hover:bg-[#003d99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200"
              >
                {gstStatus === "checking" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying GST…
                  </>
                ) : (
                  <>
                    <HiOutlineDocumentCheck className="w-5 h-5" />
                    Verify GST Number
                  </>
                )}
              </button>

              {/* Status Messages */}
              {gstStatus === "valid" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                      <HiOutlineCheckBadge className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-800 text-sm">GST Verified Successfully!</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">{gstMessage}</p>
                      {gstStateInfo && (
                        <span className="inline-block mt-2 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                          📍 {gstStateInfo}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-emerald-200 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "Status", val: "Active" },
                      { label: "Type", val: "Regular" },
                      { label: "Verified", val: "✓ Yes" },
                    ].map((item, i) => (
                      <div key={i}>
                        <p className="text-[10px] text-emerald-600 font-semibold">{item.label}</p>
                        <p className="text-xs text-emerald-800 font-black">{item.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {gstStatus === "age_error" && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex gap-3">
                    <HiOutlineExclamationTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-800 text-sm">GST Too New — Not Eligible</h4>
                      <p className="text-xs text-red-700 mt-1 leading-relaxed">{gstMessage}</p>
                      <div className="mt-3 bg-red-100 rounded-xl p-3 text-xs text-red-700">
                        <p className="font-bold mb-1">Why do we require 2-year old GST?</p>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>Ensures seller is an established business</li>
                          <li>Protects buyers from fraudulent sellers</li>
                          <li>Maintains marketplace quality standards</li>
                          <li>Required per IndiaMart Trust Policy</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {gstStatus === "invalid" && gstMessage && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
                  <HiOutlineExclamationTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{gstMessage}</p>
                </div>
              )}

              {/* GST Format Help */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-700 mb-2">📋 GST Number Format Guide</p>
                <div className="font-mono text-xs text-center bg-white rounded-lg p-3 border border-gray-200 mb-3 tracking-widest text-gray-600">
                  <span className="bg-blue-100 text-blue-700 px-1 rounded">27</span>
                  <span className="bg-green-100 text-green-700 px-1 rounded mx-0.5">AABCT1234H</span>
                  <span className="bg-amber-100 text-amber-700 px-1 rounded">1</span>
                  <span className="bg-purple-100 text-purple-700 px-1 rounded mx-0.5">Z</span>
                  <span className="bg-red-100 text-red-700 px-1 rounded">5</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-gray-500">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-100 rounded" />State Code (2 digits)</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-100 rounded" />PAN Number (10 chars)</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-100 rounded" />Entity Number</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-purple-100 rounded" />'Z' (default)</div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5 — Trust & Certifications ── */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <HiOutlineShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800">Trust & Compliance</h2>
                  <p className="text-xs text-gray-500">Add certifications to boost buyer confidence</p>
                </div>
              </div>

              {/* GST Summary */}
              {form.gstVerified && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                  <HiOutlineCheckBadge className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-800">GST Verified ✓</p>
                    <p className="text-[10px] text-emerald-600">{form.gstNumber} • 2+ years old</p>
                  </div>
                  <span className="ml-auto bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">VERIFIED</span>
                </div>
              )}

              {/* Certifications */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Certifications</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_CERTS.map((c) => (
                    <button key={c} type="button" onClick={() => toggleArray("certifications", c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        form.certifications.includes(c)
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}>
                      {form.certifications.includes(c) ? "✓ " : ""}{c}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={certInput} onChange={(e) => setCertInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("certifications", certInput, () => setCertInput("")); } }}
                    placeholder="Add custom certification…"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  <button type="button" onClick={() => addTag("certifications", certInput, () => setCertInput(""))}
                    className="px-3 py-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition">
                    <HiOutlinePlusCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Payment terms */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Terms Accepted</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_TERMS.map((pt) => (
                    <button key={pt.value} type="button" onClick={() => toggleArray("paymentTerms", pt.value)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-medium border text-left transition ${
                        form.paymentTerms.includes(pt.value)
                          ? "border-[#0052cc] bg-blue-50 text-[#0052cc]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <HiOutlineCheckCircle className="w-4 h-4 text-blue-600" />
                  Profile Summary
                </h4>
                <div className="space-y-2">
                  {[
                    { label: "Company", val: form.companyName || "—" },
                    { label: "Type", val: form.businessType || "—" },
                    { label: "Location", val: [form.city, form.state].filter(Boolean).join(", ") || "—" },
                    { label: "GST", val: form.gstVerified ? `${form.gstNumber} ✓ Verified` : "Not verified" },
                    { label: "Certifications", val: form.certifications.length > 0 ? form.certifications.join(", ") : "None" },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-start gap-2 text-xs">
                      <span className="text-gray-500 w-24 shrink-0">{label}:</span>
                      <span className="text-gray-800 font-medium flex-1 break-all">{val}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-blue-600 font-medium mt-3">
                  ✓ After saving, your verified profile will be visible to all buyers.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8 mt-6 border-t border-gray-100">
            <button type="button" onClick={prevStep} disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition">
              <HiArrowLeft className="w-4 h-4" /> Back
            </button>

            <span className="text-xs text-gray-400">Step {step} of {STEPS.length}</span>

            {step < 5 ? (
              <button type="button" onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0052cc] text-white text-sm font-bold rounded-xl hover:bg-[#003d99] transition shadow-md shadow-blue-200">
                Next <HiArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0052cc] to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-[#003d99] hover:to-indigo-700 disabled:opacity-50 transition shadow-md">
                {submitting ? "Saving…" : "Complete Setup"}
                {!submitting && <HiOutlineCheckCircle className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Skip link */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Want to set up later?{" "}
          <button onClick={() => router.push("/seller/dashboard")} className="text-blue-500 hover:underline">
            Skip for now
          </button>
        </p>
      </div>
    </div>
  );
}
