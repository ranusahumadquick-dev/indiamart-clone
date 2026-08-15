"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useGuestVerify } from "@/contexts/GuestVerifyContext";
import { useAuth } from "@/contexts/AuthContext";

const RESEND_COOLDOWN = 30;

export default function MobileOTPModal() {
  const { showModal, closeModal, markVerified } = useGuestVerify();
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal && user) markVerified();
  }, [showModal, user, markVerified]);

  useEffect(() => {
    if (!showModal) {
      setStep("phone");
      setPhone("");
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setCountdown(0);
      setDevOtp(null);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setTimeout(() => phoneRef.current?.focus(), 150);
    }
  }, [showModal]);

  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }, []);

  const sendOTP = async () => {
    setError("");
    const raw = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(raw)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/otp/send-mobile", { phone: raw });
      const dev = res.data?.data?.devOtp;
      if (dev) {
        setDevOtp(dev);
        setOtp(dev.split(""));
      }
      setStep("otp");
      startCountdown();
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setError("");
    const code = otp.join("");
    if (code.length !== 6) return;
    const raw = phone.replace(/\D/g, "");
    setLoading(true);
    try {
      await api.post("/otp/verify-mobile", { phone: raw, otp: code });
      // Save return URL before closing modal
      const returnUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      closeModal();
      // Go to signup — phone pre-filled & verified, come back to this page after signup
      router.push(`/auth/register?phone=${raw}&phoneVerified=true&redirect=${encodeURIComponent(returnUrl)}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otp.join("").length === 6) verifyOTP();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      setTimeout(() => otpRefs.current[5]?.focus(), 50);
    }
    e.preventDefault();
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-sm bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-[#1a5276] px-6 pt-6 pb-5 text-white text-center">
          <button
            onClick={closeModal}
            className="absolute top-3 right-4 text-white/70 hover:text-white text-2xl leading-none"
          >×</button>
          <h2 className="text-lg font-bold">
            {step === "phone" ? "Login to connect with suppliers" : "Enter OTP"}
          </h2>
          <p className="text-sm text-white/80 mt-1">
            {step === "phone"
              ? "Login to get verified sellers"
              : `OTP sent to +91-${phone.replace(/\D/g, "")}`}
          </p>
        </div>

        <div className="px-6 py-5">
          {step === "phone" && (
            <div className="space-y-4">
              {/* Phone input */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#1a5276] focus-within:border-transparent">
                <div className="flex items-center gap-2 px-3 bg-gray-50 border-r border-gray-300 shrink-0">
                  <span className="text-lg">🇮🇳</span>
                  <span className="text-sm font-semibold text-gray-600">+91</span>
                </div>
                <input
                  ref={phoneRef}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && sendOTP()}
                  placeholder="Enter your mobile number"
                  className="flex-1 px-3 py-3 text-sm outline-none bg-white"
                />
              </div>

              {/* Trust line */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Your mobile number is safe with us
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                onClick={sendOTP}
                disabled={loading || phone.replace(/\D/g, "").length !== 10}
                className="w-full py-3 bg-[#3498db] text-white font-bold text-sm rounded-lg hover:bg-[#2980b9] transition disabled:opacity-50 disabled:cursor-not-allowed tracking-widest uppercase"
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Sending...</span>
                  : "GET OTP"}
              </button>

              <p className="text-center text-xs text-gray-400">
                Don't have an account?{" "}
                <a href="/auth/register" className="text-[#1a5276] font-semibold hover:underline">
                  Register here
                </a>
              </p>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-5">
              {/* Dev mode OTP hint */}
              {devOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                  <p className="text-[10px] text-amber-600 font-semibold">SMS not configured — Dev OTP:</p>
                  <p className="text-lg font-black text-amber-700 tracking-widest">{devOtp}</p>
                </div>
              )}
              {/* OTP boxes */}
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition ${
                      digit ? "border-[#1a5276] bg-blue-50 text-[#1a5276]" : "border-gray-300 focus:border-[#1a5276]"
                    }`}
                  />
                ))}
              </div>

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <button
                onClick={verifyOTP}
                disabled={loading || otp.join("").length !== 6}
                className="w-full py-3 bg-[#3498db] text-white font-bold text-sm rounded-lg hover:bg-[#2980b9] transition disabled:opacity-50 disabled:cursor-not-allowed tracking-widest uppercase"
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Verifying...</span>
                  : "VERIFY OTP"}
              </button>

              <div className="flex justify-between text-xs">
                <button
                  onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setError(""); }}
                  className="text-[#1a5276] font-semibold hover:underline"
                >
                  ← Change Number
                </button>
                {countdown > 0 ? (
                  <span className="text-gray-400">Resend in {countdown}s</span>
                ) : (
                  <button
                    onClick={async () => {
                      setLoading(true); setError("");
                      try {
                        await api.post("/otp/send-mobile", { phone: phone.replace(/\D/g, "") });
                        startCountdown();
                        setOtp(["","","","","",""]);
                        setTimeout(() => otpRefs.current[0]?.focus(), 50);
                      } catch (e: any) {
                        setError(e?.response?.data?.message || "Failed to resend.");
                      } finally { setLoading(false); }
                    }}
                    disabled={loading}
                    className="text-[#1a5276] font-semibold hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer logo */}
        <div className="px-6 pb-4 text-center">
          <span className="text-xs font-bold text-[#1a5276] tracking-wide">
            🏢 IndiaMART Clone — B2B Marketplace
          </span>
        </div>
      </div>
    </div>
  );
}
