"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import {
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineCheckCircle,
  HiOutlineArrowLeft,
} from "react-icons/hi2";

function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const strengthLabel = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const strengthColor = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];

function ResetPasswordContent() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = getStrength(password);

  const checks = [
    { label: "At least 8 characters", pass: password.length >= 8 },
    { label: "One uppercase letter (A-Z)", pass: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a-z)", pass: /[a-z]/.test(password) },
    { label: "One number (0-9)", pass: /[0-9]/.test(password) },
    { label: "One special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const allChecksPassed = checks.every((c) => c.pass);
  const passwordsMatch = password === confirm && confirm.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecksPassed) { toast.error("Password does not meet requirements"); return; }
    if (!passwordsMatch) { toast.error("Passwords do not match"); return; }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6 text-white text-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <div className="bg-white/20 backdrop-blur text-white font-extrabold text-xl px-2.5 py-1 rounded-md">IM</div>
                <span className="font-bold text-lg">IndiaMart</span>
              </div>
              <h1 className="text-xl font-bold">Password Reset!</h1>
            </div>
            <div className="p-8 text-center">
              <HiOutlineCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password has been reset successfully.</h2>
              <p className="text-gray-600 text-sm mb-6">You can now log in with your new password. Redirecting to login in 3 seconds...</p>
              <Link href="/auth/login" className="inline-block w-full bg-[var(--primary)] text-white py-3 rounded-lg font-semibold hover:bg-[var(--primary-dark)] transition text-center">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] px-8 py-6 text-white text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="bg-white/20 backdrop-blur text-white font-extrabold text-xl px-2.5 py-1 rounded-md">IM</div>
              <span className="font-bold text-lg">IndiaMart</span>
            </div>
            <h1 className="text-xl font-bold">Set New Password</h1>
            <p className="text-blue-100 text-sm mt-1">Create a strong new password</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-11 pr-11 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                    placeholder="Min 8 chars, uppercase, number, special"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                  </button>
                </div>

                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : "bg-gray-200"}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strength >= 4 ? "text-green-600" : strength >= 3 ? "text-yellow-600" : "text-red-500"}`}>{strengthLabel[strength]}</p>
                    <ul className="mt-2 space-y-1">
                      {checks.map((c) => (
                        <li key={c.label} className={`flex items-center gap-2 text-xs ${c.pass ? "text-green-600" : "text-gray-400"}`}>
                          <span className="font-bold">{c.pass ? "+" : "o"}</span>{c.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`w-full border rounded-lg pl-11 pr-11 py-2.5 text-sm focus:ring-2 outline-none transition ${confirm.length > 0 ? (passwordsMatch ? "border-green-400 focus:ring-green-100" : "border-red-400 focus:ring-red-100") : "border-gray-300 focus:ring-blue-100 focus:border-[var(--primary)]"}`}
                    placeholder="Re-enter new password"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                  </button>
                </div>
                {confirm.length > 0 && (
                  <p className={`text-xs mt-1 ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                    {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !allChecksPassed || !passwordsMatch}
                className="w-full bg-[var(--primary)] text-white py-3 rounded-lg font-semibold hover:bg-[var(--primary-dark)] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Resetting Password...</>
                ) : "Reset Password"}
              </button>
            </form>

            <div className="flex items-center justify-center mt-6">
              <Link href="/auth/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <HiOutlineArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
