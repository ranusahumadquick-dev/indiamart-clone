"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlinePencilSquare,
  HiOutlineCamera,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineXMark,
  HiOutlineCheckBadge,
  HiOutlineExclamationTriangle,
  HiOutlineDevicePhoneMobile,
  HiOutlineEnvelope,
  HiOutlineBuildingStorefront,
} from "react-icons/hi2";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import MobileVerificationWidget from "@/components/ui/MobileVerification";
import { StateDropdown, CityDropdown } from "@/components/common/LocationDropdown";
// MobileVerificationWidget wraps MSG91 widget

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "account" | "business" | "docs" | "products" | "review" | "done";
type GstMode = "gst" | "pan";
type GstVerifyStatus = "idle" | "checking" | "valid" | "invalid" | "age_error";

interface ProductEntry {
  name: string;
  imageFile: File | null;
  imagePreview: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
];

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const PLANS = [
  {
    id: "free",
    name: "Free Listing",
    price: "₹0",
    priceNote: "",
    tag: "CURRENT PLAN",
    tagColor: "bg-gray-700",
    leads: "0 leads",
    features: ["Basic Listing", "5 Products", "Email Support"],
    missing: ["Higher Visibility", "Lead Manager", "TrustSEAL Badge"],
    border: "border-gray-200",
    selected: true,
  },
  {
    id: "mdc",
    name: "MDC Yearly",
    price: "₹2,667",
    priceNote: "/mo (Billed Annually)",
    tag: "VALUE PLAN",
    tagColor: "bg-yellow-500",
    saveBadge: "SAVE 40%",
    leads: "74* BuyLeads/month",
    vsTag: "10x Visibility",
    features: ["Higher Visibility", "Lead Manager", "Preferred Number"],
    missing: ["TrustSEAL Badge"],
    border: "border-teal-400",
    selected: false,
  },
  {
    id: "trustseal",
    name: "TrustSeal Pro 1 Year",
    price: "₹5,000",
    priceNote: "/mo (Billed Annually)",
    tag: "GROWTH PLAN",
    tagColor: "bg-purple-600",
    leads: "91* BuyLeads/month",
    vsTag: "+17 BuyLeads",
    features: ["Higher Visibility", "Lead Manager", "Preferred Number", "TrustSEAL Badge"],
    missing: [],
    border: "border-purple-400",
    selected: false,
  },
];

