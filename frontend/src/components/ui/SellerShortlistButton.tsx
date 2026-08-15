"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HiBookmark, HiOutlineBookmark } from "@/lib/icons";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface Props {
  sellerId: string;
  className?: string;
  iconSize?: string;
  showLabel?: boolean;
}

export default function SellerShortlistButton({
  sellerId,
  className = "",
  iconSize = "w-5 h-5",
  showLabel = false,
}: Props) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get(`/wishlist/sellers/check/${sellerId}`);
      setSaved(res.data.data.saved);
    } catch {
      // silently ignore
    }
  }, [isAuthenticated, sellerId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/buyer/wishlist");
      return;
    }

    setLoading(true);
    try {
      if (saved) {
        await api.delete(`/wishlist/sellers/${sellerId}`);
        setSaved(false);
        toast.success("Removed from shortlist");
      } else {
        await api.post(`/wishlist/sellers/${sellerId}`);
        setSaved(true);
        toast.success("Supplier saved to shortlist");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Remove from shortlist" : "Save supplier"}
      className={`flex items-center gap-1.5 transition-all duration-200 ${loading ? "opacity-50" : "hover:scale-105"} ${className}`}
    >
      {saved ? (
        <HiBookmark className={`${iconSize} text-blue-600`} />
      ) : (
        <HiOutlineBookmark className={`${iconSize} text-gray-400 hover:text-blue-500`} />
      )}
      {showLabel && (
        <span className="text-sm font-medium">{saved ? "Saved" : "Save Supplier"}</span>
      )}
    </button>
  );
}
