'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';
import api from '@/lib/axios';

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const targetUserId = searchParams.get('userId');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    if (!token || !user) {
      router.push('/auth/login');
      return;
    }
    try {
      JSON.parse(user);
      setIsAuthenticated(true);
    } catch {
      router.push('/auth/login');
    }
  }, [router]);

  // If userId param given, start or find conversation with that user
  useEffect(() => {
    if (!isAuthenticated || !targetUserId) return;
    api.post('/chat/conversations', { participantId: targetUserId })
      .then((res) => {
        const convId = res.data?.data?._id || res.data?.data?.conversationId;
        if (convId) setConversationId(convId);
      })
      .catch(() => {
        // Ignore — ChatWindow will show conversation list
      });
  }, [isAuthenticated, targetUserId]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-100" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-800 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800">Messages</h1>
      </div>

      {/* Full-height Chat Window */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow onClose={() => router.back()} initialConversationId={conversationId} />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
