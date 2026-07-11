"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlinePaperAirplane,
  HiOutlineChevronDown,
  HiOutlineCurrencyRupee,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi2";

function Stage5Negotiation() {
  const { user } = useAuth();
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [selectedNegotiation, setSelectedNegotiation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showNegotiationForm, setShowNegotiationForm] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    requestedPrice: "",
    offeredPrice: "",
    moq: "",
    bulkDiscount: "",
    paymentTerms: { advance: 30, milestone: 0, credit: 0 },
  });

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/negotiations/buyer");
      setNegotiations(res.data.data?.negotiations || []);
    } catch (err: any) {
      // Silently fail - endpoint may not exist yet
      console.warn("Negotiations endpoint not available yet");
      setNegotiations([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedNegotiation) return;

    try {
      await api.post(`/negotiations/${selectedNegotiation._id}/message`, {
        message: message.trim(),
      });
      setMessage("");
      setSelectedNegotiation(null);
      fetchNegotiations();
      toast.success("Message sent!");
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const submitNegotiationProposal = async () => {
    try {
      await api.post("/negotiations", {
        ...formData,
        paymentTerms: {
          advance: parseInt(String(formData.paymentTerms.advance)),
          milestone: parseInt(String(formData.paymentTerms.milestone)),
          credit: parseInt(String(formData.paymentTerms.credit)),
        },
      });
      toast.success("Negotiation proposal sent!");
      setShowNegotiationForm(false);
      setFormData({
        requestedPrice: "",
        offeredPrice: "",
        moq: "",
        bulkDiscount: "",
        paymentTerms: { advance: 30, milestone: 0, credit: 0 },
      });
      fetchNegotiations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit proposal");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/buyer/procurement">
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <HiOutlineArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stage 5: Negotiation</h1>
              <p className="text-sm text-gray-600">Price, MOQ, Bulk Discounts & Payment Terms</p>
            </div>
          </div>
          <button
            onClick={() => setShowNegotiationForm(!showNegotiationForm)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700"
          >
            + New Negotiation
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* New Negotiation Form */}
        {showNegotiationForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Start Negotiation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price Negotiation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Requested Price (₹/unit)</label>
                <input
                  type="number"
                  value={formData.requestedPrice}
                  onChange={(e) => setFormData({ ...formData, requestedPrice: e.target.value })}
                  placeholder="What do you want to pay?"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* MOQ */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Order Quantity (MOQ)</label>
                <input
                  type="number"
                  value={formData.moq}
                  onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                  placeholder="Minimum units required"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Bulk Discount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bulk Discount Requested (%)</label>
                <input
                  type="number"
                  value={formData.bulkDiscount}
                  onChange={(e) => setFormData({ ...formData, bulkDiscount: e.target.value })}
                  placeholder="e.g., 10 for 10% discount"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Advance Payment (%)</label>
                <input
                  type="number"
                  value={formData.paymentTerms.advance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentTerms: { ...formData.paymentTerms, advance: parseInt(e.target.value) },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Credit Days */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Credit Days (0 for COD)</label>
                <input
                  type="number"
                  value={formData.paymentTerms.credit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentTerms: { ...formData.paymentTerms, credit: parseInt(e.target.value) },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={submitNegotiationProposal}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700"
              >
                Send Proposal
              </button>
              <button
                onClick={() => setShowNegotiationForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Negotiations List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-900">Negotiations ({negotiations.length})</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {negotiations.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">No negotiations yet</div>
                ) : (
                  negotiations.map((neg) => (
                    <button
                      key={neg._id}
                      onClick={() => setSelectedNegotiation(neg)}
                      className={`w-full text-left px-6 py-4 hover:bg-blue-50 transition ${
                        selectedNegotiation?._id === neg._id ? "bg-blue-100 border-l-4 border-l-blue-600" : ""
                      }`}
                    >
                      <p className="font-semibold text-gray-900 text-sm">₹{neg.requestedPrice?.toLocaleString()}/unit</p>
                      <p className="text-xs text-gray-500 mt-1">{neg.status}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {neg.status === "agreed" && <HiOutlineCheckCircle className="w-4 h-4 text-green-600" />}
                        {neg.status === "negotiating" && <HiOutlineClock className="w-4 h-4 text-yellow-600" />}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2">
            {selectedNegotiation ? (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-96">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-gray-900">Negotiation Details</h3>
                    <p className="text-sm text-gray-500 mt-1">Price: ₹{selectedNegotiation.requestedPrice}</p>
                  </div>

                  {/* Key Details */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600">MOQ</p>
                      <p className="font-bold text-gray-900">{selectedNegotiation.moq || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Bulk Discount</p>
                      <p className="font-bold text-gray-900">{selectedNegotiation.bulkDiscounts?.length || 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Advance</p>
                      <p className="font-bold text-gray-900">{selectedNegotiation.paymentTerms?.advance || 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Credit Days</p>
                      <p className="font-bold text-gray-900">{selectedNegotiation.paymentTerms?.credit || 0}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="space-y-3">
                    {selectedNegotiation.messages?.map((msg: any, idx: number) => (
                      <div key={idx} className={`flex ${msg.from === user?._id ? "justify-end" : ""}`}>
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                            msg.from === user?._id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 p-4 flex gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Send message..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                  >
                    <HiOutlinePaperAirplane className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Select a negotiation to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Stage5Page() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "premium"]}>
      <Stage5Negotiation />
    </ProtectedRoute>
  );
}
