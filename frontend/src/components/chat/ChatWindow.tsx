"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import { resolveImageUrl } from "@/lib/imageUrl";
import { io, Socket } from "socket.io-client";
import {
  HiOutlineXMark,
  HiOutlinePaperAirplane,
  HiOutlineArrowLeft,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineUserGroup,
  HiOutlinePaperClip,
} from "react-icons/hi2";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────
interface Message {
  _id: string;
  sender: { _id: string; name: string; avatar?: string; role: string };
  text: string;
  type: string;
  readBy: string[];
  createdAt: string;
  attachments?: { url: string; type: string; fileName?: string }[];
}

interface Conversation {
  _id: string;
  participants: { _id: string; name: string; avatar?: string; role: string; companyName?: string; isVerified?: boolean }[];
  product?: { _id: string; name: string; images: { url: string }[] };
  type: string;
  lastMessage: string;
  lastMessageAt: string;
  myUnread: number;
}

interface ChatWindowProps {
  onClose: () => void;
  initialConversationId?: string;
}

// ── Socket singleton per window session ───────────────────────────────
let socketInstance: Socket | null = null;

function getSocket(token: string): Socket {
  if (!socketInstance || !socketInstance.connected) {
    const isLocalDev = typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const socketUrl = isLocalDev ? "http://localhost:8000" : window.location.origin;
    const socketPath = isLocalDev ? "/socket.io" : "/indiamart/socket.io";
    socketInstance = io(socketUrl, {
      path: socketPath,
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socketInstance;
}

// ── Helpers ───────────────────────────────────────────────────────────
function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Avatar({ name, size = "sm" }: { name?: string; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  return (
    <div className={`${cls} rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold flex-shrink-0`}>
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────
export default function ChatWindow({ onClose, initialConversationId }: ChatWindowProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeConvRef = useRef<Conversation | null>(null);
  activeConvRef.current = activeConv;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);

  // ── Load conversations via HTTP ───────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get("/messages/conversations");
      setConversations(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await api.get(`/messages/conversations/${convId}`);
      setMessages(res.data.data?.messages || []);
      scrollToBottom();
    } catch { /* silent */ }
  }, [scrollToBottom]);

  // ── Socket.io setup ───────────────────────────────────────────────
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token || !user) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("connect_error", () => setSocketConnected(false));

    // New message from socket
    socket.on("new_message", (msg: Message) => {
      setMessages((prev) => {
        // Deduplicate — replace optimistic temp if it exists, else append
        const withoutTemp = prev.filter((m) => !m._id.startsWith("temp_"));
        const alreadyExists = withoutTemp.some((m) => m._id === msg._id);
        return alreadyExists ? withoutTemp : [...withoutTemp, msg];
      });
      scrollToBottom();
      // Refresh conversation list to update lastMessage + unread
      loadConversations();
    });

    // Conversation updated notification (someone sent a message in another conv)
    socket.on("conversation_updated", ({ conversationId, lastMessage, lastMessageAt }: any) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? {
                ...c,
                lastMessage,
                lastMessageAt,
                myUnread: activeConvRef.current?._id === conversationId ? 0 : (c.myUnread || 0) + 1,
              }
            : c
        )
      );
    });

    // Typing indicators
    socket.on("user_typing", ({ userId }: { userId: string; conversationId: string }) => {
      if (userId !== user._id) {
        setTypingUsers((prev) => new Set([...prev, userId]));
      }
    });
    socket.on("user_stop_typing", ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => { const s = new Set(prev); s.delete(userId); return s; });
    });

    return () => {
      socket.off("new_message");
      socket.off("conversation_updated");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, [user, loadConversations, scrollToBottom]);

  // ── Initial load ──────────────────────────────────────────────────
  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
  }, [loadConversations]);

  useEffect(() => {
    if (initialConversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c._id === initialConversationId);
      if (conv) openConversation(conv);
    }
  }, [initialConversationId, conversations]);

  // ── Open conversation ─────────────────────────────────────────────
  const openConversation = useCallback((conv: Conversation) => {
    // Leave previous room
    if (activeConvRef.current) {
      socketRef.current?.emit("leave_conversation", activeConvRef.current._id);
    }
    setActiveConv(conv);
    setMobileView("chat");
    setTypingUsers(new Set());
    loadMessages(conv._id);
    // Join socket room
    socketRef.current?.emit("join_conversation", conv._id);
    // Reset unread locally
    setConversations((prev) => prev.map((c) => c._id === conv._id ? { ...c, myUnread: 0 } : c));
  }, [loadMessages]);

  // ── Send message via Socket.io ────────────────────────────────────
  const handleSend = async () => {
    if (!text.trim() || !activeConv || sending) return;
    const msgText = text.trim();
    setText("");
    setSending(true);
    setSelectedFiles([]); // Clear any selected files

    // Stop typing indicator
    socketRef.current?.emit("stop_typing", { conversationId: activeConv._id });

    // Optimistic bubble
    const optimistic: Message = {
      _id: `temp_${Date.now()}`,
      sender: { _id: user!._id, name: user!.name, role: user!.role },
      text: msgText,
      type: "text",
      readBy: [user!._id],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit(
          "send_message",
          { conversationId: activeConv._id, text: msgText, type: "text" },
          (ack: any) => {
            setSending(false);
            if (ack?.error) {
              setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
              setText(msgText);
            }
          }
        );
      } else {
        // HTTP fallback
        await api.post(`/chat/conversations/${activeConv._id}/messages`, { text: msgText });
        await loadMessages(activeConv._id);
        await loadConversations();
        setSending(false);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setText(msgText);
      setSending(false);
    }
  };

  // ── Typing emit ───────────────────────────────────────────────────
  const handleTyping = () => {
    if (!activeConv || !socketRef.current?.connected) return;
    socketRef.current.emit("typing", { conversationId: activeConv._id });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("stop_typing", { conversationId: activeConv._id });
    }, 2000);
  };

  // ── Back to list ──────────────────────────────────────────────────
  const backToList = () => {
    if (activeConv) socketRef.current?.emit("leave_conversation", activeConv._id);
    setActiveConv(null);
    setMobileView("list");
    setTypingUsers(new Set());
  };

  // ── File handling ────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendWithFiles = async () => {
    if (!activeConv || (text.trim().length === 0 && selectedFiles.length === 0)) return;
    setSending(true);
    setUploadingFiles(true);

    try {
      let attachments = [];

      // Step 1: Upload files if selected
      if (selectedFiles.length > 0) {
        console.log("Uploading files:", selectedFiles.length);
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("images", file);
        });

        try {
          const uploadResponse = await api.post("/chat/upload-attachments", formData);

          if (uploadResponse.data?.data?.attachments) {
            attachments = uploadResponse.data.data.attachments;
            console.log("Files uploaded successfully:", attachments.length);
          }
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          alert("Failed to upload images. Please try again.");
          setSending(false);
          setUploadingFiles(false);
          return;
        }
      }

      // Step 2: Send message with attachment URLs
      console.log("Sending message with attachments:", {
        conversationId: activeConv._id,
        attachmentCount: attachments.length,
        textLength: text.trim().length
      });

      const response = await api.post(
        `/chat/conversations/${activeConv._id}/messages`,
        {
          text: text.trim() || "",
          attachments: attachments
        }
      );

      if (response.status === 201) {
        setText("");
        setSelectedFiles([]);
        await loadMessages(activeConv._id);
        await loadConversations();
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (error?.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("Failed to send message. Please try again.");
      }
    } finally {
      setSending(false);
      setUploadingFiles(false);
    }
  };

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants?.find((p) => p._id !== user?._id);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.myUnread || 0), 0);
  const otherUser = activeConv ? getOtherParticipant(activeConv) : null;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--primary)] text-white flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {activeConv && (
            <button onClick={backToList} className="mr-1 flex-shrink-0 hover:opacity-80">
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
          )}
          {activeConv && otherUser ? (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar name={otherUser.companyName || otherUser.name} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate flex items-center gap-1">
                  {otherUser.companyName || otherUser.name}
                  {otherUser.isVerified && <HiOutlineShieldCheck className="w-3.5 h-3.5 text-blue-200 flex-shrink-0" />}
                </p>
                {activeConv.product && (
                  <p className="text-[10px] text-blue-200 truncate">{activeConv.product.name}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <HiOutlineChatBubbleLeftRight className="w-5 h-5" />
              <span className="font-semibold text-sm">Messages</span>
              {totalUnread > 0 && (
                <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{totalUnread}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Socket connection dot */}
          <span title={socketConnected ? "Connected" : "Polling mode"}
            className={`w-2 h-2 rounded-full flex-shrink-0 ${socketConnected ? "bg-green-400" : "bg-yellow-400"}`} />
          <button onClick={onClose} className="hover:opacity-75 transition flex-shrink-0">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Conversation List ── */}
        <div className={`w-full md:w-56 border-r border-gray-100 flex-shrink-0 overflow-y-auto ${activeConv && mobileView === "chat" ? "hidden md:block" : ""}`}>
          {loading ? (
            <div className="p-3 space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-400 px-4">
              <HiOutlineChatBubbleLeftRight className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-xs font-semibold text-gray-500 mb-1">No conversations yet</p>
              <p className="text-[10px] text-gray-300 mb-4">Find a product or supplier and click "Chat" to start</p>
              <div className="flex flex-col gap-2">
                <Link href="/products" onClick={onClose}
                  className="flex items-center justify-center gap-1.5 text-[11px] font-medium bg-[var(--primary)] text-white py-2 px-3 rounded-lg hover:opacity-90 transition">
                  <HiOutlineMagnifyingGlass className="w-3.5 h-3.5" />
                  Browse Products
                </Link>
                <Link href="/sellers" onClick={onClose}
                  className="flex items-center justify-center gap-1.5 text-[11px] font-medium border border-gray-200 text-gray-600 py-2 px-3 rounded-lg hover:bg-gray-50 transition">
                  <HiOutlineUserGroup className="w-3.5 h-3.5" />
                  Find Suppliers
                </Link>
              </div>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const isActive = activeConv?._id === conv._id;
              return (
                <button key={conv._id} onClick={() => openConversation(conv)}
                  className={`w-full text-left px-3 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${isActive ? "bg-blue-50 border-l-2 border-l-[var(--primary)]" : ""}`}>
                  <div className="flex items-center gap-2">
                    <Avatar name={other?.companyName || other?.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate ${conv.myUnread > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                          {other?.companyName || other?.name}
                        </p>
                        {conv.myUnread > 0 && (
                          <span className="bg-[var(--primary)] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">{conv.myUnread}</span>
                        )}
                      </div>
                      <p className={`text-[10px] truncate ${conv.myUnread > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                        {conv.lastMessage || "No messages yet"}
                      </p>
                      {conv.product && (
                        <p className="text-[9px] text-blue-400 truncate">{conv.product.name}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* ── Message Thread ── */}
        <div className={`flex-1 flex flex-col ${!activeConv || mobileView === "list" ? "hidden md:flex" : ""}`}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center text-gray-300">
              <div className="text-center">
                <HiOutlineChatBubbleLeftRight className="w-12 h-12 mx-auto mb-3" />
                <p className="text-sm">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                {messages.length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-xs">Start the conversation!</div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.sender._id === user?._id;
                  const isTemp = msg._id.startsWith("temp_");
                  return (
                    <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && (
                        <Avatar name={msg.sender.name} size="sm" />
                      )}
                      <div className={`max-w-[72%] mx-2 ${msg.type === "system" ? "w-full mx-0" : ""}`}>
                        {msg.type === "system" ? (
                          <p className="text-[10px] text-gray-400 text-center italic py-1">{msg.text}</p>
                        ) : (
                          <div className={`max-w-xs rounded-2xl overflow-hidden ${
                            isMe
                              ? "bg-[var(--primary)] text-white rounded-br-sm"
                              : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
                          } ${isTemp ? "opacity-70" : ""}`}>
                            {/* Images */}
                            {msg.attachments?.filter(a => a.type === "image").map((img, idx) => (
                              <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="block">
                                <img
                                  src={resolveImageUrl(img.url)}
                                  alt="shared"
                                  className="max-w-full h-auto max-h-56 object-cover cursor-pointer hover:opacity-90 transition"
                                />
                              </a>
                            ))}
                            {/* Text and Files */}
                            <div className="px-3 py-2">
                              {msg.text && (
                                <p className="whitespace-pre-wrap break-words text-sm">{msg.text}</p>
                              )}
                              {/* File attachments */}
                              {msg.attachments?.filter(a => a.type !== "image").map((file, idx) => (
                                <a
                                  key={idx}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 mt-2 text-sm underline ${
                                    isMe ? "text-blue-200" : "text-[var(--primary)]"
                                  }`}
                                >
                                  <HiOutlinePaperClip className="w-4 h-4" />
                                  {file.fileName || "Download file"}
                                </a>
                              ))}
                              <div className={`flex items-center justify-end gap-1 mt-1`}>
                                <span className={`text-[9px] ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                                  {formatTime(msg.createdAt)}
                                </span>
                                {isMe && !isTemp && (
                                  <HiOutlineCheckCircle className="w-3 h-3 text-blue-200" />
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* File Preview */}
              {selectedFiles.length > 0 && (
                <div className="border-t border-gray-100 px-3 py-2 bg-gray-50 flex flex-wrap gap-2 items-center">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="relative group">
                      {file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="h-16 w-16 object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <div className="h-16 w-16 flex items-center justify-center bg-gray-200 rounded border border-gray-200">
                          <span className="text-xs text-gray-600 text-center">
                            {file.type.split("/")[0] === "image" ? "IMG" : "FILE"}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => removeSelectedFile(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <HiOutlineXMark className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="border-t border-gray-100 p-3 flex items-center gap-2 flex-shrink-0 bg-white">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || uploadingFiles}
                  className="w-9 h-9 text-gray-600 hover:bg-gray-100 rounded-full flex items-center justify-center transition disabled:opacity-40 flex-shrink-0"
                  title="Attach file or image"
                >
                  <HiOutlinePaperClip className="w-5 h-5" />
                </button>
                <input
                  value={text}
                  onChange={(e) => { setText(e.target.value); handleTyping(); }}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendWithFiles()}
                  placeholder="Type a message…"
                  maxLength={2000}
                  disabled={sending || uploadingFiles}
                  className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-[var(--primary)] bg-gray-50 disabled:opacity-50"
                />
                <button
                  onClick={selectedFiles.length > 0 ? handleSendWithFiles : handleSend}
                  disabled={(!text.trim() && selectedFiles.length === 0) || sending || uploadingFiles}
                  className="w-9 h-9 bg-[var(--primary)] text-white rounded-full flex items-center justify-center hover:opacity-90 transition disabled:opacity-40 flex-shrink-0"
                  title={selectedFiles.length > 0 ? "Send message with files" : "Send message"}
                >
                  {uploadingFiles ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <HiOutlinePaperAirplane className="w-4 h-4" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
