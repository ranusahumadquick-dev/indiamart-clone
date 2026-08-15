"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineBuildingOffice2,
  HiOutlineShoppingBag,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineArrowRight,
} from "@/lib/icons";

function getPasswordStrength(password: string) {
  const checks = {
    length: password.length >= 6,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  let label = "Very Weak";
  let color = "#ff6161";
  if (score >= 5) { label = "Strong"; color = "#388e3c"; }
  else if (score >= 4) { label = "Good"; color = "#4caf50"; }
  else if (score >= 3) { label = "Fair"; color = "#ff9f00"; }
  else if (score >= 2) { label = "Weak"; color = "#fb641b"; }
  return { checks, score, label, color };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isAuthenticated } = useAuth();

  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("/");

  // Inline phone OTP state
  const [otpStep, setOtpStep] = useState<"idle" | "sent" | "verified">("idle");
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const strength = getPasswordStrength(form.password);

  const isFormValid = () => {
    if (!form.name.trim()) return false;
    if (!form.email.trim() || !isValidEmail(form.email)) return false;
    if (!form.phone.trim() || !isValidPhone(form.phone)) return false;
    if (!phoneVerified) return false;
    if (!form.password || form.password.length < 6) return false;
    if (form.password !== form.confirmPassword) return false;
    if (!agreeTerms) return false;
    return true;
  };

  useEffect(() => {
    if (isAuthenticated && !redirectUrl) router.push("/");
  }, [isAuthenticated, router, redirectUrl]);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    const phoneParam = searchParams.get("phone");
    const verifiedParam = searchParams.get("phoneVerified");
    const redirectParam = searchParams.get("redirect");
    if (roleParam === "seller") setRole("seller");
    else if (roleParam === "buyer") setRole("buyer");
    if (phoneParam) setForm((f) => ({ ...f, phone: phoneParam }));
    if (verifiedParam === "true") setPhoneVerified(true);
    if (redirectParam) setRedirectUrl(redirectParam);
  }, [searchParams]);

  const startCountdown = () => {
    setOtpCountdown(30);
    const t = setInterval(() => {
      setOtpCountdown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
    }, 1000);
  };

  const sendPhoneOTP = async () => {
    setOtpError("");
    if (!isValidPhone(form.phone)) { setOtpError("Enter a valid 10-digit mobile number first"); return; }
    setOtpLoading(true);
    try {
      const res = await api.post("/otp/send-mobile", { phone: form.phone });
      const dev = res.data?.data?.devOtp;
      if (dev) { setDevOtp(dev); setOtpValue(dev); }
      setOtpStep("sent");
      startCountdown();
    } catch (e: any) {
      setOtpError(e?.response?.data?.message || "Failed to send OTP");
    } finally { setOtpLoading(false); }
  };

  const verifyPhoneOTP = async () => {
    setOtpError("");
    if (otpValue.length !== 6) { setOtpError("Enter 6-digit OTP"); return; }
    setOtpLoading(true);
    try {
      await api.post("/otp/verify-mobile", { phone: form.phone, otp: otpValue });
      setOtpStep("verified");
      setPhoneVerified(true);
      setDevOtp(null);
    } catch (e: any) {
      setOtpError(e?.response?.data?.message || "Invalid OTP");
    } finally { setOtpLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (!agreeTerms) { toast.error("Please agree to the Terms & Conditions"); return; }
    if (!isValidPhone(form.phone)) { toast.error("Enter a valid 10-digit Indian mobile number (starts with 6-9)"); return; }

    setLoading(true);
    try {
      if (role === "seller") {
        // Create seller account, then redirect to GST/business setup
        const res = await api.post("/auth/register", {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          role: "seller",
        });
        const { accessToken, user: newUser } = res.data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        toast.success(`Welcome ${newUser.name}! Complete your business details to start selling.`);
        router.push("/seller-register");
      } else {
        await register({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          role: "buyer",
        }, redirectUrl || "/");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Registration failed";
      toast.error(msg, { duration: 5000 });
      if (msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("please login")) {
        setTimeout(() => router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] px-8 py-6 text-white text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="bg-white/20 backdrop-blur text-white font-extrabold text-xl px-2.5 py-1 rounded-md">IM</div>
              <span className="font-bold text-lg">IndiaMart</span>
            </div>
            <h1 className="text-xl font-bold">Create Your Account</h1>
            <p className="text-blue-100 text-sm mt-1">
              {phoneVerified ? "Phone verified! Fill remaining details" : "Join India's largest B2B marketplace"}
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {/* Role Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("buyer")}
                  className={`py-3 rounded-xl text-sm font-semibold border-2 transition flex items-center justify-center gap-2 ${
                    role === "buyer"
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-blue-200"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <HiOutlineShoppingBag className="w-5 h-5" />
                  Buyer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("seller")}
                  className={`py-3 rounded-xl text-sm font-semibold border-2 transition flex items-center justify-center gap-2 ${
                    role === "seller"
                      ? "bg-[var(--secondary)] text-white border-[var(--secondary)] shadow-lg shadow-orange-200"
                      : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                  }`}
                >
                  <HiOutlineBuildingOffice2 className="w-5 h-5" />
                  Seller
                </button>
              </div>

              {/* Seller info banner */}
              {role === "seller" && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-700 text-center">
                  After filling basic details, you will set up your <strong>Business &amp; GST information</strong>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <HiOutlineEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                  {phoneVerified && (
                    <span className="ml-2 inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <HiOutlineCheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                </label>

                {/* Phone input + Send OTP button */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      autoComplete="off"
                      value={form.phone}
                      readOnly={phoneVerified || otpStep === "sent"}
                      onChange={(e) => {
                        if (!phoneVerified && otpStep === "idle") {
                          setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) });
                          setOtpError("");
                        }
                      }}
                      className={`w-full border rounded-lg pl-11 pr-4 py-2.5 text-sm outline-none transition ${
                        phoneVerified
                          ? "border-green-300 bg-green-50 text-green-800 cursor-not-allowed"
                          : "border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)]"
                      }`}
                      placeholder="9876543210"
                    />
                  </div>
                  {/* Verify button — only show if not already verified from URL */}
                  {!phoneVerified && otpStep !== "sent" && (
                    <button
                      type="button"
                      onClick={sendPhoneOTP}
                      disabled={otpLoading || form.phone.length !== 10}
                      className="shrink-0 px-4 py-2.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--primary-dark)] disabled:opacity-50 transition whitespace-nowrap"
                    >
                      {otpLoading ? "Sending..." : "Get OTP"}
                    </button>
                  )}
                  {otpStep === "sent" && (
                    <button
                      type="button"
                      onClick={() => { setOtpStep("idle"); setOtpValue(""); setOtpError(""); setDevOtp(null); }}
                      className="shrink-0 px-3 py-2.5 border border-gray-300 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition"
                    >
                      Change
                    </button>
                  )}
                </div>

                {/* OTP input row — shown after Send OTP */}
                {otpStep === "sent" && (
                  <div className="mt-2 space-y-2">
                    {devOtp && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-700 font-semibold">
                        Dev OTP: <span className="tracking-widest font-black">{devOtp}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpValue}
                        onChange={(e) => { setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(""); }}
                        placeholder="Enter 6-digit OTP"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={verifyPhoneOTP}
                        disabled={otpLoading || otpValue.length !== 6}
                        className="shrink-0 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        {otpLoading ? "..." : "Verify"}
                      </button>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>OTP sent to +91-{form.phone}</span>
                      {otpCountdown > 0 ? (
                        <span>Resend in {otpCountdown}s</span>
                      ) : (
                        <button type="button" onClick={sendPhoneOTP} className="text-[var(--primary)] font-semibold hover:underline">
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {otpError && <p className="text-xs text-red-500 mt-1">{otpError}</p>}
                {phoneVerified && (
                  <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1">
                    <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Mobile number verified via OTP
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg pl-11 pr-11 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(strength.score / 5) * 100}%`, backgroundColor: strength.color }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {[
                        { key: "length", label: "6+ characters" },
                        { key: "uppercase", label: "Uppercase letter" },
                        { key: "lowercase", label: "Lowercase letter" },
                        { key: "number", label: "Number" },
                        { key: "special", label: "Special character" },
                      ].map((check) => (
                        <div key={check.key} className="flex items-center gap-1 text-xs">
                          {strength.checks[check.key as keyof typeof strength.checks]
                            ? <HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            : <HiOutlineXMark className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                          <span className={strength.checks[check.key as keyof typeof strength.checks] ? "text-green-600" : "text-gray-400"}>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className={`w-full border rounded-lg pl-11 pr-11 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? "border-red-300 focus:border-red-400"
                        : form.confirmPassword && form.password === form.confirmPassword
                        ? "border-green-300 focus:border-green-400"
                        : "border-gray-300 focus:border-[var(--primary)]"
                    }`}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <HiOutlineCheck className="w-3.5 h-3.5" /> Passwords match
                  </p>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-xs text-gray-500">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" onClick={(e) => e.stopPropagation()} className="text-[var(--primary)] hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" target="_blank" onClick={(e) => e.stopPropagation()} className="text-[var(--primary)] hover:underline">Privacy Policy</Link>
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !isFormValid()}
                className={`w-full text-white py-3 rounded-lg font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2 ${
                  role === "seller"
                    ? "bg-[var(--secondary)] hover:bg-orange-600"
                    : "bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
                }`}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Please wait...</>
                ) : role === "seller" ? (
                  <>Continue to Business Details <HiOutlineArrowRight className="w-4 h-4" /></>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[var(--primary)] font-semibold hover:underline">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}