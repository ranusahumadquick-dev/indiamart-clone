"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ChatWindow from "@/components/chat/ChatWindow";
import { useRouter } from "next/navigation";

export default function BuyerMessagesPage() {
  const router = useRouter();
  return (
    <ProtectedRoute allowedRoles={["buyer", "seller", "premium", "admin"]}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Messages</h1>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: "600px" }}>
          <ChatWindow onClose={() => router.back()} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
