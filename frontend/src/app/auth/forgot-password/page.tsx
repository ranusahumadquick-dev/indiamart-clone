"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import {
  HiOutlineEnvelope,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.toLowerCase() });
      setSent(true);
      toast.success("Reset link sent! Check your inbox.");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send reset link";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] px-8 py-6 text-white text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="bg-white/20 backdrop-blur text-white font-extrabold text-xl px-2.5 py-1 rounded-md">
                IM
              </div>
              <span className="font-bold text-lg">IndiaMart</span>
            </div>
            <h1 className="text-xl font-bold">Forgot Password?</h1>
            <p className="text-blue-100 text-sm mt-1">Enter your email to receive a reset link</p>
          </div>

          <div className="p-8">
            {sent ? (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <HiOutlineCheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-600 text-sm mb-6">
                  We sent a password reset link to{" "}
                  <span className="font-semibold text-gray-900">{email}</span>.{" "}
                  The link expires in 15 minutes.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-blue-800">
                    <strong>Didn't receive the email?</strong><br />
                    • Check your spam/junk folder<br />
                    • Verify the email address is correct<br />
                    • Wait a few minutes and try again
                  </p>
                </div>
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="w-full mb-3 bg-[var(--primary)] text-white py-2.5 rounded-lg font-semibold hover:bg-[var(--primary-dark)] transition"
                >
                  Send Again
                </button>
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <HiOutlineArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-900">
                    Enter your registered email and we will send you a secure link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <HiOutlineEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                        placeholder="you@example.com"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--primary)] text-white py-3 rounded-lg font-semibold hover:bg-[var(--primary-dark)] transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending Reset Link...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-center mt-6">
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <HiOutlineArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
