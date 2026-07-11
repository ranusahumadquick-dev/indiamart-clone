"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import {
  HiOutlinePaperAirplane,
  HiOutlineXMark,
  HiOutlineArrowLeft,
  HiOutlinePaperClip,
  HiOutlineEllipsisVertical,
  HiOutlineFaceSmile,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineEye,
} from "react-icons/hi2";

interface ChatComponentProps {
  conversationId: string;
  onClose?: () => void;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export default function Chat({ conversationId, onClose }: ChatComponentProps) {
  const { user } = useAuth();
  const {
    currentConversation,
    messages,
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markAsRead,
    setTyping,
    connected,
    typingUsers,
    userOnlineInConversation,
  } = useChat();

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<{ messageId: string; emoji: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // =============================================
  // LOAD MESSAGES
  // =============================================

  useEffect(() => {
    if (conversationId) {
      getMessages(conversationId, 1);
      markAsRead(conversationId);
    }
  }, [conversationId, getMessages, markAsRead]);

  // =============================================
  // SCROLL TO BOTTOM
  // =============================================

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // =============================================
  // TYPING INDICATOR
  // =============================================

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);

    // Send typing indicator
    if (!editingId) {
      setTyping(conversationId, true);

      // Clear existing timeout
      if (typingTimeout) clearTimeout(typingTimeout);

      // Set new timeout to stop typing after 3 seconds
      const timeout = setTimeout(() => {
        setTyping(conversationId, false);
      }, 3000);

      setTypingTimeout(timeout);
    }

    // Auto-expand textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // =============================================
  // SEND MESSAGE
  // =============================================

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) return;
    if (!connected) {
      alert("Not connected. Please wait...");
      return;
    }

    try {
      setSending(true);

      if (editingId) {
        await editMessage(editingId, text);
        setEditingId(null);
      } else {
        await sendMessage(conversationId, text);
      }

      setText("");
      setEditText("");
      setTyping(conversationId, false);
      inputRef.current?.focus();

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // =============================================
  // EDIT MESSAGE
  // =============================================

  const startEdit = (message: any) => {
    setEditingId(message._id);
    setEditText(message.text);
    setText(message.text);
    inputRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setText("");
    setEditText("");
  };

  // =============================================
  // DELETE MESSAGE
  // =============================================

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
  };

  // =============================================
  // ADD REACTION
  // =============================================

  const handleAddReaction = (messageId: string, emoji: string) => {
    addReaction(messageId, emoji);
    setSelectedReaction(null);
  };

