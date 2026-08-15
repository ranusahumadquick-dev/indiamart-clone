"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const STORAGE_KEY = "guest_popup_dismissed";
const DISMISS_DAYS = 30;
const RESEND_COOLDOWN = 30;

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const { until } = JSON.parse(raw);
    return Date.now() < until;
  } catch {
    return false;
  }
}

function dismiss() {
  const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ until }));
}

type Step = "mobile" | "otp";

export default function GuestWelcomePopup() {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("mobile");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Show popup after 2s delay if user is guest and hasn't dismissed
  useEffect(() => {
    if (user) return;
    if (isDismissed()) return;
    const t = setTimeout(() => setOpen(true), 2000);
    return () => clearTimeout(t);
  }, [user]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleClose = useCallback(() => {
    dismiss();
    setOpen(false);
  }, []);

  const handleSendOTP = async () => {
    setError("");
    const cleaned = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/otp/send-otp", { phone: cleaned });
      setMaskedPhone(res.data.data?.phone || `+91 XXXXXX${cleaned.slice(-4)}`);
      const dev = res.data.data?.devOtp;
      if (dev) { setDevOtp(dev); setOtp(dev); } else { setDevOtp(null); }
      setStep("otp");
      setResendTimer(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    if (otp.length !== 6) { setError("Enter the 6-digit OTP"); return; }
    setLoading(true);
    try {
      const cleaned = phone.replace(/\D/g, "");
      const res = await api.post("/otp/verify-otp", {
        phone: cleaned,
        otp,
        name: "Guest User",
        role: "buyer",
      });
      const { accessToken, user: loggedInUser } = res.data.data;
      if (accessToken && loggedInUser) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        await refreshUser();
        toast.success(`Welcome, ${loggedInUser.name}! 🎉`);
      }
      dismiss();
      setOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError("");
    setLoading(true);
    try {
      const cleaned = phone.replace(/\D/g, "");
      const res = await api.post("/otp/resend-otp", { phone: cleaned });
      setResendTimer(RESEND_COOLDOWN);
      const dev = res.data.data?.devOtp;
      if (dev) { setDevOtp(dev); setOtp(dev); } else { setDevOtp(null); setOtp(""); }
      toast.success(dev ? "OTP regenerated (SMS not configured)" : "OTP resent!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (val: string) => {
    setOtp(val.replace(/\D/g, "").slice(0, 6));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ animation: "fadeIn 0.2s ease" }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: "slideUp 0.25s ease" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-7 pt-6 pb-7">
          {/* Logo / Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">IM</span>
            </div>
          </div>

          {step === "mobile" ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 text-center leading-snug">
                Welcome to India&apos;s Largest<br />B2B Marketplace
              </h2>
              <p className="mt-2 text-sm text-gray-500 text-center leading-relaxed">
                Verify your mobile number to get a personalized experience, connect with sellers, save products, and receive instant inquiry updates.
              </p>

              <div className="mt-6 space-y-3">
                {/* Phone input */}
                <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition">
                  <span className="flex items-center px-3.5 bg-gray-50 border-r border-gray-200 text-sm font-semibold text-gray-600 shrink-0 select-none">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                      setError("");
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSendOTP(); }}
                    placeholder="Enter mobile number"
                    className="flex-1 px-4 py-3 text-sm text-gray-800 outline-none bg-white"
                    autoFocus
                  />
                </div>

                {error && <p className="text-xs text-red-500 px-1">{error}</p>}

                <button
                  onClick={handleSendOTP}
                  disabled={loading || phone.length < 10}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  {loading ? "Sending OTP…" : "Send OTP"}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 text-center">
                Verify Your Number
              </h2>
              <p className="mt-2 text-sm text-gray-500 text-center">
                OTP sent to <span className="font-semibold text-gray-700">{maskedPhone}</span>
              </p>
              <button
                onClick={() => { setStep("mobile"); setOtp(""); setError(""); setDevOtp(null); }}
                className="mt-1 block mx-auto text-xs text-blue-600 hover:underline"
              >
                Change number
              </button>

              <div className="mt-6 space-y-3">
                {devOtp && (
                  <p className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700 text-center">
                    SMS not configured (dev mode) — Dev OTP: <span className="tracking-widest font-black">{devOtp}</span>
                  </p>
                )}
                {/* OTP input */}
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => handleOtpInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleVerifyOTP(); }}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-center text-xl font-bold tracking-[0.35em] text-gray-800 transition"
                  autoFocus
                />

                {error && <p className="text-xs text-red-500 px-1">{error}</p>}

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length < 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  {loading ? "Verifying…" : "Verify OTP"}
                </button>

                {/* Resend */}
                <div className="text-center text-xs text-gray-500">
                  {resendTimer > 0 ? (
                    <span>Resend OTP in <span className="font-semibold text-gray-700">{resendTimer}s</span></span>
                  ) : (
                    <button
                      onClick={handleResend}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Skip */}
          <button
            onClick={handleClose}
            className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700 transition py-1"
          >
            Skip for Now — Continue Browsing
          </button>

          {/* Trust badges */}
          <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">🔒 Secure & Private</span>
            <span className="flex items-center gap-1">✅ No Spam</span>
            <span className="flex items-center gap-1">🇮🇳 Made for India</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
