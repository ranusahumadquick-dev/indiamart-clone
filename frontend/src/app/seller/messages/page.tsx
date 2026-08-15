"use client";

import React, { useEffect, useState } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ConversationList from "@/components/chat/ConversationList";
import Chat from "@/components/chat/Chat";
import {
  HiOutlineArrowLeft,
  HiOutlineChatBubbleLeftRight,
} from "@/lib/icons";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function SellerChatDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { getConversations } = useChat();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  // =============================================
  // CHECK AUTHENTICATION
  // =============================================

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  // =============================================
  // LOAD CONVERSATIONS
  // =============================================

  useEffect(() => {
    getConversations("seller");
  }, [getConversations]);

  // =============================================
  // HANDLERS
  // =============================================

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowChat(true);
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
    setShowChat(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  // =============================================
  // RENDER
  // =============================================

  return (
    <ProtectedRoute allowedRoles={["seller", "admin"]}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <HiOutlineChatBubbleLeftRight className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Buyer Messages</h1>
              </div>
              <p className="text-sm text-gray-500">
                Chat with buyers about their inquiries
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Conversation List */}
            <div
              className={`lg:col-span-1 ${
                showChat ? "hidden lg:block" : ""
              }`}
            >
              <div className="bg-white rounded-xl border border-gray-200 h-[calc(100vh-250px)]">
                <ConversationList
                  onSelectConversation={handleSelectConversation}
                  selectedConversationId={selectedConversationId || undefined}
                  role="seller"
                />
              </div>
            </div>

            {/* Right: Chat Area */}
            <div
              className={`lg:col-span-2 ${
                showChat ? "" : "hidden lg:block"
              }`}
            >
              {selectedConversationId ? (
                <div className="bg-white rounded-xl border border-gray-200 h-[calc(100vh-250px)] flex flex-col">
                  <Chat
                    conversationId={selectedConversationId}
                    onClose={handleBackToList}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 h-[calc(100vh-250px)] flex flex-col items-center justify-center text-center p-6">
                  <div className="text-6xl mb-4">💬</div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Select a Conversation
                  </h2>
                  <p className="text-gray-500">
                    Click on a buyer conversation from the list to view and respond to their messages
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
