'use client';

import React from 'react';
import Image from 'next/image';
import {
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineChatBubbleLeftRight,
  HiOutlineEnvelope,
  HiOutlineStar,
} from 'react-icons/hi2';

interface CompanyHeaderProps {
  seller: any;
  onChatClick: () => void;
  onInquiryClick: () => void;
  onWhatsAppClick: () => void;
  onCallClick: () => void;
}

export default function CompanyHeader({
  seller,
  onChatClick,
  onInquiryClick,
  onWhatsAppClick,
  onCallClick,
}: CompanyHeaderProps) {
  return (
    <div className="w-full bg-white">
      {/* Company Banner */}
      <div className="w-full h-64 bg-gradient-to-r from-blue-600 to-blue-800 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full -ml-32 -mb-32"></div>
        </div>
      </div>

      {/* Header Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Logo & Company Info */}
            <div className="flex-shrink-0 flex flex-col items-start">
              {/* Company Logo */}
              <div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 border-2 border-gray-200">
                {seller?.businessLogo ? (
                  <Image
                    src={seller.businessLogo}
                    alt={seller.companyName}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-4xl font-bold text-blue-600">
                    {(seller?.companyName?.[0] || 'S').toUpperCase()}
                  </div>
                )}
              </div>

              {/* Verified Since */}
              {seller?.yearEstablished && (
                <span className="text-sm text-gray-500 font-medium">
                  Verified Since {seller.yearEstablished}
                </span>
              )}
            </div>

            {/* Middle: Company Details */}
            <div className="flex-1">
              {/* Company Name + Badge */}
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">{seller?.companyName}</h1>
                {seller?.isVerified && (
                  <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                    <span>✓</span> Verified Supplier
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <HiOutlineMapPin className="w-5 h-5" />
                <span className="font-medium">
                  {seller?.city}, {seller?.state} - {seller?.pincode}
                </span>
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Years in Business */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {new Date().getFullYear() - (seller?.yearEstablished || 2020)}+
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Years in Business</div>
                </div>

                {/* Response Time */}
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {seller?.responseTimeMinutes || '< 1'}h
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Response Time</div>
                </div>

                {/* Response Rate */}
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">
                    {seller?.responseRate || '90'}%
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Response Rate</div>
                </div>

                {/* Rating */}
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-purple-600">
                      {seller?.averageRating?.toFixed(1) || '4.5'}
                    </div>
                    <span className="text-lg">⭐</span>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    {seller?.totalReviews || 0} reviews
                  </div>
                </div>
              </div>

              {/* Verification Badges Row */}
              <div className="flex flex-wrap gap-2 mb-4">
                {seller?.isGSTVerified && (
                  <div className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-bold text-blue-700 flex items-center gap-1">
                    <span>✓</span> GST Verified
                  </div>
                )}
                {seller?.isEmailVerified && (
                  <div className="bg-green-50 border border-green-200 rounded-full px-3 py-1 text-xs font-bold text-green-700 flex items-center gap-1">
                    <span>✓</span> Email Verified
                  </div>
                )}
                {seller?.isPhoneVerified && (
                  <div className="bg-orange-50 border border-orange-200 rounded-full px-3 py-1 text-xs font-bold text-orange-700 flex items-center gap-1">
                    <span>✓</span> Mobile Verified
                  </div>
                )}
                {seller?.isPremiumSeller && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1 text-xs font-bold text-yellow-700 flex items-center gap-1">
                    <span>👑</span> Premium Seller
                  </div>
                )}
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-col gap-3 justify-start">
              <button
                onClick={onChatClick}
                className="w-full md:w-48 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <HiOutlineChatBubbleLeftRight className="w-5 h-5" />
                Chat Now
              </button>

              <button
                onClick={onInquiryClick}
                className="w-full md:w-48 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Send Inquiry
              </button>

              <button
                onClick={onWhatsAppClick}
                className="w-full md:w-48 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <span>💬</span> WhatsApp
              </button>

              <button
                onClick={onCallClick}
                className="w-full md:w-48 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <HiOutlinePhone className="w-5 h-5" />
                Call
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Contact Info Row */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {seller?.phone && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <HiOutlinePhone className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-600 font-medium">Mobile</div>
              <div className="text-sm font-bold text-gray-900">{seller.phone}</div>
            </div>
          </div>
        )}

        {seller?.email && (
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <HiOutlineEnvelope className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-600 font-medium">Email</div>
              <div className="text-sm font-bold text-gray-900">{seller.email}</div>
            </div>
          </div>
        )}

        {seller?.website && (
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <span className="text-xl flex-shrink-0">🌐</span>
            <div>
              <div className="text-xs text-gray-600 font-medium">Website</div>
              <div className="text-sm font-bold text-gray-900 truncate">{seller.website}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
