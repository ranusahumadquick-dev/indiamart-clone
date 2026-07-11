"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/axios";
import { resolveImageUrl } from "@/lib/imageUrl";
import ProductCard from "@/components/ui/ProductCard";
import WishlistButton from "@/components/ui/WishlistButton";
import ProductImageGallery from "@/components/ProductImageGalleryPremium";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompare } from "@/contexts/CompareContext";
import { useBulkInquiry } from "@/contexts/BulkInquiryContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import RecentlyViewedSection from "@/components/ui/RecentlyViewedSection";
import ProductQA from "@/components/product/ProductQA";
import PriceAlertButton from "@/components/product/PriceAlertButton";
import SellerShortlistButton from "@/components/ui/SellerShortlistButton";
import ProductShare from "@/components/product/ProductShare";
import ProductChatButton from "@/components/chat/ProductChatButton";
import AdvancedProductDetailPage from "@/components/ProductDetail/AdvancedProductDetailPage";
import {
  HiOutlineMapPin,
  HiStar,
  HiOutlineStar,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineShieldCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineTruck,
  HiCheckBadge,
  HiMiniCheckCircle,
  HiOutlineCheckCircle,
  HiOutlineArrowLeft,
  HiOutlineBeaker,
  HiOutlineUser,
  HiOutlineArrowsRightLeft,
  HiOutlineShoppingCart,
  HiOutlineBolt,
} from "react-icons/hi2";

// ─── Types ──────────────────────────────────────────────────────────
interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  attributeValues: Record<string, string>;
  images: string[];
  thumbnail: string;
  price: number;
  originalPrice?: number;
  stock: number;
  moq: number;
  specifications: Array<{ label: string; value: string }>;
  available: boolean;
  badge?: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  priceUnit?: string;
  images: { url: string; alt?: string }[];
  city?: string;
  state?: string;
  companyName?: string;
  averageRating?: number;
  numReviews?: number;
  totalReviews?: number;
  minOrderQuantity?: number;
  stock?: number;
  tags?: string[];
  specifications?: { key: string; value: string }[];
  seller?: {
    _id: string;
    name: string;
    companyName?: string;
    city?: string;
    isVerified?: boolean;
    avgResponseTime?: number;
    image?: string;
  };
  category?: { name: string } | string;
  brand?: { _id: string; brandName: string; logo?: string; website?: string } | null;
  isVerified?: boolean;
  allowSamples?: boolean;
  samplePrice?: number;
  sampleMinQty?: number;
  sampleMaxQty?: number;
  sampleLeadTime?: string;
  // Variant support
  hasVariants?: boolean;
  variants?: ProductVariant[];
  variantTypes?: Array<{
    name: string;
    type: "swatch" | "button" | "dropdown";
    values: Array<{ label: string; value: string; hex?: string }>;
  }>;
}

