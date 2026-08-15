"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBulkInquiry } from "@/contexts/BulkInquiryContext";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import { resolveImageUrl } from "@/lib/imageUrl";
import toast from "react-hot-toast";
import {
  HiOutlineEnvelope,
  HiOutlineXMark,
  HiOutlineTrash,
  HiXMark,
  HiOutlineChatBubbleLeftRight,
} from "@/lib/icons";

export default function BulkInquiryBar() {
  const { items, removeItem, clearItems, showModal, openModal, closeModal } = useBulkInquiry();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState("");
  const [sending, setSending] = useState(false);

  if (items.length === 0) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      closeModal();
      router.push("/auth/login");
      return;
    }
    if (!message.trim()) { toast.error("Please enter a message"); return; }

    setSending(true);
    try {
      await api.post("/inquiries/bulk", {
        productIds: items.map((p) => p._id),
        subject: subject.trim() || "Bulk Inquiry",
        message: message.trim(),
        quantityRequired: quantity ? parseInt(quantity) : undefined,
      });
      toast.success(`Inquiry sent to ${items.length} seller${items.length > 1 ? "s" : ""}!`);
      clearItems();
      closeModal();
      setSubject("");
      setMessage("");
      setQuantity("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send inquiry");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Fixed bar — sits above CompareBar if both exist */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-blue-200 shadow-lg px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="text-sm font-semibold text-gray-800 shrink-0">
              Bulk Inquiry
            </span>
            <span className="text-xs text-gray-500 shrink-0">
              {items.length} product{items.length > 1 ? "s" : ""} selected
            </span>
            {/* Product chips */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide ml-2">
              {items.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-full pl-1.5 pr-1 py-0.5 shrink-0"
                >
                  {p.images?.[0]?.url && (
                    <img src={resolveImageUrl(p.images[0].url)} alt="" className="w-4 h-4 rounded-full object-cover" />
                  )}
                  <span className="text-xs text-blue-700 max-w-[100px] truncate">{p.name}</span>
                  <button
                    onClick={() => removeItem(p._id)}
                    className="text-blue-400 hover:text-blue-700 ml-0.5"
                  >
                    <HiOutlineXMark className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={clearItems}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              title="Clear all"
            >
              <HiOutlineTrash className="w-4 h-4" />
            </button>
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              <HiOutlineEnvelope className="w-4 h-4" />
              Send Inquiry
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Send Bulk Inquiry</h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  Your message will be sent to {items.length} seller{items.length > 1 ? "s" : ""}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Product list */}
            <div className="px-5 py-3 border-b border-gray-50 max-h-36 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Selected Products</p>
              <div className="space-y-1.5">
                {items.map((p) => (
                  <div key={p._id} className="flex items-center gap-2">
                    {p.images?.[0]?.url && (
                      <img src={resolveImageUrl(p.images[0].url)} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                    )}
                    <span className="text-xs text-gray-700 flex-1 line-clamp-1">{p.name}</span>
                    <span className="text-xs text-gray-400">₹{p.price}/{p.priceUnit || "Pc"}</span>
                    <button
                      onClick={() => removeItem(p._id)}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <HiXMark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSend} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Bulk Order Inquiry"
                  maxLength={200}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your requirements, target price, delivery timeline..."
                  required
                  maxLength={2000}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Quantity Required <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 500"
                  min={1}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                  ) : (
                    <><HiOutlineEnvelope className="w-4 h-4" />Send to {items.length} Seller{items.length > 1 ? "s" : ""}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
