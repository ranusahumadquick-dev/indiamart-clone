'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { HiOutlineEllipsisVertical, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import api from '@/lib/axios';

interface Conversation {
  _id: string;
  buyer: { _id: string; name: string; avatar?: string };
  seller: { _id: string; name: string; avatar?: string; companyName?: string };
  product?: { _id: string; name: string };
  lastMessage: string;
  lastMessageTime: string;
  buyerUnreadCount: number;
  sellerUnreadCount: number;
}

interface ChatListProps {
  currentUserId: string;
  onSelectConversation: (conversation: Conversation) => void;
  userRole: 'buyer' | 'seller';
}

export default function ChatList({ currentUserId, onSelectConversation, userRole }: ChatListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get(`/chat/conversations?role=${userRole}`);
      setConversations(data.data.conversations || []);
      setUnreadCount(data.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = userRole === 'buyer' ? conv.seller : conv.buyer;
    return (
      otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getOtherUser = (conversation: Conversation) => {
    return userRole === 'buyer' ? conversation.seller : conversation.buyer;
  };

  const getUnreadCount = (conversation: Conversation) => {
    return userRole === 'buyer' ? conversation.buyerUnreadCount : conversation.sellerUnreadCount;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">💬 Messages</h1>

        {/* Search */}
        <div className="relative">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="mt-3 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold w-fit">
            {unreadCount} unread
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const otherUser = getOtherUser(conversation);
            const unreadMsgs = getUnreadCount(conversation);

            return (
              <button
                key={conversation._id}
                onClick={() => onSelectConversation(conversation)}
                className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition text-left flex gap-3 ${
                  unreadMsgs > 0 ? 'bg-blue-50' : ''
                }`}
              >
                {/* Avatar */}
                {otherUser.avatar ? (
                  <Image
                    src={otherUser.avatar}
                    alt={otherUser.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold">
                    {otherUser.name.charAt(0)}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-semibold text-gray-900 truncate ${unreadMsgs > 0 ? 'font-bold' : ''}`}>
                      {otherUser.name}
                    </p>
                    <p className="text-xs text-gray-500 flex-shrink-0">
                      {new Date(conversation.lastMessageTime).toLocaleDateString()}
                    </p>
                  </div>

                  {conversation.product && (
                    <p className="text-xs text-gray-600 truncate">
                      📦 {conversation.product.name}
                    </p>
                  )}

                  <p
                    className={`text-sm truncate ${
                      unreadMsgs > 0 ? 'text-gray-900 font-semibold' : 'text-gray-600'
                    }`}
                  >
                    {conversation.lastMessage}
                  </p>
                </div>

                {/* Unread Badge */}
                {unreadMsgs > 0 && (
                  <div className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {unreadMsgs}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
