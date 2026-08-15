'use client';

import {
  HiOutlineCheckCircle,
  HiMiniCheckCircle,
  HiOutlineShieldCheck,
  HiMiniShieldCheck,
} from "@/lib/icons";

interface VerificationBadgesProps {
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  isGSTVerified?: boolean;
  isAadhaarVerified?: boolean;
  isPANVerified?: boolean;
  isPremiumSeller?: boolean;
  isTopRatedSeller?: boolean;
  averageRating?: number;
  trustScore?: number;
}

export default function VerificationBadges({
  isEmailVerified = false,
  isMobileVerified = false,
  isGSTVerified = false,
  isAadhaarVerified = false,
  isPANVerified = false,
  isPremiumSeller = false,
  isTopRatedSeller = false,
  averageRating = 0,
  trustScore = 0,
}: VerificationBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Email Verified */}
      {isEmailVerified && (
        <div
          title="Email Verified"
          className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-200 transition cursor-help"
        >
          <HiMiniCheckCircle className="w-4 h-4" />
          Email
        </div>
      )}

      {/* Mobile Verified */}
      {isMobileVerified && (
        <div
          title="Mobile Verified"
          className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-green-200 transition cursor-help"
        >
          <HiMiniCheckCircle className="w-4 h-4" />
          Mobile
        </div>
      )}

      {/* GST Verified */}
      {isGSTVerified && (
        <div
          title="GST Verified by GSTN"
          className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-orange-200 transition cursor-help"
        >
          <HiMiniCheckCircle className="w-4 h-4" />
          GST Verified
        </div>
      )}

      {/* Aadhaar Verified */}
      {isAadhaarVerified && (
        <div
          title="Aadhaar Verified"
          className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-purple-200 transition cursor-help"
        >
          <HiMiniCheckCircle className="w-4 h-4" />
          Aadhaar
        </div>
      )}

      {/* PAN Verified */}
      {isPANVerified && (
        <div
          title="PAN Verified"
          className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-200 transition cursor-help"
        >
          <HiMiniCheckCircle className="w-4 h-4" />
          PAN Verified
        </div>
      )}

      {/* Premium Seller */}
      {isPremiumSeller && (
        <div
          title="Premium Seller - Enhanced Visibility"
          className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-yellow-200 transition cursor-help border border-yellow-300"
        >
          <span>👑</span>
          Premium Seller
        </div>
      )}

      {/* Top Rated Seller */}
      {isTopRatedSeller && averageRating >= 4 && (
        <div
          title={`Top Rated Seller - ${averageRating.toFixed(1)} stars`}
          className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-red-200 transition cursor-help border border-red-300"
        >
          <span>⭐</span>
          Top Rated
        </div>
      )}

      {/* Trust Seal */}
      {trustScore >= 4 && (
        <div
          title={`Trust Score: ${trustScore.toFixed(1)}/5 - Verified & Trusted`}
          className="flex items-center gap-1 bg-teal-100 text-teal-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-teal-200 transition cursor-help border border-teal-300"
        >
          <HiOutlineShieldCheck className="w-4 h-4" />
          Trust Seal
        </div>
      )}

      {/* Verification Count Badge */}
      {(isEmailVerified ||
        isMobileVerified ||
        isGSTVerified ||
        isAadhaarVerified ||
        isPANVerified) && (
        <div className="flex items-center gap-1 bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs font-bold">
          <span>
            {[
              isEmailVerified,
              isMobileVerified,
              isGSTVerified,
              isAadhaarVerified,
              isPANVerified,
            ].filter(Boolean).length}
          </span>
          <span>verified</span>
        </div>
      )}
    </div>
  );
}
