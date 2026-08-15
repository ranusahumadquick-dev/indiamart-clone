"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import api from "@/lib/axios";
import { useAuth } from "./AuthContext";

// =============================================
// TYPES
// =============================================

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  companyName?: string;
  isVerified?: boolean;
  role: string;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
}

export interface Message {
  _id: string;
  sender: User;
  text: string;
  attachments?: { url: string; type: "image" | "file"; fileName?: string }[];
  messageType: "text" | "product_inquiry" | "quote_request" | "order_update";
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  isEdited?: boolean;
  reactions?: { emoji: string; userId: string }[];
  replyTo?: Message;
}

export interface Conversation {
  _id: string;
  buyer: User;
  seller: User;
  product?: Product;
  subject?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageBy?: User;
  messageCount: number;
  status: "active" | "archived" | "closed";
  buyerUnreadCount: number;
  sellerUnreadCount: number;
  buyerReadAt?: string;
  sellerReadAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatContextType {
  // Socket & Connection
  socket: Socket | null;
  connected: boolean;
  connecting: boolean;

  // Conversations
  conversations: Conversation[];
  currentConversation: Conversation | null;
  loadingConversations: boolean;
  unreadCount: number;

  // Messages
  messages: Message[];
  loadingMessages: boolean;
  hasMoreMessages: boolean;

  // Typing Indicator
  typingUsers: Set<string>;

  // Online Status
  onlineUsers: Set<string>;
  userOnlineInConversation: Set<string>;

  // Actions
  getConversations: (role?: "buyer" | "seller", search?: string) => Promise<void>;
  getConversationDetails: (conversationId: string) => Promise<void>;
  getMessages: (conversationId: string, page?: number) => Promise<void>;
  loadMoreMessages: (conversationId: string) => Promise<void>;
  openConversation: (conversation: Conversation) => void;
  closeConversation: () => void;
  
  // Messaging Actions
  sendMessage: (conversationId: string, text: string, attachments?: any[]) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, text: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  
  // Conversation Actions
  markAsRead: (conversationId: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  unarchiveConversation: (conversationId: string) => Promise<void>;
  closeConversationChat: (conversationId: string) => Promise<void>;
  
  // Typing Indicator
  setTyping: (conversationId: string, typing: boolean) => void;
  
  // Search & Filter
  searchConversations: (query: string) => Promise<void>;
  getChatStats: () => Promise<void>;

  // UI State
  showChatWindow: boolean;
  setShowChatWindow: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Notifications
  sendNotification: (message: any) => void;
  showNotification: (conversation: Conversation, message: string) => void;
}

// =============================================
// CONTEXT CREATION
// =============================================

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// =============================================
// PROVIDER COMPONENT
// =============================================

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading, getToken } = useAuth();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [userOnlineInConversation, setUserOnlineInConversation] = useState<Set<string>>(new Set());

  const [unreadCount, setUnreadCount] = useState(0);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // =============================================
  // NOTIFICATION UTILITIES
  // =============================================



  // =============================================
  // INITIALIZE SOCKET.IO CONNECTION
  // =============================================

  useEffect(() => {
    // Don't initialize socket until auth is done loading
    if (authLoading) return;

    const token = getToken();
    if (!token || !isAuthenticated) return;

    setConnecting(true);

    const isLocalDev = typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const socketUrl = isLocalDev ? "http://localhost:8000" : window.location.origin;
    const socketPath = isLocalDev ? "/socket.io" : "/indiamart/socket.io";

    const newSocket = io(socketUrl, {
      path: socketPath,
      auth: { token },
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    newSocket.on("connect", () => {
      console.log("✓ Chat socket connected");
      setConnected(true);
      setConnecting(false);

      // Request notification permission
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          Notification.requestPermission().catch((err) =>
            console.log("Notification permission denied:", err)
          );
        }
      }
    });

    newSocket.on("disconnect", () => {
      console.log("✗ Chat socket disconnected");
      setConnected(false);
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // =============================================
    // EVENT LISTENERS
    // =============================================

    // Online/Offline Events
    newSocket.on("user:online", ({ userId }: any) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    newSocket.on("user:offline", ({ userId }: any) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // Conversation Events
    newSocket.on("user:conversation_online", ({ conversationId, userId }: any) => {
      setUserOnlineInConversation((prev) => new Set([...prev, userId]));
    });

    newSocket.on("user:conversation_offline", ({ conversationId, userId }: any) => {
      setUserOnlineInConversation((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // Message Events
    newSocket.on("message:new", ({ message, conversationId }: any) => {
      if (currentConversation?._id === conversationId) {
        setMessages((prev) => [...prev, message]);
      } else {
        // Send notification for new message in other conversation
        sendNotification(message);
        // Update conversation list to show unread count
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversationId
              ? { ...conv, buyerUnreadCount: (conv.buyerUnreadCount || 0) + 1 }
              : conv
          )
        );
      }
    });

    newSocket.on("message:edited", ({ messageId, message }: any) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? message : msg))
      );
    });

    newSocket.on("message:deleted", ({ messageId }: any) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    newSocket.on("messages:read", ({ conversationId, userId }: any) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.sender._id !== userId ? { ...msg, isRead: true } : msg))
      );
    });

    // Conversation Updated
    newSocket.on("conversation:updated", ({ conversationId, lastMessage, unreadCount }: any) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId
            ? { ...conv, lastMessage, buyerUnreadCount: unreadCount }
            : conv
        )
      );

