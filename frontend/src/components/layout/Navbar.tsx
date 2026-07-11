"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import api from "@/lib/axios";
import { resolveImageUrl } from "@/lib/imageUrl";
import toast from "react-hot-toast";
import ChatNotificationBadge from "../ChatNotificationBadge";
import {
  HiMagnifyingGlass,
  HiOutlineBars3,
  HiXMark,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShoppingBag,
  HiOutlineClipboardDocumentList,
  HiOutlineUser,
  HiOutlineArrowRightOnRectangle,
  HiOutlineCog6Tooth,
  HiOutlineUserCircle,
  HiOutlineBuildingOffice2,
  HiOutlineBuildingOffice,
  HiOutlineSquares2X2,
  HiBell,
  HiOutlineBell,
  HiOutlineHeart,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineBuildingStorefront,
  HiOutlineTag,
  HiOutlineReceiptPercent,
  HiOutlineChartBar,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SearchSuggestion {
  _id: string;
  name: string;
  price: number;
  priceUnit?: string;
  category?: string;
  images?: { url: string }[];
}

interface SellerSuggestion {
  _id: string;
  name: string;
  companyName?: string;
  avatar?: string;
  businessType?: string;
  city?: string;
  isVerified?: boolean;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const notifIcons: Record<string, string> = {
  inquiry_reply: "💬",
  sample_status: "📦",
  requirement_response: "📋",
  product_approved: "✅",
  product_rejected: "❌",
  order_update: "🛒",
  general: "🔔",
};

// ─── Cart Icon Component ─────────────────────────────────────────────────────────

function CartIconWithBadge() {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  return (
    <Link
      href="/buyer/cart"
      className="relative p-2 rounded-lg hover:bg-gray-50 transition text-gray-600 hover:text-blue-500"
      title="My Cart"
    >
      <HiOutlineShoppingBag className="w-5 h-5" />
      {cartCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
          {cartCount > 9 ? "9+" : cartCount}
        </span>
      )}
    </Link>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

const Navbar = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();

  // --- UI state ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [sellerSuggestions, setSellerSuggestions] = useState<SellerSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // --- Notification state ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  // --- Refs ---
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // ── Close dropdowns on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch unread notification count (on auth change + interval) ─────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || loading) return;
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.data.count || 0);
    } catch (error: any) {
      // Log 401 errors for debugging
      if (error.response?.status === 401) {
        console.warn("[Navbar] 401 Unauthorized on /notifications/unread-count");
      }
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    // Only fetch after auth is done loading
    if (loading) return;

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchUnreadCount, loading]);

  // ── Fetch notifications when bell is opened ──────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || loading) return;
    setNotifLoading(true);
    try {
      const res = await api.get("/notifications?limit=10");
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.unread || 0);
    } catch (error: any) {
      // Log 401 errors for debugging
      if (error.response?.status === 401) {
        console.warn("[Navbar] 401 Unauthorized on /notifications");
      }
    } finally {
      setNotifLoading(false);
    }
  }, [isAuthenticated, loading]);

  const handleBellClick = () => {
    setNotifOpen((prev) => !prev);
    setUserMenuOpen(false);
    if (!notifOpen) fetchNotifications();
  };

  // ── Mark all as read ─────────────────────────────────────────────────────────
  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      toast.error("Failed to mark notifications");
    }
  };

  // ── Mark single as read + navigate ──────────────────────────────────────────
  const handleNotifClick = async (notif: Notification) => {
    setNotifOpen(false);
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
        setNotifications((prev) => prev.map((n) => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silently ignore
      }
    }
    if (notif.link) router.push(notif.link);
  };

  // ── Search autocomplete ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setSuggestions([]);
      setSellerSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        const [productRes, sellerRes] = await Promise.allSettled([
          api.get(`/products/search?q=${encodeURIComponent(debouncedQuery)}&limit=4&page=1`),
          api.get(`/sellers?search=${encodeURIComponent(debouncedQuery)}&limit=3`),
        ]);
        const products = productRes.status === 'fulfilled'
          ? (productRes.value.data.data?.products || productRes.value.data.data || [])
          : [];
        const sellers = sellerRes.status === 'fulfilled'
          ? (sellerRes.value.data.data?.sellers || sellerRes.value.data.data || [])
          : [];
        setSuggestions(products.slice(0, 4));
        setSellerSuggestions(sellers.slice(0, 3));
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
        setSellerSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (product: SearchSuggestion) => {
    setShowSuggestions(false);
    setSearchQuery("");
    router.push(`/products/${product._id}`);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    await logout();
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getDashboardPath = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin";
    if (user.role === "seller") return "/seller/dashboard";
    return "/buyer/dashboard";
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Top Bar */}
      <div className="bg-[var(--primary-dark)] text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span className="hidden sm:block">
            India&apos;s Largest B2B Marketplace — Trusted by 10M+ Buyers
          </span>
          <span className="sm:hidden text-center flex-1">Trusted by 10M+ Buyers</span>
          <div className="hidden md:flex gap-4 items-center">
            <Link href="/seller-register" className="hover:text-yellow-300 transition font-semibold">🏪 Become a Seller</Link>
            <span className="text-gray-400">|</span>
            <Link href="/help" className="hover:text-yellow-300 transition">Help Center</Link>
            {!isAuthenticated && (
              <>
                <span className="text-gray-400">|</span>
                <Link href="/auth/login" className="hover:text-yellow-300 transition">Download App</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-[var(--primary)] text-white font-extrabold text-lg px-2 py-1 rounded-md">IM</div>
            <div className="hidden sm:block">
              <span className="text-[var(--primary)] font-bold text-lg leading-none block">IndiaMart</span>
              <span className="text-[10px] text-gray-400 leading-none">B2B Marketplace</span>
            </div>
          </Link>

          {/* Search Bar with Autocomplete */}
          <div ref={searchRef} className="flex-1 max-w-2xl relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products, suppliers, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="w-full px-4 py-2.5 pr-24 rounded-lg border border-gray-300 text-gray-800 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100 transition"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-[var(--primary)] text-white px-4 py-1.5 rounded-md hover:bg-[var(--primary-dark)] transition text-sm font-medium flex items-center gap-1.5"
                >
                  <HiMagnifyingGlass className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </form>

            {/* Autocomplete Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                {suggestionsLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </div>
                ) : suggestions.length === 0 && sellerSuggestions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
                ) : (
                  <>
                    {/* Product results */}
                    {suggestions.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-[11px] text-gray-400 font-semibold uppercase tracking-wide border-b border-gray-50">
                          Products
                        </div>
                        {suggestions.map((product) => (
                          <button
                            key={product._id}
                            onClick={() => handleSuggestionClick(product)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition text-left"
                          >
                            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                              {product.images?.[0]?.url ? (
                                <img
                                  src={resolveImageUrl(product.images[0].url)}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <HiOutlineShoppingBag className="w-5 h-5 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[var(--primary)]">
                                  {formatINR(product.price)}/{product.priceUnit || "Pc"}
                                </span>
                                {product.category && (
                                  <span className="text-[10px] text-gray-400">
                                    {typeof product.category === 'string' ? product.category : (product.category as any)?.name || 'Product'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <HiMagnifyingGlass className="w-4 h-4 text-gray-300 shrink-0" />
                          </button>
                        ))}
                      </>
                    )}

                    {/* Seller results */}
                    {sellerSuggestions.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-[11px] text-gray-400 font-semibold uppercase tracking-wide border-t border-gray-50 bg-gray-50/50">
                          Suppliers
                        </div>
                        {sellerSuggestions.map((seller) => (
                          <button
                            key={seller._id}
                            onClick={() => {
                              setShowSuggestions(false);
                              setSearchQuery("");
                              router.push(`/seller-store/${seller._id}`);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-green-50 transition text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-blue-100 overflow-hidden shrink-0 flex items-center justify-center">
                              {seller.avatar ? (
                                <img
                                  src={resolveImageUrl(seller.avatar)}
                                  alt={seller.companyName || seller.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-lg font-bold text-green-600">
                                  {(seller.companyName || seller.name || 'S')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {seller.companyName || seller.name}
                                </p>
                                {seller.isVerified && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium shrink-0">✓ Verified</span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-400 truncate">
                                {[seller.businessType, seller.city].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                            <HiOutlineBuildingOffice className="w-4 h-4 text-gray-300 shrink-0" />
                          </button>
                        ))}
                      </>
                    )}

                    <button
                      onClick={() => {
                        setShowSuggestions(false);
                        router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                      }}
                      className="w-full px-3 py-2.5 text-sm text-[var(--primary)] font-semibold hover:bg-blue-50 transition border-t border-gray-100 flex items-center gap-2"
                    >
                      <HiMagnifyingGlass className="w-4 h-4" />
                      See all results for &ldquo;{searchQuery}&rdquo;
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-1">
            <Link
              href="/products"
              className="flex items-center gap-1.5 text-gray-600 text-sm px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-[var(--primary)] transition"
            >
              <HiOutlineShoppingBag className="w-5 h-5" />
              <span className="font-medium">Products</span>
            </Link>
            <Link
              href="/categories"
              className="flex items-center gap-1.5 text-gray-600 text-sm px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-[var(--primary)] transition"
            >
              <HiOutlineClipboardDocumentList className="w-5 h-5" />
              <span className="font-medium">Categories</span>
            </Link>
            <Link
              href="/services"
              className="flex items-center gap-1.5 text-gray-600 text-sm px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-[var(--primary)] transition"
            >
              <HiOutlineWrenchScrewdriver className="w-5 h-5" />
              <span className="font-medium">Services</span>
            </Link>
            <Link
              href="/post-requirement"
              className="flex items-center gap-1.5 text-[var(--secondary)] text-sm px-3 py-2 rounded-lg border border-orange-200 hover:bg-orange-50 transition font-semibold"
            >
              <HiOutlineChatBubbleLeftRight className="w-5 h-5" />
              Post Requirement
            </Link>

            {/* Auth Section */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-1">
                {/* Wishlist link (buyer/premium only) */}
                {(user.role === "buyer" || user.role === "premium") && (
                  <Link
                    href="/buyer/wishlist"
                    className="relative p-2 rounded-lg hover:bg-gray-50 transition text-gray-600 hover:text-red-500"
                    title="My Wishlist"
                  >
                    <HiOutlineHeart className="w-5 h-5" />
                  </Link>
                )}


                {/* Chat Messages Badge */}
                <ChatNotificationBadge onChatClick={() => {
                  if (user?.role === 'buyer') {
                    router.push('/buyer/chats');
                  } else if (user?.role === 'seller') {
                    router.push('/seller/inquiries');
                  }
                }} />

                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={handleBellClick}
                    className="relative p-2 rounded-lg hover:bg-gray-50 transition text-gray-600 hover:text-[var(--primary)]"
                    title="Notifications"
                  >
                    {unreadCount > 0 ? (
                      <HiBell className="w-5 h-5 text-[var(--primary)]" />
                    ) : (
                      <HiOutlineBell className="w-5 h-5" />
                    )}
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
                          >
                            <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="text-center py-8">
                            <HiOutlineBell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <button
                              key={notif._id}
                              onClick={() => handleNotifClick(notif)}
                              className={`w-full flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition text-left ${
                                !notif.isRead ? "bg-blue-50/50" : ""
                              }`}
                            >
                              <span className="text-lg shrink-0 mt-0.5">
                                {notifIcons[notif.type] || "🔔"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${!notif.isRead ? "font-semibold text-gray-800" : "text-gray-700"}`}>
                                  {notif.title}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                              </div>
                              {!notif.isRead && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                              )}
                            </button>
                          ))
                        )}
                      </div>

                      <div className="border-t border-gray-100 px-4 py-2.5">
                        <Link
                          href="/buyer/notifications"
                          onClick={() => setNotifOpen(false)}
                          className="text-sm text-[var(--primary)] font-semibold hover:underline"
                        >
                          View all notifications →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar + Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <div className="text-left hidden xl:block">
                      <p className="text-sm font-medium text-gray-700 leading-none">{user.name?.split(" ")[0]}</p>
                      <p className="text-[10px] text-gray-400 capitalize leading-none mt-0.5">{user.role}</p>
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                      <div className="px-4 py-3 bg-gray-50 border-b">
                        <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                        <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          user.role === "seller" ? "bg-orange-100 text-orange-700"
                            : user.role === "admin" ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {user.role === "seller" ? "🏷️ Seller" : user.role === "admin" ? "👑 Admin" : "🛒 Buyer"}
                        </span>
                      </div>
                      <div className="py-1">
                        <Link href={getDashboardPath()} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => setUserMenuOpen(false)}>
                          <HiOutlineSquares2X2 className="w-4 h-4 text-gray-400" />
                          Dashboard
                        </Link>
                        <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => setUserMenuOpen(false)}>
                          <HiOutlineUserCircle className="w-4 h-4 text-gray-400" />
                          My Profile
                        </Link>
                        {(user.role === "buyer" || user.role === "premium") && (
                          <Link href="/buyer/wishlist" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => setUserMenuOpen(false)}>
                            <HiOutlineHeart className="w-4 h-4 text-gray-400" />
                            My Wishlist
                          </Link>
                        )}
                        {user.role === "seller" && (
                          <Link href="/seller/products" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => setUserMenuOpen(false)}>
                            <HiOutlineBuildingOffice2 className="w-4 h-4 text-gray-400" />
                            My Products
                          </Link>
                        )}
                        <Link
                          href={user.role === "admin" ? "/admin/settings" : user.role === "seller" ? "/seller/settings" : "/buyer/settings"}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <HiOutlineCog6Tooth className="w-4 h-4 text-gray-400" />
                          Settings
                        </Link>
                      </div>
                      <div className="border-t">
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition">
                          <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link href="/auth/login" className="flex items-center gap-1.5 text-white bg-[var(--primary)] text-sm px-4 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition font-medium ml-1">
                <HiOutlineUser className="w-5 h-5" />
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-gray-600 p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <HiXMark className="w-6 h-6" /> : <HiOutlineBars3 className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer — full-height slide-in from right */}
      {/* Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[300px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--primary)] text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-white text-[var(--primary)] font-extrabold text-sm px-1.5 py-0.5 rounded">IM</div>
            <span className="font-bold text-sm">IndiaMart</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-white/20 transition">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {isAuthenticated && user ? (
            <>
              {/* User profile card */}
              <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-base font-bold overflow-hidden shrink-0">
                    {user.avatar
                      ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      : getInitials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      user.role === "seller" ? "bg-orange-100 text-orange-700"
                      : user.role === "admin" ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.role === "seller" ? "🏷️ Seller" : user.role === "admin" ? "👑 Admin" : "🛒 Buyer"}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Section: Main */}
              <div className="px-3 pt-3 pb-1">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider px-2 mb-1">Main</p>
                {[
                  {
                    href: user.role === "admin" ? "/admin" : user.role === "seller" ? "/seller/dashboard" : "/buyer/dashboard",
                    icon: HiOutlineSquares2X2,
                    label: "Dashboard",
                  },
                  { href: "/products", icon: HiOutlineShoppingBag, label: "All Products" },
                  { href: "/categories", icon: HiOutlineTag, label: "Categories" },
                  { href: "/services", icon: HiOutlineWrenchScrewdriver, label: "Services" },
                  { href: "/brands", icon: HiOutlineBuildingStorefront, label: "Brands" },
                  { href: "/sellers", icon: HiOutlineBuildingStorefront, label: "Find Suppliers" },
                ].map(({ href, icon: Icon, label }) => (
                  <Link key={label} href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-[var(--primary)] transition text-sm font-medium">
                    <Icon className="text-gray-400" style={{ width: "18px", height: "18px" }} />
                    {label}
                  </Link>
                ))}
              </div>

              {/* Section: Buyer / Premium activity links — show for anyone who is NOT seller or admin */}
              {user.role !== "seller" && user.role !== "admin" && (
                <div className="px-3 pt-2 pb-1 border-t border-gray-100 mt-1">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider px-2 mb-1">My Activity</p>
                  {[
                    { href: "/buyer/inquiries", icon: HiOutlineChatBubbleLeftRight, label: "My Inquiries", badge: 0 },
                    { href: "/buyer/requirements", icon: HiOutlineClipboardDocumentList, label: "RFQ / Requirements", badge: 0 },
                    { href: "/buyer/wishlist", icon: HiOutlineHeart, label: "Wishlist & Suppliers", badge: 0 },
                    { href: "/buyer/cart", icon: HiOutlineShoppingBag, label: "My Cart", badge: 0 },
                    { href: "/buyer/alerts", icon: HiOutlineBell, label: "Price Alerts", badge: 0 },
                    { href: "/buyer/notifications", icon: HiOutlineBell, label: "Notifications", badge: unreadCount },
                  ].map(({ href, icon: Icon, label, badge = 0 }) => (
                    <Link key={href} href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-[var(--primary)] transition text-sm font-medium">
                      <Icon className="text-gray-400" style={{ width: "18px", height: "18px" }} />
                      <span className="flex-1">{label}</span>
                      {badge > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* Section: Seller links */}
              {user.role === "seller" && (
                <div className="px-3 pt-2 pb-1 border-t border-gray-100 mt-1">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider px-2 mb-1">Seller</p>
                  {[
                    { href: "/seller/products", icon: HiOutlineShoppingBag, label: "My Products" },
                    { href: "/seller/inbox", icon: HiOutlineChatBubbleLeftRight, label: "Inquiries" },
                    { href: "/seller/analytics", icon: HiOutlineChartBar, label: "Analytics" },
                    { href: "/buyer/notifications", icon: HiOutlineBell, label: "Notifications", badge: unreadCount },
                  ].map(({ href, icon: Icon, label, badge = 0 }) => (
                    <Link key={href} href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-[var(--primary)] transition text-sm font-medium">
                      <Icon className="text-gray-400" style={{ width: "18px", height: "18px" }} />
                      <span className="flex-1">{label}</span>
                      {badge > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* Post Requirement CTA */}
              <div className="px-4 py-3 border-t border-gray-100 mt-1">
                <Link href="/buyer/requirements"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--secondary)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition">
                  <HiOutlineClipboardDocumentList className="w-4 h-4" />
                  Post Your Requirement
                </Link>
              </div>

              {/* Account + Logout */}
              <div className="px-3 pb-3 border-t border-gray-100">
                <Link href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium mt-1">
                  <HiOutlineUserCircle style={{ width: "18px", height: "18px" }} className="text-gray-400" />
                  My Profile
                </Link>
                <Link
                  href={user?.role === "admin" ? "/admin/settings" : user?.role === "seller" ? "/seller/settings" : "/buyer/settings"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium">
                  <HiOutlineCog6Tooth style={{ width: "18px", height: "18px" }} className="text-gray-400" />
                  Settings
                </Link>
                <button onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition text-sm font-medium w-full mt-1">
                  <HiOutlineArrowRightOnRectangle style={{ width: "18px", height: "18px" }} />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Guest user menu */}
              <div className="px-3 py-3">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider px-2 mb-1">Explore</p>
                {[
                  { href: "/products", icon: HiOutlineShoppingBag, label: "All Products" },
                  { href: "/categories", icon: HiOutlineTag, label: "Categories" },
                  { href: "/services", icon: HiOutlineWrenchScrewdriver, label: "Services" },
                  { href: "/brands", icon: HiOutlineBuildingStorefront, label: "Brands" },
                  { href: "/sellers", icon: HiOutlineBuildingStorefront, label: "Find Suppliers" },
                ].map(({ href, icon: Icon, label }) => (
                  <Link key={href} href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-[var(--primary)] transition text-sm font-medium">
                    <Icon className="text-gray-400" style={{ width: "18px", height: "18px" }} />
                    {label}
                  </Link>
                ))}
                <Link href="/post-requirement"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--secondary)] hover:bg-orange-50 transition text-sm font-semibold">
                  <HiOutlineChatBubbleLeftRight style={{ width: "18px", height: "18px" }} />
                  Post Your Requirement
                </Link>
                <Link href="/seller-register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-blue-50 transition text-sm font-medium">
                  <HiOutlineBuildingOffice2 style={{ width: "18px", height: "18px" }} className="text-gray-400" />
                  Become a Seller
                </Link>
              </div>

              <div className="px-4 py-3 border-t border-gray-100">
                <Link href="/seller-register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#ff6b00] text-white rounded-xl text-sm font-bold hover:bg-[#e05a00] transition mb-2">
                  🏪 Start Selling Free
                </Link>
                <Link href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition">
                  <HiOutlineUser className="w-4 h-4" />
                  Login / Register
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
