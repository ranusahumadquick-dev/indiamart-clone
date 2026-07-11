"use client";

import React, { useState, useCallback } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineXMark,
} from "react-icons/hi2";
import Chat from "./Chat";
import ConversationList from "./ConversationList";

interface ProductChatButtonProps {
  sellerId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  className?: string;
}

export default function ProductChatButton({
  sellerId,
  productId,
  productName,
  productPrice,
  productImage,
  className = "",
}: ProductChatButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const {
    getOrCreateConversation,
    openConversation,
    currentConversation,
    closeConversation,
    conversations,
  } = useChat();

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // =============================================
  // HANDLE CHAT CLICK
  // =============================================

  const handleChatClick = useCallback(async () => {
    if (!isAuthenticated) {
      alert("Please log in to chat with sellers");
      return;
    }

    setShowModal(true);
    setLoading(true);

    try {
      // Get or create conversation using axios client (handles auth + correct base URL)
      const { data } = await api.post("/chat/conversations", { sellerId, productId });
      const conversation = data.data;

      if (!conversation || !conversation._id) {
        throw new Error("Invalid conversation data received");
      }

      setConversationId(conversation._id);
      openConversation(conversation);
    } catch (error) {
      console.error("Error starting chat:", error);
      alert(`Failed to start chat: ${error instanceof Error ? error.message : "Unknown error"}`);
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, sellerId, productId, openConversation]);

  // =============================================
  // HANDLE CLOSE
  // =============================================

  const handleClose = useCallback(() => {
    setShowModal(false);
    setConversationId(null);
    closeConversation();
  }, [closeConversation]);

  // =============================================
  // RENDER
  // =============================================

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={handleChatClick}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition ${className}`}
      >
        <HiOutlineChatBubbleLeftRight className="w-5 h-5" />
        Chat with Seller
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">
                {loading ? "Starting chat..." : "Chat"}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Loading State */}
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600">Starting chat...</p>
                  </div>
                </div>
              ) : !conversationId ? (
                /* Conversation List View */
                <div className="flex-1">
                  <ConversationList
                    onSelectConversation={(convId) => {
                      setConversationId(convId);
                    }}
                    role="buyer"
                  />
                </div>
              ) : (
                /* Chat View */
                <div className="flex-1 flex flex-col">
                  <Chat
                    conversationId={conversationId}
                    onClose={handleClose}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
