"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CategoryCard from "@/components/ui/CategoryCard";
import api from "@/lib/axios";
import { HiMagnifyingGlass, HiOutlineChevronRight } from "@/lib/icons";

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  productCount?: number;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
  description?: string;
  productCount?: number;
  subcategories: SubCategory[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/categories/tree")
      .then((res) => setCategories(res.data?.data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = searchQuery.trim()
    ? categories.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.subcategories?.some((sub) =>
            sub.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : categories;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Browse All Categories
          </h1>
          <p className="text-gray-500">
            Explore thousands of products organized by industry and category
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none transition"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-xl p-4 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            {/* Category Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((cat) => (
                <CategoryCard key={cat._id} {...cat} />
              ))}
            </div>

            {/* Detailed Category List */}
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                All Categories & Subcategories
              </h2>
              <div className="space-y-3">
                {filtered.map((cat) => (
                  <div
                    key={cat._id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Parent Category Header */}
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === cat._id ? null : cat._id)
                      }
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon || "📁"}</span>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            <Link
                              href={`/categories/${cat.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-[var(--primary)] transition"
                            >
                              {cat.name}
                            </Link>
                          </h3>
                          {cat.description && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                          {cat.subcategories?.length || 0} subcategories
                          {cat.productCount ? ` · ${cat.productCount} products` : ""}
                        </span>
                        <HiOutlineChevronRight
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            expandedId === cat._id ? "rotate-90" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Subcategories */}
                    {expandedId === cat._id && cat.subcategories?.length > 0 && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {cat.subcategories.map((sub) => (
                            <Link
                              key={sub._id}
                              href={`/categories/${sub.slug}`}
                              className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-gray-100 hover:border-[var(--primary)] hover:text-[var(--primary)] transition text-sm text-gray-600"
                            >
                              <span className="text-base">
                                {sub.icon || "•"}
                              </span>
                              <span className="truncate font-medium">
                                {sub.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No categories found</p>
            <p className="text-sm mt-1">
              {searchQuery
                ? `No categories matching "${searchQuery}"`
                : "Categories will appear when added by admin."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
