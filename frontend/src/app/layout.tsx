import type { Metadata } from "next";
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
        <AuthProvider>
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
                  </BulkInquiryProvider>
                </CartProvider>
              </CompareProvider>
            </PaymentProvider>
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
