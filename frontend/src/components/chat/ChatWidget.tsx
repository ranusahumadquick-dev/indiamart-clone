"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { HiOutlineChatBubbleLeftRight, HiOutlineXMark } from "@/lib/icons";
import Link from "next/link";
import ChatWindow from "./ChatWindow";
import api from "@/lib/axios";

export default function ChatWidget() {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showLoginTip, setShowLoginTip] = useState(false);
  const [unread, setUnread] = useState(0);
  const tipRef = useRef<HTMLDivElement>(null);

  const hidden = pathname.startsWith("/auth") || pathname.startsWith("/admin");

  // Close tooltip when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tipRef.current && !tipRef.current.contains(e.target as Node)) {
        setShowLoginTip(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (loading || !isAuthenticated || hidden) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get("/messages/conversations");
        const total = (res.data.data || []).reduce(
          (sum: number, c: any) => sum + (c.myUnread || 0),
          0
        );
        setUnread(total);
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [loading, isAuthenticated, hidden]);

  if (hidden || loading) return null;

  const handleClick = () => {
    if (!isAuthenticated) {
      setShowLoginTip((prev) => !prev);
      return;
    }
    setOpen(true);
  };

  return (
    <div ref={tipRef} className="fixed bottom-6 right-6 z-50">
      {/* Login tooltip for unauthenticated users */}
      {showLoginTip && !isAuthenticated && (
        <div className="absolute bottom-16 right-0 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 mb-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-800">Chat with Sellers</p>
            <button onClick={() => setShowLoginTip(false)} className="text-gray-400 hover:text-gray-600">
              <HiOutlineXMark className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Login to chat directly with suppliers and get quick quotes.
          </p>
          <Link
            href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
            className="block w-full text-center bg-[var(--primary)] text-white text-sm font-medium py-2 rounded-lg hover:opacity-90 transition"
            onClick={() => setShowLoginTip(false)}
          >
            Login to Chat
          </Link>
          <Link
            href="/auth/register"
            className="block w-full text-center text-[var(--primary)] text-xs font-medium py-1.5 hover:underline"
            onClick={() => setShowLoginTip(false)}
          >
            New user? Register free
          </Link>
          {/* Arrow */}
          <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45" />
        </div>
      )}

      {/* Floating chat button */}
      {!open && (
        <button
          onClick={handleClick}
          className="w-14 h-14 bg-[var(--primary)] text-white rounded-full shadow-lg hover:bg-[var(--primary-dark)] transition flex items-center justify-center relative"
          aria-label={isAuthenticated ? "Open messages" : "Chat with sellers"}
        >
          <HiOutlineChatBubbleLeftRight className="w-6 h-6" />
          {isAuthenticated && unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-[var(--secondary)] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}

      {/* Chat window — authenticated only */}
      {isAuthenticated && open && (
        <div className="absolute bottom-16 right-0 w-[360px] h-[480px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col mb-1">
          <ChatWindow onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
