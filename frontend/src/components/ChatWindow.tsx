'use client';

import { useEffect, useRef, useState } from 'react';
import { HiOutlinePaperClip, HiOutlineFaceSmile, HiOutlineXMark } from 'react-icons/hi2';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  text: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  isRead: boolean;
  attachments?: Array<{ url: string; fileName: string }>;
}

interface ChatWindowProps {
  conversationId: string;
  otherUser: {
    _id: string;
    name: string;
    avatar?: string;
    companyName?: string;
  };
  currentUserId: string;
}

export default function ChatWindow({ conversationId, otherUser, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000', {
      auth: { token },
      reconnection: true,
    });

    // Join conversation room
    socketRef.current.emit('join_conversation', conversationId);

    // Listen for new messages
    socketRef.current.on('message:new', (data) => {
      setMessages((prev) => [...prev, data.message]);
      scrollToBottom();
    });

    // Listen for typing indicators
    socketRef.current.on('user:typing', ({ userId }) => {
      if (userId === otherUser._id) setIsTyping(true);
    });

    socketRef.current.on('user:stop_typing', () => {
      setIsTyping(false);
    });

    // Fetch existing messages
    fetchMessages();

    return () => {
      socketRef.current?.emit('leave_conversation', conversationId);
      socketRef.current?.disconnect();
    };
  }, [conversationId, otherUser._id]);

  const fetchMessages = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/chat/conversations/${conversationId}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('authToken')}`,
        },
      });
      const data = await res.json();
      setMessages(data.data.messages || []);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSendMessage = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const response = await fetch(`${apiUrl}/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        setText('');
        // Message will be added via socket.io
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = () => {
    socketRef.current?.emit('typing', { conversationId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { conversationId });
    }, 3000);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          {otherUser.avatar && (
            <Image
              src={otherUser.avatar}
              alt={otherUser.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
          <div>
            <p className="font-semibold text-gray-900">{otherUser.name}</p>
            {otherUser.companyName && (
              <p className="text-sm text-gray-600">{otherUser.companyName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">
              Start the conversation
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex gap-3 ${
                msg.sender._id === currentUserId ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender._id !== currentUserId && msg.sender.avatar && (
                <Image
                  src={msg.sender.avatar}
                  alt={msg.sender.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}

              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender._id === currentUserId
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="break-words">{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.sender._id === currentUserId ? 'text-blue-100' : 'text-gray-600'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex gap-3">
            <div className="bg-gray-200 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex gap-3">
          <button className="p-2 hover:bg-gray-200 rounded-lg transition">
            <HiOutlinePaperClip className="w-6 h-6 text-gray-600" />
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button className="p-2 hover:bg-gray-200 rounded-lg transition">
            <HiOutlineFaceSmile className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={handleSendMessage}
            disabled={!text.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
