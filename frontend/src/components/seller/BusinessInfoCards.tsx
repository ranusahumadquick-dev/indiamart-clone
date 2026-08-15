'use client';

import React from 'react';
import {
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineMapPin,
  HiOutlineCheckBadge,
  HiOutlineShieldCheck,
  HiOutlineCube,
} from "@/lib/icons";

interface BusinessInfoCardsProps {
  seller: any;
}

export default function BusinessInfoCards({ seller }: BusinessInfoCardsProps) {
  const infoCards = [
    {
      icon: HiOutlineBriefcase,
      label: 'Nature of Business',
      value: seller?.businessType || 'Manufacturing & Trading',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      icon: HiOutlineDocumentText,
      label: 'GST Number',
      value: seller?.gstNumber || 'Not Provided',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      icon: HiOutlineCheckBadge,
      label: 'Legal Status',
      value: 'Proprietorship',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      icon: HiOutlineCube,
      label: 'Annual Turnover',
      value: seller?.annualTurnover || '₹1Cr - ₹10Cr',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      icon: HiOutlineUsers,
      label: 'Number of Employees',
      value: seller?.numberOfEmployees || '10-50',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
    },
    {
      icon: HiOutlineCalendar,
      label: 'Establishment Year',
      value: seller?.yearEstablished || '2015',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
    },
    {
      icon: HiOutlineShieldCheck,
      label: 'CEO / Founder',
      value: seller?.name || 'Information Available',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      icon: HiOutlineMapPin,
      label: 'Factory Address',
      value: `${seller?.city}, ${seller?.state}`,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pl-4 border-l-4 border-blue-600">
        <h3 className="text-2xl font-bold text-gray-900">Company Information</h3>
        <p className="text-gray-600 text-sm mt-1">Complete business details and credentials</p>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {infoCards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <div
              key={idx}
              className={`${card.bgColor} border-2 ${card.borderColor} rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}
            >
              {/* Icon with Gradient Background */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>

              {/* Label */}
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                {card.label}
              </p>

              {/* Value */}
              <p className="text-lg font-bold text-gray-900 line-clamp-2">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
