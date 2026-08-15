"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { HiOutlineDevicePhoneMobile, HiOutlineCheckCircle } from "@/lib/icons";

interface Props {
  onVerified: (phone: string) => void;
  defaultPhone?: string;
}

declare global {
  interface Window {
    initSendOTP?: (config: object) => void;
  }
}

export default function MobileVerification({ onVerified, defaultPhone = "" }: Props) {
  const [phone,      setPhone]      = useState(defaultPhone);
  const [loading,    setLoading]    = useState(false);
  const [verified,   setVerified]   = useState(false);
  const [widgetReady,setWidgetReady]= useState(false);
  const [config,     setConfig]     = useState<{ widgetId: string; tokenAuth: string } | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // 1. Fetch MSG91 config from backend
  useEffect(() => {
    api.get("/settings/msg91-config").then((res) => {
      const d = res.data?.data;
      if (d?.configured) setConfig({ widgetId: d.widgetId, tokenAuth: d.tokenAuth });
      else toast.error("OTP service not configured. Contact admin.");
    }).catch(() => toast.error("Failed to load OTP config."));
  }, []);

  // 2. Load MSG91 widget script
  const loadWidget = () => {
    if (!config) return;
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }

    setLoading(true);

    const configuration = {
      widgetId:   config.widgetId,
      tokenAuth:  config.tokenAuth,
      identifier: phone,
      success: async (data: Record<string, unknown>) => {
        console.log("[MSG91] Widget success data:", JSON.stringify(data));

        // MSG91 widget returns token in data.message or data.access_token
        const token = (data?.message || data?.access_token || data?.token || "") as string;
        console.log("[MSG91] Token extracted:", token ? "YES" : "EMPTY");

        if (!token) {
          toast.error("Verification failed — no token received. Try again.");
          setLoading(false);
          return;
        }

        try {
          await api.post("/settings/verify-otp-token", { token, phone });
          setVerified(true);
          toast.success("Mobile number verified!");
          onVerified(phone);
        } catch (err: any) {
          toast.error(err?.message || "Verification failed. Try again.");
        }
        setLoading(false);
      },
      failure: (error: unknown) => {
        console.error("[MSG91] Error:", error);
        toast.error("OTP verification failed. Please try again.");
        setLoading(false);
      },
    };

    // Remove existing script
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }

    const urls = [
      "https://verify.msg91.com/otp-provider.js",
      "https://verify.phone91.com/otp-provider.js",
    ];

    let idx = 0;
    const attempt = () => {
      const s = document.createElement("script");
      s.src   = urls[idx];
      s.async = true;
      s.onload = () => {
        if (typeof window.initSendOTP === "function") {
          window.initSendOTP(configuration);
          setWidgetReady(true);
          setLoading(false);
        }
      };
      s.onerror = () => {
        idx++;
        if (idx < urls.length) attempt();
        else {
          toast.error("Failed to load OTP widget. Check internet connection.");
          setLoading(false);
        }
      };
      document.head.appendChild(s);
      scriptRef.current = s;
    };
    attempt();
  };

  if (verified) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
        <HiOutlineCheckCircle className="w-6 h-6 text-green-600 shrink-0" />
        <div>
          <p className="font-bold text-green-800 text-sm">Mobile Verified</p>
          <p className="text-green-600 text-xs">+91 {phone}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Input */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="flex items-center bg-gray-50 border-2 border-gray-200 rounded-xl px-3 text-sm font-semibold text-gray-700 shrink-0">
            🇮🇳 +91
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="Enter 10-digit mobile number"
            maxLength={10}
            disabled={loading}
            className={`flex-1 border-2 rounded-xl px-4 py-3 text-sm outline-none transition ${
              phone.length === 10 && /^[6-9]\d{9}$/.test(phone)
                ? "border-green-400 bg-green-50"
                : "border-gray-200 focus:border-blue-500"
            }`}
          />
        </div>
        {phone.length > 0 && phone.length < 10 && (
          <p className="text-xs text-red-500 mt-1">Enter complete 10-digit number</p>
        )}
        {phone.length === 10 && !/^[6-9]\d{9}$/.test(phone) && (
          <p className="text-xs text-red-500 mt-1">Number must start with 6, 7, 8, or 9</p>
        )}
      </div>

      {/* Send OTP Button */}
      <button
        onClick={loadWidget}
        disabled={loading || phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone) || !config}
        className="w-full bg-[#0052cc] hover:bg-[#003d99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Loading OTP Widget...</>
        ) : (
          <><HiOutlineDevicePhoneMobile className="w-5 h-5" /> Send OTP</>
        )}
      </button>

      {!config && (
        <p className="text-xs text-center text-red-500">
          OTP service not configured. Contact administrator.
        </p>
      )}
    </div>
  );
}
