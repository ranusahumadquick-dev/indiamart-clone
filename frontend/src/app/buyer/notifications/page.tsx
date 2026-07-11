"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineBell,
  HiBell,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineArrowLeft,
} from "react-icons/hi2";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  inquiry_reply: "💬",
  sample_status: "📦",
  requirement_response: "📋",
  product_approved: "✅",
  product_rejected: "❌",
  order_update: "🛒",
  general: "🔔",
};

const TYPE_LABELS: Record<string, string> = {
  inquiry_reply: "Inquiry Reply",
  sample_status: "Sample Update",
  requirement_response: "Requirement Response",
  product_approved: "Product Approved",
  product_rejected: "Product Rejected",
  order_update: "Order Update",
  general: "General",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/notifications?page=${pg}&limit=20`);
      const d = res.data.data;
      if (pg === 1) {
        setNotifications(d.notifications || []);
      } else {
        setNotifications((prev) => [...prev, ...(d.notifications || [])]);
      }
      setUnread(d.unread || 0);
      setPages(d.pages || 1);
      setPage(pg);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to update notifications");
    }
  };

  const markOne = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnread((c) => Math.max(0, c - 1));
      } catch {
        // silently ignore
      }
    }
    if (notif.link) router.push(notif.link);
  };

  const deleteOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const n = notifications.find((n) => n._id === id);
      if (n && !n.isRead) setUnread((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const clearAll = async () => {
    if (!confirm("Delete all notifications?")) return;
    try {
      await api.delete("/notifications");
      setNotifications([]);
      setUnread(0);
      toast.success("All notifications cleared");
    } catch {
      toast.error("Failed to clear notifications");
    }
  };

  const displayed = filter === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <ProtectedRoute allowedRoles={["buyer", "premium", "seller", "admin"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"
            >
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <HiBell className="w-7 h-7 text-[var(--primary)]" />
                Notifications
              </h1>
              {unread > 0 && (
                <p className="text-sm text-gray-500 mt-0.5">{unread} unread</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1.5 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition"
                >
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1.5 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-4 w-fit">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === f
                    ? "bg-[var(--primary)] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f === "all" ? "All" : `Unread${unread > 0 ? ` (${unread})` : ""}`}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && page === 1 && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse flex gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && displayed.length === 0 && (
            <div className="text-center py-20">
              <HiOutlineBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </h2>
              <p className="text-gray-500 mb-6">
                {filter === "unread"
                  ? "You're all caught up!"
                  : "Activity on your account will appear here."}
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[var(--primary-dark)] transition"
              >
                Browse Products
              </Link>
            </div>
          )}

          {/* Notification List */}
          {!loading && displayed.length > 0 && (
            <div className="space-y-2">
              {displayed.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => markOne(notif)}
                  className={`group relative bg-white rounded-xl border ${
                    !notif.isRead ? "border-blue-200 bg-blue-50/30" : "border-gray-100"
                  } p-4 cursor-pointer hover:shadow-sm transition-all duration-150 flex items-start gap-4`}
                >
                  {/* Type Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                    !notif.isRead ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    {TYPE_ICONS[notif.type] || "🔔"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm leading-snug ${!notif.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                      </div>
                      <button
                        onClick={(e) => deleteOne(e, notif._id)}
                        className="shrink-0 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        title="Delete"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</span>
                      <span className="text-[10px] text-gray-300">•</span>
                      <span className="text-[10px] text-gray-400">{TYPE_LABELS[notif.type] || "General"}</span>
                      {!notif.isRead && (
                        <>
                          <span className="text-[10px] text-gray-300">•</span>
                          <span className="text-[10px] font-semibold text-blue-500">Unread</span>
                        </>
                      )}
                    </div>
                  </div>

                  {!notif.isRead && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              ))}

              {/* Load More */}
              {page < pages && filter === "all" && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => fetchNotifications(page + 1)}
                    disabled={loading}
                    className="text-sm text-[var(--primary)] font-semibold hover:underline disabled:opacity-60"
                  >
                    {loading ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
