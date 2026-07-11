"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductCard, { DUMMY_PRODUCTS } from "@/components/ui/ProductCard";
import ProductImage from "@/components/ProductImage";
import api from "@/lib/axios";
import {
  HiMagnifyingGlass,
  HiOutlineFunnel,
  HiXMark,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineMapPin,
  HiOutlineTag,
  HiOutlineCurrencyDollar,
  HiOutlineSquares2X2,
  HiOutlineQueueList,
  HiOutlineArrowPath,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineCubeTransparent,
  HiOutlineStar,
} from "react-icons/hi2";

// ─── Types ──────────────────────────────────────────────────────────
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
  brand?: { _id: string; brandName: string } | null;
  tags?: string[];
  stock?: number;
}

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  subcategories?: SubCategory[];
}

interface Filters {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  location: string;
  sortBy: string;
  minRating: string;
  maxMOQ: string;
  isVerified: string;
  allowSamples: string;
}

const INITIAL_FILTERS: Filters = {
  search: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  location: "",
  sortBy: "newest",
  minRating: "",
  maxMOQ: "",
  isVerified: "",
  allowSamples: "",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "relevance", label: "Relevance" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
];

const PRICE_PRESETS = [
  { label: "Under ₹500", min: "", max: "500" },
  { label: "₹500 – ₹2,000", min: "500", max: "2000" },
  { label: "₹2,000 – ₹10,000", min: "2000", max: "10000" },
  { label: "₹10,000 – ₹50,000", min: "10000", max: "50000" },
  { label: "Over ₹50,000", min: "50000", max: "" },
];

const MOQ_PRESETS = [
  { label: "1 Piece", value: "1" },
  { label: "Up to 10", value: "10" },
  { label: "Up to 50", value: "50" },
  { label: "Up to 100", value: "100" },
  { label: "Up to 500", value: "500" },
];

const RATING_OPTIONS = [
  { label: "4★ & above", value: "4" },
  { label: "3★ & above", value: "3" },
  { label: "2★ & above", value: "2" },
];

const TRENDING_SEARCHES = [
  "Stainless Steel Pipe",
  "LED Panel Light",
  "Cotton Fabric",
  "Hydraulic Pump",
  "Water Tank",
  "Packaging Machine",
];

const PRODUCTS_PER_PAGE = 12;

// ─── Client-side Search Engine (fallback) ──────────────────────────
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function scoreProduct(product: Product, queryTokens: string[], rawQuery: string): number {
  const getCategoryName = (cat: Product["category"]) =>
    typeof cat === "object" ? cat?.name || "" : cat || "";

  const nameTokens = tokenize(product.name);
  const categoryTokens = tokenize(getCategoryName(product.category));
  const tagTokens = tokenize((product.tags || []).join(" "));
  const companyTokens = tokenize(product.companyName || "");
  const locationTokens = tokenize([product.city, product.state].filter(Boolean).join(" "));
  const descTokens = tokenize(product.description || "");

  const nameStr = product.name.toLowerCase();
  const rawQ = rawQuery.toLowerCase();
  let score = 0;

  if (nameStr === rawQ) return 1000;
  if (nameStr.startsWith(rawQ)) score += 800;
  if (nameStr.includes(rawQ)) score += 500;
  if (categoryTokens.join(" ").includes(rawQ)) score += 300;

  for (const qToken of queryTokens) {
    if (qToken.length < 2) continue;
    if (nameTokens.some((t) => t.startsWith(qToken) || t.includes(qToken))) score += 100;
    if (categoryTokens.some((t) => t.startsWith(qToken) || t.includes(qToken))) score += 60;
    if (tagTokens.some((t) => t.startsWith(qToken) || t.includes(qToken))) score += 50;
    if (companyTokens.some((t) => t.startsWith(qToken) || t.includes(qToken))) score += 30;
    if (locationTokens.some((t) => t.startsWith(qToken) || t.includes(qToken))) score += 20;
    if (descTokens.some((t) => t.startsWith(qToken) || t.includes(qToken))) score += 10;
  }

  if (product.isVerified) score += 10;
  if ((product.averageRating || 0) >= 4) score += 5;

  return score;
}

