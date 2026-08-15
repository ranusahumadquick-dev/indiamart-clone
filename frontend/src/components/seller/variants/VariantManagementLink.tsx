"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { HiOutlineSparkles } from "@/lib/icons";

interface VariantManagementLinkProps {
  productId: string;
  hasVariants?: boolean;
}

export const VariantManagementLink: React.FC<VariantManagementLinkProps> = ({
  productId,
  hasVariants = false,
}) => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/seller/products/${productId}/variants`)}
      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition font-medium shadow-sm"
    >
      <HiOutlineSparkles size={20} />
      Manage Variants
      {hasVariants && (
        <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
          Advanced
        </span>
      )}
    </button>
  );
};
