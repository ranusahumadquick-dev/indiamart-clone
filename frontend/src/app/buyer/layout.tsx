"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  HiOutlineSquares2X2,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClipboardDocumentList,
  HiOutlineBeaker,
  HiOutlineArrowPath,
  HiOutlineChatBubbleOvalLeft,
  HiOutlineHeart,
  HiOutlineBell,
  HiOutlineUserCircle,
  HiOutlineBolt,
  HiOutlineBuildingStorefront,
  HiOutlineArrowLeft,
  HiOutlineSparkles,
  HiMiniShieldCheck,
  HiOutlineWrenchScrewdriver,
  HiOutlineReceiptPercent,
} from "react-icons/hi2";

const NAV = [
  {
    group: "Overview",
    links: [
      { href: "/buyer/dashboard",       label: "Dashboard",         icon: HiOutlineSquares2X2 },
    ],
  },
  {
    group: "Sourcing",
    links: [
      { href: "/buyer/procurement",      label: "B2B Procurement",   icon: HiOutlineBolt },
      { href: "/buyer/inquiries",        label: "Inquiries",         icon: HiOutlineChatBubbleLeftRight },
      { href: "/buyer/requirements",     label: "Buy Requirements",  icon: HiOutlineClipboardDocumentList },
      { href: "/buyer/samples",          label: "Sample Requests",   icon: HiOutlineBeaker },
      { href: "/buyer/orders",           label: "My Orders",         icon: HiOutlineArrowPath },
      { href: "/buyer/transactions",     label: "Transactions",      icon: HiOutlineReceiptPercent },
    ],
  },
  {
    group: "Services",
    links: [
      { href: "/services",               label: "Browse Services",   icon: HiOutlineWrenchScrewdriver },
    ],
  },
  {
    group: "Communication",
    links: [
      { href: "/buyer/messages",         label: "Messages",          icon: HiOutlineChatBubbleOvalLeft },
      { href: "/buyer/notifications",    label: "Notifications",     icon: HiOutlineBell },
    ],
  },
  {
    group: "Account",
    links: [
      { href: "/buyer/wishlist",         label: "Wishlist",          icon: HiOutlineHeart },
      { href: "/buyer/alerts",           label: "Price Alerts",      icon: HiOutlineBolt },
      { href: "/buyer/account-manager",  label: "Account Manager",   icon: HiOutlineBuildingStorefront },
      { href: "/buyer/settings",         label: "Settings",          icon: HiOutlineUserCircle },
      { href: "/buyer/plans",            label: "Upgrade Plan",      icon: HiOutlineSparkles },
    ],
  },
];

// Flat list for mobile tab bar (top 5 most used)
const MOBILE_TABS = [
  { href: "/buyer/dashboard",   label: "Home",      icon: HiOutlineSquares2X2 },
  { href: "/services",          label: "Services",  icon: HiOutlineWrenchScrewdriver },
  { href: "/buyer/inquiries",   label: "Inquiries", icon: HiOutlineChatBubbleLeftRight },
  { href: "/buyer/orders",      label: "Orders",    icon: HiOutlineArrowPath },
  { href: "/buyer/messages",    label: "Messages",  icon: HiOutlineChatBubbleOvalLeft },
];

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const initials = (user?.name || "B")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isActive = (href: string) =>
    href === "/buyer/dashboard"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 text-sm">
          <Link href="/" className="text-gray-400 hover:text-[var(--primary)] flex items-center gap-1 transition">
            <HiOutlineArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-medium">Buyer Panel</span>
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Desktop Sidebar ── */}
          <aside className="hidden md:block w-60 shrink-0 sticky top-24">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

              {/* User card */}
              <div className="bg-gradient-to-br from-[var(--primary)] to-blue-700 px-4 py-5 text-white">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-lg font-bold mb-3">
                  {initials}
                </div>
                <p className="font-semibold text-sm leading-snug truncate">{user?.name || "Buyer"}</p>
                <p className="text-blue-200 text-xs mt-0.5 truncate">{user?.email || ""}</p>
                {user?.isVerified && (
                  <span className="inline-flex items-center gap-1 mt-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                    <HiMiniShieldCheck className="w-3 h-3" /> Verified Buyer
                  </span>
                )}
              </div>

              {/* Nav groups */}
              <nav className="p-2 space-y-4">
                {NAV.map((group) => (
                  <div key={group.group}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pb-1">
                      {group.group}
                    </p>
                    <div className="space-y-0.5">
                      {group.links.map((link) => {
                        const active = isActive(link.href);
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                              active
                                ? "bg-blue-50 text-[var(--primary)]"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                            }`}
                          >
                            <link.icon className={`w-4 h-4 shrink-0 ${active ? "text-[var(--primary)]" : "text-gray-400"}`} />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0 pb-20 md:pb-0">
            {children}
          </main>

        </div>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
        <div className="flex justify-around py-2 px-1">
          {MOBILE_TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition ${
                  active ? "text-[var(--primary)]" : "text-gray-400"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
