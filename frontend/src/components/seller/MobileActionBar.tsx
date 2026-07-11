'use client';

import React from 'react';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineEnvelope,
  HiOutlinePhone,
} from 'react-icons/hi2';

interface MobileActionBarProps {
  onChatClick: () => void;
  onInquiryClick: () => void;
  onWhatsAppClick: () => void;
}

export default function MobileActionBar({
  onChatClick,
  onInquiryClick,
  onWhatsAppClick,
}: MobileActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 shadow-lg z-40">
      {/* Indicator Line */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500"></div>

      {/* Action Buttons */}
      <div className="flex gap-2 p-3">
        {/* Chat Button */}
        <button
          onClick={onChatClick}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-2 rounded-lg transition-colors text-sm"
        >
          <HiOutlineChatBubbleLeftRight className="w-5 h-5" />
          <span className="hidden xs:inline">Chat</span>
        </button>

        {/* Inquiry Button */}
        <button
          onClick={onInquiryClick}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-2 rounded-lg transition-colors text-sm"
        >
          <HiOutlineEnvelope className="w-5 h-5" />
          <span className="hidden xs:inline">Inquiry</span>
        </button>

        {/* WhatsApp Button */}
        <button
          onClick={onWhatsAppClick}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-2 rounded-lg transition-colors text-sm"
        >
          <span>💬</span>
          <span className="hidden xs:inline">WhatsApp</span>
        </button>
      </div>

      {/* Spacer for content */}
      <style>{`
        body {
          padding-bottom: 80px;
        }
      `}</style>
    </div>
  );
}
