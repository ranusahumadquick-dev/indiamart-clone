"use client";

import React from "react";
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "@/lib/icons";

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium">{startItem}</span> to{" "}
        <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{totalCount}</span> variants
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-600 hover:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent rounded transition"
          title="Previous page"
        >
          <HiOutlineChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 rounded transition ${
                  pageNum === currentPage
                    ? "bg-blue-600 text-white font-medium"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-600 hover:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent rounded transition"
          title="Next page"
        >
          <HiOutlineChevronRight size={20} />
        </button>
      </div>

      <div className="text-sm text-gray-600">
        Page <span className="font-medium">{currentPage}</span> of{" "}
        <span className="font-medium">{totalPages}</span>
      </div>
    </div>
  );
};
