"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HiHeart, HiOutlineHeart } from "react-icons/hi2";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  iconSize?: string;
}

export default function WishlistButton({
  productId,
  className = "",
  iconSize = "w-5 h-5",
}: WishlistButtonProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get(`/wishlist/check/${productId}`);
      setSaved(res.data?.data?.saved || false);
    } catch (error) {
      // silently ignore check errors, user can still try to save
      console.debug("Wishlist check error (non-critical):", error);
    }
  }, [isAuthenticated, productId]);

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
        await api.delete(`/wishlist/${productId}`);
        setSaved(false);
        toast.success("Removed from wishlist");
      } else {
        await api.post(`/wishlist/${productId}`);
        setSaved(true);
        toast.success("Saved to wishlist");
      }
    } catch (error) {
      console.error("Wishlist error:", error);
      const message = error instanceof Error ? error.message : "Failed to update wishlist";
      toast.error(message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={`transition-all duration-200 ${loading ? "opacity-50" : "hover:scale-110"} ${className}`}
    >
      {saved ? (
        <HiHeart className={`${iconSize} text-red-500`} />
      ) : (
        <HiOutlineHeart className={`${iconSize} text-gray-400 hover:text-red-400`} />
      )}
    </button>
  );
}
