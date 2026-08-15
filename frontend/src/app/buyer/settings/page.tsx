"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { StateDropdown, CityDropdown } from "@/components/common/LocationDropdown";
import {
  HiOutlineUser,
  HiOutlineMapPin,
  HiOutlineBell,
  HiOutlineHeart,
  HiOutlineCreditCard,
  HiOutlineShieldExclamation,
  HiOutlineLockClosed,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlinePlusCircle,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineExclamationTriangle,
  HiOutlineDevicePhoneMobile,
  HiOutlineBuildingStorefront,
} from "@/lib/icons";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  language?: string;
  createdAt: string;
}

interface Address {
  _id: string;
  type: "home" | "office" | "other";
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

interface NotificationSettings {
  emailAlerts: boolean;
  whatsappAlerts: boolean;
  smsAlerts: boolean;
  orderUpdates: boolean;
  priceDrops: boolean;
  newQuotes: boolean;
  inquiryReplies: boolean;
  sellerMessages: boolean;
  weeklyDigest: boolean;
}

interface PaymentMethod {
  _id: string;
  type: "card" | "upi" | "netbanking";
  last4?: string;
  isDefault: boolean;
}

interface LoginSession {
  _id: string;
  deviceName: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

const TABS = [
  { id: "profile", label: "Profile & Account", icon: HiOutlineUser },
  { id: "address", label: "Addresses", icon: HiOutlineMapPin },
  { id: "notifications", label: "Notifications", icon: HiOutlineBell },
  { id: "security", label: "Security & Privacy", icon: HiOutlineShieldExclamation },
  { id: "payment", label: "Payment & Wallet", icon: HiOutlineCreditCard },
  { id: "wishlist", label: "Saved Items", icon: HiOutlineHeart },
];

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", language: "english" });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || "", phone: user.phone || "", language: (user as any).language || "english" });
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (passwordForm.new.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.post("/users/change-password", {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new,
      });
      toast.success("Password changed successfully");
      setShowPasswordModal(false);
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.post("/users/delete-account");
      toast.success("Account deleted successfully");
      localStorage.removeItem("token");
      router.push("/");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Personal Information</h3>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              placeholder="Your name"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <div className="flex gap-2">
              <span className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">+91</span>
              <input
                type="tel"
                value={form.phone}
                readOnly
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="9876543210"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Verified mobile number cannot be changed</p>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={user?.email || ""}
              readOnly
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Primary email cannot be changed</p>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language Preference</label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="english">English</option>
              <option value="hindi">हिंदी</option>
              <option value="gujarati">ગુજરાતી</option>
              <option value="marathi">मराठी</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Account Actions Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Account Actions</h3>

        <div className="space-y-3">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <HiOutlineLockClosed className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">Change Password</span>
            </div>
            <HiOutlineXMark className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-between px-4 py-3 border border-red-200 rounded-xl hover:bg-red-50 transition"
          >
            <div className="flex items-center gap-3">
              <HiOutlineTrash className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-600">Delete Account</span>
            </div>
            <HiOutlineXMark className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="px-6 py-5 space-y-4">
              {[
                { key: "current", label: "Current Password" },
                { key: "new", label: "New Password" },
                { key: "confirm", label: "Confirm Password" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <div className="relative">
                    <input
                      type={showPasswords[key as keyof typeof showPasswords] ? "text" : "password"}
                      value={passwordForm[key as keyof typeof passwordForm]}
                      onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({
                          ...showPasswords,
                          [key]: !showPasswords[key as keyof typeof showPasswords],
                        })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                    >
                      {showPasswords[key as keyof typeof showPasswords] ? (
                        <HiOutlineEyeSlash className="w-4 h-4" />
                      ) : (
                        <HiOutlineEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="px-6 py-5">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <HiOutlineExclamationTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. All your data, orders, and messages will be permanently deleted.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-60"
                >
                  {loading ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Address Tab ──────────────────────────────────────────────────────────────

function AddressTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ type: "home" | "office" | "other"; street: string; city: string; state: string; pincode: string }>({
    type: "home",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/addresses");
      setAddresses(res.data.data?.addresses || []);
    } catch {
      toast.error("Failed to fetch addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/users/addresses/${editingId}`, form);
        toast.success("Address updated");
      } else {
        await api.post("/users/addresses", form);
        toast.success("Address added");
      }
      fetchAddresses();
      setShowForm(false);
      setEditingId(null);
      setForm({ type: "home", street: "", city: "", state: "", pincode: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    setLoading(true);
    try {
      await api.delete(`/users/addresses/${id}`);
      toast.success("Address deleted");
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete address");
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setLoading(true);
    try {
      await api.put(`/users/addresses/${id}/default`);
      toast.success("Default address updated");
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update default");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Saved Addresses</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            <HiOutlinePlusCircle className="w-4 h-4" />
            Add Address
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <form onSubmit={handleSaveAddress} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                >
                  <option value="home">Home</option>
                  <option value="office">Office</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="400001"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address</label>
              <input
                type="text"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                placeholder="House no., Building name..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <StateDropdown value={form.state} onChange={(v) => setForm({ ...form, state: v, city: "" })} />
              </div>
              <div>
                <CityDropdown value={form.city} onChange={(v) => setForm({ ...form, city: v })} state={form.state} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Address"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm({ type: "home", street: "", city: "", state: "", pincode: "" });
                }}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <HiOutlineMapPin className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No addresses saved</p>
          <p className="text-sm text-gray-400 mt-1">Add your first address to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">
                    {addr.type}
                  </span>
                  {addr.isDefault && (
                    <span className="text-xs font-bold text-green-600 uppercase bg-green-50 px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800">{addr.street}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {addr.city}, {addr.state} {addr.pincode}
                </p>
              </div>

              <div className="flex gap-2 ml-4">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr._id)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition"
                    title="Set as default"
                  >
                    <HiOutlineCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingId(addr._id);
                    setForm({
                      type: addr.type,
                      street: addr.street,
                      city: addr.city,
                      state: addr.state,
                      pincode: addr.pincode,
                    });
                    setShowForm(true);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition"
                >
                  <HiOutlinePencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteAddress(addr._id)}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailAlerts: true,
    whatsappAlerts: false,
    smsAlerts: false,
    orderUpdates: true,
    priceDrops: true,
    newQuotes: true,
    inquiryReplies: true,
    sellerMessages: true,
    weeklyDigest: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/notification-settings");
      setSettings(res.data.data?.settings || settings);
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    setLoading(true);
    try {
      await api.put("/users/notification-settings", newSettings);
      toast.success("Settings updated");
    } catch (err: any) {
      toast.error("Failed to update settings");
      setSettings(settings);
    } finally {
      setLoading(false);
    }
  };

  const notificationGroups = [
    {
      title: "Alert Channels",
      items: [
        { key: "emailAlerts", label: "Email Alerts", desc: "Receive notifications via email" },
        { key: "whatsappAlerts", label: "WhatsApp Alerts", desc: "Get updates on WhatsApp" },
        { key: "smsAlerts", label: "SMS Alerts", desc: "Receive SMS notifications" },
      ],
    },
    {
      title: "Activity Alerts",
      items: [
        { key: "orderUpdates", label: "Order Updates", desc: "Status changes for your orders" },
        { key: "priceDrops", label: "Price Drop Alerts", desc: "Notify when prices decrease" },
        { key: "newQuotes", label: "New Quotes", desc: "Alerts for incoming quotes" },
        { key: "inquiryReplies", label: "Inquiry Replies", desc: "When sellers reply to inquiries" },
        { key: "sellerMessages", label: "Seller Messages", desc: "Direct messages from sellers" },
      ],
    },
    {
      title: "Digest",
      items: [
        { key: "weeklyDigest", label: "Weekly Digest", desc: "Summary of activity each week" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {notificationGroups.map((group) => (
        <div key={group.title}>
          <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">{group.title}</h3>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {group.items.map((item, idx) => (
              <div
                key={item.key}
                className={`flex items-center justify-between px-5 py-4 ${
                  idx !== group.items.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>

                <button
                  onClick={() => handleToggle(item.key as keyof NotificationSettings)}
                  disabled={loading}
                  className={`relative w-12 h-7 rounded-full transition ${
                    settings[item.key as keyof NotificationSettings] ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute w-6 h-6 bg-white rounded-full top-0.5 transition-transform ${
                      settings[item.key as keyof NotificationSettings] ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTwoFAModal, setShowTwoFAModal] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  useEffect(() => {
    fetchSessions();
    checkTwoFA();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/login-sessions");
      setSessions(res.data.data?.sessions || []);
    } catch {
      // Use empty
    } finally {
      setLoading(false);
    }
  };

  const checkTwoFA = async () => {
    try {
      const res = await api.get("/users/2fa-status");
      setTwoFAEnabled(res.data.data?.enabled || false);
    } catch {
      // Default to false
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    setLoading(true);
    try {
      await api.post(`/users/logout-session/${sessionId}`);
      toast.success("Session logged out");
      fetchSessions();
    } catch (err: any) {
      toast.error("Failed to logout session");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    setLoading(true);
    try {
      if (twoFAEnabled) {
        await api.post("/users/disable-2fa");
        toast.success("2FA disabled");
      } else {
        setShowTwoFAModal(true);
      }
      setTwoFAEnabled(!twoFAEnabled);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update 2FA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-4 border border-gray-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <HiOutlineDevicePhoneMobile className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Authenticator App</p>
              <p className="text-xs text-gray-500">{twoFAEnabled ? "Enabled" : "Disabled"}</p>
            </div>
          </div>

          <button
            onClick={handleToggle2FA}
            disabled={loading}
            className={`relative w-12 h-7 rounded-full transition ${twoFAEnabled ? "bg-green-600" : "bg-gray-300"}`}
          >
            <div
              className={`absolute w-6 h-6 bg-white rounded-full top-0.5 transition-transform ${
                twoFAEnabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Active Login Sessions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Active Login Sessions</h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No active sessions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session._id}
                className="flex items-start justify-between px-4 py-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <HiOutlineDevicePhoneMobile className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{session.deviceName}</p>
                      {session.isCurrent && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{session.ipAddress}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Last active: {new Date(session.lastActive).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    onClick={() => handleLogoutSession(session._id)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Logout
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blocked Sellers */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Blocked Sellers</h3>
        <div className="text-center py-8">
          <HiOutlineShieldExclamation className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">You haven't blocked any sellers</p>
        </div>
      </div>

      {showTwoFAModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Enable Two-Factor Authentication</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your authenticator app to enable 2FA.
              </p>
              <div className="bg-gray-100 rounded-xl p-4 mb-4 flex items-center justify-center h-48">
                <p className="text-gray-400 text-sm">QR Code Placeholder</p>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Or enter this code manually: <span className="font-mono font-bold">ABCD1234EFGH5678</span>
              </p>

              <button
                onClick={() => setShowTwoFAModal(false)}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payment Tab ──────────────────────────────────────────────────────────────

function PaymentTab() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetchPaymentMethods();
    fetchWalletBalance();
  }, []);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/payment-methods");
      setMethods(res.data.data?.methods || []);
    } catch {
      // Use empty
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const res = await api.get("/users/wallet");
      setWalletBalance(res.data.data?.balance || 0);
    } catch {
      // Default to 0
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm("Remove this payment method?")) return;
    setLoading(true);
    try {
      await api.delete(`/users/payment-methods/${id}`);
      toast.success("Payment method removed");
      fetchPaymentMethods();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove payment method");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm mb-2">Wallet Balance</p>
        <h2 className="text-4xl font-bold">₹{walletBalance.toLocaleString("en-IN")}</h2>
        <div className="flex gap-3 mt-5">
          <button className="flex-1 bg-white/20 text-white py-2 rounded-lg text-sm font-semibold hover:bg-white/30 transition">
            Add Money
          </button>
          <button className="flex-1 bg-white/20 text-white py-2 rounded-lg text-sm font-semibold hover:bg-white/30 transition">
            View Transactions
          </button>
        </div>
      </div>

      {/* Saved Payment Methods */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Saved Payment Methods</h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : methods.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <HiOutlineCreditCard className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-500">No payment methods saved</p>
            <p className="text-sm text-gray-400 mt-1">Add a payment method for faster checkout</p>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => (
              <div key={method._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                    <HiOutlineCreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{method.type.toUpperCase()}</p>
                    {method.last4 && <p className="text-xs text-gray-500">****{method.last4}</p>}
                    {method.isDefault && (
                      <span className="text-xs font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded inline-block mt-1">
                        Default
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeletePaymentMethod(method._id)}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button className="w-full mt-4 border border-gray-200 text-blue-600 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition">
          <HiOutlinePlusCircle className="w-4 h-4 inline-block mr-2" />
          Add Payment Method
        </button>
      </div>
    </div>
  );
}

// ─── Wishlist Tab ─────────────────────────────────────────────────────────────

function WishlistTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await api.get("/wishlist");
      setItems(res.data.data?.items || []);
    } catch {
      // Use empty
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/wishlist/${id}`);
      toast.success("Item removed from wishlist");
      fetchWishlist();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Saved Products ({items.length})</h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <HiOutlineHeart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-500">No saved products</p>
            <p className="text-sm text-gray-400 mt-1">Heart your favorite products to save them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between hover:shadow-sm transition"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 rounded-lg bg-gray-100" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Saved {new Date(item.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveItem(item._id)}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved Sellers */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Followed Sellers</h3>
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <HiOutlineBuildingStorefront className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No sellers followed</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

function SettingsContent() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account, privacy, and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-8">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-semibold text-center leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "address" && <AddressTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "payment" && <PaymentTab />}
        {activeTab === "wishlist" && <WishlistTab />}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "premium", "admin"]}>
      <SettingsContent />
    </ProtectedRoute>
  );
}
