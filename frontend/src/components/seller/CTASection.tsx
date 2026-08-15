'use client';

import React from 'react';
import {
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineCreditCard,
} from "@/lib/icons";

interface CTASectionProps {
  sellerName: string;
  onChatClick: () => void;
  onInquiryClick: () => void;
}

export default function CTASection({
  sellerName,
  onChatClick,
  onInquiryClick,
}: CTASectionProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-6 rounded-2xl shadow-lg">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left: Content */}
          <div className="space-y-4">
            <h3 className="text-3xl font-bold">Ready to Start Trading?</h3>
            <p className="text-blue-100 text-lg">
              Connect with {sellerName} today and unlock exclusive B2B benefits. Get instant quotes, bulk discounts, and reliable delivery.
            </p>

            {/* Benefits List */}
            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-3">
                <HiOutlineCheckCircle className="w-6 h-6 flex-shrink-0" />
                <span>Verified Supplier with proven track record</span>
              </div>
              <div className="flex items-center gap-3">
                <HiOutlineShieldCheck className="w-6 h-6 flex-shrink-0" />
                <span>Secure transactions and buyer protection</span>
              </div>
              <div className="flex items-center gap-3">
                <HiOutlineTruck className="w-6 h-6 flex-shrink-0" />
                <span>Fast and reliable nationwide delivery</span>
              </div>
              <div className="flex items-center gap-3">
                <HiOutlineCreditCard className="w-6 h-6 flex-shrink-0" />
                <span>Flexible payment options and credit terms</span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-col gap-4">
            <button
              onClick={onChatClick}
              className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-6 rounded-xl transition-all text-lg shadow-lg hover:shadow-xl"
            >
              💬 Start Live Chat
            </button>

            <button
              onClick={onInquiryClick}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all text-lg shadow-lg hover:shadow-xl"
            >
              📝 Request Custom Quote
            </button>

            <p className="text-blue-100 text-center text-sm">
              ✓ Free quotes • No obligation • Response within 1 hour
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
