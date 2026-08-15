"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineTrash,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShieldCheck,
  HiOutlineMapPin,
  HiOutlineShoppingBag,
  HiStar,
  HiOutlineStar,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlinePlus,
  HiOutlineTag,
  HiOutlineBuildingOffice2,
} from "@/lib/icons";

// ── Types ─────────────────────────────────────────────────────────────
interface WishlistItem {
  _id: string;
  note: string;
  collectionName: string;
  createdAt: string;
  product: {
    _id: string;
    name: string;
    price: number;
    comparePrice?: number;
    images: { url: string; alt?: string }[];
    city?: string;
    state?: string;
    companyName?: string;
    averageRating?: number;
    numReviews?: number;
    minOrderQuantity?: number;
    priceUnit?: string;
    isVerified?: boolean;
    category?: string;
  };
}

interface SellerItem {
  _id: string;
  note: string;
  collectionName: string;
  createdAt: string;
  seller: {
    _id: string;
    name: string;
    companyName?: string;
    businessLogo?: string;
    businessDescription?: string;
    city?: string;
    state?: string;
    isVerified?: boolean;
    averageRating?: number;
    totalReviews?: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────
function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function StarRow({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>
          {i < Math.floor(rating) ? (
            <HiStar className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <HiOutlineStar className="w-3.5 h-3.5 text-gray-300" />
          )}
        </span>
      ))}
      {count != null && <span className="text-[11px] text-gray-400 ml-0.5">({count})</span>}
    </div>
  );
}

