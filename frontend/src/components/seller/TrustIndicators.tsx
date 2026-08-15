'use client';

import React from 'react';
import {
  HiCheckBadge,
  HiOutlineShieldCheck,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineSparkles,
  HiOutlineAdjustmentsHorizontal,
} from "@/lib/icons";

interface TrustIndicatorsProps {
  seller: any;
}

export default function TrustIndicators({ seller }: TrustIndicatorsProps) {
  const isTopRated = seller?.totalReviews >= 5 && Number(seller?.averageRating) >= 4;

  const trustItems = [
    {
      icon: HiOutlineShieldCheck,
      label: 'Trusted Seller',
      verified: seller?.isVerified,
      description: 'Seller Verification Passed',
    },
    {
      icon: HiOutlinePhone,
      label: 'Mobile Verified',
      verified: seller?.isMobileVerified,
      description: 'Phone Number Verified',
    },
    {
      icon: HiOutlineEnvelope,
      label: 'Email Verified',
      verified: seller?.isEmailVerified,
      description: 'Email Address Verified',
    },
    {
      icon: HiOutlineSparkles,
      label: 'Top Rated',
      verified: isTopRated,
      description: `${Number(seller?.averageRating || 0).toFixed(1)} ★ across ${seller?.totalReviews || 0} reviews`,
    },
    {
      icon: HiOutlineAdjustmentsHorizontal,
      label: 'Secure Payments',
      verified: true,
      description: 'Encrypted Transaction System',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pl-4 border-l-4 border-green-600">
        <h3 className="text-2xl font-bold text-gray-900">Trust & Verification</h3>
        <p className="text-gray-600 text-sm mt-1">All verifications that build buyer confidence</p>
      </div>

      {/* Trust Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trustItems.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div
              key={idx}
              className={`${
                item.verified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              } border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="flex items-start gap-4">
                {/* Icon with Check Circle */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      item.verified
                        ? 'bg-gradient-to-br from-green-500 to-green-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  {item.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border-2 border-green-500">
                      <HiCheckBadge className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="font-bold text-gray-900">
                    {item.label}
                    {item.verified && <span className="text-green-600 ml-1">✓</span>}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  {item.verified && (
                    <div className="mt-2 inline-block px-3 py-1 bg-green-100 rounded-full text-xs font-bold text-green-700">
                      Verified
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Score Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-bold mb-2">Trust Score</h4>
            <p className="text-green-50">
              This seller maintains high buyer satisfaction standards.
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-5xl font-black">
              {typeof seller?.trustScore === 'number' ? seller.trustScore.toFixed(1) : '4.2'}
            </div>
            <div className="text-green-100 text-sm font-semibold">out of 5.0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
