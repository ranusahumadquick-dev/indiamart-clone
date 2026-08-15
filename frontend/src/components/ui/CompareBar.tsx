"use client";
import { resolveImageUrl } from '@/lib/imageUrl';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCompare } from "@/contexts/CompareContext";
import { HiXMark, HiOutlineArrowsRightLeft, HiOutlineTrash } from "@/lib/icons";

// Pages where compare bar should NOT appear
const HIDDEN_PREFIXES = ["/seller", "/buyer", "/admin", "/profile", "/auth", "/checkout", "/payments", "/subscription"];

export default function CompareBar() {
  const { items, removeItem, clearItems } = useCompare();
  const pathname = usePathname();

  if (items.length === 0) return null;
  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Label */}
        <div className="shrink-0 hidden sm:block">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <HiOutlineArrowsRightLeft className="w-4 h-4 text-[var(--primary)]" />
            Compare
          </p>
          <p className="text-[11px] text-gray-400">{items.length}/4 products</p>
        </div>

        <div className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {/* Product slots */}
          {items.map((product) => (
            <div
              key={product._id}
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 shrink-0 min-w-[140px] max-w-[180px]"
            >
              <div className="w-8 h-8 rounded overflow-hidden bg-gray-200 shrink-0">
                <Image
                  src={product.images?.[0]?.url || "/placeholder.svg"}
                  alt={product.name}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                  unoptimized={product.images?.[0]?.url?.startsWith("http")}
                />
              </div>
              <p className="text-xs font-medium text-gray-700 truncate flex-1">{product.name}</p>
              <button
                onClick={() => removeItem(product._id)}
                className="text-gray-400 hover:text-red-500 transition shrink-0"
              >
                <HiXMark className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 4 - items.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-lg px-2.5 py-1.5 shrink-0 min-w-[140px] h-[52px]"
            >
              <p className="text-[11px] text-gray-400">+ Add product</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clearItems}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Clear all"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
          <Link
            href="/compare"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              items.length >= 2
                ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
            }`}
          >
            <HiOutlineArrowsRightLeft className="w-4 h-4" />
            Compare {items.length >= 2 ? "Now" : `(need ${2 - items.length} more)`}
          </Link>
        </div>
      </div>
    </div>
  );
}