// ── Inline Note Editor ────────────────────────────────────────────────
function NoteEditor({
  itemId,
  initialNote,
  endpoint,
  onSave,
}: {
  itemId: string;
  initialNote: string;
  endpoint: string;
  onSave: (note: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialNote);

  const save = async () => {
    try {
      await api.patch(`${endpoint}/${itemId}/note`, { note: value });
      onSave(value);
      setEditing(false);
      toast.success("Note saved");
    } catch {
      toast.error("Failed to save note");
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-500 transition mt-1"
      >
        <HiOutlinePencil className="w-3 h-3" />
        {initialNote ? initialNote : "Add note…"}
      </button>
    );
  }

  return (
    <div className="mt-1 flex items-start gap-1">
      <textarea
        autoFocus
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Your private note…"
        maxLength={500}
        className="flex-1 text-[11px] border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400 resize-none"
      />
      <div className="flex flex-col gap-1">
        <button onClick={save} className="p-1 text-green-600 hover:text-green-700">
          <HiOutlineCheck className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => { setValue(initialNote); setEditing(false); }} className="p-1 text-gray-400 hover:text-gray-600">
          <HiOutlineXMark className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Collection Badge ──────────────────────────────────────────────────
function CollectionBadge({
  itemId,
  initialCollection,
  collections,
  endpoint,
  onSave,
}: {
  itemId: string;
  initialCollection: string;
  collections: string[];
  endpoint: string;
  onSave: (col: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newCol, setNewCol] = useState("");

  const save = async (col: string) => {
    try {
      await api.patch(`${endpoint}/${itemId}/note`, { collectionName: col || "All" });
      onSave(col || "All");
      setOpen(false);
      setNewCol("");
    } catch {
      toast.error("Failed to update collection");
    }
  };

  const allCols = Array.from(new Set(["All", ...collections])).filter(Boolean);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-100 transition"
      >
        <HiOutlineTag className="w-3 h-3" />
        {initialCollection || "All"}
      </button>
      {open && (
        <div className="absolute top-6 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[140px]">
          {allCols.map((c) => (
            <button
              key={c}
              onClick={() => save(c)}
              className={`block w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-50 ${initialCollection === c ? "font-semibold text-blue-600" : "text-gray-600"}`}
            >
              {c}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1 flex gap-1">
            <input
              value={newCol}
              onChange={(e) => setNewCol(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newCol.trim() && save(newCol.trim())}
              placeholder="New folder…"
              maxLength={50}
              className="flex-1 text-[11px] border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:border-blue-300"
            />
            <button
              onClick={() => newCol.trim() && save(newCol.trim())}
              className="text-blue-500 hover:text-blue-700"
            >
              <HiOutlinePlus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
function WishlistContent() {
  const [tab, setTab] = useState<"products" | "sellers">("products");
  const [products, setProducts] = useState<WishlistItem[]>([]);
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [productCollections, setProductCollections] = useState<string[]>([]);
  const [sellerCollections, setSellerCollections] = useState<string[]>([]);
  const [activeCollection, setActiveCollection] = useState("All");
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes, pcRes, scRes] = await Promise.allSettled([
        api.get("/wishlist"),
        api.get("/wishlist/sellers"),
        api.get("/wishlist/collections"),
        api.get("/wishlist/sellers/collections"),
      ]);
      if (pRes.status === "fulfilled") setProducts(pRes.value.data.data || []);
      if (sRes.status === "fulfilled") setSellers(sRes.value.data.data || []);
      if (pcRes.status === "fulfilled") setProductCollections(pcRes.value.data.data || []);
      if (scRes.status === "fulfilled") setSellerCollections(scRes.value.data.data || []);
    } catch {
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Reset collection filter when switching tabs
  const switchTab = (t: "products" | "sellers") => {
    setTab(t);
    setActiveCollection("All");
  };

  const removeProduct = async (productId: string) => {
    setRemoving(productId);
    try {
      await api.delete(`/wishlist/${productId}`);
      setProducts((prev) => prev.filter((i) => i.product._id !== productId));
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Failed to remove");
    } finally {
      setRemoving(null);
    }
  };

  const removeSeller = async (sellerId: string) => {
    setRemoving(sellerId);
    try {
      await api.delete(`/wishlist/sellers/${sellerId}`);
      setSellers((prev) => prev.filter((i) => i.seller._id !== sellerId));
      toast.success("Removed from shortlist");
    } catch {
      toast.error("Failed to remove");
    } finally {
      setRemoving(null);
    }
  };

  const clearAll = async () => {
    const label = tab === "products" ? "wishlist" : "supplier shortlist";
    if (!confirm(`Clear your entire ${label}?`)) return;
    try {
      if (tab === "products") {
        await api.delete("/wishlist");
        setProducts([]);
      } else {
        await api.delete("/wishlist/sellers");
        setSellers([]);
      }
      toast.success(`${tab === "products" ? "Wishlist" : "Shortlist"} cleared`);
    } catch {
      toast.error("Failed to clear");
    }
  };

  // Filter by collection
  const currentCollections = tab === "products" ? productCollections : sellerCollections;
  const visibleProducts = activeCollection === "All"
    ? products
    : products.filter((i) => i.collectionName === activeCollection);
  const visibleSellers = activeCollection === "All"
    ? sellers
    : sellers.filter((i) => i.collectionName === activeCollection);
  const count = tab === "products" ? visibleProducts.length : visibleSellers.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <HiHeart className="w-7 h-7 text-red-500" />
              My Shortlist
            </h1>
            {!loading && (
              <p className="text-sm text-gray-500 mt-0.5">{count} {tab === "products" ? "products" : "suppliers"} saved</p>
            )}
          </div>
          {count > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1.5 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition"
            >
              <HiOutlineTrash className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-5">
          <button
            onClick={() => switchTab("products")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${tab === "products" ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
          >
            <HiOutlineHeart className="w-4 h-4" />
            Saved Products
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "products" ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-500"}`}>
              {products.length}
            </span>
          </button>
          <button
            onClick={() => switchTab("sellers")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${tab === "sellers" ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
          >
            <HiOutlineBookmark className="w-4 h-4" />
            Saved Suppliers
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "sellers" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"}`}>
              {sellers.length}
            </span>
          </button>
        </div>

        {/* Collection Filter */}
        {currentCollections.length > 1 && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {["All", ...currentCollections.filter((c) => c !== "All")].map((col) => (
              <button
                key={col}
                onClick={() => setActiveCollection(col)}
                className={`text-xs px-3 py-1 rounded-full border transition ${activeCollection === col ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
              >
                {col}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 animate-pulse overflow-hidden">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && count === 0 && (
          <div className="text-center py-20">
            {tab === "products" ? (
              <>
                <HiOutlineHeart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No saved products yet</h2>
                <p className="text-gray-500 mb-6">Browse products and tap the heart icon to save them here.</p>
                <Link href="/products" className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[var(--primary-dark)] transition">
                  <HiOutlineShoppingBag className="w-5 h-5" /> Browse Products
                </Link>
              </>
            ) : (
              <>
                <HiOutlineBookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No saved suppliers yet</h2>
                <p className="text-gray-500 mb-6">Visit a supplier profile and click "Save Supplier" to add them here.</p>
                <Link href="/products" className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[var(--primary-dark)] transition">
                  <HiOutlineBuildingOffice2 className="w-5 h-5" /> Find Suppliers
                </Link>
              </>
            )}
          </div>
        )}

        {/* ── Products Grid ── */}
        {!loading && tab === "products" && visibleProducts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleProducts.map((item) => {
              const { product } = item;
              if (!product) return null;
              const discount = product.comparePrice && product.comparePrice > product.price
                ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
              const imageSrc = product.images?.[0]?.url || "/placeholder.svg";
              const location = [product.city, product.state].filter(Boolean).join(", ");

              return (
                <div key={product._id} className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col">
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    <Link href={`/products/${product._id}`}>
                      <Image src={imageSrc} alt={product.name} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized={imageSrc.startsWith("http")} />
                    </Link>
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{discount}% OFF</span>
                    )}
                    {product.isVerified && (
                      <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <HiOutlineShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                    <button
                      onClick={() => removeProduct(product._id)}
                      disabled={removing === product._id}
                      className="absolute bottom-2 right-2 bg-white/90 backdrop-blur p-1.5 rounded-full shadow hover:bg-red-50 transition"
                      title="Remove from wishlist"
                    >
                      {removing === product._id
                        ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        : <HiHeart className="w-4 h-4 text-red-500" />}
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-3 flex flex-col flex-1 gap-1">
                    {product.companyName && (
                      <p className="text-[11px] text-blue-600 font-semibold truncate">{product.companyName}</p>
                    )}
                    <Link href={`/products/${product._id}`}>
                      <h3 className="text-[13px] font-medium text-gray-800 line-clamp-2 leading-snug hover:text-blue-700 transition">{product.name}</h3>
                    </Link>
                    <div className="flex items-center gap-2 flex-wrap">
                      {product.category && (
                        <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{product.category}</span>
                      )}
                      <CollectionBadge
                        itemId={item._id}
                        initialCollection={item.collectionName}
                        collections={productCollections}
                        endpoint="/wishlist"
                        onSave={(col) => {
                          setProducts((prev) => prev.map((p) => p._id === item._id ? { ...p, collectionName: col } : p));
                          if (!productCollections.includes(col)) setProductCollections((prev) => [...prev, col]);
                        }}
                      />
                    </div>
                    <div className="mt-0.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-gray-900">{formatINR(product.price)}</span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="text-xs text-gray-400 line-through">{formatINR(product.comparePrice)}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">Per {product.priceUnit || "Piece"}</p>
                    </div>
                    {product.averageRating && product.averageRating > 0 ? (
                      <StarRow rating={product.averageRating} count={product.numReviews} />
                    ) : null}
                    {location && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <HiOutlineMapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{location}</span>
                      </div>
                    )}

                    {/* Note */}
                    <NoteEditor
                      itemId={item._id}
                      initialNote={item.note}
                      endpoint="/wishlist"
                      onSave={(note) => setProducts((prev) => prev.map((p) => p._id === item._id ? { ...p, note } : p))}
                    />

                    <div className="flex-1" />
                    <div className="flex gap-2 pt-2 mt-1 border-t border-gray-50">
                      <Link href={`/products/${product._id}`}
                        className="flex-1 text-center text-[12px] font-semibold text-blue-600 border border-blue-200 rounded-lg py-1.5 hover:bg-blue-50 transition">
                        View
                      </Link>
                      <Link href={`/products/${product._id}#inquiry`}
                        className="flex-1 flex items-center justify-center gap-1 text-[12px] font-semibold text-white bg-orange-500 rounded-lg py-1.5 hover:bg-orange-600 transition">
                        <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
                        Contact
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Sellers Grid ── */}
        {!loading && tab === "sellers" && visibleSellers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleSellers.map((item) => {
              const { seller } = item;
              if (!seller) return null;
              const initials = (seller.companyName || seller.name || "S").slice(0, 2).toUpperCase();
              const location = [seller.city, seller.state].filter(Boolean).join(", ");

              return (
                <div key={seller._id} className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 p-4 flex flex-col gap-3">
                  {/* Seller Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden">
                      {seller.businessLogo ? (
                        <img src={seller.businessLogo} alt={seller.companyName} className="w-full h-full object-cover" />
                      ) : initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-gray-800 truncate text-sm">{seller.companyName || seller.name}</h3>
                        {seller.isVerified && <HiOutlineShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />}
                      </div>
                      {location && (
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <HiOutlineMapPin className="w-3 h-3" />{location}
                        </p>
                      )}
                      {seller.averageRating && seller.averageRating > 0 ? (
                        <StarRow rating={seller.averageRating} count={seller.totalReviews} />
                      ) : null}
                    </div>
                    {/* Remove */}
                    <button
                      onClick={() => removeSeller(seller._id)}
                      disabled={removing === seller._id}
                      className="p-1.5 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition shrink-0"
                      title="Remove from shortlist"
                    >
                      {removing === seller._id
                        ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        : <HiBookmark className="w-4 h-4 text-blue-500" />}
                    </button>
                  </div>

                  {/* Description */}
                  {seller.businessDescription && (
                    <p className="text-[12px] text-gray-500 line-clamp-2">{seller.businessDescription}</p>
                  )}

                  {/* Collection + Note */}
                  <div className="flex items-center gap-2">
                    <CollectionBadge
                      itemId={item._id}
                      initialCollection={item.collectionName}
                      collections={sellerCollections}
                      endpoint="/wishlist/sellers"
                      onSave={(col) => {
                        setSellers((prev) => prev.map((s) => s._id === item._id ? { ...s, collectionName: col } : s));
                        if (!sellerCollections.includes(col)) setSellerCollections((prev) => [...prev, col]);
                      }}
                    />
                  </div>

                  <NoteEditor
                    itemId={item._id}
                    initialNote={item.note}
                    endpoint="/wishlist/sellers"
                    onSave={(note) => setSellers((prev) => prev.map((s) => s._id === item._id ? { ...s, note } : s))}
                  />

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-50 mt-auto">
                    <Link href={`/sellers/${seller._id}`}
                      className="flex-1 text-center text-[12px] font-semibold text-blue-600 border border-blue-200 rounded-lg py-2 hover:bg-blue-50 transition">
                      View Profile
                    </Link>
                    <Link href={`/sellers/${seller._id}#contact`}
                      className="flex-1 flex items-center justify-center gap-1 text-[12px] font-semibold text-white bg-orange-500 rounded-lg py-2 hover:bg-orange-600 transition">
                      <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
                      Contact
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WishlistPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "premium", "admin"]}>
      <WishlistContent />
    </ProtectedRoute>
  );
}
