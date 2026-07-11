"use client";

import { useState } from "react";
import {
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineXMark,
  HiOutlineChevronDown,
} from "react-icons/hi2";

interface CallSellerModalProps {
  seller: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
    companyName?: string;
  };
  onClose: () => void;
}

export default function CallSellerModal({ seller, onClose }: CallSellerModalProps) {
  const [contactMethod, setContactMethod] = useState<"call" | "whatsapp" | "email">("call");
  const [calling, setCalling] = useState(false);
  const [status, setStatus] = useState<"idle" | "calling" | "ringing" | "connected" | "ended">("idle");
  const [duration, setDuration] = useState(0);

  const handleCall = async () => {
    if (!seller.phone) {
      alert("Seller phone number not available");
      return;
    }

    setCalling(true);
    setStatus("calling");

    // Simulate call initiation
    setTimeout(() => {
      setStatus("ringing");
    }, 1500);

    setTimeout(() => {
      setStatus("connected");
    }, 3500);
  };

  const handleEndCall = () => {
    setStatus("ended");
    setCalling(false);
  };

  const handleWhatsApp = () => {
    if (!seller.phone) {
      alert("Seller phone number not available");
      return;
    }
    window.open(`https://wa.me/${seller.phone}?text=Hi, I'm interested in your product`, "_blank");
  };

  const handleEmail = () => {
    if (!seller.email) {
      alert("Seller email not available");
      return;
    }
    window.location.href = `mailto:${seller.email}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--primary)] to-blue-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <HiOutlinePhone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Contact Seller</p>
              <p className="text-blue-100 text-xs">{seller.companyName || seller.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Phone Call Section */}
          {seller.phone && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800">Direct Call</h3>

              {status === "idle" ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 space-y-3">
                  <p className="text-xs text-gray-600">
                    Call {seller.name} directly to discuss your inquiry
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 bg-white rounded-lg px-3 py-2 border border-blue-100">
                    <HiOutlinePhone className="w-4 h-4 text-blue-600" />
                    {seller.phone}
                  </div>
                  <button
                    onClick={handleCall}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <HiOutlinePhone className="w-5 h-5" />
                    Start Call
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4 space-y-3">
                  {/* Status indicator */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">
                        {status === "calling" && "Calling..."}
                        {status === "ringing" && "Ringing..."}
                        {status === "connected" && "Call Connected"}
                        {status === "ended" && "Call Ended"}
                      </p>
                      {status === "connected" && (
                        <p className="text-sm font-bold text-green-700 mt-1">{duration}s</p>
                      )}
                    </div>
                    {status === "connected" && (
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse animation-delay-200" />
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse animation-delay-400" />
                      </div>
                    )}
                  </div>

                  {/* Call controls */}
                  {status !== "ended" && (
                    <button
                      onClick={handleEndCall}
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition"
                    >
                      End Call
                    </button>
                  )}

                  {status === "ended" && (
                    <button
                      onClick={() => setStatus("idle")}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
                    >
                      Call Again
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          {seller.phone && <div className="border-t border-gray-200" />}

          {/* WhatsApp Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-800">Quick Message</h3>
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-semibold py-3 rounded-xl transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.915 1.27c-1.528.757-2.927 1.8-4.08 3.018C2.884 8.846 2.256 10.435 2.122 12.05c-.134 1.616.214 3.275 1.029 4.749l-1.086 3.946a1 1 0 001.342 1.341l3.946-1.086a9.788 9.788 0 004.773 1.216h.005c5.396 0 9.795-4.32 9.992-9.713.196-5.413-4.331-9.841-9.768-9.841" />
              </svg>
              Message on WhatsApp
            </button>
          </div>

          {/* Email Section */}
          {seller.email && (
            <>
              <div className="border-t border-gray-200" />
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-800">Send Email</h3>
                <button
                  onClick={handleEmail}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold py-3 rounded-xl transition"
                >
                  <HiOutlineEnvelope className="w-5 h-5" />
                  Email: {seller.email}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
