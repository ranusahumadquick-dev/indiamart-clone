'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiOutlineCheckBadge,
  HiOutlineChatBubbleLeftRight,
} from "@/lib/icons";
import WhatsappButton from '@/components/WhatsappButton';

interface SellerContactCardProps {
  seller: {
    _id: string;
    name: string;
    companyName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    whatsappNumber?: string;
    isVerified?: boolean;
    avgRating?: number;
    totalReviews?: number;
  };
  onSendInquiry?: () => void;
}

export default function SellerContactCard({
  seller,
  onSendInquiry,
}: SellerContactCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(seller.phone);
    setCopied('phone');
    toast.success('Phone copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(seller.email);
    setCopied('email');
    toast.success('Email copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCall = () => {
    window.open(`tel:${seller.phone}`);
  };

  const handleEmail = () => {
    window.open(`mailto:${seller.email}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 sticky top-20">
      {/* Header */}
      <div className="border-b pb-4 mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          {seller.companyName || seller.name}
          {seller.isVerified && (
            <span title="Verified Seller">
              <HiOutlineCheckBadge className="w-5 h-5 text-blue-600" />
            </span>
          )}
        </h3>
        {seller.avgRating && (
          <p className="text-sm text-gray-600 mt-1">
            ⭐ {seller.avgRating.toFixed(1)} ({seller.totalReviews || 0} reviews)
          </p>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-3 mb-6">
        {/* Phone */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition cursor-pointer group"
          onClick={handleCopyPhone}>
          <div className="flex items-center gap-3">
            <HiOutlinePhone className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600">Phone</p>
              <p className="text-sm font-semibold text-gray-900">{seller.phone}</p>
            </div>
          </div>
          <span className="text-xs text-gray-500 group-hover:text-blue-600 font-medium">
            {copied === 'phone' ? '✓ Copied' : 'Copy'}
          </span>
        </div>

        {/* Email */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition cursor-pointer group"
          onClick={handleCopyEmail}>
          <div className="flex items-center gap-3">
            <HiOutlineEnvelope className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600">Email</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{seller.email}</p>
            </div>
          </div>
          <span className="text-xs text-gray-500 group-hover:text-green-600 font-medium">
            {copied === 'email' ? '✓ Copied' : 'Copy'}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
          <HiOutlineMapPin className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-600">Location</p>
            <p className="text-sm font-semibold text-gray-900">
              {seller.city}, {seller.state}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 mb-4">
        {/* Call Button */}
        <button
          onClick={handleCall}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition"
        >
          <HiOutlinePhone className="w-5 h-5" />
          Call Now
        </button>

        {/* Email Button */}
        <button
          onClick={handleEmail}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition"
        >
          <HiOutlineEnvelope className="w-5 h-5" />
          Email
        </button>

        {/* WhatsApp Button */}
        {seller.whatsappNumber && (
          <WhatsappButton
            phoneNumber={seller.whatsappNumber}
            message={`Hi ${seller.name}, I'm interested in your products.`}
            className="w-full"
          />
        )}

        {/* Send Inquiry Button */}
        <button
          onClick={onSendInquiry}
          className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-4 rounded-lg transition"
        >
          <HiOutlineChatBubbleLeftRight className="w-5 h-5" />
          Send Inquiry
        </button>
      </div>

      {/* Response Time */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
        <p className="text-xs text-gray-600">Average Response Time</p>
        <p className="text-sm font-bold text-blue-600">Usually within 2 hours</p>
      </div>
    </div>
  );
}
