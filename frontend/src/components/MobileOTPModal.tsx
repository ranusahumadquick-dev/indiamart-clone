"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { useGuestVerify } from "@/contexts/GuestVerifyContext";
import { useAuth } from "@/contexts/AuthContext";

const RESEND_COOLDOWN = 30;

export default function MobileOTPModal() {
  const { showModal, closeModal, markVerified } = useGuestVerify();
  const { user } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // If already logged in, just mark verified
  useEffect(() => {
    if (showModal && user) {
      markVerified();
    }
  }, [showModal, user, markVerified]);

  useEffect(() => {
    if (!showModal) {
      setStep("phone");
      setPhone("");
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setCountdown(0);
      if (timerRef.current) clearInterval(timerRef.current);
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
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/otp/send-mobile", { phone: raw });
      setStep("otp");
      startCountdown();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
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
      const res = await api.post("/otp/verify-mobile", { phone: raw, otp: code });
      // If a real user account was returned, store token
      if (res.data?.data?.accessToken) {
        localStorage.setItem("accessToken", res.data.data.accessToken);
      }
      markVerified();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">🔐</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Verify Your Mobile Number</h2>
              </div>
              <p className="text-sm text-gray-500 ml-10">
                {step === "phone"
                  ? "Verify to connect with sellers and view product details."
                  : `OTP sent to +91 ${phone.replace(/\D/g, "")}`}
              </p>
            </div>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step: Phone */}
          {step === "phone" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-medium">
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
                    onKeyDown={(e) => e.key === "Enter" && sendOTP()}
                    placeholder="Enter 10-digit mobile number"
                    autoFocus
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <span>⚠️</span> {error}
                </p>
              )}

              <button
                onClick={sendOTP}
                disabled={loading || phone.replace(/\D/g, "").length !== 10}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending OTP...</>
                ) : "Send OTP"}
              </button>

              <p className="text-xs text-center text-gray-400">
                By continuing, you agree to receive an OTP on this number.
              </p>
            </div>
          )}

          {/* Step: OTP */}
          {step === "otp" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Enter 6-digit OTP
                </label>
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
                      className={`w-11 h-12 text-center text-lg font-bold border-2 rounded-xl focus:outline-none transition ${
                        digit
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 focus:border-blue-500"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 flex items-center justify-center gap-1.5">
                  <span>⚠️</span> {error}
                </p>
              )}

              <button
                onClick={verifyOTP}
                disabled={loading || otp.join("").length !== 6}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</>
                ) : "✓ Verify OTP"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setError(""); }}
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  ← Change Number
                </button>
                {countdown > 0 ? (
                  <span className="text-gray-400">Resend in {countdown}s</span>
                ) : (
                  <button
                    onClick={async () => {
                      setLoading(true);
                      setError("");
                      try {
                        await api.post("/otp/send-mobile", { phone: phone.replace(/\D/g, "") });
                        startCountdown();
                        setOtp(["","","","","",""]);
                        otpRefs.current[0]?.focus();
                      } catch (e: any) {
                        setError(e?.response?.data?.message || "Failed to resend OTP.");
                      } finally { setLoading(false); }
                    }}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-800 font-medium transition disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Trust badges */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">🔒 Secure</span>
            <span className="flex items-center gap-1">✓ One-time verification</span>
            <span className="flex items-center gap-1">📱 SMS OTP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