// Server handles all filters (category, price, MOQ, rating, isVerified, allowSamples).
// Client only applies: search relevance scoring, location (city+state), and sort order.
function applyClientFilters(products: Product[], filters: Filters): Product[] {
  // Safety net: never show non-approved or inactive products on client side
  let result = products.filter((p: any) => p.status === "approved" && p.isActive !== false);

  // Search relevance scoring (server does text search; client re-ranks by score)
  if (filters.search.trim()) {
    const rawQuery = filters.search.trim();
    const queryTokens = tokenize(rawQuery);
    const scored = result
      .map((product) => ({ product, score: scoreProduct(product, queryTokens, rawQuery) }))
      .filter((s) => s.score > 0);
    scored.sort((a, b) => b.score - a.score);
    result = scored.map((s) => s.product);
  }

  // Location: server only filters by city; client also handles state
  if (filters.location.trim()) {
    const loc = filters.location.toLowerCase();
    result = result.filter(
      (p) => p.city?.toLowerCase().includes(loc) || p.state?.toLowerCase().includes(loc)
    );
  }

  // Sort (client-side for non-search results, server sorts searches by relevance)
  if (!filters.search.trim()) {
    switch (filters.sortBy) {
      case "price_low": result.sort((a, b) => a.price - b.price); break;
      case "price_high": result.sort((a, b) => b.price - a.price); break;
      case "rating": result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)); break;
      case "popular": result.sort((a, b) => (b.numReviews || b.totalReviews || 0) - (a.numReviews || a.totalReviews || 0)); break;
      default: break;
    }
  }

  return result;
}

function paginate(products: Product[], page: number): Product[] {
  const start = (page - 1) * PRODUCTS_PER_PAGE;
  return products.slice(start, start + PRODUCTS_PER_PAGE);
}

