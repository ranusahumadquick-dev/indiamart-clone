'use client';

import { useState, useEffect } from 'react';
import { HiOutlineChatBubbleLeftRight } from "@/lib/icons";
import { useRouter } from 'next/navigation';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';

interface ChatNotificationBadgeProps {
  onChatClick?: () => void;
}

export default function ChatNotificationBadge({ onChatClick }: ChatNotificationBadgeProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useChat();

  const handleClick = () => {
    if (onChatClick) {
      onChatClick();
    } else {
      // Navigate to appropriate chat page based on user role
      if (user?.role === 'buyer') {
        router.push('/buyer/chats');
      } else if (user?.role === 'seller') {
        router.push('/seller/inquiries');
      } else {
        router.push('/buyer/chats');
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      title="Chat Messages"
      aria-label={`Chat messages${unreadCount > 0 ? ` - ${unreadCount} unread` : ''}`}
    >
      <HiOutlineChatBubbleLeftRight className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-600 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
