"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import ProductCard, { DUMMY_PRODUCTS } from "@/components/ui/ProductCard";
import api from "@/lib/axios";
import {
  HiOutlineChevronRight,
  HiMagnifyingGlass,
  HiOutlineFunnel,
  HiXMark,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineArrowPath,
} from "@/lib/icons";

// ─── Types ──────────────────────────────────────────────────────────
interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  isActive?: boolean;
}

interface ParentCategory {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface CategoryData {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  description?: string;
  productCount?: number;
  totalProducts?: number;
  subcategories: SubCategory[];
  parentCategory: ParentCategory | null;
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  images: { url: string; alt?: string }[];
  city?: string;
  state?: string;
  companyName?: string;
  averageRating?: number;
  numReviews?: number;
  totalReviews?: number;
  minOrderQuantity?: number;
  priceUnit?: string;
  isVerified?: boolean;
  category?: string | { _id: string; name: string };
  tags?: string[];
  stock?: number;
  isActive?: boolean;
}

const PRODUCTS_PER_PAGE = 12;

// ─── Main Content ───────────────────────────────────────────────────
function CategoryPageContent() {
  const { slug } = useParams();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<CategoryData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedSub, setSelectedSub] = useState<string>(
    searchParams.get("sub") || ""
  );
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({
    min: "",
    max: "",
  });

  // Fetch category info
  useEffect(() => {
    const fetchCategory = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/categories/${slug}`);
        setCategory(res.data?.data || null);
      } catch {
        setCategory(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [slug]);

  // Fetch products for this category
  useEffect(() => {
    if (!category) return;

    const fetchProducts = async () => {
      setProductsLoading(true);
      setCurrentPage(1); // Reset page when fetching new products
      try {
        const params = new URLSearchParams();
        params.append("category", category._id);
        params.append("page", "1");
        params.append("limit", "100");

        if (selectedSub) {
          params.set("subCategory", selectedSub);
        }
        if (priceRange.min) params.set("minPrice", priceRange.min);
        if (priceRange.max) params.set("maxPrice", priceRange.max);
        if (sortBy) params.set("sortBy", sortBy);

        const res = await api.get(`/products?${params.toString()}`);
        const apiProducts = res.data?.data?.products;
        setProducts(apiProducts?.length > 0 ? apiProducts : []);
      } catch {
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [category, selectedSub, sortBy, priceRange]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = products.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const getCategoryName = (cat: Product["category"]) =>
    typeof cat === "object" ? cat?.name || "" : cat || "";

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-2xl font-bold text-gray-700 mb-2">Category Not Found</p>
        <p className="text-gray-400 mb-6">
          The category you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/categories"
          className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--primary-dark)] transition"
        >
          Browse All Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-[var(--primary)] transition">
            Home
          </Link>
          <HiOutlineChevronRight className="w-3.5 h-3.5" />
          <Link href="/categories" className="hover:text-[var(--primary)] transition">
            Categories
          </Link>
          {category.parentCategory && (
            <>
              <HiOutlineChevronRight className="w-3.5 h-3.5" />
              <Link
                href={`/categories/${category.parentCategory.slug}`}
                className="hover:text-[var(--primary)] transition"
              >
                {category.parentCategory.name}
              </Link>
            </>
          )}
          <HiOutlineChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-800 font-medium">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{category.icon || "📁"}</span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-gray-500 mt-1">{category.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                <span>
                  {category.totalProducts || products.length || 0} products
                  available
                </span>
                {category.subcategories?.length > 0 && (
                  <span>
                    {category.subcategories.length} subcategories
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Subcategory Chips */}
          {category.subcategories?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Subcategories
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSub("")}
                  className={`text-sm px-4 py-2 rounded-lg border transition font-medium ${
                    !selectedSub
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  }`}
                >
                  All
                </button>
                {category.subcategories.map((sub) => (
                  <button
                    key={sub._id}
                    onClick={() => setSelectedSub(sub._id)}
                    className={`text-sm px-4 py-2 rounded-lg border transition font-medium ${
                      selectedSub === sub._id
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    }`}
                  >
                    {sub.icon && <span className="mr-1">{sub.icon}</span>}
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sort & Filters Bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {productsLoading ? (
              <span className="flex items-center gap-2">
                <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {paginatedProducts.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {products.length}
                </span>{" "}
                products
              </>
            )}
          </p>

          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="hidden md:block border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
            </select>

            <button
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden flex items-center gap-2 bg-[var(--primary)] text-white px-3 py-2 rounded-lg text-sm font-medium"
            >
              <HiOutlineAdjustmentsHorizontal className="w-4 h-4" />
              Sort & Filter
            </button>
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowMobileFilters(false)}
            />
            <div className="absolute right-0 top-0 h-full w-72 max-w-[80vw] bg-white shadow-xl overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg">Sort & Filter</h2>
                <button onClick={() => setShowMobileFilters(false)}>
                  <HiXMark className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">
                    Price Range (₹)
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, min: e.target.value })
                      }
                      className="w-1/2 border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, max: e.target.value })
                      }
                      className="w-1/2 border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => {
                    setSortBy("newest");
                    setPriceRange({ min: "", max: "" });
                    setSelectedSub("");
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-semibold"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 bg-[var(--primary)] text-white py-2.5 rounded-lg text-sm font-semibold"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border animate-pulse overflow-hidden">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-5 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : paginatedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedProducts.map((product) => {
                const { category: cat, ...rest } = product;
                const categoryStr = typeof cat === "object" ? cat?.name || "" : cat || "";
                return (
                  <ProductCard key={product._id} {...rest} category={categoryStr} />
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
                  )
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <span key={page} className="flex items-center">
                        {prev && page - prev > 1 && (
                          <span className="px-2 text-gray-300">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                            currentPage === page
                              ? "bg-[var(--primary)] text-white shadow"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      </span>
                    );
                  })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <HiMagnifyingGlass className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-1">
              No products in this category
            </p>
            <p className="text-sm text-gray-400 mb-6">
              {selectedSub
                ? "Try selecting a different subcategory or clear filters"
                : "Products will appear when sellers list them here"}
            </p>
            <div className="flex items-center justify-center gap-3">
              {selectedSub && (
                <button
                  onClick={() => setSelectedSub("")}
                  className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              )}
              <Link
                href="/products"
                className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--primary-dark)] transition"
              >
                Browse All Products
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page Export with Suspense ──────────────────────────────────────
export default function CategorySlugPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">
          Loading category...
        </div>
      }
    >
      <CategoryPageContent />
    </Suspense>
  );
}
