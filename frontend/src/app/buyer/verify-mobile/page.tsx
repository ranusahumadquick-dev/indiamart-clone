"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MobileVerification from "@/components/ui/MobileVerification";
import { HiOutlineShieldCheck } from "react-icons/hi2";

export default function BuyerVerifyMobilePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const handleVerified = async (phone: string) => {
    await refreshUser?.();
    setTimeout(() => router.push("/buyer/dashboard"), 1000);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0052cc] to-indigo-600 px-8 py-6 text-center text-white">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <HiOutlineShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-black mb-1">Verify Your Mobile</h1>
            <p className="text-blue-100 text-sm">
              Enter your mobile number to receive OTP via SMS
            </p>
          </div>

          <div className="p-8">
            <MobileVerification
              onVerified={handleVerified}
              defaultPhone={user?.phone || ""}
            />

            <p className="text-center text-xs text-gray-400 mt-6">
              OTP powered by MSG91 · Secure · Instant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
