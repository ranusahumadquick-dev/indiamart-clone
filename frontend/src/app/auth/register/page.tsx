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
} from "react-icons/hi2";

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

  const strength = getPasswordStrength(form.password);

  const isFormValid = () => {
    if (!form.name.trim()) return false;
    if (!form.email.trim() || !isValidEmail(form.email)) return false;
    if (!form.phone.trim() || !isValidPhone(form.phone)) return false;
    if (!form.password || form.password.length < 6) return false;
    if (form.password !== form.confirmPassword) return false;
    if (!agreeTerms) return false;
    return true;
  };

  useEffect(() => {
    if (isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "seller") setRole("seller");
    else if (roleParam === "buyer") setRole("buyer");
  }, [searchParams]);

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
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Registration failed");
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
            <p className="text-blue-100 text-sm mt-1">Join India&apos;s largest B2B marketplace</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                <div className="relative">
                  <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    className="w-full border border-gray-300 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                    placeholder="9876543210"
                  />
                </div>
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
                  <span className="text-[var(--primary)] hover:underline cursor-pointer">Terms of Service</span>
                  {" "}and{" "}
                  <span className="text-[var(--primary)] hover:underline cursor-pointer">Privacy Policy</span>
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