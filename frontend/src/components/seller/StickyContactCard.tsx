'use client';

import React, { useState } from 'react';
import { HiOutlinePhone, HiOutlineXMark } from 'react-icons/hi2';

interface StickyContactCardProps {
  seller: any;
  onChatClick: () => void;
  onInquiryClick: () => void;
  onWhatsAppClick: () => void;
}

export default function StickyContactCard({
  seller,
  onChatClick,
  onInquiryClick,
  onWhatsAppClick,
}: StickyContactCardProps) {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  return (
    <div className="hidden lg:block fixed right-6 top-32 w-80 z-40">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Gradient Top Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-700"></div>

        {/* Close Button */}
        <button
          onClick={() => setClosed(true)}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition z-10"
        >
          <HiOutlineXMark className="w-5 h-5 text-gray-600" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Seller Info */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {seller?.companyName}
            </h3>
            <div className="flex items-center gap-1 text-sm text-green-600 font-medium mb-3">
              <span>🟢</span> Usually responds within {seller?.responseTimeMinutes || '1'} hour
            </div>

            {/* Mobile Number */}
            {seller?.phone && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                <HiOutlinePhone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-600">Mobile</div>
                  <a
                    href={`tel:${seller.phone}`}
                    className="text-sm font-bold text-blue-600 hover:underline"
                  >
                    {seller.phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Quick Inquiry Form */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Product/Service
            </label>
            <input
              type="text"
              placeholder="What are you interested in?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            <label className="block text-xs font-bold text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              placeholder="Enter quantity"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <button
            onClick={onChatClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors mb-2"
          >
            💬 Chat Now
          </button>

          <button
            onClick={onInquiryClick}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors mb-2"
          >
            📝 Send Inquiry
          </button>

          <button
            onClick={onWhatsAppClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
          >
            💬 WhatsApp
          </button>

          {/* Request Callback Link */}
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
              Request Callback
            </button>
          </div>

          {/* Trust Badge */}
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 text-center">
            <div className="text-xs text-green-700">
              <span>✓</span> Verified Supplier
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            Your inquiry will reach the supplier directly
          </p>
        </div>
      </div>
    </div>
  );
}
