"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineEllipsisVertical,
  HiOutlineArchiveBox,
  HiOutlineTrash,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
  role?: "buyer" | "seller";
}

export default function ConversationList({
  onSelectConversation,
  selectedConversationId,
  role = "buyer",
}: ConversationListProps) {
  const { user } = useAuth();
  const {
    conversations,
    getConversations,
    searchConversations,
    archiveConversation,
    unarchiveConversation,
    loadingConversations,
    unreadCount,
    onlineUsers,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "archived">("active");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // =============================================
  // LOAD CONVERSATIONS
  // =============================================

  useEffect(() => {
    getConversations(role, searchQuery);
  }, [role, getConversations]);

  // =============================================
  // SEARCH CONVERSATIONS
  // =============================================

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (query.trim()) {
        await searchConversations(query);
      } else {
        await getConversations(role);
      }
    },
    [searchConversations, getConversations, role]
  );

  // =============================================
  // FILTER CONVERSATIONS
  // =============================================

  const filteredConversations = conversations.filter((conv) => {
    if (filter === "active") return conv.status === "active";
    if (filter === "archived") return conv.status === "archived";
    return true;
  });

  // =============================================
  // GET OTHER PARTICIPANT
  // =============================================

  const getOtherParticipant = (conversation: any) => {
    return role === "buyer" ? conversation.seller : conversation.buyer;
  };

  // =============================================
  // GET UNREAD COUNT FOR CONVERSATION
  // =============================================

  const getUnreadCount = (conversation: any) => {
    return role === "buyer"
      ? conversation.buyerUnreadCount
      : conversation.sellerUnreadCount;
  };

  // =============================================
  // FORMAT TIME
  // =============================================

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // =============================================
  // TRUNCATE MESSAGE
  // =============================================

  const truncateMessage = (msg: string, length: number = 40) => {
    return msg?.length > length ? msg.substring(0, length) + "..." : msg;
  };

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ========== HEADER ========== */}
      <div className="px-5 py-5 border-b border-gray-100 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-5">
          {role === "buyer" ? "My Chats" : "Customer Chats"}
        </h1>

        {/* Search */}
        <div className="relative mb-4">
          <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-sm font-medium"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2.5">
          {(["all", "active", "archived"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                filter === f
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f === "all"
                ? "All"
                : f === "active"
                ? "Active"
                : "Archived"}
              {f === "active" &&
                unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
            </button>
          ))}
        </div>
      </div>

      {/* ========== CONVERSATION LIST ========== */}
      <div className="flex-1 overflow-y-auto bg-white">
        {loadingConversations ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm font-medium">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-gray-700 font-semibold text-lg">No conversations yet</p>
            <p className="text-gray-500 text-sm mt-2">
              {searchQuery
                ? "Try a different search"
                : "Start chatting with buyers or sellers"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              const unreadCount = getUnreadCount(conversation);
              const isOnline = onlineUsers?.has(otherParticipant._id);
              const isSelected =
                selectedConversationId === conversation._id;

              return (
                <div
                  key={conversation._id}
                  className={`px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 min-h-[140px] flex items-center ${
                    isSelected
                      ? "bg-blue-50 border-blue-500"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  onClick={() => onSelectConversation(conversation._id)}
                >
                  <div className="flex items-start gap-5">
                    {/* Avatar & Online Status */}
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-2xl">
                        {otherParticipant?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <h3 className="font-bold text-lg break-words flex-1">
                          {otherParticipant?.companyName ||
                            otherParticipant?.name}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 flex-shrink-0">
                            {formatTime(
                              conversation.lastMessageTime ||
                                conversation.createdAt
                            )}
                          </span>

                          {/* Menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(
                                  activeMenuId === conversation._id
                                    ? null
                                    : conversation._id
                                );
                              }}
                              className="p-2 hover:bg-gray-100 rounded transition"
                            >
                              <HiOutlineEllipsisVertical className="w-6 h-6 text-gray-400" />
                            </button>

                            {activeMenuId === conversation._id && (
                              <div className="absolute top-10 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-40">
                                {conversation.status === "active" ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      archiveConversation(
                                        conversation._id
                                      );
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm flex items-center gap-2 transition"
                                  >
                                    <HiOutlineArchiveBox className="w-5 h-5" />
                                    Archive
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      unarchiveConversation(
                                        conversation._id
                                      );
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm flex items-center gap-2 transition"
                                  >
                                    <HiOutlineCheckCircle className="w-5 h-5" />
                                    Restore
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Last Message & Product */}
                      <div className="flex items-center gap-3">
                        {conversation.product && (
                          <div className="w-10 h-10 rounded flex-shrink-0 overflow-hidden bg-gray-100">
                            {conversation.product.image && (
                              <Image
                                src={conversation.product.image}
                                alt="product"
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        )}

                        <p
                          className={`text-base line-clamp-2 flex-1 ${
                            unreadCount > 0
                              ? "font-semibold text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {conversation.lastMessage ||
                            "No messages yet"}
                        </p>

                        {unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-base font-bold px-3 py-1 rounded-full flex-shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