// ─── Dummy Product Detail ───────────────────────────────────────────
const DUMMY_DETAIL: Product = {
  _id: "demo-detail-1",
  name: "Industrial Stainless Steel Pipe 304 Grade Seamless Tube for Construction & Industrial Use",
  description:
    "Premium quality 304 grade stainless steel seamless pipes suitable for high-pressure applications, chemical processing, oil & gas, food industry, and construction. Our pipes undergo rigorous quality testing including hydrostatic testing, eddy current testing, and chemical analysis to ensure compliance with ASTM A312 standards. Available in various sizes from 1/8\" to 24\" NB with wall thickness ranging from SCH 5S to SCH XXS. Surface finish options include BA, 2B, No.1, No.4, No.8 mirror, and hairline. Custom lengths and specifications available upon request.",
  price: 450,
  comparePrice: 600,
  priceUnit: "Meter",
  images: [
    { url: "https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=600&h=600&fit=crop", alt: "Steel Pipe Main" },
    { url: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&h=600&fit=crop", alt: "Steel Pipe Side" },
    { url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=600&fit=crop", alt: "Steel Pipe Factory" },
    { url: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=600&h=600&fit=crop", alt: "Steel Pipe Detail" },
  ],
  city: "Mumbai",
  state: "Maharashtra",
  companyName: "Shree Ganesh Steel Corp",
  averageRating: 4.5,
  numReviews: 128,
  minOrderQuantity: 50,
  stock: 5000,
  isVerified: true,
  tags: ["Stainless Steel", "304 Grade", "Seamless Pipe", "Industrial", "Construction"],
  specifications: [
    { key: "Grade", value: "SS 304 / 304L" },
    { key: "Type", value: "Seamless" },
    { key: "Outer Diameter", value: "1/8\" to 24\" NB" },
    { key: "Wall Thickness", value: "SCH 5S to SCH XXS" },
    { key: "Length", value: "6 Meters (Custom available)" },
    { key: "Standard", value: "ASTM A312 / ASME SA312" },
    { key: "Finish", value: "BA, 2B, No.1, No.4, Mirror" },
    { key: "Application", value: "Chemical, Oil & Gas, Food, Construction" },
  ],
  seller: {
    _id: "seller-1",
    name: "Rajesh Kumar",
    companyName: "Shree Ganesh Steel Corp",
    city: "Mumbai, Maharashtra",
    isVerified: true,
  },
};


// ─── Helpers ────────────────────────────────────────────────────────
function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }, (_, i) => {
        const diff = rating - i;
        return (
          <span key={i} className="relative">
            <HiOutlineStar className={`${dim} text-gray-300`} />
            {diff >= 1 && <HiStar className={`${dim} text-amber-400 absolute inset-0`} />}
            {diff >= 0.5 && diff < 1 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <HiStar className={`${dim} text-amber-400`} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

interface Review {
  _id: string;
  user: { name: string; avatar?: string };
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
}

// ─── Page Component ─────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { addProduct } = useRecentlyViewed();
  const { addItem: addToCompare, removeItem: removeFromCompare, isInCompare } = useCompare();
  const { addItem: addToBulk, removeItem: removeFromBulk, isInBulk } = useBulkInquiry();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [inquiryForm, setInquiryForm] = useState({
    message: "",
    quantity: "",
    subject: "",
  });

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [myReviewId, setMyReviewId] = useState<string | null>(null);

  // Chat
  const [startingChat, setStartingChat] = useState(false);

  const fetchProduct = async () => {
    try {
      const [productRes, relatedRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/products/related/${id}`),
      ]);
      const p = productRes.data.data;

      // 🔵 DEBUG: API Response Analysis
      console.log("🔵 [API RESPONSE] Full product:", p);
      console.log("🔵 [API RESPONSE] Images received:", p.images);
      console.log("🔵 [API RESPONSE] Images count:", p.images?.length || 0);
      console.log("🔵 [API RESPONSE] hasVariants:", p.hasVariants);
      console.log("🔵 [API RESPONSE] variants count:", p.variants?.length || 0);
      console.log("🔵 [API RESPONSE] variantTypes count:", p.variantTypes?.length || 0);
      console.log("🔵 [API RESPONSE] variants array:", p.variants);
      console.log("🔵 [API RESPONSE] variantTypes:", p.variantTypes);

      // Transform images to ensure they have url property
      console.log("🔄 [TRANSFORM] Raw API response:", { hasImages: !!p.images, imagesLength: p.images?.length, firstImage: p.images?.[0] });

      let processedImages: any[] = [];

      if (Array.isArray(p.images) && p.images.length > 0) {
        processedImages = p.images.map((img: any) => {
          return {
            url: resolveImageUrl(img.url || img),
            alt: img.alt || p.name,
            type: img.type || 'image',
            videoThumbnail: img.videoThumbnail
          };
        });
      }

      const transformedProduct = {
        ...p,
        images: processedImages
      };

      console.log("🔄 [TRANSFORM] Final images for component:", processedImages);
      console.log("🔄 [TRANSFORM] Product being set with", processedImages.length, "images");

      setProduct(transformedProduct);
      setRelated(relatedRes.data.data?.products || []);
      // Track recently viewed
      if (p) {
        addProduct({
          _id: p._id,
          name: p.name,
          price: p.price,
          comparePrice: p.comparePrice,
          images: p.images,
          city: p.city,
          state: p.state,
          companyName: p.companyName || p.seller?.companyName,
          averageRating: p.averageRating,
          numReviews: p.numReviews || p.totalReviews,
          minOrderQuantity: p.minOrderQuantity,
          priceUnit: p.priceUnit,
          isVerified: p.isVerified,
          category: typeof p.category === "string" ? p.category : p.category?.name,
        });
      }
    } catch (error: any) {
      console.error("Error fetching product:", error);
      const status = error?.response?.status;
      if (status === 404) {
        setProduct(null);
      } else {
        setProduct(DUMMY_DETAIL);
      }
      setRelated([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await api.get(`/reviews/${id}`);
      const list: Review[] = res.data?.data?.reviews || [];
      setReviews(list);
      if (user) {
        const mine = list.find((r) => {
          const userId = typeof r.user === 'string' ? r.user : (r.user as any)?._id;
          return userId === user._id;
        });
        if (mine) setMyReviewId(mine._id);
      }
    } catch { /* silent */ }
    finally { setReviewsLoading(false); }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) { toast.error("Please write a comment"); return; }
    setSubmittingReview(true);
    try {
      const res = await api.post(`/reviews/${id}`, reviewForm);
      const newReview = res.data.data;
      setReviews((prev) => [newReview, ...prev]);
      setMyReviewId(newReview._id);
      setReviewForm({ rating: 5, title: "", comment: "" });
      toast.success("Review submitted!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      setMyReviewId(null);
      toast.success("Review removed");
    } catch { toast.error("Failed to delete review"); }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to send inquiry");
      return;
    }
    if (!inquiryForm.message.trim()) {
      toast.error("Please describe your requirement");
      return;
    }
    try {
      await api.post(`/inquiries/${id}`, inquiryForm);
      toast.success("Inquiry sent successfully!");
      setInquiryForm({ message: "", quantity: "", subject: "" });
    } catch (error: any) {
      console.error("Inquiry error:", error);
      toast.error(error?.response?.data?.message || "Failed to send inquiry. Please try again.");
    }
  };

  const startChat = async () => {
    if (!isAuthenticated) { toast.error("Please login to chat"); return; }
    if (!product?.seller?._id) return;
    setStartingChat(true);
    try {
      await api.post("/messages/conversations", {
        sellerId: product.seller?._id,
        productId: product._id,
        message: `Hi, I'm interested in "${product.name}". Can you share more details?`,
      });
      toast.success("Conversation started! Open the chat widget.");
    } catch {
      toast.error("Failed to start chat");
    } finally {
      setStartingChat(false);
    }
  };

  // ── Loading Skeleton ──
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-10 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error Handling ──
  if (!id) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Product</h1>
        <p className="text-gray-500 mb-6">Product ID is missing.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Product not found</h1>
        <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
      </div>
    );
  }

  // ─── Use Advanced Variants System if Product Has Variants ───
  // 🔴 DEBUG: Variant Rendering Decision
  console.log("🔴 [RENDER CHECK] product.hasVariants:", product.hasVariants);
  console.log("🔴 [RENDER CHECK] product.variants:", product.variants);
  console.log("🔴 [RENDER CHECK] product.variants?.length:", product.variants?.length);
  console.log("🔴 [RENDER CHECK] variantTypes:", product.variantTypes);

  // 🔧 FIX: Check variants existence instead of hasVariants flag (flag may be missing/false)
  if (product.variants && product.variants.length > 0 && product.variantTypes && product.variantTypes.length > 0) {
    const advancedProduct = {
      id: product._id,
      name: product.name,
      category: typeof product.category === "string" ? product.category : product.category?.name || "Product",
      description: product.description,
      basePrice: product.price,
      averageRating: product.averageRating || 0,
      totalReviews: product.numReviews || product.totalReviews || 0,
      hasVariants: true, // Set to true since we've validated variants exist
      images: product.images || [], // 🖼️ ADD IMAGES HERE!
      seller: {
        id: product.seller?._id || "",
        name: product.seller?.name || "Unknown",
        companyName: product.seller?.companyName || product.companyName || "Unknown",
        verified: product.seller?.isVerified || product.isVerified || false,
        rating: product.averageRating || 0,
        responseTime: product.seller?.avgResponseTime ? `${product.seller.avgResponseTime}h` : "24h",
        location: [product.city, product.state].filter(Boolean).join(", ") || "India",
        image: product.seller?.image,
        phone: product.seller?.phone || product.seller?.whatsapp || "",
      },
      variants: product.variants,
      variantTypes: product.variantTypes || [],
      tags: product.tags || [],
      warranty: "1 Year",
      returnPolicy: "30 Days",
      deliveryInfo: "2-7 Days",
    };

    console.log("✅ [VARIANT PAGE] advancedProduct.images:", advancedProduct.images);

    console.log("✅ [VARIANT PAGE] Rendering AdvancedProductDetailPage with", product.variants?.length, "variants");

    return (
      <div className="bg-gray-50 min-h-screen">
        <AdvancedProductDetailPage
          product={advancedProduct}
          relatedProducts={related as any}
          onProductSwitch={(newProduct) => {
            setProduct({
              ...product,
              ...newProduct,
            } as any);
          }}
        />
      </div>
    );
  }

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  const location = [product.city, product.state].filter(Boolean).join(", ");
  const reviewCount = product.numReviews || product.totalReviews || 0;
  const sellerName = product.seller?.companyName || product.companyName || "Verified Seller";
  const sellerVerified = product.seller?.isVerified || product.isVerified || false;

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center text-sm text-gray-500 mb-3 gap-1.5">
          <Link href="/" className="hover:text-blue-600 transition">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-blue-600 transition">Products</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        {/* ── Main Content: 3-Column Professional B2B Layout ── */}
        <div className="grid lg:grid-cols-12 gap-4 lg:gap-6">
          {/* COLUMN 1: Product Media Gallery (40%) */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-6">
              {/* Alibaba-Style Product Gallery */}
              <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
                <ProductImageGallery images={product.images || []} />

                {/* Discount Badge */}
                {discount > 0 && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg z-10">
                    {discount}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 2: Product Information (35%) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              {/* Quick seller badge */}
              <p className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                {sellerVerified && <HiOutlineShieldCheck className="w-4 h-4 text-blue-500" />}
                {sellerName}
              </p>

              {/* Brand badge */}
              {product.brand && (
                <a href={`/brands/${product.brand._id}`}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-indigo-100 transition">
                  {product.brand.logo && (
                    <img src={product.brand.logo} alt={product.brand.brandName} className="w-4 h-4 rounded-full object-cover" />
                  )}
                  {product.brand.brandName}
                </a>
              )}

              {/* Title */}
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>

              {/* Rating - Compact Single Line */}
              {product.averageRating && product.averageRating > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <StarRating rating={product.averageRating} size="sm" />
                  <span className="font-semibold text-gray-800">{product.averageRating.toFixed(1)}</span>
                  <span className="text-gray-400">({reviewCount})</span>
                </div>
              )}

              {/* Price Box - Highlighted */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatINR(product.price)}
                  </span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatINR(product.comparePrice)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Per {product.priceUnit || "Piece"}
                </p>
                {discount > 0 && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    Save {formatINR(product.comparePrice! - product.price)} ({discount}% off)
                  </p>
                )}
              </div>

              {/* Quick Action Buttons - Single Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 px-2 py-1.5 rounded border border-gray-200 hover:border-red-300 hover:bg-red-50 transition cursor-pointer">
                  <WishlistButton productId={product._id} iconSize="w-4 h-4" />
                  <span className="text-xs text-gray-500">Save</span>
                </div>
                <button
                  onClick={() => {
                    const inC = isInCompare(product._id);
                    if (inC) {
                      removeFromCompare(product._id);
                      toast("Removed", { icon: "📊" });
                    } else {
                      const added = addToCompare({
                        _id: product._id, name: product.name, price: product.price,
                        comparePrice: product.comparePrice, images: product.images,
                        city: product.city, state: product.state, companyName: product.companyName,
                        averageRating: product.averageRating, numReviews: product.numReviews,
                        minOrderQuantity: product.minOrderQuantity, priceUnit: product.priceUnit,
                        isVerified: product.isVerified,
                        category: typeof product.category === "object" ? (product.category as any)?.name : product.category,
                      });
                      if (added) toast.success("Added to compare");
                      else toast.error("Compare limit: 4");
                    }
                  }}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded border text-xs transition ${
                    isInCompare(product._id)
                      ? "border-blue-400 bg-blue-50 text-blue-600"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-500"
                  }`}
                >
                  <HiOutlineArrowsRightLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const inB = isInBulk(product._id);
                    if (inB) {
                      removeFromBulk(product._id);
                      toast("Removed", { icon: "📋" });
                    } else {
                      const added = addToBulk({
                        _id: product._id, name: product.name, price: product.price,
                        priceUnit: product.priceUnit, images: product.images,
                      });
                      if (added) toast.success("Added to bulk inquiry");
                      else toast.error("Bulk inquiry full (max 10)");
                    }
                  }}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded border text-xs transition ${
                    isInBulk(product._id)
                      ? "border-orange-400 bg-orange-50 text-orange-600"
                      : "border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-500"
                  }`}
                >
                  <HiOutlineEnvelope className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Info Grid - 3 Items */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-blue-50 rounded p-2 border border-blue-200">
                  <span className="text-gray-600 block">Min Order</span>
                  <p className="font-semibold text-gray-900">{product.minOrderQuantity || "1"}</p>
                </div>
                <div className="bg-blue-50 rounded p-2 border border-blue-200">
                  <span className="text-gray-600 block">Stock</span>
                  <p className="font-semibold text-gray-900">{product.stock || "∞"}</p>
                </div>
                <div className="bg-blue-50 rounded p-2 border border-blue-200">
                  <span className="text-gray-600 block">Location</span>
                  <p className="font-semibold text-gray-900 truncate">{location.split(",")[0] || "India"}</p>
                </div>
              </div>

              {/* Description - Collapsible */}
              <details className="group">
                <summary className="cursor-pointer font-semibold text-gray-800 py-2 text-sm">
                  📝 Product Description
                </summary>
                <p className="text-sm text-gray-600 leading-relaxed mt-2">
                  {product.description}
                </p>
              </details>
            </div>

            {/* Specifications Table */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">📋 Specifications</h3>
                <div className="space-y-2 text-xs">
                  {product.specifications.slice(0, 6).map((spec, idx) => (
                    <div key={idx} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-gray-600 font-medium">{spec.key}</span>
                      <span className="text-gray-800 font-semibold text-right">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share Button */}
            <div>
              <ProductShare
                productId={product._id}
                productName={product.name}
                productPrice={product.price}
                productImage={product.images[0]?.url}
              />
            </div>
          </div>

          {/* COLUMN 3: Sticky Seller Card (25%) */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-6 space-y-3">
              {/* Seller Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                {/* Seller Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{sellerName}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <HiOutlineMapPin className="w-3 h-3" />
                      {location || "India"}
                    </p>
                  </div>
                  {sellerVerified && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                      ✓ Verified
                    </span>
                  )}
                </div>

                {/* Seller Stats */}
                <div className="space-y-1 py-2 border-t border-b border-gray-200 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-semibold text-gray-900">{product.averageRating?.toFixed(1) || "N/A"} ⭐</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time</span>
                    <span className="font-semibold text-gray-900">24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">On Platform</span>
                    <span className="font-semibold text-gray-900">2+ Years</span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="flex gap-2 text-xs">
                  <div className="flex items-center gap-1 bg-green-50 px-2 py-1.5 rounded border border-green-200 flex-1">
                    <HiMiniCheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700 font-medium">Verified</span>
                  </div>
                  <div className="flex items-center gap-1 bg-blue-50 px-2 py-1.5 rounded border border-blue-200 flex-1">
                    <HiOutlineTruck className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700 font-medium">Free Ship</span>
                  </div>
                </div>

                {/* Contact Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={startChat}
                    disabled={startingChat}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition text-sm flex items-center justify-center gap-2"
                  >
                    <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
                    {startingChat ? "Starting..." : "💬 Chat Now"}
                  </button>

                  <button
                    onClick={() => {
                      const element = document.getElementById("inquiry");
                      if (element) element.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 rounded-lg transition text-sm flex items-center justify-center gap-2"
                  >
                    <HiOutlineEnvelope className="w-4 h-4" />
                    📬 Send Inquiry
                  </button>

                  <button
                    className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition text-sm flex items-center justify-center gap-2"
                  >
                    <HiOutlinePhone className="w-4 h-4" />
                    ☎️ Call
                  </button>
                </div>
              </div>

              {/* Quick Inquiry Form */}
              <form id="inquiry" onSubmit={sendInquiry} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
                <h3 className="font-semibold text-gray-900 text-xs">Quick Inquiry</h3>
                <input
                  type="text"
                  placeholder="Subject..."
                  value={inquiryForm.subject}
                  onChange={(e) => setInquiryForm({...inquiryForm, subject: e.target.value})}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={inquiryForm.quantity}
                  onChange={(e) => setInquiryForm({...inquiryForm, quantity: e.target.value})}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <textarea
                  placeholder="Your message..."
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none h-16"
                />
                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-1.5 rounded-lg transition text-xs"
                >
                  Send Inquiry
                </button>
              </form>
            </div>
          </div>
        </div>


        {/* ── Mobile sticky order bar ── */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-3 py-2 flex gap-2 shadow-2xl">
          <Link
            href={`/checkout/sample?productId=${product._id}`}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-lg font-bold text-xs hover:opacity-90 transition"
          >
            <HiOutlineShoppingCart className="w-4 h-4" />
            Order
          </Link>
          <button
            onClick={() => {
              startChat();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 rounded-lg font-bold text-xs hover:opacity-90 transition"
          >
            <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
            Chat
          </button>
          <Link
            href="#inquiry"
            className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 text-white py-2.5 rounded-lg font-bold text-xs hover:bg-orange-600 transition"
          >
            <HiOutlineEnvelope className="w-4 h-4" />
            Inquiry
          </Link>
        </div>

        {/* ── Product Q&A ── */}
        {product && (
          <div className="mt-6">
            <ProductQA productId={product._id} sellerId={product.seller?._id} />
          </div>
        )}

        {/* ── Reviews ── */}
        <section className="mt-6" id="reviews">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              Ratings & Reviews
              {reviews.length > 0 && (
                <span className="text-base font-normal text-gray-400 ml-2">({reviews.length})</span>
              )}
            </h2>
            {product.averageRating ? (
              <div className="flex items-center gap-2">
                <StarRating rating={product.averageRating} size="sm" />
                <span className="text-sm font-semibold text-gray-700">{product.averageRating.toFixed(1)}</span>
              </div>
            ) : null}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Write Review Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
                {!isAuthenticated ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-3">Sign in to write a review</p>
                    <Link href="/auth/login" className="text-sm font-medium text-[var(--primary)] hover:underline">
                      Login
                    </Link>
                  </div>
                ) : myReviewId ? (
                  <div className="text-center py-4">
                    <HiOutlineCheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">You reviewed this product</p>
                    <button
                      onClick={() => deleteReview(myReviewId)}
                      className="text-xs text-red-500 hover:underline mt-2"
                    >
                      Remove my review
                    </button>
                  </div>
                ) : (
                  <form onSubmit={submitReview} className="space-y-3">
                    <h3 className="font-semibold text-gray-800 text-sm">Write a Review</h3>

                    {/* Star picker */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        >
                          {star <= reviewForm.rating ? (
                            <HiStar className="w-6 h-6 text-amber-400" />
                          ) : (
                            <HiOutlineStar className="w-6 h-6 text-gray-300" />
                          )}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Title (optional)"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
                    />
                    <textarea
                      required
                      rows={3}
                      placeholder="Share your experience with this product..."
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)] resize-none"
                    />
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full bg-[var(--primary)] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--primary-dark)] transition disabled:opacity-60"
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-4">
              {reviewsLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
                  <HiOutlineStar className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">No reviews yet. Be the first!</p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev._id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          {rev.user?.avatar ? (
                            <img src={rev.user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                          ) : (
                            <HiOutlineUser className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{rev.user?.name || "User"}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(rev.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={rev.rating} size="sm" />
                    </div>
                    {rev.title && <p className="text-sm font-medium text-gray-800 mb-1">{rev.title}</p>}
                    <p className="text-sm text-gray-600">{rev.comment}</p>
                    {rev._id === myReviewId && (
                      <button
                        onClick={() => deleteReview(rev._id)}
                        className="text-xs text-red-400 hover:text-red-600 mt-2 hover:underline"
                      >
                        Delete my review
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ── Recently Viewed ── */}
        <div className="mt-6">
          <RecentlyViewedSection excludeId={product?._id} maxItems={6} />
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">You May Also Like</h2>
              <Link
                href="/products"
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((p: any) => (
                <ProductCard
                  key={p._id}
                  {...p}
                  category={typeof p.category === "object" && p.category !== null ? p.category.name : p.category}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
