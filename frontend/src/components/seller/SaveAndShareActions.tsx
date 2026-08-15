'use client';

import React, { useState } from 'react';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineShare,
  HiOutlineCheck,
} from "@/lib/icons";

interface SaveAndShareActionsProps {
  sellerId: string;
  sellerName: string;
}

export default function SaveAndShareActions({
  sellerId,
  sellerName,
}: SaveAndShareActionsProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
  };

  const handleShare = async (platform: 'whatsapp' | 'email' | 'copy') => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Check out ${sellerName} on IndiaMART - Professional B2B Supplier`;

    if (platform === 'whatsapp') {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
      window.open(whatsappUrl, '_blank');
    } else if (platform === 'email') {
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
      window.location.href = mailtoUrl;
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }

    setShowShareMenu(false);
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
      {/* Share Menu */}
      {showShareMenu && (
        <div className="flex flex-col gap-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={() => handleShare('whatsapp')}
            className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 rounded-lg transition text-sm font-medium text-gray-700 hover:text-green-600 whitespace-nowrap"
          >
            <span>💬</span> WhatsApp
          </button>
          <button
            onClick={() => handleShare('email')}
            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-lg transition text-sm font-medium text-gray-700 hover:text-blue-600 whitespace-nowrap"
          >
            <span>📧</span> Email
          </button>
          <button
            onClick={() => handleShare('copy')}
            className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 rounded-lg transition text-sm font-medium text-gray-700 hover:text-purple-600 whitespace-nowrap"
          >
            <span>{shareSuccess ? '✓' : '📋'}</span>
            {shareSuccess ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        {/* Save Button */}
        <button
          onClick={handleSaveToggle}
          className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all hover:scale-110 ${
            isSaved
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white text-red-500 hover:text-red-600 border-2 border-red-500'
          }`}
          title={isSaved ? 'Remove from saved' : 'Save supplier'}
        >
          {isSaved ? (
            <HiHeart className="w-6 h-6" />
          ) : (
            <HiOutlineHeart className="w-6 h-6" />
          )}
        </button>

        {/* Share Button */}
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-white border-2 border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all hover:scale-110"
          title="Share supplier"
        >
          <HiOutlineShare className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
