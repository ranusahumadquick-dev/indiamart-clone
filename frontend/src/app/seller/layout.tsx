"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  HiOutlineSquares2X2,
  HiOutlineShoppingBag,
  HiOutlinePlusCircle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUserCircle,
  HiOutlineArrowLeft,
  HiOutlineBeaker,
  HiOutlineClipboardDocumentList,
  HiOutlineChatBubbleOvalLeft,
  HiOutlineLockClosed,
  HiOutlineBuildingOffice2,
  HiOutlineCog6Tooth,
  HiOutlinePhone,
  HiOutlineBell,
  HiOutlineStar,
  HiOutlineChartBar,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineCurrencyRupee,
  HiOutlineBuildingStorefront,
} from "@/lib/icons";

const sidebarLinks = [
  { href: "/seller/dashboard",    label: "Dashboard",          icon: HiOutlineSquares2X2 },
  { href: "/seller/analytics",    label: "Analytics",          icon: HiOutlineChartBar },
  { href: "/seller/products",     label: "My Products",        icon: HiOutlineShoppingBag },
  { href: "/seller/products/new", label: "Add Product",        icon: HiOutlinePlusCircle },
  { href: "/seller/featured-products", label: "Featured Products", icon: HiOutlineStar },
  { href: "/seller/services",     label: "My Services",        icon: HiOutlineSparkles },
  { href: "/seller/brands",      label: "Brand Management",   icon: HiOutlineBuildingStorefront },
  { href: "/seller/inquiries",    label: "Inquiries",          icon: HiOutlineChatBubbleLeftRight },
  { href: "/seller/samples",      label: "Samples",            icon: HiOutlineBeaker },
  { href: "/seller/orders",       label: "Orders",             icon: HiOutlineClipboardDocumentList },
  { href: "/seller/payments",     label: "Payments",           icon: HiOutlineCurrencyRupee },
  { href: "/seller/messages",     label: "Messages",           icon: HiOutlineChatBubbleOvalLeft },
  { href: "/seller/invitations",  label: "Private Invitations",icon: HiOutlineLockClosed },
  { href: "/seller/requirements", label: "Buyer Requirements",  icon: HiOutlineClipboardDocumentList },
  { href: "/seller/profile",      label: "Business Profile",   icon: HiOutlineBuildingOffice2 },
  { href: "/seller/itr-certificates", label: "ITR Certificates",   icon: HiOutlineShieldCheck },
  { href: "/seller/settings",              label: "Settings",                 icon: HiOutlineCog6Tooth },
  { href: "/seller/settings/contact",       label: "Contact Settings",      icon: HiOutlinePhone },
  { href: "/seller/settings/notifications", label: "Notification Settings",  icon: HiOutlineBell },
  { href: "/seller/settings/requirements",  label: "Requirement Alerts",     icon: HiOutlineBell },
  { href: "/profile",             label: "Account",            icon: HiOutlineUserCircle },
];

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Registration page has its own full-page layout — no sidebar
  if (pathname === "/seller/register") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[80vh] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link
            href="/"
            className="text-gray-400 hover:text-[var(--primary)] flex items-center gap-1"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-medium">Seller Panel</span>
        </div>

        <div className="flex gap-6">
          {/* Sidebar — Desktop */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              {/* Seller Info */}
              <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] p-4 text-white">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold mb-2">
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "S"}
                </div>
                <p className="font-semibold text-sm">{user?.name}</p>
                <p className="text-blue-100 text-xs">{user?.companyName || "Seller"}</p>
              </div>

              {/* Navigation */}
              <nav className="p-2">
                {sidebarLinks.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/seller/dashboard" &&
                      pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? "bg-blue-50 text-[var(--primary)]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Mobile Tab Bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
            <div className="flex justify-around py-2">
              {sidebarLinks.slice(0, 4).map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/seller/dashboard" &&
                    pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium ${
                      isActive
                        ? "text-[var(--primary)]"
                        : "text-gray-400"
                    }`}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label.split(" ")[0]}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