// ─── Main Content ───────────────────────────────────────────────────
function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalFromServer, setTotalFromServer] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || searchParams.get("q") || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<Filters>(() => ({
    search: searchParams.get("search") || searchParams.get("q") || "",
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    location: searchParams.get("location") || "",
    sortBy: searchParams.get("sortBy") || "newest",
    minRating: searchParams.get("minRating") || "",
    maxMOQ: searchParams.get("maxMOQ") || "",
    isVerified: searchParams.get("isVerified") || "",
    allowSamples: searchParams.get("allowSamples") || "",
  }));

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("recentSearches");
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  }, []);

  // Re-sync filters when URL search param changes (e.g. new search from navbar)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || searchParams.get("q") || "";
    setFilters((prev) => {
      if (prev.search === urlSearch) return prev;
      return { ...prev, search: urlSearch };
    });
    setSearchInput(urlSearch);
  }, [searchParams]);

  // Sync filters to URL
  const syncToURL = useCallback((f: Filters) => {
    const params = new URLSearchParams();
    if (f.search) params.set("search", f.search);
    if (f.category) params.set("category", f.category);
    if (f.minPrice) params.set("minPrice", f.minPrice);
    if (f.maxPrice) params.set("maxPrice", f.maxPrice);
    if (f.location) params.set("location", f.location);
    if (f.sortBy && f.sortBy !== "newest") params.set("sortBy", f.sortBy);
    if (f.minRating) params.set("minRating", f.minRating);
    if (f.maxMOQ) params.set("maxMOQ", f.maxMOQ);
    if (f.isVerified) params.set("isVerified", f.isVerified);
    if (f.allowSamples) params.set("allowSamples", f.allowSamples);
    const qs = params.toString();
    router.replace(`/products${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router]);

  // Fetch hierarchical categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories/tree");
        setCategories(res.data.data || []);
      } catch {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products from server with all active filters applied
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setCurrentPage(1);
      try {
        const hasSearch = filters.search.trim().length > 0;
        const params = new URLSearchParams();
        params.append("page", "1");
        params.append("limit", "200"); // large batch; client paginates at 12/page

        // Send all filter params to server — server is the single source of truth
        if (filters.category) params.set("category", filters.category);
        if (filters.minPrice) params.set("minPrice", filters.minPrice);
        if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
        if (filters.location) params.set("city", filters.location);
        if (filters.minRating) params.set("minRating", filters.minRating);
        if (filters.maxMOQ) params.set("maxMOQ", filters.maxMOQ);
        if (filters.isVerified) params.set("isVerified", filters.isVerified);
        if (filters.allowSamples) params.set("allowSamples", filters.allowSamples);

        const hasActiveFilters =
          filters.category || filters.minPrice || filters.maxPrice ||
          filters.location || filters.minRating || filters.maxMOQ ||
          filters.isVerified || filters.allowSamples;

        if (hasSearch) {
          params.set("q", filters.search.trim());
          if (filters.sortBy && filters.sortBy !== "relevance") params.set("sortBy", filters.sortBy);
          const url = `/products/search?${params.toString()}`;
          console.log("[Products] Search fetch:", url);
          const res = await api.get(url);
          const apiProducts = res.data?.data?.products || [];
          const serverTotal = res.data?.data?.pagination?.total || apiProducts.length;
          console.log("[Products] Search results:", apiProducts.length, "/ server total:", serverTotal);
          setProducts(apiProducts);
          setTotalFromServer(serverTotal);
        } else {
          if (filters.sortBy) params.set("sortBy", filters.sortBy);
          const url = `/products?${params.toString()}`;
          console.log("[Products] Listing fetch:", url);
          const res = await api.get(url);
          const apiProducts = res.data?.data?.products || [];
          const serverTotal = res.data?.data?.pagination?.total || apiProducts.length;
          console.log("[Products] Listing results:", apiProducts.length, "/ server total:", serverTotal);
          // Use DUMMY_PRODUCTS only when no filters are active AND db is genuinely empty
          setProducts(apiProducts.length > 0 ? apiProducts : hasActiveFilters ? [] : DUMMY_PRODUCTS);
          setTotalFromServer(apiProducts.length > 0 ? serverTotal : hasActiveFilters ? 0 : DUMMY_PRODUCTS.length);
        }
      } catch (err: any) {
        console.error("[Products] Fetch error:", err?.response?.data || err.message);
        setProducts(DUMMY_PRODUCTS);
        setTotalFromServer(DUMMY_PRODUCTS.length);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filters]);

  // Client-side: only search scoring, location filter, and sort (server handled all other filters)
  const filtered = useMemo(
    () => applyClientFilters(products, filters),
    [products, filters]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = paginate(filtered, currentPage);

  

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.location) count++;
    if (filters.sortBy !== "newest") count++;
    if (searchInput.trim()) count++;
    if (filters.minRating) count++;
    if (filters.maxMOQ) count++;
    if (filters.isVerified) count++;
    if (filters.allowSamples) count++;
    return count;
  }, [filters, searchInput]);

  const clearAllFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setSearchInput("");
    syncToURL(INITIAL_FILTERS);
  }, [syncToURL]);

  const updateFilter = useCallback(
    (key: keyof Filters, value: string) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      syncToURL(newFilters);
    },
    [filters, syncToURL]
  );

  const handleSearch = useCallback(() => {
    const newFilters = { ...filters, search: searchInput.trim() };
    setFilters(newFilters);
    syncToURL(newFilters);
    setShowSuggestions(false);

    // Save to recent searches
    if (searchInput.trim()) {
      setRecentSearches((prev) => {
        const updated = [searchInput.trim(), ...prev.filter((s) => s !== searchInput.trim())].slice(0, 5);
        localStorage.setItem("recentSearches", JSON.stringify(updated));
        return updated;
      });
    }
  }, [filters, searchInput, syncToURL]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const applyPricePreset = (preset: typeof PRICE_PRESETS[0]) => {
    const newFilters = { ...filters, minPrice: preset.min, maxPrice: preset.max };
    setFilters(newFilters);
    syncToURL(newFilters);
  };

  // Look up human-readable name for a category ObjectId
  const getCategoryDisplayName = useCallback((id: string): string => {
    if (!id) return "";
    for (const cat of categories) {
      if (cat._id === id) return cat.name;
      const sub = cat.subcategories?.find((s) => s._id === id);
      if (sub) return sub.name;
    }
    return id; // fallback: show raw id if not found yet (categories still loading)
  }, [categories]);

  // Get category display name
  const getCategoryName = (cat: Product["category"]) =>
    typeof cat === "object" ? cat?.name || "" : cat || "";

  // ── Render ──
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ── Search Bar ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, suppliers, categories..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-11 pr-20 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none transition"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <HiXMark className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleSearch}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[var(--primary)] text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-[var(--primary-dark)] transition"
              >
                Search
              </button>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && !searchInput.trim() && (recentSearches.length > 0 || TRENDING_SEARCHES.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 z-30 overflow-hidden">
                  {recentSearches.length > 0 && (
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <HiOutlineClock className="w-3.5 h-3.5" /> Recent Searches
                      </p>
                      <div className="space-y-1">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            onMouseDown={() => {
                              setSearchInput(term);
                              const newFilters = { ...filters, search: term };
                              setFilters(newFilters);
                              syncToURL(newFilters);
                            }}
                            className="w-full text-left px-2 py-1.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-[var(--primary)] rounded transition"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <HiOutlineSparkles className="w-3.5 h-3.5" /> Trending
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {TRENDING_SEARCHES.map((term) => (
                        <button
                          key={term}
                          onMouseDown={() => {
                            setSearchInput(term);
                            const newFilters = { ...filters, search: term };
                            setFilters(newFilters);
                            syncToURL(newFilters);
                          }}
                          className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:text-[var(--primary)] transition"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop: inline sort */}
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter("sortBy", e.target.value)}
              className="hidden md:block border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 transition ${viewMode === "grid" ? "bg-blue-50 text-[var(--primary)]" : "text-gray-400 hover:bg-gray-50"}`}
                title="Grid view"
              >
                <HiOutlineSquares2X2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 transition ${viewMode === "list" ? "bg-blue-50 text-[var(--primary)]" : "text-gray-400 hover:bg-gray-50"}`}
                title="List view"
              >
                <HiOutlineQueueList className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters(true)}
              className="md:hidden flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-3 rounded-lg text-sm font-semibold"
            >
              <HiOutlineAdjustmentsHorizontal className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="bg-white text-[var(--primary)] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filter Tags */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">
                Active filters ({activeFilterCount}):
              </span>
              {searchInput.trim() && (
                <FilterTag label={`"${searchInput}"`} onRemove={() => { setSearchInput(""); updateFilter("search", ""); }} />
              )}
              {filters.category && (
                <FilterTag label={getCategoryDisplayName(filters.category)} onRemove={() => updateFilter("category", "")} icon={<HiOutlineTag className="w-3 h-3" />} />
              )}
              {filters.minPrice && (
                <FilterTag label={`Min ₹${Number(filters.minPrice).toLocaleString("en-IN")}`} onRemove={() => updateFilter("minPrice", "")} icon={<HiOutlineCurrencyDollar className="w-3 h-3" />} />
              )}
              {filters.maxPrice && (
                <FilterTag label={`Max ₹${Number(filters.maxPrice).toLocaleString("en-IN")}`} onRemove={() => updateFilter("maxPrice", "")} icon={<HiOutlineCurrencyDollar className="w-3 h-3" />} />
              )}
              {filters.location && (
                <FilterTag label={filters.location} onRemove={() => updateFilter("location", "")} icon={<HiOutlineMapPin className="w-3 h-3" />} />
              )}
              {filters.minRating && (
                <FilterTag label={`${filters.minRating}★ & above`} onRemove={() => updateFilter("minRating", "")} icon={<HiOutlineStar className="w-3 h-3" />} />
              )}
              {filters.maxMOQ && (
                <FilterTag label={`MOQ ≤ ${filters.maxMOQ}`} onRemove={() => updateFilter("maxMOQ", "")} icon={<HiOutlineCubeTransparent className="w-3 h-3" />} />
              )}
              {filters.isVerified && (
                <FilterTag label="Verified Only" onRemove={() => updateFilter("isVerified", "")} icon={<HiOutlineShieldCheck className="w-3 h-3" />} />
              )}
              {filters.allowSamples && (
                <FilterTag label="Samples Available" onRemove={() => updateFilter("allowSamples", "")} />
              )}
              <button onClick={clearAllFilters} className="text-xs text-red-500 font-medium hover:text-red-700 hover:underline ml-1">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Body: Sidebar + Grid ── */}
        <div className="flex gap-6">
          {/* Sidebar Filters (Desktop) */}
          <FilterSidebar
            filters={filters}
            updateFilter={updateFilter}
            clearAll={clearAllFilters}
            activeCount={activeFilterCount}
            categories={categories}
            onPricePreset={applyPricePreset}
          />

          {/* Mobile Filter Drawer */}
          {showFilters && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
              <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-lg text-gray-800">Filters</h2>
                    <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded-md">
                      <HiXMark className="w-6 h-6 text-gray-500" />
                    </button>
                  </div>

                  <FilterControls
                    filters={filters}
                    updateFilter={updateFilter}
                    showSort={true}
                    categories={categories}
                    onPricePreset={applyPricePreset}
                  />

                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => { clearAllFilters(); setShowFilters(false); }}
                      className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="flex-1 bg-[var(--primary)] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--primary-dark)]"
                    >
                      Show Results
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Grid / List */}
          <div className="flex-1 min-w-0">
            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                    Searching...
                  </span>
                ) : (
                  <>
                    Showing <span className="font-semibold text-gray-700">{paginatedProducts.length}</span> of{" "}
                    <span className="font-semibold text-gray-700">{totalFromServer || filtered.length}</span> products
                    {filters.search.trim() && (
                      <span className="ml-1">for &quot;{filters.search.trim()}&quot;</span>
                    )}
                  </>
                )}
              </p>
            </div>

            {loading ? (
              <ProductGridSkeleton viewMode={viewMode} />
            ) : paginatedProducts.length > 0 ? (
              <>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {paginatedProducts.map((product) => {
                      const { category, ...rest } = product;
                      const categoryStr = typeof category === "object" ? category?.name || "" : category || "";
                      return <ProductCard key={product._id} {...rest} category={categoryStr} />;
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paginatedProducts.map((product) => (
                      <ListProductCard key={product._id} product={product} />
                    ))}
                  </div>
                )}

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
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((page, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <span key={page} className="flex items-center">
                            {prev && page - prev > 1 && <span className="px-2 text-gray-300">...</span>}
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
              <EmptyState onClear={clearAllFilters} category={getCategoryDisplayName(filters.category)} search={filters.search} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function FilterSidebar({
  filters,
  updateFilter,
  clearAll,
  activeCount,
  categories,
  onPricePreset,
}: {
  filters: Filters;
  updateFilter: (key: keyof Filters, value: string) => void;
  clearAll: () => void;
  activeCount: number;
  categories: Category[];
  onPricePreset: (preset: typeof PRICE_PRESETS[0]) => void;
}) {
  return (
    <aside className="hidden md:block w-64 shrink-0">
      <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <HiOutlineFunnel className="w-4 h-4" />
            Filters
            {activeCount > 0 && (
              <span className="text-[10px] bg-[var(--primary)] text-white px-1.5 py-0.5 rounded-full font-bold">
                {activeCount}
              </span>
            )}
          </h2>
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-xs text-red-500 font-medium hover:underline">
              Clear all
            </button>
          )}
        </div>

        <FilterControls
          filters={filters}
          updateFilter={updateFilter}
          showSort={false}
          categories={categories}
          onPricePreset={onPricePreset}
        />
      </div>
    </aside>
  );
}

function FilterControls({
  filters,
  updateFilter,
  showSort,
  categories,
  onPricePreset,
}: {
  filters: Filters;
  updateFilter: (key: keyof Filters, value: string) => void;
  showSort: boolean;
  categories: Category[];
  onPricePreset: (preset: typeof PRICE_PRESETS[0]) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Sort (mobile drawer only) */}
      {showSort && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sort By</h3>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter("sortBy", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Quick Toggles */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Filters</h3>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <div
            onClick={() => updateFilter("isVerified", filters.isVerified === "true" ? "" : "true")}
            className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative cursor-pointer ${
              filters.isVerified === "true" ? "bg-[var(--primary)]" : "bg-gray-200"
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              filters.isVerified === "true" ? "translate-x-4" : "translate-x-0"
            }`} />
          </div>
          <span className="text-sm text-gray-700 flex items-center gap-1.5">
            <HiOutlineShieldCheck className="w-4 h-4 text-blue-500" />
            Verified Sellers Only
          </span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <div
            onClick={() => updateFilter("allowSamples", filters.allowSamples === "true" ? "" : "true")}
            className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative cursor-pointer ${
              filters.allowSamples === "true" ? "bg-[var(--primary)]" : "bg-gray-200"
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              filters.allowSamples === "true" ? "translate-x-4" : "translate-x-0"
            }`} />
          </div>
          <span className="text-sm text-gray-700 flex items-center gap-1.5">
            <HiOutlineCubeTransparent className="w-4 h-4 text-orange-500" />
            Samples Available
          </span>
        </label>
      </div>

      {/* Category */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</h3>
        <select
          value={filters.category}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <optgroup key={cat._id} label={`${cat.icon || "📁"} ${cat.name}`}>
              {/* Send _id so backend uses isObjectId fast-path — no slug/name ambiguity */}
              <option value={cat._id}>All {cat.name}</option>
              {cat.subcategories?.map((sub) => (
                <option key={sub._id} value={sub._id}>&nbsp;&nbsp;{sub.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Price Range (₹)</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PRICE_PRESETS.map((preset) => {
            const isActive = filters.minPrice === preset.min && filters.maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                onClick={() => onPricePreset(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition font-medium ${
                  isActive
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-[var(--primary)]"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input type="number" placeholder="Min ₹" value={filters.minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            className="w-1/2 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none" />
          <input type="number" placeholder="Max ₹" value={filters.maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            className="w-1/2 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none" />
        </div>
      </div>

      {/* Minimum Order Quantity */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Min. Order Qty (MOQ)
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {MOQ_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => updateFilter("maxMOQ", filters.maxMOQ === preset.value ? "" : preset.value)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition font-medium ${
                filters.maxMOQ === preset.value
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-[var(--primary)]"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Minimum Rating</h3>
        <div className="space-y-1.5">
          {RATING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateFilter("minRating", filters.minRating === opt.value ? "" : opt.value)}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
                filters.minRating === opt.value
                  ? "bg-amber-50 border-amber-300 text-amber-700 font-medium"
                  : "bg-white border-gray-200 text-gray-600 hover:border-amber-200 hover:bg-amber-50"
              }`}
            >
              <span className="flex">
                {[1,2,3,4,5].map((s) => (
                  <HiOutlineStar key={s}
                    className={`w-3.5 h-3.5 ${s <= Number(opt.value) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                    style={{ fill: s <= Number(opt.value) ? "currentColor" : "none" }}
                  />
                ))}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Location</h3>
        <div className="relative">
          <HiOutlineMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="City or State"
            value={filters.location}
            onChange={(e) => updateFilter("location", e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function FilterTag({
  label,
  onRemove,
  icon,
}: {
  label: string;
  onRemove: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
      {icon}
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:text-blue-900">
        <HiXMark className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

// ─── List View Product Card ─────────────────────────────────────────
function ListProductCard({ product }: { product: Product }) {
  const getCategoryName = (cat: Product["category"]) =>
    typeof cat === "object" ? cat?.name || "" : cat || "";

  const categoryStr = getCategoryName(product.category);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
      {/* Image */}
      <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        <div className="w-full h-full relative">
          <ProductImage
            productId={product._id}
            title={product.name}
            category={categoryStr}
            existingImage={product.images?.[0]?.url}
          />
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              {getCategoryName(product.category) && (
                <span className="text-[10px] font-semibold text-[var(--primary)] bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {getCategoryName(product.category)}
                </span>
              )}
              <h3 className="font-semibold text-gray-800 mt-1 line-clamp-1 text-sm">
                {product.name}
              </h3>
            </div>
            {product.isVerified && (
              <span className="shrink-0 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                ✓ Verified
              </span>
            )}
          </div>
          {product.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-lg font-bold text-gray-800">
                ₹{product.price?.toLocaleString("en-IN")}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-xs text-gray-400 line-through ml-1.5">
                  ₹{product.comparePrice?.toLocaleString("en-IN")}
                </span>
              )}
              <span className="text-xs text-gray-400 ml-1">
                / {product.priceUnit || "Piece"}
              </span>
            </div>
            {product.minOrderQuantity && product.minOrderQuantity > 1 && (
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                MOQ: {product.minOrderQuantity}
              </span>
            )}
          </div>
          <Link
            href={`/products/${product._id}`}
            className="text-sm font-medium text-[var(--primary)] hover:underline"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onClear, category, search }: { onClear: () => void; category?: string; search?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 py-20 text-center px-6">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <HiMagnifyingGlass className="w-10 h-10 text-gray-300" />
      </div>
      <p className="text-xl font-bold text-gray-700 mb-2">No products found</p>
      {(category || search) && (
        <p className="text-sm text-gray-500 mb-1">
          {search && <>for &quot;<strong>{search}</strong>&quot;</>}
          {search && category && " in "}
          {category && <><strong>{category}</strong> category</>}
        </p>
      )}
      <p className="text-sm text-gray-400 mb-6">
        Try changing or removing filters to see more results
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onClear}
          className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--primary-dark)] transition"
        >
          Clear All Filters
        </button>
        <a
          href="/post-requirement"
          className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
        >
          Post Your Requirement
        </a>
      </div>
    </div>
  );
}

function ProductGridSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border animate-pulse p-4 flex gap-4">
            <div className="w-32 h-32 bg-gray-200 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="h-3 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-5 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border animate-pulse overflow-hidden">
          <div className="aspect-[4/3] bg-gray-200" />
          <div className="p-4 space-y-2.5">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-5 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page Export with Suspense ──────────────────────────────────────
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">
          Loading products...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
