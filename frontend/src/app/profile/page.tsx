"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineArrowLeft,
  HiOutlineCamera,
  HiOutlineShieldCheck,
  HiMiniShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  // Info form
  const [info, setInfo] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [savingInfo, setSavingInfo] = useState(false);

  // Password form
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [savingPwd, setSavingPwd] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleInfoSave = async () => {
    if (!info.name.trim()) { toast.error("Name is required"); return; }
    try {
      setSavingInfo(true);
      await api.put("/auth/profile", { name: info.name.trim() });
      await refreshUser();
      toast.success("Profile updated");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Update failed");
    } finally { setSavingInfo(false); }
  };

  const handlePasswordChange = async () => {
    if (!pwd.current || !pwd.next) { toast.error("Fill in all password fields"); return; }
    if (pwd.next.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (pwd.next !== pwd.confirm) { toast.error("Passwords do not match"); return; }
    try {
      setSavingPwd(true);
      await api.post("/auth/change-password", { currentPassword: pwd.current, newPassword: pwd.next });
      setPwd({ current: "", next: "", confirm: "" });
      toast.success("Password changed successfully");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Password change failed");
    } finally { setSavingPwd(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB allowed"); return; }
    try {
      setUploadingAvatar(true);
      const fd = new FormData();
      fd.append("avatar", file);
      await api.put("/auth/update-avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await refreshUser();
      toast.success("Avatar updated");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Avatar upload failed");
    } finally { setUploadingAvatar(false); }
  };

  const roleLabel = user.role === "seller" ? "Seller Account"
    : user.role === "admin" ? "Admin Account"
    : user.role === "premium" ? "Premium Buyer"
    : "Buyer Account";

  const roleBadgeColor = user.role === "seller" ? "bg-blue-100 text-blue-700"
    : user.role === "admin" ? "bg-purple-100 text-purple-700"
    : user.role === "premium" ? "bg-amber-100 text-amber-700"
    : "bg-gray-100 text-gray-600";

  return (
    <div className="min-h-[80vh] bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <Link href={user.role === "seller" ? "/seller/dashboard" : "/buyer/dashboard"}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[var(--primary)] mb-6 transition">
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <h1 className="text-xl font-bold text-gray-800 mb-6">Account Settings</h1>

        {/* ── Avatar + identity card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold">
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : initials}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition">
                <HiOutlineCamera className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>

            {/* Name + role */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-bold text-gray-800 text-lg">{user.name}</h2>
                {user.isVerified && (
                  <HiMiniShieldCheck className="w-5 h-5 text-blue-500" title="Verified" />
                )}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadgeColor}`}>
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Verification badges */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <VerifyBadge label="Email Verified" ok={!!user.isEmailVerified} value={user.email} />
            <VerifyBadge label="Phone Verified" ok={!!user.isPhoneVerified} value={user.phone} />
          </div>
        </div>

        {/* ── Personal info ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <HiOutlineUser className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Personal Information</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name</label>
              <input
                value={info.name}
                onChange={(e) => setInfo((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address</label>
              <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-100 rounded-xl bg-gray-50">
                <HiOutlineEnvelope className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500">{user.email}</span>
                <span className="ml-auto text-xs text-gray-400">Cannot change</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone Number</label>
              <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-100 rounded-xl bg-gray-50">
                <HiOutlinePhone className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500">{user.phone}</span>
                <span className="ml-auto text-xs text-gray-400">Cannot change</span>
              </div>
            </div>

            <button
              onClick={handleInfoSave}
              disabled={savingInfo || info.name === user.name}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
              {savingInfo ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* ── Password change ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <HiOutlineLockClosed className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Change Password</h3>
            </div>
            <button onClick={() => setShowPwd((v) => !v)}
              className="text-xs text-blue-600 hover:underline font-medium">
              {showPwd ? "Hide" : "Change"}
            </button>
          </div>

          {showPwd && (
            <div className="space-y-3">
              {[
                { key: "current", label: "Current Password" },
                { key: "next",    label: "New Password" },
                { key: "confirm", label: "Confirm New Password" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                  <input
                    type="password"
                    value={pwd[key as keyof typeof pwd]}
                    onChange={(e) => setPwd((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none text-sm"
                    placeholder="••••••••"
                  />
                </div>
              ))}
              <button
                onClick={handlePasswordChange}
                disabled={savingPwd}
                className="w-full py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition mt-1">
                {savingPwd ? "Updating…" : "Update Password"}
              </button>
            </div>
          )}

          {!showPwd && (
            <p className="text-sm text-gray-400">Password was last updated — click Change to update it.</p>
          )}
        </div>

        {/* ── Security ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
              <HiOutlineShieldCheck className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Account Security</h3>
          </div>
          <div className="space-y-3 text-sm">
            <SecurityRow label="Email Verification" ok={!!user.isEmailVerified} />
            <SecurityRow label="Phone Verification"  ok={!!user.isPhoneVerified} />
            <SecurityRow label="Profile Completed"   ok={!!user.profileCompleted} />
            {user.role === "seller" && (
              <SecurityRow label="Seller Verified (by Admin)" ok={!!user.isVerified} />
            )}
          </div>
          {user.role === "seller" && (
            <Link href="/seller/profile"
              className="mt-4 block text-center py-2.5 border border-blue-200 text-blue-600 text-sm font-medium rounded-xl hover:bg-blue-50 transition">
              Go to Business Profile →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function VerifyBadge({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs ${ok ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"}`}>
      {ok
        ? <HiOutlineCheckCircle className="w-4 h-4 text-green-500 shrink-0" />
        : <HiOutlineXCircle    className="w-4 h-4 text-gray-300 shrink-0" />}
      <div className="min-w-0">
        <p className={`font-semibold truncate ${ok ? "text-green-700" : "text-gray-400"}`}>{label}</p>
        <p className="text-gray-400 truncate">{value}</p>
      </div>
    </div>
  );
}

function SecurityRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ok ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
        {ok ? "Verified" : "Pending"}
      </span>
    </div>
  );
}