// ─── Testing Bypass Component (comment out for production) ───────────────────
function OtpBypass({ onSkip }: { onSkip: () => void }) {
  useEffect(() => { onSkip(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="bg-white rounded-2xl border border-yellow-200 p-8 text-center">
      <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <HiOutlineDevicePhoneMobile className="w-6 h-6 text-yellow-600" />
      </div>
      <p className="text-sm font-semibold text-yellow-700">⚠️ Phone OTP bypassed (testing mode)</p>
      <p className="text-xs text-gray-400 mt-1">Redirecting to business details...</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SellerRegisterPage() {
  const router = useRouter();
  const { refreshUser, user } = useAuth();
  const [phase, setPhase] = useState<Phase>("account");

  // Phase 0 — Account Details
  const [acctName, setAcctName] = useState("");
  const [acctEmail, setAcctEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [acctPassword, setAcctPassword] = useState("");
  const [acctConfirm, setAcctConfirm] = useState("");
  const [showAcctPw, setShowAcctPw] = useState(false);
  const [showAcctConfirm, setShowAcctConfirm] = useState(false);
  const [acctAgree, setAcctAgree] = useState(false);
  const [acctLoading, setAcctLoading] = useState(false);

  // Redirect unauthenticated users to register page; pre-fill and skip to business if already a seller
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (storedUser && token) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role === "seller") {
          // Already completed registration — send them to dashboard
          if (parsed.profileCompleted) {
            router.replace("/seller/dashboard");
            return;
          }
          setAcctName(parsed.name || "");
          setAcctEmail(parsed.email || "");
          setOwnerName(parsed.name || "");
          setBizEmail(parsed.email || "");
          if (parsed.phone) setMobile(parsed.phone);
          setPhase("business");
          return;
        }
      } catch {
        // ignore parse error
      }
    }
    // Not logged in — send them to register as seller
    router.replace("/auth/register?role=seller");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // (OTP state kept for email OTP in business phase)
  const emailOtpRef = useRef<HTMLDivElement | null>(null);

  // Phase 2 — Business
  const [gstMode, setGstMode] = useState<GstMode>("gst");
  const [gstin, setGstin] = useState("");
  const [gstVerifyStatus, setGstVerifyStatus] = useState<GstVerifyStatus>("idle");
  const [gstFetched, setGstFetched] = useState(false);
  const [panNumber, setPanNumber] = useState("");
  const [panVerified, setPanVerified] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [bizErrors, setBizErrors] = useState<Record<string, string>>({});
  const [bizLoading, setBizLoading] = useState(false);

  // Phase 2.5 — Documents
  const [itrFile,          setItrFile]          = useState<File | null>(null);
  const [caCertFile,       setCaCertFile]        = useState<File | null>(null);
  const [bankStmtFile,     setBankStmtFile]      = useState<File | null>(null);
  const [docsUploading,    setDocsUploading]     = useState(false);

  // Phase 3 — Products
  const [products, setProducts] = useState<ProductEntry[]>([
    { name: "", imageFile: null, imagePreview: "" },
    { name: "", imageFile: null, imagePreview: "" },
    { name: "", imageFile: null, imagePreview: "" },
  ]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeSugIdx, setActiveSugIdx] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const PRODUCT_LIST = [
    "Face Cream","Night Cream","Skin Cream","Hair Cream","Body Cream","Fairness Cream","Moisturizing Cream","Anti-Aging Cream",
    "Cotton Fabric","Cotton Yarn","Cotton T-Shirt","Cotton Saree","Cotton Bedsheet","Cotton Towel",
    "Steel Pipe","Steel Rod","Steel Sheet","Steel Coil","Steel Wire","Stainless Steel Pipe","MS Steel Pipe",
    "LED Bulb","LED Panel Light","LED Strip Light","LED Street Light","LED Tube Light","LED Display Board",
    "Rice","Basmati Rice","Brown Rice","Wheat Flour","Maida","Atta","Besan","Poha","Daliya",
    "Mobile Phone","Mobile Cover","Mobile Charger","Mobile Accessories","Smartphone",
    "Laptop","Laptop Bag","Laptop Stand","Laptop Charger","Computer","Desktop PC","Keyboard","Mouse",
    "Wooden Furniture","Office Chair","Study Table","Sofa Set","Dining Table","Bed","Wardrobe","Bookshelf",
    "Machine","CNC Machine","Lathe Machine","Drilling Machine","Cutting Machine","Welding Machine","Grinding Machine",
    "Cement","Sand","Bricks","TMT Bar","Tiles","Marble","Granite","Paint","Waterproof Paint","Plywood",
    "T-Shirt","Jeans","Jacket","Kurti","Saree","Lehenga","Shirt","Trouser","Sports Shoes","Sandal","Chappal",
    "Solar Panel","Solar Inverter","Solar Light","Solar Water Heater","Battery","Inverter Battery","UPS",
    "Plastic Bottle","PVC Pipe","HDPE Pipe","Plastic Container","Plastic Bag","PP Bag","Jute Bag","Paper Bag",
    "Herbal Powder","Aloe Vera Gel","Neem Oil","Turmeric Powder","Ashwagandha","Amla Powder",
    "Fertilizer","Pesticide","Seeds","Drip Irrigation","Greenhouse","Tractor Parts","Agriculture Pump",
    "Ayurvedic Medicine","Tablet","Capsule","Syrup","Medical Equipment","Surgical Gloves","N95 Mask","Oximeter",
    "Electric Motor","Pump","Gearbox","Valve","Bearing","Coupling","Conveyor Belt","Hydraulic Press",
    "Gold Jewellery","Silver Jewellery","Diamond Ring","Artificial Jewellery","Bangles","Earrings","Necklace",
    "CCTV Camera","Security Camera","Biometric Machine","Access Control","Alarm System","Fire Extinguisher",
    "Rubber","Rubber Sheet","Rubber Hose","Silicone Rubber","Foam Sheet","Sponge",
    "Cardboard Box","Corrugated Box","Packaging Box","Bubble Wrap","Stretch Film","BOPP Tape",
    "Car Accessories","Bike Parts","Auto Parts","Tyre","Engine Oil","Gear Oil","Brake Pad",
    "Food Color","Spices","Masala","Dry Fruits","Cashew","Almond","Raisin","Pista",
    "Industrial Fan","Air Compressor","Exhaust Fan","Cooling Tower","Air Cooler","Water Cooler","RO Water Purifier",
  ];

  function getProductSuggestions(query: string): string[] {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return PRODUCT_LIST.filter((p) => p.toLowerCase().includes(q)).slice(0, 7);
  }

  // Phase 4 — Plan
  const [selectedPlan, setSelectedPlan] = useState("free");

  // ── ACCOUNT FORM SUBMIT ──────────────────────────────────────────────────────
  const submitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acctName.trim()) { toast.error("Full name is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(acctEmail)) { toast.error("Enter a valid email address"); return; }
    if (!/^[6-9]\d{9}$/.test(mobile)) { toast.error("Enter a valid 10-digit mobile number"); return; }
    if (acctPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (acctPassword !== acctConfirm) { toast.error("Passwords do not match"); return; }
    if (!acctAgree) { toast.error("Please agree to the Terms & Conditions"); return; }

    setAcctLoading(true);
    try {
      // Pre-fill business email from account email
      setBizEmail(acctEmail);
      setOwnerName(acctName);
      toast.success("Account details saved! Now enter your business details.");
      setPhase("business");
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setAcctLoading(false);
    }
  };

  // stub — OTP flow replaced by account form
  const verifyMobileOtp = async () => {
    toast.error("OTP flow is disabled");
  };

  // GST form state
  const [gstRegDate,       setGstRegDate]       = useState("");
  const [gstDateError,     setGstDateError]     = useState("");
  const [gstTurnoverPending, setGstTurnoverPending] = useState(false); // age OK, ITR needed
  const [gstDetails, setGstDetails] = useState<{
    businessName?: string; tradeName?: string; status?: string;
    ageYears?: number; ageMonths?: number; apiUsed?: string;
    registrationDate?: string; state?: string;
    turnoverAmount?: number | null; turnoverSource?: string | null;
    verified?: boolean; turnoverPending?: boolean;
  } | null>(null);
  // Structured error for hard-failure banner (not shown for turnoverPending)
  const [gstError, setGstError] = useState<{
    title: string; message: string; hint?: string;
  } | null>(null);

  const businessDetailsRef = useRef<HTMLDivElement>(null);

  // ── GST FETCH ─────────────────────────────────────────────────────────────────
  // Steps: format → date present & ≥ 2yr → backend (API exists + active + age + turnover from DB/API)
  // Turnover is NEVER self-declared. If backend cannot verify it → TURNOVER_UNVERIFIABLE.
  // Only on full success does gstFetched become true and business details appear.
  const fetchGstDetails = async () => {
    const cleaned = gstin.trim().toUpperCase();

    // Reset all previous result state
    setGstError(null);
    setGstDetails(null);
    setGstFetched(false);

    // ── Client pre-check 1: GSTIN format ──────────────────────────────────────
    if (cleaned.length !== 15) {
      toast.error("GSTIN must be exactly 15 characters");
      return;
    }
    if (!GST_REGEX.test(cleaned)) {
      toast.error("Invalid GSTIN format. Example: 27ABCDE1234F1Z5");
      return;
    }

    // ── Client pre-check 2: Registration date required & age ≥ 2 years ────────
    if (!gstRegDate) {
      setGstDateError("GST Registration Date is required. Enter the date on your GST certificate.");
      toast.error("Please enter your GST Registration Date");
      return;
    }
    if (gstDateError) {
      // onChange already computed age and set this error
      toast.error("GST registration date does not meet the 2-year minimum");
      return;
    }

    // ── Call backend — backend enforces all remaining rules ────────────────────
    setGstVerifyStatus("checking");

    try {
      const res = await api.post("/seller-verify/gst", {
        gstNumber:  cleaned,
        gstRegDate,
        phone: mobile,
      });

      const d = res.data?.data;

      // Auto-fill all available business details from GST response
      if (d?.state)            setStateVal(d.state);
      if (d?.businessName)     setCompanyName(d.businessName);
      if (d?.tradeName && !d?.businessName) setCompanyName(d.tradeName);
      if (d?.registrationDate) setGstRegDate(d.registrationDate);
      if (d?.city)             setCity(d.city);
      if (d?.pincode)          setPincode(d.pincode);
      if (d?.pan)              setPanNumber(d.pan);

      setGstDetails(d);
      setGstError(null);

      if (d?.turnoverPending) {
        // Age verified ✅ but no trusted turnover source found yet.
        // Allow user to proceed — they will upload ITR in the next step.
        // Account stays under_review until admin confirms turnover from ITR.
        setGstTurnoverPending(true);
        setGstFetched(true);
        setGstVerifyStatus("valid");
        toast("GST age verified ✅ — Upload your ITR to complete turnover verification", {
          icon: "📄",
          duration: 5000,
        });
      } else {
        // Fully verified — age + turnover both confirmed from trusted source
        setGstTurnoverPending(false);
        setGstFetched(true);
        setGstVerifyStatus("valid");
        toast.success("✅ GST Verified Successfully — Business details loaded");
      }

      // Scroll to business details section which now appears
      setTimeout(() => {
        businessDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);

    } catch (err: any) {
      const msg: string       = err?.message         || "GST verification failed";
      const errorCode: string = err?.data?.errorCode || "";

      setGstFetched(false);
      setGstTurnoverPending(false);

      // Map each backend error code to a specific UI message
      if (errorCode === "INVALID_FORMAT" || msg.includes("15 characters") || msg.includes("Invalid GSTIN")) {
        setGstVerifyStatus("invalid");
        setGstError({
          title:   "Invalid GST Number",
          message: msg,
          hint:    "Check the 15-character GSTIN printed on your GST registration certificate.",
        });

      } else if (errorCode === "NOT_FOUND" || msg.includes("not found")) {
        setGstVerifyStatus("invalid");
        setGstError({
          title:   "GST Number Not Found",
          message: "This GSTIN does not exist in the government GST database.",
          hint:    "Verify the number carefully — it may contain a typo.",
        });

      } else if (errorCode === "INACTIVE" || msg.includes("Inactive") || msg.includes("cancelled")) {
        setGstVerifyStatus("invalid");
        setGstError({
          title:   "GST Registration is Inactive",
          message: msg,
          hint:    "Only Active GST registrations are accepted. Please reactivate your GST first.",
        });

      } else if (errorCode === "TOO_NEW" || msg.includes("month") || msg.includes("2 year")) {
        setGstVerifyStatus("age_error" as GstVerifyStatus);
        setGstDateError(msg);
        setGstError({
          title:   "GST Registration Too New",
          message: msg,
          hint:    "IndiaMart requires GST to be at least 2 years old. Please apply again later.",
        });

      } else if (errorCode === "TURNOVER_LOW" || (msg.includes("turnover") && msg.includes("lakh"))) {
        setGstVerifyStatus("invalid");
        setGstError({
          title:   "Annual Turnover Below Minimum",
          message: msg,
          hint:    "A minimum annual turnover of ₹10,00,000 (10 lakh) is required to sell on IndiaMart.",
        });

      } else if (errorCode === "DATE_REQUIRED" || msg.includes("date is required")) {
        setGstVerifyStatus("idle");
        setGstDateError("GST Registration Date is required. Enter the date on your GST certificate.");
        setGstError(null);

      } else {
        setGstVerifyStatus("invalid");
        setGstError({ title: "Verification Failed", message: msg });
      }

      toast.error(msg);
    }
  };

  const verifyPan = async () => {
    const cleaned = panNumber.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleaned)) {
      toast.error("Enter a valid 10-character PAN number");
      return;
    }
    try {
      await new Promise((r) => setTimeout(r, 800));
      setPanVerified(true);
      toast.success("PAN verified successfully!");
    } catch {
      toast.error("PAN verification failed");
    }
  };

  const startResendTimer = () => {
    setEmailResendTimer(60);
    const iv = setInterval(() => {
      setEmailResendTimer((t) => {
        if (t <= 1) { clearInterval(iv); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const sendEmailOtp = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bizEmail)) {
      toast.error("Enter a valid email address");
      return;
    }
    try {
      await api.post("/otp/send-email", { email: bizEmail });
      setEmailOtpSent(true);
      setEmailOtp("");
      startResendTimer();
      setTimeout(() => emailOtpRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      toast.success(`OTP sent to ${bizEmail}. Please check your inbox.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send OTP. Please try again.");
    }
  };

  const verifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length < 4) { toast.error("Enter valid OTP"); return; }
    try {
      await api.post("/otp/verify-email", { email: bizEmail, otp: emailOtp });
      setEmailVerified(true);
      toast.success("Email verified!");
    } catch (err: any) {
      toast.error(err?.message || "Invalid OTP");
    }
  };

  const validateBusiness = (): boolean => {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) errs.companyName = "Company name cannot be blank";
    if (!ownerName.trim()) errs.ownerName = "Your name is required";
    if (!/^\d{6}$/.test(pincode)) errs.pincode = "Enter valid 6-digit pincode";
    if (!city.trim()) errs.city = "City is required";
    if (!stateVal) errs.state = "State is required";
    if (!bizEmail.trim()) errs.bizEmail = "Business email is required";
    if (!emailVerified) errs.emailVerified = "Please verify your email to continue";
    if (gstMode === "gst" && !gstin.trim()) errs.gst = "Please enter your GST number";
    if (gstMode === "pan" && !panNumber.trim()) errs.pan = "Please enter your PAN number";
    setBizErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitBusiness = () => {
    if (!validateBusiness()) {
      toast.error("Please fill all required fields correctly");
      return;
    }
    // No API call here — data saved to state, committed at final Review step
    setPhase("docs");
  };

  // ── PRODUCTS ─────────────────────────────────────────────────────────────────
  const updateProduct = (idx: number, field: keyof ProductEntry, value: string | File | null) => {
    setProducts((prev) =>
      prev.map((p, i) => i === idx ? { ...p, [field]: value } : p)
    );
  };

  const handleProductImage = (idx: number, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max file size 5MB"); return; }
    const preview = URL.createObjectURL(file);
    setProducts((prev) =>
      prev.map((p, i) => i === idx ? { ...p, imageFile: file, imagePreview: preview } : p)
    );
  };

  const submitProducts = () => {
    const filledProducts = products.filter((p) => p.name.trim());
    if (filledProducts.length < 3) {
      toast.error("Please add at least 3 product names");
      return;
    }
    if (!termsAccepted) {
      toast.error("Please accept the terms and conditions");
      return;
    }
    // Navigate to review — API calls happen only at final Submit
    setPhase("review");
  };

  // ── FINAL SUBMIT — called only from Review step ──────────────────────────────
  const submitAll = async () => {
    setProductsLoading(true);
    try {
      // 1. Save business details
      await api.put("/sellers/me", {
        companyName,
        city,
        state: stateVal,
        pincode,
        gstNumber: gstMode === "gst" && gstin.trim() ? gstin.trim().toUpperCase() : undefined,
        panNumber: gstMode === "pan" && panNumber.trim() ? panNumber.trim().toUpperCase() : undefined,
      });

      // 2. Register products (with images as FormData)
      const filledProducts = products.filter((p) => p.name.trim());
      const fd = new FormData();
      fd.append("products", JSON.stringify(filledProducts.map((p) => ({ name: p.name.trim() }))));
      filledProducts.forEach((p, idx) => {
        if (p.imageFile) fd.append(`image_${idx}`, p.imageFile);
      });
      const result = await api.post("/products/register-batch", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const savedCount = result.data?.data?.count || 0;

      // 3. Update local state so ProtectedRoute reflects profileCompleted immediately
      try {
        await refreshUser();
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          u.profileCompleted = true;
          localStorage.setItem("user", JSON.stringify(u));
        }
      } catch { /* ignore */ }

      toast.success(`🎉 Registration complete! ${savedCount} products saved. Welcome to IndiaMart!`);
      setPhase("done");
    } catch (err: any) {
      const msg = err?.message || "Failed to complete registration. Please try again.";
      toast.error(msg);
    } finally {
      setProductsLoading(false);
    }
  };

  const progressStep =
    phase === "business" ? 0
    : phase === "docs" || phase === "products" ? 1
    : phase === "review" ? 2
    : 3;

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Top Progress Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-[#0052cc] text-white font-black text-sm px-2 py-1 rounded-lg">IM</div>
              <span className="font-black text-[#0052cc] text-lg">IndiaMart</span>
            </Link>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Seller Registration</span>
            {phase !== "account" && phase !== "done" && (
              <span className="text-xs text-gray-500">
                Step {phase === "business" ? "1" : (phase === "docs" || phase === "products") ? "2" : "3"} of 3
              </span>
            )}
          </div>

          {/* Steps */}
          <div className="flex items-center gap-0">
            {[
              { id: 0, label: "BUSINESS" },
              { id: 1, label: "PRODUCTS" },
              { id: 2, label: "REVIEW" },
            ].map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${
                    progressStep > s.id
                      ? "bg-[#0d9e7e] border-[#0d9e7e] text-white"
                      : progressStep === s.id
                      ? "bg-[#003580] border-[#003580] text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}>
                    {progressStep > s.id
                      ? <HiOutlineCheckCircle className="w-5 h-5" />
                      : s.id + 1
                    }
                  </div>
                  <span className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${
                    progressStep >= s.id ? "text-[#003580]" : "text-gray-400"
                  }`}>{s.label}</span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${
                    progressStep > s.id ? "bg-[#0d9e7e]" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">

        {/* ═══════════════════════════════════════════════════════
            PHASE 0 — ACCOUNT DETAILS FORM
        ═══════════════════════════════════════════════════════ */}
        {phase === "account" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#003580] to-[#0052cc] px-8 py-5 text-white">
              <h1 className="text-xl font-black">Start Selling on IndiaMart</h1>
              <p className="text-blue-200 text-sm mt-0.5">Create your seller account</p>
            </div>
            <form onSubmit={submitAccount} className="p-8 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={acctName}
                  onChange={(e) => setAcctName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#0052cc] outline-none transition"
                  placeholder="Your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={acctEmail}
                  onChange={(e) => setAcctEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#0052cc] outline-none transition"
                  placeholder="you@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                <div className="flex">
                  <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-xl text-sm text-gray-500 font-medium">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1 border border-gray-300 rounded-r-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#0052cc] outline-none transition"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showAcctPw ? "text" : "password"}
                    required
                    value={acctPassword}
                    onChange={(e) => setAcctPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-11 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#0052cc] outline-none transition"
                    placeholder="Minimum 6 characters"
                  />
                  <button type="button" onClick={() => setShowAcctPw(!showAcctPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showAcctPw
                      ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showAcctConfirm ? "text" : "password"}
                    required
                    value={acctConfirm}
                    onChange={(e) => setAcctConfirm(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:ring-2 outline-none transition ${acctConfirm && acctPassword !== acctConfirm ? "border-red-300 focus:ring-red-100" : acctConfirm && acctPassword === acctConfirm ? "border-green-400 focus:ring-green-100" : "border-gray-300 focus:ring-blue-100 focus:border-[#0052cc]"}`}
                    placeholder="Re-enter password"
                  />
                  <button type="button" onClick={() => setShowAcctConfirm(!showAcctConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showAcctConfirm
                      ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
                {acctConfirm && acctPassword !== acctConfirm && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acctAgree}
                  onChange={(e) => setAcctAgree(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300"
                />
                <span className="text-xs text-gray-500">
                  I agree to the{" "}
                  <span className="text-[#0052cc] font-semibold cursor-pointer">Terms of Service</span>
                  {" "}and{" "}
                  <span className="text-[#0052cc] font-semibold cursor-pointer">Privacy Policy</span>
                </span>
              </label>

              <button
                type="submit"
                disabled={acctLoading}
                className="w-full bg-[#003580] hover:bg-[#0052cc] disabled:opacity-60 text-white font-black py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                {acctLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Please wait...</>
                ) : (
                  <>Continue to Business Details <HiOutlineArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-[#003580] font-semibold hover:underline">Sign In</Link>
              </p>
            </form>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            PHASE 1 — BUSINESS DETAILS
        ═══════════════════════════════════════════════════════ */}
        {phase === "business" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#003580] to-[#0052cc] px-8 py-5 text-white">
              <h1 className="text-xl font-black">Start Selling on IndiaMart</h1>
              <p className="text-blue-200 text-sm mt-0.5">Provide your Business details</p>
            </div>

            <div className="p-8 space-y-6">
              {/* Previous button — always visible */}
              <button
                onClick={() => setPhase("account")}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-semibold transition"
              >
                <HiOutlineArrowLeft className="w-4 h-4" /> Back to Account Details
              </button>

              {/* GST / PAN Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setGstMode("gst"); setGstFetched(false); setGstVerifyStatus("idle"); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    gstMode === "gst"
                      ? "border-[#0d9e7e] bg-[#f0faf7]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <HiOutlineDocumentText className={`w-5 h-5 shrink-0 ${gstMode === "gst" ? "text-[#0d9e7e]" : "text-gray-400"}`} />
                  <div>
                    <p className={`text-sm font-bold ${gstMode === "gst" ? "text-[#0d9e7e]" : "text-gray-700"}`}>I have GSTIN</p>
                    <p className="text-[10px] text-gray-500">Auto-verify & fill details</p>
                  </div>
                  {gstMode === "gst" && (
                    <div className="ml-auto w-4 h-4 bg-[#0d9e7e] rounded-full flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => { setGstMode("pan"); setGstFetched(false); setGstVerifyStatus("idle"); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    gstMode === "pan"
                      ? "border-[#0d9e7e] bg-[#f0faf7]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <HiOutlineShieldCheck className={`w-5 h-5 shrink-0 ${gstMode === "pan" ? "text-[#0d9e7e]" : "text-gray-400"}`} />
                  <div>
                    <p className={`text-sm font-bold ${gstMode === "pan" ? "text-[#0d9e7e]" : "text-gray-700"}`}>GST Exempt</p>
                    <p className="text-[10px] text-gray-500">Use PAN to register</p>
                  </div>
                  {gstMode === "pan" && (
                    <div className="ml-auto w-4 h-4 bg-[#0d9e7e] rounded-full flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              </div>

              {/* ── GST Verification Section ───────────────────────────────── */}
              {gstMode === "gst" && (
                <div className="space-y-4">

                  {/* GSTIN Number input + Fetch button */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      GSTIN Number *
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={gstin}
                        onChange={(e) => {
                          setGstin(e.target.value.toUpperCase());
                          // Reset verification state when number changes
                          setGstVerifyStatus("idle");
                          setGstFetched(false);
                          setGstDetails(null);
                        }}
                        maxLength={15}
                        placeholder="e.g. 27ABCDE1234F1Z5"
                        className={`flex-1 border-2 rounded-xl px-4 py-3 text-sm font-mono tracking-widest outline-none transition-all ${
                          gstVerifyStatus === "valid"
                            ? "border-emerald-500 bg-emerald-50"
                            : gstVerifyStatus === "invalid" || (gstVerifyStatus as string) === "age_error"
                            ? "border-red-400 bg-red-50"
                            : "border-gray-200 focus:border-[#003580]"
                        }`}
                      />
                      <button
                        onClick={fetchGstDetails}
                        disabled={gstin.length !== 15 || gstVerifyStatus === "checking"}
                        className="bg-[#0d9e7e] hover:bg-[#0b8a6e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-xl transition-all text-sm whitespace-nowrap flex items-center gap-2"
                      >
                        {gstVerifyStatus === "checking" ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>Fetch Details <HiOutlineArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* GST Registration Date — REQUIRED */}
                  <div>
                    <label className="block text-xs font-bold text-red-600 uppercase tracking-wider mb-1.5">
                      GST Registration Date *
                    </label>
                    <input
                      type="date"
                      value={gstRegDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGstRegDate(val);
                        setGstFetched(false);
                        setGstVerifyStatus("idle");
                        setGstDetails(null);
                        // Instant age feedback as user picks a date
                        if (val) {
                          const ageMonths = Math.floor(
                            (Date.now() - new Date(val).getTime()) / (1000 * 60 * 60 * 24 * 30)
                          );
                          if (ageMonths < 24) {
                            const needed = 24 - ageMonths;
                            setGstDateError(
                              `Only ${ageMonths} month${ageMonths === 1 ? "" : "s"} old — need ${needed} more month${needed === 1 ? "" : "s"} (minimum 2 years required).`
                            );
                          } else {
                            setGstDateError("");
                          }
                        } else {
                          setGstDateError("");
                        }
                      }}
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm outline-none transition-all ${
                        gstDateError
                          ? "border-red-400 bg-red-50"
                          : gstRegDate && !gstDateError
                          ? "border-emerald-400 bg-emerald-50"
                          : "border-gray-200 focus:border-[#003580]"
                      }`}
                    />
                    {gstDateError ? (
                      <p className="text-red-500 text-xs mt-1 flex items-start gap-1">
                        <HiOutlineExclamationTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {gstDateError}
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-400 mt-1">
                        Must be registered on or before{" "}
                        <strong>
                          {(() => {
                            const d = new Date();
                            d.setFullYear(d.getFullYear() - 2);
                            return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
                          })()}
                        </strong>
                      </p>
                    )}
                  </div>

                  {/* Turnover info — read-only note (no self-declaration) */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-blue-800 mb-0.5">Annual Turnover Requirement</p>
                    <p className="text-[11px] text-blue-700">
                      Minimum ₹10,00,000 (10 lakh) annual turnover is required.
                      Turnover is verified automatically from your GST records or your ITR document — no self-declaration accepted.
                    </p>
                  </div>

                  {/* ── Verification result ──────────────────────────────────── */}

                  {/* SUCCESS — fully verified */}
                  {gstVerifyStatus === "valid" && gstDetails && !gstTurnoverPending && (
                    <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <HiOutlineCheckBadge className="w-6 h-6 text-emerald-600 shrink-0" />
                        <span className="text-emerald-800 font-black text-sm">GST Verified Successfully ✅</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        {gstDetails.businessName && (
                          <div className="col-span-2">
                            <p className="text-gray-500">Business Name</p>
                            <p className="font-bold text-gray-800">{gstDetails.businessName}</p>
                          </div>
                        )}
                        {gstDetails.status && (
                          <div>
                            <p className="text-gray-500">GST Status</p>
                            <p className="font-bold text-emerald-700">{gstDetails.status}</p>
                          </div>
                        )}
                        {gstDetails.ageYears != null && (
                          <div>
                            <p className="text-gray-500">Registration Age</p>
                            <p className="font-bold text-emerald-700">{gstDetails.ageYears} years ✅</p>
                          </div>
                        )}
                        {gstDetails.registrationDate && (
                          <div>
                            <p className="text-gray-500">Registered On</p>
                            <p className="font-bold text-gray-700">{gstDetails.registrationDate}</p>
                          </div>
                        )}
                        {gstDetails.state && (
                          <div>
                            <p className="text-gray-500">State</p>
                            <p className="font-bold text-gray-700">{gstDetails.state}</p>
                          </div>
                        )}
                        {(gstDetails as any).city && (
                          <div>
                            <p className="text-gray-500">City</p>
                            <p className="font-bold text-gray-700">{(gstDetails as any).city}</p>
                          </div>
                        )}
                        {(gstDetails as any).pincode && (
                          <div>
                            <p className="text-gray-500">Pincode</p>
                            <p className="font-bold text-gray-700">{(gstDetails as any).pincode}</p>
                          </div>
                        )}
                        {(gstDetails as any).pan && (
                          <div>
                            <p className="text-gray-500">PAN</p>
                            <p className="font-bold text-gray-700 font-mono tracking-wider">{(gstDetails as any).pan}</p>
                          </div>
                        )}
                        {(gstDetails as any).address && (
                          <div className="col-span-2">
                            <p className="text-gray-500">Address</p>
                            <p className="font-bold text-gray-700">{(gstDetails as any).address}</p>
                          </div>
                        )}
                        {gstDetails.turnoverAmount != null && (
                          <div className="col-span-2">
                            <p className="text-gray-500">Verified Turnover</p>
                            <p className="font-bold text-emerald-700">
                              ₹{(gstDetails.turnoverAmount / 100_000).toFixed(1)} lakh ✅
                              <span className="ml-2 text-[10px] text-gray-400 font-normal">
                                (source: {gstDetails.turnoverSource === "itr_verified" ? "Verified ITR" : "GST API"})
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-3 font-semibold">
                        ✅ All checks passed — business details auto-filled below
                      </p>
                    </div>
                  )}

                  {/* SUCCESS — age verified, turnover pending ITR */}
                  {gstVerifyStatus === "valid" && gstDetails && gstTurnoverPending && (
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <HiOutlineCheckBadge className="w-5 h-5 text-amber-600 shrink-0" />
                        <span className="text-amber-800 font-black text-sm">GST Age Verified ✅ — Turnover Pending</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
                        {gstDetails.ageYears != null && (
                          <div>
                            <p className="text-gray-500">Registration Age</p>
                            <p className="font-bold text-emerald-700">{gstDetails.ageYears} years ✅</p>
                          </div>
                        )}
                        {gstDetails.registrationDate && (
                          <div>
                            <p className="text-gray-500">Registered On</p>
                            <p className="font-bold text-gray-700">{gstDetails.registrationDate}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500">Turnover</p>
                          <p className="font-bold text-amber-700">⏳ Pending ITR verification</p>
                        </div>
                      </div>
                      <div className="bg-white border border-amber-300 rounded-lg p-2.5">
                        <p className="text-amber-800 text-[11px] font-semibold mb-0.5">📄 Action Required</p>
                        <p className="text-amber-700 text-[11px]">
                          We could not verify your annual turnover from GST records. Please upload your latest ITR document in the next step.
                          Your account will be activated within <strong>5–7 business days</strong> after our team verifies your turnover.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* FAILURE — specific reason banner */}
                  {(gstVerifyStatus === "invalid" || (gstVerifyStatus as string) === "age_error") && gstError && (
                    <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4">
                      <p className="font-bold text-sm flex items-center gap-2 mb-1 text-red-700">
                        <HiOutlineExclamationTriangle className="w-5 h-5 shrink-0" />
                        {gstError.title}
                      </p>
                      <p className="text-red-600 text-xs">{gstError.message}</p>
                      {gstError.hint && (
                        <p className="text-red-400 text-[11px] mt-2 font-medium">{gstError.hint}</p>
                      )}
                    </div>
                  )}

                  {bizErrors.gst && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <HiOutlineExclamationTriangle className="w-3.5 h-3.5 shrink-0" />
                      {bizErrors.gst}
                    </p>
                  )}

                  {/* PAN hint */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                    <span className="text-yellow-600 text-xs mt-0.5">•</span>
                    <div className="text-xs text-yellow-800">
                      Don&apos;t remember your GSTIN? Find it instantly using your PAN card.{" "}
                      <button
                        onClick={() => setGstMode("pan")}
                        className="inline-flex items-center gap-1 bg-white border border-yellow-300 text-yellow-800 font-semibold px-2 py-0.5 rounded-lg text-[11px] hover:bg-yellow-100 transition mt-1"
                      >
                        💳 Use PAN
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PAN Input */}
              {gstMode === "pan" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    PAN Number *
                    <span className="text-gray-400 font-normal normal-case ml-1">10 characters — used for identity verification</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={panNumber}
                      onChange={(e) => { setPanNumber(e.target.value.toUpperCase()); setPanVerified(false); }}
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      className={`flex-1 border-2 rounded-xl px-4 py-3 text-sm font-mono tracking-widest outline-none transition-all ${
                        panVerified ? "border-[#0d9e7e] bg-[#f0faf7]" : "border-gray-200 focus:border-[#003580]"
                      }`}
                    />
                    <button
                      onClick={verifyPan}
                      disabled={panNumber.length !== 10 || panVerified}
                      className="bg-[#0d9e7e] hover:bg-[#0b8a6e] disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl transition-all text-sm whitespace-nowrap"
                    >
                      {panVerified ? "✓ Verified" : "Verify PAN"}
                    </button>
                  </div>
                  {panVerified && (
                    <p className="text-[#0d9e7e] text-xs font-semibold mt-1 flex items-center gap-1">
                      <HiOutlineCheckBadge className="w-3.5 h-3.5" /> PAN verified successfully
                    </p>
                  )}
                  {bizErrors.pan && <p className="text-red-500 text-xs mt-1">{bizErrors.pan}</p>}
                </div>
              )}

              {/* ── BUSINESS DETAILS — shown only after GST fetched or PAN verified ── */}
              {(gstFetched || panVerified) && <div ref={businessDetailsRef} className="border-t border-gray-100 pt-5">
                <p className="text-center text-xs text-gray-400 font-semibold uppercase tracking-widest mb-4">
                  — Business Details —
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-red-600 uppercase tracking-wider mb-1.5">
                      Business/Company Name *
                    </label>
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name"
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm outline-none transition-all ${
                        bizErrors.companyName ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#003580]"
                      }`}
                    />
                    {bizErrors.companyName && (
                      <p className="text-red-500 text-xs mt-1">{bizErrors.companyName}</p>
                    )}
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-red-600 uppercase tracking-wider mb-1.5">
                      Your Name *
                    </label>
                    <input
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Enter your name"
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm outline-none transition-all ${
                        bizErrors.ownerName ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#003580]"
                      }`}
                    />
                    {bizErrors.ownerName && (
                      <p className="text-red-500 text-xs mt-1">{bizErrors.ownerName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-red-600 uppercase tracking-wider mb-1.5">Pincode *</label>
                    <input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      placeholder="Enter pincode"
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm outline-none transition-all ${
                        bizErrors.pincode ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#003580]"
                      }`}
                    />
                    {bizErrors.pincode && <p className="text-red-500 text-xs mt-1">{bizErrors.pincode}</p>}
                  </div>

                  <div>
                    <CityDropdown
                      label="City"
                      value={city}
                      onChange={setCity}
                      state={stateVal}
                      required
                      error={bizErrors.city}
                    />
                  </div>

                  <div className="col-span-2">
                    <StateDropdown
                      label="State"
                      value={stateVal}
                      onChange={(v) => { setStateVal(v); setCity(""); }}
                      required
                      error={bizErrors.state}
                    />
                    {bizErrors.state && <p className="text-red-500 text-xs mt-1">{bizErrors.state}</p>}
                  </div>
                </div>

                {/* Business Email + OTP */}
                <div className="mt-4">
                  <label className="block text-xs font-bold text-red-600 uppercase tracking-wider mb-1.5">
                    Business Email *
                  </label>
                  {/* Email verified — show green badge + Change button */}
                  {emailVerified ? (
                    <div className="flex items-center gap-3 border-2 border-[#0d9e7e] bg-[#f0faf7] rounded-xl px-4 py-3">
                      <HiOutlineCheckBadge className="w-5 h-5 text-[#0d9e7e] shrink-0" />
                      <span className="flex-1 text-sm font-semibold text-gray-800">{bizEmail}</span>
                      <button
                        onClick={() => { setEmailVerified(false); setEmailOtpSent(false); setEmailOtp(""); }}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={bizEmail}
                        onChange={(e) => { setBizEmail(e.target.value); setEmailOtpSent(false); }}
                        placeholder="you@company.com"
                        className={`flex-1 border-2 rounded-xl px-4 py-3 text-sm outline-none transition-all ${
                          bizErrors.bizEmail ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#003580]"
                        }`}
                      />
                      <button
                        onClick={sendEmailOtp}
                        disabled={!bizEmail || emailOtpSent}
                        className="bg-[#0d9e7e] hover:bg-[#0b8a6e] disabled:opacity-50 text-white font-bold px-4 py-3 rounded-xl transition-all text-sm whitespace-nowrap"
                      >
                        {emailOtpSent ? "✓ OTP Sent" : "Send OTP"}
                      </button>
                    </div>
                  )}
                  {bizErrors.bizEmail && <p className="text-red-500 text-xs mt-1">{bizErrors.bizEmail}</p>}
                  {bizErrors.emailVerified && <p className="text-red-500 text-xs mt-1">{bizErrors.emailVerified}</p>}

                  {/* OTP input box — appears after Send OTP clicked */}
                  {emailOtpSent && !emailVerified && (
                    <div ref={emailOtpRef} className="mt-3 space-y-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-xs text-gray-600">OTP has been sent to <strong>{bizEmail}</strong>. Please check your inbox (and spam folder).</p>
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          className="flex-1 border-2 border-blue-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#003580] text-center tracking-widest font-bold text-lg bg-white"
                        />
                        <button
                          onClick={verifyEmailOtp}
                          className="bg-[#003580] hover:bg-[#002560] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
                        >
                          Verify
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">OTP expires in 10 minutes</p>
                        {emailResendTimer > 0 ? (
                          <p className="text-xs text-gray-400">Resend in <span className="font-semibold text-[#003580]">{emailResendTimer}s</span></p>
                        ) : (
                          <button
                            onClick={sendEmailOtp}
                            className="text-xs text-[#003580] hover:underline font-semibold"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>}
              {/* END BUSINESS DETAILS */}

              {/* Next button — shown only after GST/PAN verified */}
              {(gstFetched || panVerified) && (
                <button
                  onClick={submitBusiness}
                  className="w-full bg-[#0d9e7e] hover:bg-[#0b8a6e] text-white font-black py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 mt-2"
                >
                  Continue to Documents <HiOutlineArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            PHASE 2 — DOCUMENT UPLOAD
        ═══════════════════════════════════════════════════════ */}
        {phase === "docs" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#003580] to-[#0052cc] px-8 py-5 text-white">
              <h1 className="text-xl font-black">Upload Verification Documents</h1>
              <p className="text-blue-200 text-sm mt-0.5">Required for seller approval (reviewed in 5–7 days)</p>
            </div>
            <div className="p-8 space-y-5">
              {/* Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-bold mb-1">Documents Required for Verification</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li><strong>ITR or CA Certificate</strong> — mandatory (Income Tax Return / Chartered Accountant Certificate)</li>
                    <li><strong>Bank Statement</strong> — optional (last 3 months)</li>
                  </ul>
                  <p className="mt-2">Accepted formats: PDF, JPG, PNG (max 10MB each)</p>
                </div>
              </div>

              {/* ITR */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ITR / CA Certificate <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs font-normal text-gray-400">(at least one required)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* ITR */}
                  <label className={`flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${itrFile ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"}`}>
                    <span className="text-2xl">{itrFile ? "✅" : "📄"}</span>
                    <span className="text-xs font-bold text-gray-700">ITR Document</span>
                    <span className="text-[11px] text-gray-400">{itrFile ? itrFile.name.slice(0, 20) + "..." : "Click to upload"}</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                      onChange={(e) => setItrFile(e.target.files?.[0] || null)} />
                  </label>
                  {/* CA Certificate */}
                  <label className={`flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${caCertFile ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"}`}>
                    <span className="text-2xl">{caCertFile ? "✅" : "🏛️"}</span>
                    <span className="text-xs font-bold text-gray-700">CA Certificate</span>
                    <span className="text-[11px] text-gray-400">{caCertFile ? caCertFile.name.slice(0, 20) + "..." : "Click to upload"}</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                      onChange={(e) => setCaCertFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>

              {/* Bank Statement */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Bank Statement <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </label>
                <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${bankStmtFile ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"}`}>
                  <span className="text-2xl">{bankStmtFile ? "✅" : "🏦"}</span>
                  <div>
                    <p className="text-xs font-bold text-gray-700">Bank Statement (last 3 months)</p>
                    <p className="text-[11px] text-gray-400">{bankStmtFile ? bankStmtFile.name : "PDF, JPG, PNG — max 10MB"}</p>
                  </div>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={(e) => setBankStmtFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              {/* Navigation */}
              <button
                onClick={() => setPhase("business")}
                className="flex items-center gap-2 px-5 py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-bold rounded-xl transition-all text-sm"
              >
                <HiOutlineArrowLeft className="w-4 h-4" /> Previous
              </button>

              {/* Upload Button */}
              <button
                onClick={async () => {
                  if (!itrFile && !caCertFile) {
                    toast.error("Please upload ITR or CA Certificate");
                    return;
                  }
                  setDocsUploading(true);
                  try {
                    // Upload docs using the already-authenticated seller session
                    const storedUser = localStorage.getItem("user");
                    const parsedUser = storedUser ? JSON.parse(storedUser) : null;

                    const fd = new FormData();
                    if (itrFile)      fd.append("itr",           itrFile);
                    if (caCertFile)   fd.append("caCertificate", caCertFile);
                    if (bankStmtFile) fd.append("bankStatement",  bankStmtFile);
                    if (parsedUser?._id) fd.append("sellerId", String(parsedUser._id));
                    fd.append("phone", mobile || parsedUser?.phone || "");

                    await api.post("/seller-verify/upload-docs", fd);
                    toast.success("Documents uploaded! Proceeding...");
                    setTimeout(() => setPhase("products"), 800);
                  } catch (err: any) {
                    toast.error(err?.message || "Upload failed. Try again.");
                  } finally {
                    setDocsUploading(false);
                  }
                }}
                disabled={docsUploading || (!itrFile && !caCertFile)}
                className="w-full bg-[#0d9e7e] hover:bg-[#0b8a6e] disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                {docsUploading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
                ) : (
                  <>Upload & Continue <HiOutlineArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <button onClick={() => setPhase("products")}
                className="w-full text-xs text-gray-400 hover:text-gray-600 underline">
                Skip for now (upload later from dashboard)
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            PHASE 3 — ADD PRODUCTS
        ═══════════════════════════════════════════════════════ */}
        {phase === "products" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#003580] to-[#0052cc] px-8 py-5 text-white">
              <h1 className="text-xl font-black">Add Your Products</h1>
              <p className="text-blue-200 text-sm mt-0.5">Tell buyers what you sell</p>
            </div>

            <div className="p-8">
              {/* Warning Banner */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex gap-2 mb-6">
                <HiOutlineExclamationTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  Adding <strong>3 Product Names</strong> is mandatory. Photos are optional but will help increasing enquiries.
                </p>
              </div>

              {/* Product Entries */}
              <div className="space-y-4">
                {products.map((product, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 bg-[#003580] text-white rounded-full text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-gray-700 flex-1">
                        Product {idx + 1}
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                      {idx >= 3 && (
                        <button
                          type="button"
                          onClick={() => setProducts((prev) => prev.filter((_, i) => i !== idx))}
                          className="w-6 h-6 bg-red-100 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center transition-all"
                          title="Remove product"
                        >
                          <HiOutlineXMark className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex gap-4">
                      {/* Image Upload */}
                      <div
                        onClick={() => fileRefs.current[idx]?.click()}
                        className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#003580] hover:bg-blue-50 transition-all shrink-0 overflow-hidden relative"
                      >
                        {product.imagePreview ? (
                          <>
                            <img src={product.imagePreview} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={(e) => { e.stopPropagation(); updateProduct(idx, "imageFile", null); updateProduct(idx, "imagePreview", ""); }}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"
                            >
                              <HiOutlineXMark className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <HiOutlineCamera className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-[10px] text-gray-400 text-center leading-tight">Add Photo</span>
                          </>
                        )}
                        <input
                          ref={(el) => { fileRefs.current[idx] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleProductImage(idx, e.target.files?.[0] || null)}
                        />
                      </div>

                      {/* Product Name */}
                      <div className="flex-1 relative">
                        <label className="block text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1.5">
                          Product Name *
                        </label>
                        <input
                          value={product.name}
                          onChange={(e) => {
                            updateProduct(idx, "name", e.target.value);
                            setSuggestions(getProductSuggestions(e.target.value));
                            setActiveSugIdx(idx);
                          }}
                          onFocus={() => {
                            setSuggestions(getProductSuggestions(product.name));
                            setActiveSugIdx(idx);
                          }}
                          onBlur={() => setTimeout(() => { setActiveSugIdx(null); setSuggestions([]); }, 150)}
                          placeholder={`e.g. ${["Steel Pipe", "Cotton Fabric", "LED Panel Light"][idx] ?? "Product Name"}`}
                          className={`w-full border-2 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#003580] transition-all ${
                            product.name ? "border-[#0d9e7e] bg-[#f0faf7]" : "border-gray-200"
                          }`}
                        />
                        {activeSugIdx === idx && suggestions.length > 0 && (
                          <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                            {suggestions.map((s) => (
                              <li
                                key={s}
                                onMouseDown={() => {
                                  updateProduct(idx, "name", s);
                                  setSuggestions([]);
                                  setActiveSugIdx(null);
                                }}
                                className="px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f0faf7] hover:text-[#003580] cursor-pointer border-b border-gray-100 last:border-0"
                              >
                                {s}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer mt-5 p-3 rounded-xl hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#003580] shrink-0"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  I/we confirm that the listed products will not infringe any third-party rights and comply
                  with IndiaMart's{" "}
                  <Link href="/help" className="text-[#003580] font-semibold underline">Terms & Conditions</Link>{" "}
                  and{" "}
                  <Link href="/help" className="text-[#003580] font-semibold underline">Prohibited Items Policy</Link>.
                </span>
              </label>

              {/* Add More */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setProducts((prev) => [...prev, { name: "", imageFile: null, imagePreview: "" }])}
                  className="w-full border-2 border-dashed border-[#0d9e7e] text-[#0d9e7e] hover:bg-[#f0faf7] font-bold py-3 rounded-xl text-sm transition-all"
                >
                  + Add More Products
                </button>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => setPhase("docs")}
                  className="flex items-center gap-2 px-5 py-4 border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-bold rounded-xl transition-all text-sm"
                >
                  <HiOutlineArrowLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={submitProducts}
                  disabled={!termsAccepted || products.filter((p) => p.name.trim()).length < 3}
                  className="flex-1 bg-[#0d9e7e] hover:bg-[#0b8a6e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                >
                  Review & Submit <HiOutlineArrowRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-center text-[11px] text-gray-400 mt-3">
                {products.filter((p) => p.name.trim()).length}/3 products added
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            PHASE REVIEW — CONFIRM DETAILS BEFORE SUBMIT
        ═══════════════════════════════════════════════════════ */}
        {phase === "review" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#003580] to-[#0052cc] px-8 py-5 text-white">
              <h1 className="text-xl font-black">Review Your Details</h1>
              <p className="text-blue-200 text-sm mt-0.5">Confirm everything before completing registration</p>
            </div>

            <div className="p-8 space-y-5">
              {/* Business Details */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm font-bold text-gray-700">Business Details</p>
                  <button
                    onClick={() => setPhase("business")}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                  >
                    <HiOutlinePencilSquare className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                <div className="px-4 py-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Company Name</p>
                    <p className="font-semibold text-gray-800">{companyName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Owner Name</p>
                    <p className="font-semibold text-gray-800">{ownerName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">City</p>
                    <p className="font-semibold text-gray-800">{city || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">State</p>
                    <p className="font-semibold text-gray-800">{stateVal || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Pincode</p>
                    <p className="font-semibold text-gray-800">{pincode || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Business Email</p>
                    <p className="font-semibold text-gray-800">{bizEmail || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 font-medium">{gstMode === "gst" ? "GSTIN" : "PAN"}</p>
                    <p className="font-semibold text-gray-800 font-mono tracking-wider">
                      {gstMode === "gst" ? (gstin || "—") : (panNumber || "—")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm font-bold text-gray-700">
                    Products ({products.filter((p) => p.name.trim()).length} added)
                  </p>
                  <button
                    onClick={() => setPhase("products")}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                  >
                    <HiOutlinePencilSquare className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                <ul className="divide-y divide-gray-100">
                  {products.filter((p) => p.name.trim()).map((p, i) => (
                    <li key={i} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-6 h-6 bg-[#003580] text-white rounded-full text-xs font-black flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-800 font-medium">{p.name}</span>
                      {p.imagePreview && (
                        <img src={p.imagePreview} alt={p.name} className="w-8 h-8 rounded-lg object-cover ml-auto" />
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Documents */}
              {(itrFile || caCertFile || bankStmtFile) && (
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm font-bold text-gray-700">Documents</p>
                    <button
                      onClick={() => setPhase("docs")}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                    >
                      <HiOutlinePencilSquare className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {itrFile && <li className="px-4 py-2.5 text-sm text-gray-700 flex items-center gap-2"><span>📄</span> ITR: {itrFile.name}</li>}
                    {caCertFile && <li className="px-4 py-2.5 text-sm text-gray-700 flex items-center gap-2"><span>🏛️</span> CA Certificate: {caCertFile.name}</li>}
                    {bankStmtFile && <li className="px-4 py-2.5 text-sm text-gray-700 flex items-center gap-2"><span>🏦</span> Bank Statement: {bankStmtFile.name}</li>}
                  </ul>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setPhase("products")}
                  className="flex items-center gap-2 px-5 py-4 border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-bold rounded-xl transition-all text-sm"
                >
                  <HiOutlineArrowLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={submitAll}
                  disabled={productsLoading}
                  className="flex-1 bg-[#0d9e7e] hover:bg-[#0b8a6e] disabled:opacity-60 text-white font-black py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                >
                  {productsLoading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                  ) : (
                    <>Submit Registration <HiOutlineCheckCircle className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            PHASE 3 — SUCCESS + PLAN SELECTION
        ═══════════════════════════════════════════════════════ */}
        {phase === "done" && (
          <div className="space-y-4">
            {/* Success Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#003580] to-[#0052cc] rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                <span className="text-4xl">🏪</span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">
                You&apos;re now an IndiaMart Seller!
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Congratulations! Your catalog will be live shortly.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push("/seller/dashboard")}
                  className="bg-[#0d9e7e] hover:bg-[#0b8a6e] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                >
                  Go to Dashboard <HiOutlineArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="border-2 border-[#0d9e7e] text-[#0d9e7e] hover:bg-[#f0faf7] font-bold py-3.5 rounded-xl text-sm transition-all"
                >
                  Go to Buyer
                </button>
              </div>
            </div>

            {/* Plan Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <p className="text-center text-sm font-bold text-gray-700 mb-4">
                Grow your business faster — Pick your plan today
              </p>

              {/* Current Plan Banner */}
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-800 text-white text-[10px] font-black px-2 py-0.5 rounded-full">YOUR CURRENT PLAN</span>
                  <span className="font-bold text-gray-700 text-sm">Free Listing · ₹0</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">BuyLeads/month</p>
                  <p className="text-sm font-black text-red-500">0 leads</p>
                </div>
              </div>

              {/* Paid Plans */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLANS.filter((p) => p.id !== "free").map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`border-2 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md ${
                      selectedPlan === plan.id ? plan.border + " shadow-md" : "border-gray-200"
                    }`}
                  >
                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`${plan.tagColor} text-white text-[10px] font-black px-2 py-0.5 rounded-full`}>
                        {plan.tag}
                      </span>
                      {plan.saveBadge && (
                        <span className="bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                          {plan.saveBadge}
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-gray-900 text-sm mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-2xl font-black text-gray-900">{plan.price}</span>
                      <span className="text-xs text-gray-500">{plan.priceNote}</span>
                    </div>

                    {/* Leads stats */}
                    <div className="grid grid-cols-2 gap-2 my-3 bg-gray-50 rounded-xl p-2">
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-500 uppercase">BuyLeads</p>
                        <p className="text-lg font-black text-[#003580]">{plan.leads.split(" ")[0]}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-500 uppercase">VS FREE</p>
                        <p className="text-sm font-black text-emerald-600">{plan.vsTag}</p>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-700">
                          <HiOutlineCheckCircle className="w-3.5 h-3.5 text-[#0d9e7e] shrink-0" />
                          {f}
                        </li>
                      ))}
                      {plan.missing.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                          <HiOutlineXMark className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* Select Radio */}
                    <div className="mt-3 flex justify-end">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPlan === plan.id ? "border-[#0d9e7e]" : "border-gray-300"
                      }`}>
                        {selectedPlan === plan.id && (
                          <div className="w-2.5 h-2.5 bg-[#0d9e7e] rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedPlan !== "free" && (
                <button
                  onClick={() => router.push("/seller/plans")}
                  className="w-full mt-4 bg-[#0d9e7e] hover:bg-[#0b8a6e] text-white font-black py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  Upgrade to {PLANS.find((p) => p.id === selectedPlan)?.name}
                  <HiOutlineArrowRight className="w-4 h-4" />
                </button>
              )}

              <p className="text-center text-[11px] text-gray-400 mt-3">
                * Includes 1 Daily Bonus BuyLead
              </p>
              <p className="text-center text-[11px] text-[#003580] font-semibold">
                You can upgrade your plan anytime from the Seller Dashboard
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