      // Show notification if conversation has unread messages
      if (unreadCount > 0 && conversationId !== currentConversation?._id) {
        const conv = conversations.find(c => c._id === conversationId);
        if (conv) {
          showNotification(conv, lastMessage);
        }
      }
    });

    // Typing Indicator
    newSocket.on("user:typing", ({ userId, conversationId }: any) => {
      if (currentConversation?._id === conversationId) {
        setTypingUsers((prev) => new Set([...prev, userId]));
      }
    });

    newSocket.on("user:stop_typing", ({ userId }: any) => {
      setTypingUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // Reactions
    newSocket.on("reaction:added", ({ messageId, emoji, userId }: any) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                reactions: [
                  ...(msg.reactions || []),
                  { emoji, userId },
                ],
              }
            : msg
        )
      );
    });

    newSocket.on("reaction:removed", ({ messageId, emoji, userId }: any) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                reactions: (msg.reactions || []).filter(
                  (r) => !(r.emoji === emoji && r.userId === userId)
                ),
              }
            : msg
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [authLoading, isAuthenticated, getToken]);

  // =============================================
  // API FUNCTIONS
  // =============================================

  const getConversations = useCallback(
    async (role: "buyer" | "seller" = "buyer", search?: string) => {
      // Don't fetch conversations until auth is loaded
      if (authLoading || !isAuthenticated) return;

      try {
        setLoadingConversations(true);
        const params = new URLSearchParams({ role });
        if (search) params.append("search", search);

        const res = await api.get(`/chat/conversations?${params}`);
        setConversations(res.data.data.conversations);
        setUnreadCount(res.data.data.unreadCount);
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.warn("[ChatContext] 401 Unauthorized on /chat/conversations");
        } else {
          console.error("Error fetching conversations:", error);
        }
      } finally {
        setLoadingConversations(false);
      }
    },
    [authLoading, isAuthenticated]
  );

  const getConversationDetails = useCallback(async (conversationId: string) => {
    try {
      const res = await api.get(`/chat/conversations/${conversationId}`);
      setCurrentConversation(res.data.data);
    } catch (error) {
      console.error("Error fetching conversation details:", error);
    }
  }, []);

  const getMessages = useCallback(
    async (conversationId: string, page: number = 1) => {
      try {
        setLoadingMessages(true);
        setCurrentPage(page);

        const res = await api.get(
          `/chat/conversations/${conversationId}/messages?page=${page}&limit=30`
        );

        if (page === 1) {
          setMessages(res.data.data.messages);
        } else {
          setMessages((prev) => [...res.data.data.messages, ...prev]);
        }

        const { pages, page: currentP } = res.data.data.pagination;
        setHasMoreMessages(currentP < pages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    },
    []
  );

  const loadMoreMessages = useCallback(
    async (conversationId: string) => {
      await getMessages(conversationId, currentPage + 1);
    },
    [currentPage, getMessages]
  );

  const sendMessage = useCallback(
    async (conversationId: string, text: string, attachments: any[] = []) => {
      if (!socket) return;

      // Add message optimistically to UI
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        conversation: conversationId,
        sender: { _id: "user", name: "You" },
        text,
        attachments,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMessage as any]);

      socket.emit(
        "send_message",
        { conversationId, text, attachments },
        (response: any) => {
          if (response.error) {
            console.error("Message send error:", response.error);
            // Remove optimistic message if failed
            setMessages((prev) => prev.filter((msg) => msg._id !== optimisticMessage._id));
          }
        }
      );
    },
    [socket]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await api.delete(`/chat/messages/${messageId}`);
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    },
    []
  );

  const editMessage = useCallback(
    async (messageId: string, text: string) => {
      try {
        const res = await api.put(`/chat/messages/${messageId}`, { text });
        setMessages((prev) =>
          prev.map((msg) => (msg._id === messageId ? res.data.data : msg))
        );
      } catch (error) {
        console.error("Error editing message:", error);
      }
    },
    []
  );

  const addReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!socket) return;
      socket.emit("add_reaction", { messageId, emoji });
    },
    [socket]
  );

  const removeReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!socket) return;
      socket.emit("remove_reaction", { messageId, emoji });
    },
    [socket]
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      try {
        await api.put(`/chat/conversations/${conversationId}/read`);
        if (socket) {
          socket.emit("messages:read", { conversationId });
        }
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    },
    [socket]
  );

  const archiveConversation = useCallback(
    async (conversationId: string) => {
      try {
        await api.put(`/chat/conversations/${conversationId}/archive`);
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversationId ? { ...conv, status: "archived" } : conv
          )
        );
      } catch (error) {
        console.error("Error archiving conversation:", error);
      }
    },
    []
  );

  const unarchiveConversation = useCallback(
    async (conversationId: string) => {
      try {
        await api.put(`/chat/conversations/${conversationId}/unarchive`);
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversationId ? { ...conv, status: "active" } : conv
          )
        );
      } catch (error) {
        console.error("Error unarchiving conversation:", error);
      }
    },
    []
  );

  const closeConversationChat = useCallback(
    async (conversationId: string) => {
      try {
        await api.put(`/chat/conversations/${conversationId}/close`);
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversationId ? { ...conv, status: "closed" } : conv
          )
        );
      } catch (error) {
        console.error("Error closing conversation:", error);
      }
    },
    []
  );

  const setTyping = useCallback(
    (conversationId: string, typing: boolean) => {
      if (!socket) return;

      if (typing) {
        socket.emit("typing", { conversationId });

        // Auto stop typing after 3 seconds of inactivity
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          socket.emit("stop_typing", { conversationId });
        }, 3000);
      } else {
        socket.emit("stop_typing", { conversationId });
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    },
    [socket]
  );

  const searchConversations = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        await getConversations("buyer");
        return;
      }

      try {
        setLoadingConversations(true);
        const res = await api.get(`/chat/search?query=${query}`);
        setConversations(res.data.data);
      } catch (error) {
        console.error("Error searching conversations:", error);
      } finally {
        setLoadingConversations(false);
      }
    },
    [getConversations]
  );

  const getChatStats = useCallback(async () => {
    try {
      const res = await api.get("/chat/stats/summary?role=buyer");
      return res.data.data;
    } catch (error) {
      console.error("Error fetching chat stats:", error);
    }
  }, []);

  const sendNotification = useCallback((message: any) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        const notification = new Notification("New Message", {
          body: `${message.sender.name}: ${message.text.substring(0, 100)}`,
          icon: message.sender.avatar,
          badge: "/favicon.ico",
          tag: `msg-${message._id}`,
          requireInteraction: false,
          silent: false,
        });

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      }
    }

    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch((err) => console.log("Audio play error:", err));
    }
  }, []);

  const showNotification = useCallback((conversation: Conversation, message: string) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("New Message", {
          body: `${conversation.seller?.name || conversation.buyer?.name}: ${message}`,
          icon: conversation.seller?.avatar || conversation.buyer?.avatar,
          badge: "/favicon.ico",
          tag: `conv-${conversation._id}`,
          requireInteraction: false,
          silent: false,
        });
      }
    }

    // Play sound notification
    if (audioRef.current) {
      audioRef.current.play().catch((err) => console.log("Audio play error:", err));
    }

    // Show toast notification
    console.log("🔔 New message notification:", message);
  }, []);

  const openConversation = useCallback((conversation: Conversation) => {
    setCurrentConversation(conversation);
    if (socket) {
      socket.emit("join_conversation", conversation._id);
    }
    setMessages([]);
    setCurrentPage(1);
  }, [socket]);

  const closeConversationUI = useCallback(() => {
    if (currentConversation && socket) {
      socket.emit("leave_conversation", currentConversation._id);
    }
    setCurrentConversation(null);
    setMessages([]);
    setTypingUsers(new Set());
  }, [currentConversation, socket]);

  const value: ChatContextType = {
    socket,
    connected,
    connecting,
    conversations,
    currentConversation,
    loadingConversations,
    unreadCount,
    messages,
    loadingMessages,
    hasMoreMessages,
    typingUsers,
    onlineUsers,
    userOnlineInConversation,
    getConversations,
    getConversationDetails,
    getMessages,
    loadMoreMessages,
    openConversation,
    closeConversation: closeConversationUI,
    sendMessage,
    deleteMessage,
    editMessage,
    addReaction,
    removeReaction,
    markAsRead,
    archiveConversation,
    unarchiveConversation,
    closeConversationChat,
    setTyping,
    searchConversations,
    getChatStats,
    showChatWindow,
    setShowChatWindow,
    searchQuery,
    setSearchQuery,
    sendNotification,
    showNotification,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
      {/* Hidden audio element for notification sounds - disabled temporarily */}
      {/* <audio ref={audioRef}>
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
        <source src="/sounds/notification.ogg" type="audio/ogg" />
      </audio> */}
    </ChatContext.Provider>
  );
}

// =============================================
// CUSTOM HOOK
// =============================================

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}