  // =============================================
  // FORMAT TIME
  // =============================================

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }

    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDateSeparator = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isYesterday = d.toDateString() === new Date(now.getTime() - 86400000).toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // =============================================
  // GET OTHER PARTICIPANT
  // =============================================

  const otherParticipant = currentConversation
    ? user?._id === currentConversation.buyer._id
      ? currentConversation.seller
      : currentConversation.buyer
    : null;

  // =============================================
  // GROUP MESSAGES BY DATE
  // =============================================

  const groupMessagesByDate = () => {
    const grouped: { [key: string]: any[] } = {};

    messages.forEach((msg) => {
      const date = formatDateSeparator(msg.createdAt);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(msg);
    });

    return grouped;
  };

  const groupedMessages = groupMessagesByDate();

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                {otherParticipant?.name?.[0]?.toUpperCase() || "?"}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm truncate">
                  {otherParticipant?.companyName || otherParticipant?.name}
                </h2>
                <p className="text-xs text-gray-500">
                  {userOnlineInConversation?.has(otherParticipant?._id || "")
                    ? "Online"
                    : "Offline"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="hidden lg:flex flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ========== PRODUCT INFO ========== */}
      {currentConversation?.product && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <div className="flex items-center gap-3">
            {currentConversation.product.image && (
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={currentConversation.product.image}
                  alt={currentConversation.product.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {currentConversation.product.name}
              </p>
              <p className="text-xs text-gray-600">
                ₹ {currentConversation.product.price?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========== MESSAGES ========== */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-500 px-2 bg-white">
                {date}
              </span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Messages */}
            {msgs.map((message, idx) => {
              const isOwn = message.sender._id === user?._id;
              const showAvatar =
                idx === 0 ||
                msgs[idx - 1].sender._id !== message.sender._id;

              return (
                <div
                  key={message._id}
                  className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"} group`}
                >
                  {/* Avatar (only show for others and if it's first message from that person) */}
                  {!isOwn && (
                    <div
                      className={`flex-shrink-0 ${
                        showAvatar ? "w-8 h-8" : "w-8"
                      }`}
                    >
                      {showAvatar && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center text-xs font-bold">
                          {message.sender.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`flex flex-col max-w-xs ${
                      isOwn ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Message Text */}
                    <div
                      className={`px-3 py-2 rounded-lg relative group/message ${
                        isOwn
                          ? "bg-blue-500 text-white rounded-bl-none"
                          : "bg-gray-100 text-gray-800 rounded-bl-lg"
                      }`}
                    >
                      <p className="text-sm break-words">{message.text}</p>

                      {/* Attachments */}
                      {message.attachments?.map((att, i) => (
                        <div key={i} className="mt-2">
                          {att.type === "image" ? (
                            <img
                              src={att.url}
                              alt="attachment"
                              className="max-w-xs rounded-lg"
                            />
                          ) : (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`underline text-sm ${
                                isOwn ? "text-blue-100" : "text-blue-500"
                              }`}
                            >
                              📄 {att.fileName}
                            </a>
                          )}
                        </div>
                      ))}

                      {/* Message Status */}
                      <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                        {isOwn && (
                          <>
                            <span>{formatTime(message.createdAt)}</span>
                            <span className={message.isRead ? "text-blue-500" : "text-gray-400"}>✓✓</span>
                          </>
                        )}
                        {!isOwn && <span>{formatTime(message.createdAt)}</span>}
                      </div>

                      {/* Edited Badge */}
                      {message.isEdited && (
                        <span className="text-xs opacity-70 ml-1">(edited)</span>
                      )}

                      {/* Message Actions (hover) */}
                      <div className="hidden group-hover/message:flex absolute -top-10 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-1 gap-1 z-20">
                        {isOwn && (
                          <>
                            <button
                              onClick={() => startEdit(message)}
                              className="p-1.5 hover:bg-gray-100 rounded transition"
                              title="Edit"
                            >
                              <HiOutlinePencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message._id)}
                              className="p-1.5 hover:bg-gray-100 rounded transition text-red-500"
                              title="Delete"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <div className="relative">
                          <button
                            onClick={() =>
                              setSelectedReaction(
                                selectedReaction?.messageId === message._id
                                  ? null
                                  : { messageId: message._id, emoji: "" }
                              )
                            }
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                            title="React"
                          >
                            <HiOutlineFaceSmile className="w-4 h-4" />
                          </button>

                          {selectedReaction?.messageId === message._id && (
                            <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1 z-30">
                              {EMOJI_REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() =>
                                    handleAddReaction(message._id, emoji)
                                  }
                                  className="text-lg hover:scale-125 transition-transform"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {Object.entries(
                          message.reactions.reduce(
                            (acc, r) => {
                              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                              return acc;
                            },
                            {} as Record<string, number>
                          )
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              const hasReacted = message.reactions.some(
                                (r) =>
                                  r.emoji === emoji &&
                                  r.userId === user?._id
                              );
                              if (hasReacted) {
                                removeReaction(message._id, emoji);
                              } else {
                                handleAddReaction(message._id, emoji);
                              }
                            }}
                            className="bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 text-xs flex items-center gap-1 transition"
                          >
                            {emoji} {count > 1 && count}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex gap-2 items-end">
            <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse"></div>
            <div className="bg-gray-100 px-3 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ========== INPUT ========== */}
      <div className="p-4 border-t border-gray-200 bg-white">
        {editingId && (
          <div className="mb-3 p-2 bg-blue-50 border-l-2 border-blue-500 rounded flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Editing message...
            </span>
            <button
              onClick={cancelEdit}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Cancel
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          {/* File Upload */}
          <button
            type="button"
            className="flex-shrink-0 p-2.5 hover:bg-gray-100 rounded-lg transition"
            title="Attach file"
          >
            <HiOutlinePaperClip className="w-5 h-5 text-gray-600" />
          </button>

          {/* Input & Emoji */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={text}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none max-h-32 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600 transition"
            >
              <HiOutlineFaceSmile className="w-5 h-5" />
            </button>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!text.trim() || sending || !connected}
            className="flex-shrink-0 p-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition disabled:cursor-not-allowed"
          >
            <HiOutlinePaperAirplane className="w-5 h-5" />
          </button>
        </form>

        {!connected && (
          <p className="text-xs text-red-600 mt-2">
            ⚠️ Connecting to server...
          </p>
        )}
      </div>
    </div>
  );
}
