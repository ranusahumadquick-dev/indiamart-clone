"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter as useNextRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { resolveImageUrl } from "@/lib/imageUrl";
import ProductChatButton from "@/components/chat/ProductChatButton";
import WishlistButton from "@/components/ui/WishlistButton";
import WriteReviewModal from "./WriteReviewModal";
import { useCompare } from "@/contexts/CompareContext";
import { useBulkInquiry } from "@/contexts/BulkInquiryContext";
import { useCart } from "@/contexts/CartContext";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import {
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineShoppingCart,
  HiOutlineArrowDownTray,
  HiOutlineStar,
  HiStar,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiMiniCheckCircle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowsRightLeft,
  HiOutlineXMark,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePaperAirplane,
} from "react-icons/hi2";

interface Specification {
  label: string;
  value: string;
}

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  attributeValues: Record<string, string>;
  images: string[];
  thumbnail: string;
  video?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  moq: number;
  specifications: Specification[];
  available: boolean;
  badge?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice?: number;
  price?: number;
  comparePrice?: number;
  priceMax?: number;
  averageRating: number;
  totalReviews: number;
  hasVariants?: boolean;
  seller: {
    id: string;
    name: string;
    companyName: string;
    verified: boolean;
    rating: number;
    responseTime: string;
    location: string;
    image?: string;
  };
  variants: ProductVariant[];
  variantTypes: Array<{
    name: string;
    type: "swatch" | "button" | "dropdown";
    values: Array<{ label: string; value: string; hex?: string }>;
  }>;
  tags: string[];
  warranty?: string;
  returnPolicy?: string;
  deliveryInfo?: string;
}

interface Props {
  product: Product;
  relatedProducts?: Product[];
  onProductSwitch?: (product: Product) => void;
}

export default function AdvancedProductDetailPage({
  product: initialProduct,
  relatedProducts = [],
  onProductSwitch,
}: Props) {
  const { addItem: addToCompare, removeItem: removeFromCompare, isInCompare } = useCompare();
  const { addItem: addToBulk, removeItem: removeFromBulk, isInBulk } = useBulkInquiry();
  const protect = useProtectedAction();

  // 🔍 DEBUG: Log initial product data
  useEffect(() => {
    console.log("🔍 [ProductDetail] Initial Product:", initialProduct.name);
    console.log("   hasVariants:", initialProduct.hasVariants);
    console.log("   product.images:", initialProduct.images);
    console.log("   product.images?.length:", initialProduct.images?.length || 0);
    console.log("   variantTypes:", initialProduct.variantTypes?.length || 0);
    console.log("   variants:", initialProduct.variants?.length || 0);
    if (initialProduct.variantTypes?.length > 0) {
      console.log("   variantTypes data:", JSON.stringify(initialProduct.variantTypes, null, 2));
    }
    if (initialProduct.variants?.length > 0) {
      console.log("   variants sample (first 2):", JSON.stringify(initialProduct.variants.slice(0, 2), null, 2));
    }
  }, [initialProduct]);

  const [product, setProduct] = useState<Product>(initialProduct);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    initialProduct.variants?.length > 0
      ? initialProduct.variants[0]
      : {
          id: 'default',
          sku: 'default',
          name: initialProduct.name,
          attributeValues: {},
          images: initialProduct.images || [],
          thumbnail: initialProduct.images?.[0]?.url || '',
          video: undefined,
          price: initialProduct.basePrice || initialProduct.price || 0,
          originalPrice: initialProduct.comparePrice || initialProduct.priceMax || initialProduct.basePrice || initialProduct.price || 0,
          stock: 1000,
          moq: initialProduct.minOrderQuantity || 1,
          specifications: [],
          available: true,
          badge: undefined,
        }
  );
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const nextRouter = useNextRouter();
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recentlySelected, setRecentlySelected] = useState<Array<Record<string, string>>>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeOrderTab, setActiveOrderTab] = useState<'wholesale' | 'customization'>('wholesale');
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isInlineInquirySending, setIsInlineInquirySending] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [customizationData, setCustomizationData] = useState({
    logoPrinting: false,
    oemOdm: false,
    customPackaging: false,
    specialRequirements: ''
  });

  // Customization form state
  const [customizationLogoFile, setCustomizationLogoFile] = useState<File | null>(null);
  const [customizationLogoPreview, setCustomizationLogoPreview] = useState<string>('');
  const [customizationAttachments, setCustomizationAttachments] = useState<File[]>([]);
  const [customizationUploadProgress, setCustomizationUploadProgress] = useState(0);
  const [isSubmittingCustomization, setIsSubmittingCustomization] = useState(false);
  const [customizationError, setCustomizationError] = useState<string>('');

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showZoomLens, setShowZoomLens] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const zoomLensRef = useRef<HTMLDivElement>(null);

  // Enhanced hover zoom with lens
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current) return;

    const rect = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });

    // Show zoom lens
    if (zoomLensRef.current) {
      const lensSize = 80;
      const lensX = e.clientX - rect.left - lensSize / 2;
      const lensY = e.clientY - rect.top - lensSize / 2;

      zoomLensRef.current.style.left = Math.max(0, Math.min(lensX, rect.width - lensSize)) + 'px';
      zoomLensRef.current.style.top = Math.max(0, Math.min(lensY, rect.height - lensSize)) + 'px';
    }
  };

  const handleMouseEnter = () => {
    setIsZoomed(true);
    setShowZoomLens(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
    setShowZoomLens(false);
  };

  const openLightbox = () => {
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = 'unset';
  };

  // Get display images - use variant images or fallback to product images
  const displayImages = useMemo(() => {
    // If variant has images, use them
    if (selectedVariant.images && Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0) {
      console.log("📸 [displayImages] Using variant images:", selectedVariant.images);
      return selectedVariant.images.filter((img: any) => img);
    }
    // Fallback to product images if variant has no images
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      console.log("📸 [displayImages] Using product images:", product.images);
      const processedImages = product.images.map((img: any) => {
        // Return full image object with type and videoThumbnail
        if (typeof img === 'string') {
          return { url: img, type: 'image' };
        }
        return {
          url: resolveImageUrl(img.url || img),
          type: img.type || 'image',
          videoThumbnail: img.videoThumbnail,
          alt: img.alt || product.name
        };
      });
      console.log("📸 [displayImages] Processed images:", processedImages);
      return processedImages;
    }
    // Return empty array as last resort
    console.log("📸 [displayImages] No images available!");
    return [];
  }, [selectedVariant.images, product.images]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'ArrowLeft') {
          setMainImageIndex(prev => (prev === 0 ? displayImages.length - 1 : prev - 1));
        } else if (e.key === 'ArrowRight') {
          setMainImageIndex(prev => (prev === displayImages.length - 1 ? 0 : prev + 1));
        } else if (e.key === 'Escape') {
          closeLightbox();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, displayImages.length]);

  // Save recently selected variant to localStorage
  const saveRecentVariant = useCallback((attributes: Record<string, string>) => {
    if (typeof window === "undefined") return;
    const key = `lastSelectedVariants_${product.id}`;
    let recent = JSON.parse(localStorage.getItem(key) || "[]");
    const attrStr = JSON.stringify(attributes);
    recent = recent.filter((item: string) => item !== attrStr);
    recent.unshift(attrStr);
    recent = recent.slice(0, 5);
    localStorage.setItem(key, JSON.stringify(recent));
    setRecentlySelected(recent.map((item: string) => JSON.parse(item)));
  }, [product.id]);

  // Initialize selected attributes from first variant and load recently selected
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      setSelectedVariant(firstVariant);
      setSelectedAttributes(firstVariant.attributeValues);
      console.log("✅ [ProductDetail] Initialized with first variant:", {
        sku: firstVariant.sku,
        name: firstVariant.name,
        price: firstVariant.price,
        attributeValues: firstVariant.attributeValues,
      });

      // Load recently selected variants
      if (typeof window !== "undefined") {
        const key = `lastSelectedVariants_${product.id}`;
        const recent = JSON.parse(localStorage.getItem(key) || "[]");
        setRecentlySelected(recent.map((item: string) => JSON.parse(item)));
      }
    } else {
      console.log("⚠️ [ProductDetail] No variants available for product:", product.name);
    }
  }, [product]);

  // Get available variants for each attribute
  const availableAttributeValues = useMemo(() => {
    const available: Record<string, Set<string>> = {};

    product.variantTypes.forEach((type) => {
      available[type.name] = new Set();
    });

    product.variants
      .filter((v) => v.available && v.stock > 0)
      .forEach((variant) => {
        Object.entries(variant.attributeValues).forEach(([key, value]) => {
          if (available[key]) {
            available[key].add(value);
          }
        });
      });

    return available;
  }, [product.variants, product.variantTypes]);

  // Get price range for each attribute value (for display)
  const attributePrices = useMemo(() => {
    const prices: Record<string, Record<string, { min: number; max: number }>> = {};

    product.variantTypes.forEach((type) => {
      prices[type.name] = {};
      type.values.forEach((val) => {
        const variantsWithValue = product.variants.filter(
          (v) => v.attributeValues[type.name] === val.label
        );
        if (variantsWithValue.length > 0) {
          const pricesForValue = variantsWithValue.map((v) => v.price);
          prices[type.name][val.label] = {
            min: Math.min(...pricesForValue),
            max: Math.max(...pricesForValue),
          };
        }
      });
    });

    return prices;
  }, [product.variants, product.variantTypes]);

  // Get stock status for each attribute value (for display)
  const attributeStock = useMemo(() => {
    const stock: Record<string, Record<string, { total: number; status: string }>> = {};

    product.variantTypes.forEach((type) => {
      stock[type.name] = {};
      type.values.forEach((val) => {
        const variantsWithValue = product.variants.filter(
          (v) => v.attributeValues[type.name] === val.label
        );
        if (variantsWithValue.length > 0) {
          const totalStock = variantsWithValue.reduce((sum, v) => sum + v.stock, 0);
          const status =
            totalStock === 0
              ? "Out of Stock"
              : totalStock <= 5
                ? "Limited Stock"
                : "In Stock";
          stock[type.name][val.label] = { total: totalStock, status };
        }
      });
    });

    return stock;
  }, [product.variants, product.variantTypes]);

  // Find variant by selected attributes
  const findVariant = useCallback(
    (attributes: Record<string, string>) => {
      console.log("🔎 [findVariant] Looking for variant with attributes:", attributes);
      const found = product.variants.find((v) => {
        const matches = Object.entries(attributes).every(
          ([key, value]) => {
            const variantAttrValue = v.attributeValues[key];
            console.log(`  Checking ${key}: "${value}" vs "${variantAttrValue}" = ${variantAttrValue === value}`);
            return variantAttrValue === value;
          }
        );
        return matches;
      });
      console.log("🔎 [findVariant] Result:", found?.sku || "NOT FOUND");
      return found;
    },
    [product.variants]
  );

  // Handle attribute selection
  const handleAttributeSelect = (attrName: string, value: string) => {
    console.log(`📌 [Variant] Selected ${attrName}: ${value}`);

    const newAttributes = { ...selectedAttributes, [attrName]: value };
    setSelectedAttributes(newAttributes);

    const variant = findVariant(newAttributes);
    console.log("🔍 [Variant] Found variant:", variant);

    if (variant) {
      setSelectedVariant(variant);
      setMainImageIndex(0);
      console.log("✅ [Variant] Variant updated:", {
        sku: variant.sku,
        price: variant.price,
        stock: variant.stock,
      });

      // Save to recently selected
      saveRecentVariant(newAttributes);

      // Update URL with variant params
      if (typeof window !== "undefined") {
        const params = new URLSearchParams();
        Object.entries(newAttributes).forEach(([key, val]) => {
          params.set(key.toLowerCase(), val.toLowerCase());
        });
        window.history.replaceState({}, "", `?${params.toString()}`);
      }

      // Smooth scroll to product
      if (typeof window !== "undefined") {
        const element = document.getElementById("product-detail");
        element?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      console.warn("⚠️ [Variant] No matching variant found for attributes:", newAttributes);
    }
  };

  // Handle product switching from related products
  const handleProductSwitch = (newProduct: Product) => {
    setLoading(true);
    setProduct(newProduct);

    // Only set variant if it exists
    if (newProduct.variants && newProduct.variants.length > 0) {
      setSelectedVariant(newProduct.variants[0]);
      setSelectedAttributes(newProduct.variants[0].attributeValues);
    } else {
      setSelectedVariant(undefined);
      setSelectedAttributes({});
    }

    setMainImageIndex(0);
    setQuantity(1);
    setLiked(false);

    setTimeout(() => {
      setLoading(false);
      onProductSwitch?.(newProduct);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 300);
  };

  const discount = selectedVariant.originalPrice
    ? Math.round(
        ((selectedVariant.originalPrice - selectedVariant.price) /
          selectedVariant.originalPrice) *
          100
      )
    : 0;

  const stockStatus =
    selectedVariant.stock > 10
      ? "In Stock"
      : selectedVariant.stock > 0
        ? "Limited Stock"
        : "Out of Stock";

  const stockColor =
    selectedVariant.stock > 10
      ? "text-green-600"
      : selectedVariant.stock > 0
        ? "text-orange-600"
        : "text-red-600";

  const stockBg =
    selectedVariant.stock > 10
      ? "bg-green-50"
      : selectedVariant.stock > 0
        ? "bg-orange-50"
        : "bg-red-50";

  function AddToCartButton({ variant, product }: { variant: ProductVariant; product: Product }) {
    const { addToCart } = useCart();

    return (
      <button
        onClick={() => {
          const added = addToCart({
            _id: product.id,
            name: product.name,
            price: variant.price,
            image: variant.images?.[0] || variant.thumbnail,
            variantId: variant.id,
          }, 1);
          if (added) {
            toast.success("Added to cart ✓");
          } else {
            toast.error("Cart is full (max 20 items)");
          }
        }}
        disabled={variant.stock === 0}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition text-xs ${
          variant.stock > 0
            ? "border-blue-400 hover:border-blue-500 hover:bg-blue-50 text-blue-600"
            : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
        }`}
        title={variant.stock === 0 ? "Out of stock" : "Add to cart"}
      >
        <HiOutlineShoppingCart className="w-4 h-4" />
        Add to Cart
      </button>
    );
  }

  // ────────────────────────────────────────────────────────────
  // CUSTOMIZATION FORM HANDLERS
  // ────────────────────────────────────────────────────────────

  const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
  const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFile = (file: File, maxSize: number, allowedTypes: string[]): string => {
    if (file.size > maxSize) {
      return `File size exceeds ${maxSize / (1024 * 1024)}MB limit`;
    }
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Allowed: PNG, JPG, PDF';
    }
    return '';
  };

  const handleCustomizationLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, MAX_LOGO_SIZE, ALLOWED_LOGO_TYPES);
    if (error) {
      setCustomizationError(error);
      return;
    }

    setCustomizationLogoFile(file);
    setCustomizationError('');

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomizationLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // PDF icon
      setCustomizationLogoPreview('');
    }
  };

  const handleCustomizationLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const error = validateFile(file, MAX_LOGO_SIZE, ALLOWED_LOGO_TYPES);
    if (error) {
      setCustomizationError(error);
      return;
    }

    setCustomizationLogoFile(file);
    setCustomizationError('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomizationLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCustomizationLogoPreview('');
    }
  };

  const handleCustomizationAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles: File[] = [];
    let hasError = false;

    files.forEach((file) => {
      const error = validateFile(file, MAX_LOGO_SIZE, [...ALLOWED_LOGO_TYPES, 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
      if (error) {
        setCustomizationError(`${file.name}: ${error}`);
        hasError = true;
      } else {
        validFiles.push(file);
      }
    });

    if (!hasError) {
      setCustomizationAttachments(validFiles);
      setCustomizationError('');
    }
  };

  const handleCustomizationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCustomizationError('');

    const formData = new FormData(e.currentTarget);
    const message = formData.get('message') as string;
    const quantity = formData.get('quantity') as string;

    // Validate required fields
    if (!message?.trim()) {
      setCustomizationError('Message is required');
      return;
    }
    if (!quantity || parseInt(quantity) < 1) {
      setCustomizationError('Quantity must be at least 1');
      return;
    }

    try {
      setIsSubmittingCustomization(true);

      const submitFormData = new FormData();
      console.log('📤 [Customization] Submitting request:', {
        productId: product.id,
        sellerId: product.seller.id,
        quantity,
        message,
        hasLogo: !!customizationLogoFile,
        attachmentCount: customizationAttachments.length,
      });

      submitFormData.append('productId', product.id);
      submitFormData.append('sellerId', product.seller.id);
      submitFormData.append('quantity', quantity);
      submitFormData.append('message', message);
      submitFormData.append('oemRequirement', formData.get('oem') || '');
      submitFormData.append('packagingRequirement', formData.get('packaging') || '');

      if (customizationLogoFile) {
        submitFormData.append('logo', customizationLogoFile);
      }

      customizationAttachments.forEach((file) => {
        submitFormData.append('attachment', file);
      });

      const response = await api.post('/customizations', submitFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setCustomizationUploadProgress(Math.round(progress));
          }
        },
      });

      if (response.data.success) {
        toast.success('Customization request submitted! We will contact you shortly.');
        setIsCustomizationModalOpen(false);

        // Reset form
        (e.target as HTMLFormElement).reset();
        setCustomizationLogoFile(null);
        setCustomizationLogoPreview('');
        setCustomizationAttachments([]);
        setCustomizationUploadProgress(0);
        setCustomizationError('');
      }
    } catch (error: any) {
      console.error('Customization submission error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to submit customization request';
      setCustomizationError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmittingCustomization(false);
      setCustomizationUploadProgress(0);
    }
  };

  return (
    <div id="product-detail" className="bg-white">
      {loading && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 shadow-xl">
            <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-6 py-6 lg:py-10">
        {/* Premium Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span className="hover:text-blue-600 cursor-pointer transition">Home</span>
          <span className="text-gray-400">/</span>
          <span className="hover:text-blue-600 cursor-pointer transition">{product.category}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-semibold truncate">{product.name}</span>
        </div>

        {/* HERO SECTION: Images + Product Info + Seller Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">

          {/* LEFT: Product Images Gallery (40%) */}
          <div className="lg:col-span-5">
            {/* Sticky Image Gallery Container */}
            <div className="space-y-4 lg:sticky lg:top-6">
                {/* Main Image with Premium Zoom & Fullscreen */}
            <div
              ref={mainImageRef}
              className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden border border-gray-300 group cursor-zoom-in shadow-lg"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={() => { if (displayImages[mainImageIndex]?.type !== 'video') openLightbox(); }}
            >
              {displayImages && displayImages.length > 0 && displayImages[mainImageIndex]?.type === 'video' ? (
                <video
                  key={displayImages[mainImageIndex].url}
                  src={displayImages[mainImageIndex].url}
                  controls
                  autoPlay={false}
                  className="w-full h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <Image
                  src={displayImages && displayImages.length > 0 ? (displayImages[mainImageIndex]?.url || displayImages[mainImageIndex]) : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f0f0f0' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"}
                  alt={selectedVariant?.name || product.name || `Product image ${mainImageIndex + 1}`}
                  fill
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f0f0f0' width='400' height='400'/%3E%3C/svg%3E";
                  }}
                  className={`object-contain transition-transform duration-300 ${
                    isZoomed ? "scale-150" : "scale-100"
                  }`}
                  style={
                    isZoomed
                      ? {
                          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        }
                      : {}
                  }
                  priority
                  quality={95}
                />
              )}

              {/* Zoom Lens - Premium Design */}
              {showZoomLens && isZoomed && (
                <div
                  ref={zoomLensRef}
                  className="absolute w-20 h-20 border-2 border-blue-500 rounded-lg pointer-events-none shadow-lg bg-white/5 backdrop-blur-sm"
                  style={{
                    transition: 'none',
                  }}
                />
              )}

              {/* Hover Zoom Indicator */}
              {!isZoomed && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="flex flex-col items-center gap-1">
                    <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                    </svg>
                    <span className="text-white text-xs font-medium drop-shadow">Hover to zoom</span>
                  </div>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {discount > 0 && (
                  <div className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                    -{discount}%
                  </div>
                )}
                {selectedVariant.badge && (
                  <div className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                    {selectedVariant.badge}
                  </div>
                )}
              </div>

              {/* Premium Image Counter - Top Right */}
              <div className="absolute top-3 right-3 bg-gradient-to-r from-gray-900/90 to-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-white/20 flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-4 h-4 bg-white/20 rounded-full text-xs">{mainImageIndex + 1}</span>
                <span className="text-gray-300">/</span>
                <span>{displayImages.length}</span>
              </div>

              {/* Stock Badge */}
              <div
                className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-lg ${stockBg} ${stockColor}`}
              >
                {selectedVariant.stock > 0 ? (
                  <HiOutlineCheckCircle className="w-4 h-4" />
                ) : (
                  <HiOutlineExclamationTriangle className="w-4 h-4" />
                )}
                {stockStatus}
              </div>

              {/* Click to Fullscreen Indicator */}
              <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2.5 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                💡 Click for fullscreen
              </div>

              {/* Navigation Arrows for multiple images */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMainImageIndex(prev => (prev === 0 ? displayImages.length - 1 : prev - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-black/60 to-black/40 hover:from-black/80 hover:to-black/60 text-white p-2.5 rounded-full transition-all duration-200 z-10 shadow-lg hover:shadow-xl opacity-0 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <HiOutlineChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMainImageIndex(prev => (prev === displayImages.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-black/40 to-black/60 hover:from-black/60 hover:to-black/80 text-white p-2.5 rounded-full transition-all duration-200 z-10 shadow-lg hover:shadow-xl opacity-0 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <HiOutlineChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Premium Thumbnail Gallery - Click to Change Variant */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {/* Product images - Click to cycle through variants */}
              {displayImages.map((img, idx) => (
                <button
                  key={`current-${idx}`}
                  onClick={() => {
                    setMainImageIndex(idx);
                  }}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all duration-200 cursor-pointer group relative ${
                    mainImageIndex === idx
                      ? "border-blue-600 shadow-lg ring-2 ring-blue-300"
                      : "border-gray-300 hover:border-blue-400 shadow-sm hover:shadow-md"
                  }`}
                  title={`Click to view ${img?.type === 'video' ? 'video' : 'image'} ${idx + 1}`}
                  aria-label={`Select ${img?.type === 'video' ? 'video' : 'image'} ${idx + 1}`}
                >
                  {img?.type === 'video' ? (
                    <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      <span className="text-white text-[9px] mt-1">Video</span>
                    </div>
                  ) : (
                    <Image
                      src={resolveImageUrl(img?.url || img)}
                      alt={img?.alt || `View ${idx + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23f0f0f0' width='80' height='80'/%3E%3C/svg%3E";
                      }}
                    />
                  )}
                  {/* Video Play Icon overlay - only when image type but showing a video indicator */}
                  {img?.type === 'video' && false && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition">
                      <svg className="w-5 h-5 text-white group-hover:scale-125 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  )}
                  {/* Active Indicator Badge */}
                  {mainImageIndex === idx && (
                    <div className="absolute top-1 right-1 bg-blue-600 rounded-full w-2 h-2 shadow-md"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Video Support */}
            {selectedVariant.video && (
              <div className="w-full aspect-video bg-gray-900 rounded-xl overflow-hidden">
                <video
                  src={selectedVariant.video}
                  controls
                  className="w-full h-full"
                />
              </div>
            )}
            </div>
          </div>

          {/* CENTER: Product Information (35%) */}
          <div className="lg:col-span-4 space-y-6">
            {/* WHOLESALE & CUSTOMIZATION TABS - Alibaba Style */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveOrderTab('wholesale')}
                  className={`pb-2 font-semibold text-base transition-all border-b-2 ${
                    activeOrderTab === 'wholesale'
                      ? 'text-gray-900 border-orange-500'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  Wholesale
                </button>

                <button
                  onClick={() => setActiveOrderTab('customization')}
                  className={`pb-2 font-semibold text-base transition-all border-b-2 ${
                    activeOrderTab === 'customization'
                      ? 'text-gray-900 border-orange-500'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  Customization
                </button>
              </div>
            </div>

            {/* CUSTOMIZATION TAB - Features & Action Section */}
            {activeOrderTab === 'customization' && (
              <div className="space-y-4">
                {/* Customization Available Badge */}
                <div className="inline-block">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    ✓ Customization Available
                  </span>
                </div>

                {/* Customization Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-xl p-6">
                  {/* Logo Printing Feature */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🏷️</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Logo Printing</p>
                      <p className="text-xs text-gray-600 mt-1">Add your company logo</p>
                    </div>
                  </div>

                  {/* OEM/ODM Feature */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">⚙️</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">OEM/ODM Support</p>
                      <p className="text-xs text-gray-600 mt-1">Custom manufacturing</p>
                    </div>
                  </div>

                  {/* Custom Packaging Feature */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">📦</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Custom Packaging</p>
                      <p className="text-xs text-gray-600 mt-1">Design your packaging</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PREMIUM TITLE SECTION */}
            <div className="border-b border-gray-200 pb-6">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 leading-tight">
                {product.name}
              </h1>

              {/* Variant Subtitle */}
              {selectedVariant.name && selectedVariant.name !== product.name && (
                <p className="text-base text-gray-600 mb-4 font-medium">
                  {selectedVariant.name}
                </p>
              )}

              {/* Rating Stars with Review Count */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i}>
                        {i < Math.round(product.averageRating) ? (
                          <HiStar className="w-5 h-5 text-amber-400" />
                        ) : (
                          <HiOutlineStar className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-900">{product.averageRating.toFixed(1)}</span>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                  {product.totalReviews} Reviews
                </button>
              </div>
            </div>

            {/* PREMIUM PRICING SECTION */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-200 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-bold text-gray-900">
                    ₹{(selectedVariant?.price || product.basePrice || product.price).toLocaleString("en-IN")}
                  </span>
                  {(selectedVariant?.originalPrice || product.comparePrice || product.priceMax) && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-gray-500 line-through">
                        ₹{(selectedVariant?.originalPrice || product.comparePrice || product.priceMax).toLocaleString("en-IN")}
                      </span>
                      {discount > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-sm">
                          {discount}% OFF
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {discount > 0 && (
                  <p className="text-base text-green-600 font-semibold">
                    Save ₹{(selectedVariant.originalPrice! - selectedVariant.price).toLocaleString("en-IN")}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  Per {product.priceUnit || "Unit"}
                </p>
              </div>
            </div>

            {/* MOQ & AVAILABILITY SECTION */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Min. Order</p>
                <p className="text-2xl font-bold text-gray-900">{selectedVariant?.moq || product.minOrderQuantity || 1}</p>
                <p className="text-xs text-gray-500 mt-1">Units</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Availability</p>
                <p className={`text-2xl font-bold ${selectedVariant?.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedVariant?.stock > 0 ? '✓ In Stock' : 'Out of Stock'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{selectedVariant?.stock || 0} units</p>
              </div>
            </div>

            {/* PRODUCT HIGHLIGHTS SECTION */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Product Highlights</h3>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-lg mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">Premium Quality Materials</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-lg mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">Fast & Free Shipping</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-lg mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">Bulk Orders Accepted</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-lg mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">Verified & Certified</span>
                </div>
              </div>
            </div>

            {/* QUICK ACTION BUTTONS */}
            <div className="flex items-center gap-2">
              <AddToCartButton variant={selectedVariant} product={product} />
              <div className="flex items-center gap-1 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition cursor-pointer">
                <WishlistButton productId={product.id} iconSize="w-4 h-4" />
                <span className="text-xs text-gray-600 font-medium">Save</span>
              </div>
              <button
                onClick={() => {
                  const inC = isInCompare(product.id);
                  if (inC) {
                    removeFromCompare(product.id);
                    toast("Removed from compare", { icon: "📊" });
                  } else if (selectedVariant) {
                    const added = addToCompare({
                      _id: product.id,
                      name: product.name,
                      price: selectedVariant.price,
                      comparePrice: selectedVariant.originalPrice,
                      images: [{ url: selectedVariant.images?.[0] || selectedVariant.thumbnail, alt: product.name }],
                      city: product.seller.location.split(",")[0],
                      state: product.seller.location.split(",")[1],
                      companyName: product.seller.companyName,
                      averageRating: product.averageRating,
                      numReviews: product.totalReviews,
                      minOrderQuantity: selectedVariant.moq,
                      priceUnit: product.category,
                      isVerified: product.seller.verified,
                      category: product.category,
                    });
                    if (added) toast.success("Added to compare");
                    else toast.error("Compare limit is 4 products");
                  }
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition text-xs ${
                  isInCompare(product.id)
                    ? "border-blue-400 bg-blue-50 text-blue-600"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-500"
                }`}
              >
                <HiOutlineArrowsRightLeft className="w-4 h-4" />
                Compare
              </button>
              <button
                onClick={() => {
                  const inB = isInBulk(product.id);
                  if (inB) {
                    removeFromBulk(product.id);
                    toast("Removed from bulk inquiry", { icon: "📋" });
                  } else {
                    const added = addToBulk({
                      _id: product.id,
                      name: product.name,
                      price: selectedVariant.price,
                      priceUnit: product.category,
                      images: [{ url: selectedVariant.images?.[0] || selectedVariant.thumbnail, alt: product.name }],
                    });
                    if (added) toast.success("Added to bulk inquiry");
                    else toast.error("Bulk inquiry is full (max 10)");
                  }
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition text-xs ${
                  isInBulk(product.id)
                    ? "border-orange-400 bg-orange-50 text-orange-600"
                    : "border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-500"
                }`}
              >
                <HiOutlineEnvelope className="w-4 h-4" />
                Bulk Inquiry
              </button>
            </div>

            {/* Variant Selectors - Show if variantTypes exist */}
            {product.variantTypes && product.variantTypes.length > 0 && (
              <div className="space-y-3 border-t border-b border-gray-200 py-3">
                {console.log("🎨 [ProductDetail] Rendering variants for:", product.name, "Count:", product.variantTypes.length)}
                {product.variantTypes.map((variantType) => (
                <div key={variantType.name}>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    {variantType.name}
                  </label>

                  {variantType.type === "swatch" ? (
                    // Swatch Display
                    <div className="flex flex-wrap gap-3">
                      {variantType.values.map((value) => (
                        <button
                          key={value.value}
                          onClick={() =>
                            handleAttributeSelect(variantType.name, value.label)
                          }
                          disabled={!availableAttributeValues[variantType.name]?.has(value.label)}
                          className={`group relative flex items-center justify-center transition-all ${
                            selectedAttributes[variantType.name] === value.label
                              ? "ring-2 ring-blue-500 ring-offset-2"
                              : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-1"
                          } ${
                            !availableAttributeValues[variantType.name]?.has(value.label)
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        >
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                            style={{ backgroundColor: value.hex || "#E5E7EB" }}
                          />
                          {!availableAttributeValues[variantType.name]?.has(value.value) && (
                            <div className="absolute inset-0 rounded-lg bg-black/20" />
                          )}
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs py-1 px-3 rounded z-10">
                            <div className="font-semibold whitespace-nowrap">{value.label}</div>
                            {attributePrices[variantType.name]?.[value.label] && (
                              <div className="text-gray-300 whitespace-nowrap">
                                ₹{attributePrices[variantType.name][value.label].min}
                                {attributePrices[variantType.name][value.label].max !==
                                  attributePrices[variantType.name][value.label].min &&
                                  ` - ₹${attributePrices[variantType.name][value.label].max}`}
                              </div>
                            )}
                            {attributeStock[variantType.name]?.[value.label] && (
                              <div
                                className={`whitespace-nowrap text-xs font-semibold mt-1 ${
                                  attributeStock[variantType.name][value.label].status === "Out of Stock"
                                    ? "text-red-400"
                                    : attributeStock[variantType.name][value.label].status === "Limited Stock"
                                      ? "text-yellow-400"
                                      : "text-green-400"
                                }`}
                              >
                                {attributeStock[variantType.name][value.label].total} {attributeStock[variantType.name][value.label].status === "Out of Stock" ? "Out of Stock" : "pcs"}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : variantType.type === "button" ? (
                    // Button Display
                    <div className="flex flex-wrap gap-2">
                      {variantType.values.map((value) => (
                        <div key={value.value} className="group relative">
                          <button
                            onClick={() =>
                              handleAttributeSelect(variantType.name, value.label)
                            }
                            disabled={!availableAttributeValues[variantType.name]?.has(value.label)}
                            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all text-sm ${
                              selectedAttributes[variantType.name] === value.label
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                            } ${
                              !availableAttributeValues[variantType.name]?.has(value.label)
                                ? "opacity-50 cursor-not-allowed line-through"
                                : "cursor-pointer"
                            }`}
                          >
                            {value.label}
                          </button>
                          {/* Tooltip with Price & Stock */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs py-1 px-2 rounded z-10 whitespace-nowrap">
                            {attributePrices[variantType.name]?.[value.label] && (
                              <div className="text-gray-300">
                                ₹{attributePrices[variantType.name][value.label].min}
                                {attributePrices[variantType.name][value.label].max !==
                                  attributePrices[variantType.name][value.label].min &&
                                  ` - ₹${attributePrices[variantType.name][value.label].max}`}
                              </div>
                            )}
                            {attributeStock[variantType.name]?.[value.label] && (
                              <div
                                className={`text-xs font-semibold ${
                                  attributeStock[variantType.name][value.label].status === "Out of Stock"
                                    ? "text-red-400"
                                    : attributeStock[variantType.name][value.label].status === "Limited Stock"
                                      ? "text-yellow-400"
                                      : "text-green-400"
                                }`}
                              >
                                {attributeStock[variantType.name][value.label].total} {attributeStock[variantType.name][value.label].status === "Out of Stock" ? "Out of Stock" : "pcs"}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Dropdown Display
                    <select
                      value={selectedAttributes[variantType.name] || ""}
                      onChange={(e) =>
                        handleAttributeSelect(variantType.name, e.target.value)
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    >
                      <option value="">Select {variantType.name}</option>
                      {variantType.values.map((value) => (
                        <option
                          key={value.value}
                          value={value.label}
                          disabled={!availableAttributeValues[variantType.name]?.has(value.label)}
                        >
                          {value.label}
                          {!availableAttributeValues[variantType.name]?.has(value.label) &&
                            " (Unavailable)"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
              </div>
            )}

            {/* Detailed Specifications Table - Below Product Description */}
            {selectedVariant?.specifications && selectedVariant.specifications.length > 0 && (
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Specifications</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      {selectedVariant.specifications.map((spec, idx) => {
                        const label = spec.label || spec.key || "Property";
                        const value = spec.value || "—";
                        return (
                          <tr
                            key={idx}
                            className={`border-b border-gray-200 ${
                              idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                            } hover:bg-blue-50 transition text-sm`}
                          >
                            <td className="px-4 py-2 font-semibold text-gray-900 w-2/5 break-words">
                              {label}
                            </td>
                            <td className="px-4 py-2 text-gray-700 w-3/5 break-words">{value}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 🚫 REMOVED: Hardcoded Material/Style variants - using database variantTypes instead */}
            {/* Material Variants - Only for Textiles & Apparel */}
            {false && product.category === "Textiles & Apparel" && (
              <div className="space-y-3 border-t border-b border-gray-200 py-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Material
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Cotton", icon: "🧵" },
                      { label: "Leather", icon: "🎒" },
                      { label: "Silk", icon: "✨" },
                      { label: "Wool", icon: "🧶" },
                      { label: "Polyester", icon: "🧬" },
                    ].map((material) => (
                      <div key={material.label} className="group relative">
                        <button
                          onClick={() => handleAttributeSelect("Material", material.label)}
                          className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all text-sm flex items-center gap-2 ${
                            selectedAttributes["Material"] === material.label
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          <span>{material.icon}</span>
                          {material.label}
                        </button>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs py-1 px-2 rounded z-10 whitespace-nowrap">
                          {attributePrices["Material"]?.[material.label] && (
                            <div className="text-gray-300">
                              ₹{attributePrices["Material"][material.label].min}
                              {attributePrices["Material"][material.label].max !==
                                attributePrices["Material"][material.label].min &&
                                ` - ₹${attributePrices["Material"][material.label].max}`}
                            </div>
                          )}
                          {attributeStock["Material"]?.[material.label] && (
                            <div
                              className={`text-xs font-semibold ${
                                attributeStock["Material"][material.label].status === "Out of Stock"
                                  ? "text-red-400"
                                  : attributeStock["Material"][material.label].status === "Limited Stock"
                                    ? "text-yellow-400"
                                    : "text-green-400"
                              }`}
                            >
                              {attributeStock["Material"][material.label].total} {attributeStock["Material"][material.label].status === "Out of Stock" ? "Out of Stock" : "pcs"}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Style Variants */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Style
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Modern", icon: "✨" },
                      { label: "Classic", icon: "👑" },
                      { label: "Casual", icon: "👕" },
                      { label: "Premium", icon: "💎" },
                    ].map((style) => (
                      <div key={style.label} className="group relative">
                        <button
                          onClick={() => handleAttributeSelect("Style", style.label)}
                          className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all text-sm flex items-center gap-2 ${
                            selectedAttributes["Style"] === style.label
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          <span>{style.icon}</span>
                          {style.label}
                        </button>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs py-1 px-2 rounded z-10 whitespace-nowrap">
                          {attributePrices["Style"]?.[style.label] && (
                            <div className="text-gray-300">
                              ₹{attributePrices["Style"][style.label].min}
                              {attributePrices["Style"][style.label].max !==
                                attributePrices["Style"][style.label].min &&
                                ` - ₹${attributePrices["Style"][style.label].max}`}
                            </div>
                          )}
                          {attributeStock["Style"]?.[style.label] && (
                            <div
                              className={`text-xs font-semibold ${
                                attributeStock["Style"][style.label].status === "Out of Stock"
                                  ? "text-red-400"
                                  : attributeStock["Style"][style.label].status === "Limited Stock"
                                    ? "text-yellow-400"
                                    : "text-green-400"
                              }`}
                            >
                              {attributeStock["Style"][style.label].total} {attributeStock["Style"][style.label].status === "Out of Stock" ? "Out of Stock" : "pcs"}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 🚫 REMOVED: Hardcoded Size variants - using database variantTypes instead */}
            {/* Size Variants - Only for Textiles & Apparel */}
            {false && product.category === "Textiles & Apparel" && (
            <div className="space-y-3 border-t border-b border-gray-200 py-3">
              {/* Standard Sizes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Standard Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {["S", "M", "L", "XL", "XXL"].map((size) => (
                    <div key={size} className="group relative">
                      <button
                        onClick={() => handleAttributeSelect("Size", size)}
                        className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all text-sm ${
                          selectedAttributes["Size"] === size
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {size}
                      </button>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs py-1 px-2 rounded z-10 whitespace-nowrap">
                        {attributePrices["Size"]?.[size] && (
                          <div className="text-gray-300">
                            ₹{attributePrices["Size"][size].min}
                            {attributePrices["Size"][size].max !==
                              attributePrices["Size"][size].min &&
                              ` - ₹${attributePrices["Size"][size].max}`}
                          </div>
                        )}
                        {attributeStock["Size"]?.[size] && (
                          <div
                            className={`text-xs font-semibold ${
                              attributeStock["Size"][size].status === "Out of Stock"
                                ? "text-red-400"
                                : attributeStock["Size"][size].status === "Limited Stock"
                                  ? "text-yellow-400"
                                  : "text-green-400"
                            }`}
                          >
                            {attributeStock["Size"][size].total} {attributeStock["Size"][size].status === "Out of Stock" ? "Out of Stock" : "pcs"}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Numeric Sizes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Numeric Sizes (Pants/Waist)
                </label>
                <div className="flex flex-wrap gap-2">
                  {["28", "30", "32", "34", "36", "38", "40"].map((size) => (
                    <div key={size} className="group relative">
                      <button
                        onClick={() => handleAttributeSelect("Size", size)}
                        className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all text-sm ${
                          selectedAttributes["Size"] === size
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {size}
                      </button>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs py-1 px-2 rounded z-10 whitespace-nowrap">
                        {attributePrices["Size"]?.[size] && (
                          <div className="text-gray-300">
                            ₹{attributePrices["Size"][size].min}
                            {attributePrices["Size"][size].max !==
                              attributePrices["Size"][size].min &&
                              ` - ₹${attributePrices["Size"][size].max}`}
                          </div>
                        )}
                        {attributeStock["Size"]?.[size] && (
                          <div
                            className={`text-xs font-semibold ${
                              attributeStock["Size"][size].status === "Out of Stock"
                                ? "text-red-400"
                                : attributeStock["Size"][size].status === "Limited Stock"
                                  ? "text-yellow-400"
                                  : "text-green-400"
                            }`}
                          >
                            {attributeStock["Size"][size].total} {attributeStock["Size"][size].status === "Out of Stock" ? "Out of Stock" : "pcs"}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Size Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Custom Size
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter custom size (e.g., 3XL, 45, 5cm)"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAttributeSelect("Size", e.target.value);
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-sm"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
                    Apply
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Storage Variants - Only for Electronics */}
            {product.category === "Electronics" && (
              <div className="space-y-3 border-t border-b border-gray-200 py-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Storage Capacity
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "128GB", icon: "💾" },
                      { label: "256GB", icon: "💿" },
                      { label: "512GB", icon: "📀" },
                    ].map((storage) => (
                      <div key={storage.label} className="group relative">
                        <button
                          onClick={() => handleAttributeSelect("Storage", storage.label)}
                          className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all text-sm flex items-center gap-2 ${
                            selectedAttributes["Storage"] === storage.label
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          <span>{storage.icon}</span>
                          {storage.label}
                        </button>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs py-1 px-2 rounded z-10 whitespace-nowrap">
                          {attributePrices["Storage"]?.[storage.label] && (
                            <div className="text-gray-300">
                              ₹{attributePrices["Storage"][storage.label].min}
                              {attributePrices["Storage"][storage.label].max !==
                                attributePrices["Storage"][storage.label].min &&
                                ` - ₹${attributePrices["Storage"][storage.label].max}`}
                            </div>
                          )}
                          {attributeStock["Storage"]?.[storage.label] && (
                            <div
                              className={`text-xs font-semibold ${
                                attributeStock["Storage"][storage.label].status === "Out of Stock"
                                  ? "text-red-400"
                                  : attributeStock["Storage"][storage.label].status === "Limited Stock"
                                    ? "text-yellow-400"
                                    : "text-green-400"
                              }`}
                            >
                              {attributeStock["Storage"][storage.label].total} {attributeStock["Storage"][storage.label].status === "Out of Stock" ? "Out of Stock" : "pcs"}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Industrial Variants - Only for Industrial */}
            {product.category === "Industrial" && (
              <div className="space-y-3 border-t border-b border-gray-200 py-3">
                {/* Capacity Variants */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Capacity (Ton)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "1 Ton", icon: "⚙️" },
                      { label: "5 Ton", icon: "🏭" },
                      { label: "10 Ton", icon: "🚜" },
                    ].map((capacity) => (
                      <div key={capacity.label} className="group relative">
                        <button
                          onClick={() => handleAttributeSelect("Capacity", capacity.label)}
                          className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all text-sm flex items-center gap-2 ${
                            selectedAttributes["Capacity"] === capacity.label
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          <span>{capacity.icon}</span>
                          {capacity.label}
                        </button>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs py-1 px-2 rounded z-10 whitespace-nowrap">
                          {attributePrices["Capacity"]?.[capacity.label] && (
                            <div className="text-gray-300">
                              ₹{attributePrices["Capacity"][capacity.label].min}
                              {attributePrices["Capacity"][capacity.label].max !==
                                attributePrices["Capacity"][capacity.label].min &&
                                ` - ₹${attributePrices["Capacity"][capacity.label].max}`}
                            </div>
                          )}
                          {attributeStock["Capacity"]?.[capacity.label] && (
                            <div
                              className={`text-xs font-semibold ${
                                attributeStock["Capacity"][capacity.label].status === "Out of Stock"
                                  ? "text-red-400"
                                  : attributeStock["Capacity"][capacity.label].status === "Limited Stock"
                                    ? "text-yellow-400"
                                    : "text-green-400"
                              }`}
                            >
                              {attributeStock["Capacity"][capacity.label].total} {attributeStock["Capacity"][capacity.label].status === "Out of Stock" ? "Out of Stock" : "pcs"}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Power Variants (HP) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Power (HP)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "1 HP", icon: "⚡" },
                      { label: "2 HP", icon: "⚡⚡" },
                      { label: "5 HP", icon: "🔋" },
                      { label: "10 HP", icon: "🏭" },
                    ].map((power) => (
                      <div key={power.label} className="group relative">
                        <button
                          onClick={() => handleAttributeSelect("Power", power.label)}
                          className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all text-sm flex items-center gap-2 ${
                            selectedAttributes["Power"] === power.label
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          <span>{power.icon}</span>
                          {power.label}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voltage Variants */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Voltage
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "220V", icon: "⚙️" },
                      { label: "380V", icon: "⚙️" },
                      { label: "440V", icon: "🔌" },
                    ].map((voltage) => (
                      <button
                        key={voltage.label}
                        onClick={() => handleAttributeSelect("Voltage", voltage.label)}
                        className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all text-sm flex items-center gap-2 ${
                          selectedAttributes["Voltage"] === voltage.label
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <span>{voltage.icon}</span>
                        {voltage.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phase Variants */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Phase
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Single Phase", icon: "⚡" },
                      { label: "Three Phase", icon: "⚡⚡⚡" },
                    ].map((phase) => (
                      <button
                        key={phase.label}
                        onClick={() => handleAttributeSelect("Phase", phase.label)}
                        className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all text-sm flex items-center gap-2 ${
                          selectedAttributes["Phase"] === phase.label
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <span>{phase.icon}</span>
                        {phase.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type Variants (Automatic/Semi-Automatic) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Automatic", icon: "🤖" },
                      { label: "Semi Automatic", icon: "⚙️" },
                    ].map((type) => (
                      <button
                        key={type.label}
                        onClick={() => handleAttributeSelect("Type", type.label)}
                        className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all text-sm flex items-center gap-2 ${
                          selectedAttributes["Type"] === type.label
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <span>{type.icon}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Material Variants (Industrial) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Material
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Steel", icon: "🔩" },
                      { label: "Cast Iron", icon: "⚙️" },
                      { label: "Aluminum", icon: "⬜" },
                      { label: "Stainless Steel", icon: "✨" },
                    ].map((material) => (
                      <button
                        key={material.label}
                        onClick={() => handleAttributeSelect("Material", material.label)}
                        className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all text-sm flex items-center gap-2 ${
                          selectedAttributes["Material"] === material.label
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <span>{material.icon}</span>
                        {material.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MOQ and Stock Info */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">MOQ</p>
                <p className="font-bold text-gray-900">{selectedVariant.moq}</p>
              </div>
              <div>
                <p className="text-gray-600">SKU</p>
                <p className="font-bold text-gray-900 truncate">
                  {selectedVariant.sku}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Available</p>
                <p className="font-bold text-gray-900">
                  {selectedVariant.stock}
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(selectedVariant.moq, quantity - 1))}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(selectedVariant.moq, parseInt(e.target.value) || 1)
                    )
                  }
                  className="w-16 px-3 py-2 rounded-lg border border-gray-300 text-center font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Trust Badges - Above Order Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-6 pb-4 border-t border-gray-200 mt-6">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <HiMiniCheckCircle className="w-5 h-5 text-green-600" />
                <div className="text-sm">
                  <p className="font-semibold text-green-900">Verified</p>
                  <p className="text-xs text-green-700">Seller</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <HiOutlineTruck className="w-5 h-5 text-blue-600" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900">Free</p>
                  <p className="text-xs text-blue-700">Shipping</p>
                </div>
              </div>
            </div>

            {/* WHOLESALE TAB - Order Action Buttons */}
            {activeOrderTab === 'wholesale' && (
              <div className="space-y-2 transition-opacity duration-300 mt-6 pt-6 border-t border-gray-200">
                {/* Place Order (Wholesale) */}
                {product?.id ? (
                  <Link
                    href={`/checkout/sample?productId=${product.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-bold hover:opacity-90 transition text-base shadow-sm"
                  >
                    <HiOutlineShoppingCart className="w-5 h-5" />
                    Place Order
                  </Link>
                ) : (
                  <button disabled className="flex items-center justify-center gap-2 w-full bg-gray-300 text-gray-500 py-3 rounded-lg font-bold cursor-not-allowed">
                    <HiOutlineShoppingCart className="w-5 h-5" />
                    Loading...
                  </button>
                )}

                {/* Send Inquiry Button */}
                <button
                  onClick={() => setIsInquiryModalOpen(true)}
                  className="flex items-center justify-center gap-2 w-full border-2 border-purple-400 text-purple-600 py-2.5 rounded-lg font-semibold hover:bg-purple-50 transition"
                >
                  <HiOutlinePaperAirplane className="w-4 h-4" />
                  Send Inquiry
                </button>

                {/* Chat Now */}
                {product.seller.id && (
                  <ProductChatButton
                    sellerId={product.seller.id}
                    productId={product.id}
                    productName={product.name}
                    productPrice={selectedVariant.price}
                    productImage={selectedVariant.images?.[0] || selectedVariant.thumbnail}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 text-base py-3 shadow-md"
                  />
                )}
              </div>
            )}

            {/* CUSTOMIZATION TAB - Action Buttons */}
            {activeOrderTab === 'customization' && (
              <div className="space-y-2 transition-opacity duration-300 mt-6 pt-6 border-t border-gray-200">
                {/* Request Customization Button */}
                <button
                  onClick={() => setIsCustomizationModalOpen(true)}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-bold hover:opacity-90 transition text-base shadow-sm"
                >
                  ✨ Request Customization
                </button>

                {/* Send Inquiry Button */}
                <button
                  onClick={() => setIsInquiryModalOpen(true)}
                  className="flex items-center justify-center gap-2 w-full border-2 border-purple-400 text-purple-600 py-2.5 rounded-lg font-semibold hover:bg-purple-50 transition"
                >
                  <HiOutlinePaperAirplane className="w-4 h-4" />
                  Send Inquiry
                </button>

                {/* Chat Now */}
                {product.seller.id && (
                  <ProductChatButton
                    sellerId={product.seller.id}
                    productId={product.id}
                    productName={product.name}
                    productPrice={selectedVariant.price}
                    productImage={selectedVariant.images?.[0] || selectedVariant.thumbnail}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white text-base py-3 shadow-md"
                  />
                )}
              </div>
            )}

          </div>

          {/* RIGHT: Seller Card (25%) */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24 space-y-3">
              {/* Seller Profile Card */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

                {/* ── Seller Header ── */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                  <Link
                    href={product.seller.id ? `/sellers/${product.seller.id}` : "#"}
                    className="font-bold text-base text-gray-900 hover:text-blue-600 transition block truncate"
                  >
                    {product.seller.companyName}
                  </Link>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <span>📍</span>
                    <span>{product.seller.location}</span>
                  </div>
                </div>

                {/* ── Trust Badges (compact horizontal scroll) ── */}
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <div className="flex flex-wrap gap-1.5">
                    {product.seller.verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">🚚 Free Shipping</span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-1 rounded-full">📅 10+ Years Member</span>
                    {product.seller.responseTime && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full">⏱️ {product.seller.responseTime} Response</span>
                    )}
                    {product.averageRating > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">⭐ {product.averageRating.toFixed(1)} Rating</span>
                    )}
                  </div>

                  {/* Trust bar */}
                  <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
                    <span className="text-base shrink-0">🛡️</span>
                    <div>
                      <p className="text-[11px] font-bold text-gray-800">Trusted & Verified Seller</p>
                      <p className="text-[10px] text-gray-500">Certified on IndiaMART • <span className="text-green-700 font-semibold">Buyer Protection Guaranteed</span></p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-4 py-3 space-y-2">
                  {/* Start Chat Button */}
                  {product.seller.id && (
                    <button
                      onClick={() => protect(() => {
                        window.location.href = `/chat?sellerId=${product.seller.id}&sellerName=${encodeURIComponent(product.seller.companyName || product.seller.name || '')}&productId=${product.id}`;
                      })}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                    >
                      <HiOutlineEnvelope className="w-4 h-4" />
                      Start Chat
                    </button>
                  )}

                  {/* WhatsApp Button */}
                  <button
                    onClick={() => protect(() => {
                      const rawPhone = (product.seller as any).phone
                        ? String((product.seller as any).phone).replace(/\D/g, "")
                        : "";

                      if (!rawPhone) {
                        toast("Seller has not added a WhatsApp number.\nYou can use Send Inquiry instead.", {
                          icon: "📱",
                          duration: 4000,
                        });
                        return;
                      }

                      const phone = rawPhone.startsWith("91") ? rawPhone : "91" + rawPhone;

                      if (phone.length !== 12) {
                        toast.error("Seller's phone number appears invalid. Please use Send Inquiry.");
                        return;
                      }

                      const sellerName = product.seller.companyName || product.seller.name || "Seller";
                      const price = selectedVariant?.price ?? (product as any).price ?? "";
                      const msg = `Hello,\n\nI am interested in your product:\n*Product Name:* ${product.name}\n*Product ID:* ${product.id}${price ? `\n*Price:* ₹${price}` : ""}\n\nPlease share more details.\n\nThank you,\n${sellerName}`;

                      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    })}
                    className="w-full py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 active:scale-95 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <HiOutlinePhone className="w-4 h-4" />
                    WhatsApp
                  </button>

                  {/* Send Inquiry Button */}
                  <button
                    onClick={() => protect(() => setIsInquiryModalOpen(true))}
                    className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 active:scale-95 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <HiOutlinePaperAirplane className="w-4 h-4" />
                    Send Inquiry
                  </button>
                </div>

                {/* View Profile Link */}
                <div className="px-4 pb-3 border-t border-gray-100 pt-2">
                  <Link
                    href={product.seller.id ? `/sellers/${product.seller.id}` : "#"}
                    className="block text-center text-blue-600 hover:text-blue-700 font-semibold text-xs transition"
                  >
                    View Complete Profile →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width About Product Accordion */}
        {product.description && (
          <div className="mt-8 w-full">
            <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              {/* Accordion Header */}
              <button
                onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <h2 className="text-lg font-bold text-gray-900">About this product</h2>
                </div>
                <div className={`transition-transform duration-300 ${isAboutExpanded ? 'rotate-180' : ''}`}>
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </button>

              {/* Accordion Content with Smooth Animation */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isAboutExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 py-5 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                    {/* Support both plain text and HTML content */}
                    {product.description.includes('<') ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: product.description }}
                        className="space-y-4 text-base text-gray-700 leading-7"
                      />
                    ) : (
                      <div className="space-y-4 whitespace-pre-wrap text-base text-gray-700 leading-7">
                        {product.description}
                      </div>
                    )}
                  </div>

                  {/* Spacing at bottom */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      For more details, please contact the seller or send an inquiry.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Info - Warranty, Returns, Delivery */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {product.warranty && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition">
              <p className="text-xs text-gray-600 mb-1">Warranty</p>
              <p className="text-base font-bold text-gray-900">{product.warranty}</p>
            </div>
          )}
          {product.returnPolicy && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition">
              <p className="text-xs text-gray-600 mb-1">Returns</p>
              <p className="text-base font-bold text-gray-900">{product.returnPolicy}</p>
            </div>
          )}
          {product.deliveryInfo && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition">
              <p className="text-xs text-gray-600 mb-1">Delivery</p>
              <p className="text-base font-bold text-gray-900">{product.deliveryInfo}</p>
            </div>
          )}
        </div>

        {/* Ratings & Reviews Section */}
        <div className="mt-8 border-t border-gray-200 pt-6" id="reviews-section">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                toast.success(`Opening ${product.totalReviews} Reviews...`);
              }}
              className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition cursor-pointer"
            >
              Ratings & Reviews ⭐
            </button>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Write Review
            </button>
          </div>

          {/* Rating Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Left: Rating Overview */}
              <div>
                <div className="text-6xl font-bold text-gray-900 mb-3">
                  {product.averageRating.toFixed(1)}
                </div>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className="text-3xl">
                      {i < Math.floor(product.averageRating) ? "⭐" : "☆"}
                    </span>
                  ))}
                </div>
                <p className="text-gray-600 font-medium">
                  Based on <strong>{product.totalReviews}</strong> verified reviews
                </p>
              </div>

              {/* Right: Rating Distribution */}
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const percentage = [45, 30, 15, 7, 3][5 - rating];
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex gap-0.5 w-16">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className="text-lg">
                            {i < rating ? "⭐" : "☆"}
                          </span>
                        ))}
                      </div>
                      <div className="h-3 bg-gray-300 rounded-full flex-1">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detailed Reviews */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Reviews</h3>
            {Array.from({ length: 5 }).map((_, idx) => {
              const reviewRatings = [5, 5, 4, 4, 3];
              const reviewNames = ["Rajesh Kumar", "Priya Singh", "Mohammad Ali", "Deepak Patel", "Anita Sharma"];
              const reviewComments = [
                "Excellent quality product! Delivered on time. Will definitely order again. 👍",
                "Best product in this category. Very satisfied with the quality and service.",
                "Good product but packaging could be better. Overall satisfied.",
                "Value for money! Meets all specifications mentioned.",
                "Average product. Expected better quality but it's okay.",
              ];
              return (
                <div key={idx} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                          {reviewNames[idx].charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{reviewNames[idx]}</p>
                          <p className="text-xs text-gray-500">✓ Verified Purchase • {idx + 1} months ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className="text-lg">
                          {i < reviewRatings[idx] ? "⭐" : "☆"}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">{reviewComments[idx]}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <button className="hover:text-blue-600 transition">👍 Helpful ({Math.floor(Math.random() * 50)})</button>
                    <button className="hover:text-red-600 transition">👎 Not Helpful</button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              toast.success(`${product.totalReviews} Reviews Loading...`);
              // TODO: Navigate to reviews page or open modal
            }}
            className="w-full py-3 border-2 border-blue-400 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition cursor-pointer"
          >
            View All {product.totalReviews} Reviews
          </button>
        </div>

        {/* Q&A Section */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Questions & Answers</h2>

          <div className="space-y-4 mb-3">
            {[
              {
                q: "What is the minimum order quantity?",
                a: "Minimum order quantity is 1 unit. However, bulk orders have discounts.",
              },
              {
                q: "Does it come with warranty?",
                a: "Yes, 1 year manufacturer's warranty is included with this product.",
              },
              {
                q: "How long does delivery take?",
                a: "Standard delivery takes 2-7 days depending on your location.",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="font-semibold text-gray-900 mb-2">Q: {item.q}</p>
                <p className="text-gray-700 text-sm ml-4 border-l-2 border-green-400 pl-4">
                  A: {item.a}
                </p>
              </div>
            ))}
          </div>

          <button className="w-full py-3 border-2 border-blue-400 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition">
            Ask a Question
          </button>
        </div>

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Similar Products</h2>
              <p className="text-gray-600">Customers also viewed these products</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 cursor-pointer group"
                  onClick={() => onProductSwitch?.(p)}
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden relative">
                    <img
                      src={p.variants?.[0]?.images?.[0] || p.variants?.[0]?.thumbnail || ""}
                      alt={p.name || 'Product'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition">{p.name}</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-gray-900">₹{(p.basePrice || p.price).toLocaleString("en-IN")}</p>
                      {(p.comparePrice || p.priceMax) && (
                        <p className="text-sm text-gray-500 line-through">₹{(p.comparePrice || p.priceMax).toLocaleString("en-IN")}</p>
                      )}
                    </div>
                    {p.averageRating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className="text-sm">
                              {i < Math.floor(p.averageRating) ? "⭐" : "☆"}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">({p.totalReviews || 0})</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications & Compliance */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Certifications & Standards</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: "🏭", title: "ISO 9001:2015", desc: "Quality Management" },
              { icon: "🔒", title: "CE Marked", desc: "EU Compliance" },
              { icon: "✅", title: "Verified Seller", desc: "IndiaMART Verified" },
            ].map((cert, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-4xl mb-2">{cert.icon}</div>
                <h4 className="font-bold text-gray-900 mb-1">{cert.title}</h4>
                <p className="text-sm text-gray-600">{cert.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tags Section */}
        {product.tags && product.tags.length > 0 && (
          <div className="mt-12 border-t border-gray-200 pt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Product Tags</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-100 cursor-pointer transition"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Video & Media Section */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Product Video & Media</h2>

          {/* Video Placeholder or Embed */}
          {product.videoUrl ? (
            <div className="rounded-xl overflow-hidden h-96 bg-gray-900">
              {product.videoUrl.includes('youtube') || product.videoUrl.includes('youtu.be') ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={product.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  title="Product Demo Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <video width="100%" height="100%" controls className="w-full h-full">
                  <source src={product.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ) : (
            <button
              onClick={() => alert('📹 No video uploaded yet.\n\nSellers can add product demo videos to showcase their products.')}
              className="w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden h-96 flex items-center justify-center hover:from-gray-800 hover:to-gray-700 transition group"
            >
              <div className="text-center">
                <div className="text-6xl mb-4 group-hover:scale-110 transition transform">▶️</div>
                <p className="text-white text-lg font-semibold">Product Demo Video</p>
                <p className="text-gray-400 text-sm mt-2">Click to see if video available</p>
              </div>
            </button>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Why Buy From Us</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <div className="text-3xl mb-2">✓</div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">100% Verified</h4>
              <p className="text-xs text-gray-600">Seller verification & authenticity guaranteed</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
              <div className="text-3xl mb-2">📦</div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">Fast Delivery</h4>
              <p className="text-xs text-gray-600">Quick shipping across India</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <div className="text-3xl mb-2">💬</div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">24/7 Support</h4>
              <p className="text-xs text-gray-600">Live chat & dedicated support</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
              <div className="text-3xl mb-2">🛡️</div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">Secure Payment</h4>
              <p className="text-xs text-gray-600">Safe & encrypted transactions</p>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Order Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-3 py-2.5 flex gap-2 shadow-2xl">
          <Link
            href={`/checkout/sample?productId=${product.id}`}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-lg font-bold text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5"
          >
            <HiOutlineShoppingCart className="w-4 h-4" />
            Order
          </Link>
          {product.seller.id && (
            <ProductChatButton
              sellerId={product.seller.id}
              productId={product.id}
              productName={product.name}
              productPrice={selectedVariant.price}
              productImage={selectedVariant.images?.[0] || selectedVariant.thumbnail}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 text-xs py-2.5 shadow-md"
            />
          )}
          <Link
            href="#inquiry"
            className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg font-bold text-xs hover:bg-orange-600 transition flex items-center justify-center gap-1.5"
          >
            <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
            Contact
          </Link>
        </div>

        {/* Inquiry Form Section */}
        <div id="inquiry" className="mt-12 border-t border-gray-200 pt-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-2xl">
            <h2 className="font-bold text-gray-800 mb-1">Send Inquiry</h2>
            <p className="text-xs text-gray-400 mb-4">Get a quote from the supplier</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                // Get form data
                const formData = new FormData(e.currentTarget);
                const subject = formData.get('subject') as string;
                const quantityRequired = formData.get('quantity') as string;
                const description = formData.get('description') as string;

                // Validate
                if (!subject.trim() || !description.trim()) {
                  toast.error('Please fill all required fields');
                  return;
                }

                setIsInlineInquirySending(true);
                try {
                  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

                  if (!token) {
                    toast.error('Please login to send an inquiry');
                    return;
                  }

                  await api.post(`/inquiries/${product.id}`, {
                    subject,
                    quantityRequired: parseInt(quantityRequired) || quantity,
                    message: description,
                  });
                  toast.success('Inquiry sent successfully! The seller will respond soon.');
                  (e.target as HTMLFormElement).reset();
                } catch (error) {
                  console.error('Inquiry submission error:', error);
                  const errorMsg = error instanceof Error ? error.message : 'Error sending inquiry. Please try again.';
                  toast.error(errorMsg);
                } finally {
                  setIsInlineInquirySending(false);
                }
              }}
              className="space-y-3"
            >
              <input
                type="text"
                name="subject"
                placeholder="Subject"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none transition"
                required
              />
              <input
                type="number"
                name="quantity"
                placeholder="Quantity Required"
                defaultValue={quantity}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none transition"
              />
              <textarea
                name="description"
                placeholder="Describe your requirement... (Include customization details if any)"
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none resize-none transition"
                required
              />
              <button
                type="submit"
                disabled={isInlineInquirySending}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isInlineInquirySending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Sending...
                  </>
                ) : 'Send Inquiry'}
              </button>
            </form>
          </div>
        </div>

        {/* Padding for mobile sticky bar */}
        <div className="lg:hidden h-20" />
      </div>

      {/* Premium Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image fullscreen view"
        >
          <div
            className="relative w-full h-screen max-w-6xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white/70 hover:text-white transition-all duration-200 z-50 p-2 rounded-full hover:bg-white/10 backdrop-blur-sm"
              aria-label="Close fullscreen"
            >
              <HiOutlineXMark className="w-8 h-8" />
            </button>

            {/* Main Fullscreen Image */}
            <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
              {displayImages && displayImages[mainImageIndex] ? (
                displayImages[mainImageIndex]?.type === 'video' ? (
                  <video
                    key={displayImages[mainImageIndex].url}
                    src={displayImages[mainImageIndex].url}
                    controls
                    autoPlay
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <Image
                    src={displayImages[mainImageIndex]?.url || displayImages[mainImageIndex]}
                    alt={displayImages[mainImageIndex]?.alt || `Product image ${mainImageIndex + 1} fullscreen`}
                    fill
                    className="object-contain"
                    sizes="90vw"
                    quality={95}
                    priority
                  />
                )
              ) : (
                <div className="flex items-center justify-center text-white text-sm">
                  <p>Image unavailable</p>
                </div>
              )}

              {/* Fullscreen Image Counter */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-gray-900/90 to-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg border border-white/20 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-xs font-bold">{mainImageIndex + 1}</span>
                <span className="text-gray-300">/</span>
                <span>{displayImages.length}</span>
              </div>

              {/* Fullscreen Navigation Arrows */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMainImageIndex(prev => (prev === 0 ? displayImages.length - 1 : prev - 1));
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-3 rounded-full transition-all z-10 backdrop-blur-sm"
                    aria-label="Previous image"
                  >
                    <HiOutlineChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMainImageIndex(prev => (prev === displayImages.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-3 rounded-full transition-all z-10 backdrop-blur-sm"
                    aria-label="Next image"
                  >
                    <HiOutlineChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Thumbnail Strip at Bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {displayImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImageIndex(i)}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        mainImageIndex === i
                          ? 'border-blue-400 ring-2 ring-blue-300 shadow-lg'
                          : 'border-white/30 hover:border-white/50'
                      }`}
                      aria-label={`Select ${img?.type === 'video' ? 'video' : 'image'} ${i + 1}`}
                    >
                      <Image
                        src={
                          img?.videoThumbnail && img?.type === 'video'
                            ? img.videoThumbnail
                            : img?.url || img
                        }
                        alt={img?.alt || `Thumbnail ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                      {/* Video Play Icon */}
                      {img?.type === 'video' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyboard Hint */}
              <div className="absolute bottom-4 left-4 text-white/50 text-xs font-medium">
                ← → to navigate • ESC to close
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INQUIRY MODAL */}
      {isInquiryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Send Inquiry</h2>
              <button
                onClick={() => setIsInquiryModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <HiOutlineXMark className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  // Check login
                  const token = localStorage.getItem('accessToken');
                  if (!token) {
                    toast.error('Please login to send an inquiry');
                    setIsInquiryModalOpen(false);
                    nextRouter.push(`/auth/login?redirect=/products/${product.id}`);
                    return;
                  }
                  setLoading(true);
                  try {
                    const formData = new FormData(e.currentTarget);
                    const payload: Record<string, any> = {
                      message: formData.get('message') as string,
                      quantityRequired: parseInt(formData.get('quantity') as string) || quantity,
                    };
                    const subject = formData.get('subject') as string;
                    if (subject) payload.subject = subject;
                    // Add sellerId as fallback so backend can find seller even if product.seller is missing
                    if (product.seller?.id) payload.sellerId = product.seller.id;

                    await api.post(`/inquiries/${product.id}`, payload);
                    toast.success('Inquiry sent successfully! The seller will contact you soon.');
                    setIsInquiryModalOpen(false);
                    (e.target as HTMLFormElement).reset();
                  } catch (error: any) {
                    const msg = error?.response?.data?.message || error?.message || 'Failed to send inquiry';
                    if (error?.response?.status === 401) {
                      toast.error('Please login to send an inquiry');
                      nextRouter.push(`/auth/login?redirect=/products/${product.id}`);
                    } else {
                      toast.error(msg);
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    placeholder="e.g., Bulk order inquiry"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity Required</label>
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Number of units"
                    defaultValue={quantity}
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                  <textarea
                    name="message"
                    placeholder="Share your specific requirements, customization needs, bulk discounts, payment terms, delivery timeline, etc."
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsInquiryModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Sending...
                      </>
                    ) : 'Send Inquiry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMIZATION MODAL */}
      {isCustomizationModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Customization Request</h2>
              <button
                onClick={() => setIsCustomizationModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <HiOutlineXMark className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Error Message */}
              {customizationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{customizationError}</p>
                </div>
              )}

              <form
                onSubmit={handleCustomizationSubmit}
                className="space-y-5"
              >
                {/* Product Name - Auto-filled, read-only */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={product.name}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-700 text-sm"
                  />
                </div>

                {/* Quantity Required */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity Required <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Enter quantity"
                    min="1"
                    defaultValue={quantity}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                    required
                  />
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Logo Upload <span className="text-gray-400 text-xs">(Optional)</span></label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-purple-400', 'bg-purple-50');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-purple-400', 'bg-purple-50');
                    }}
                    onDrop={(e) => {
                      e.currentTarget.classList.remove('border-purple-400', 'bg-purple-50');
                      handleCustomizationLogoDrop(e);
                    }}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition cursor-pointer"
                  >
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      className="hidden"
                      id="customizationLogoUpload"
                      onChange={handleCustomizationLogoChange}
                    />
                    <label htmlFor="customizationLogoUpload" className="cursor-pointer block">
                      {customizationLogoFile ? (
                        <div className="space-y-2">
                          {customizationLogoPreview ? (
                            <div className="flex justify-center">
                              <img src={customizationLogoPreview} alt="Logo preview" className="h-20 rounded-lg object-contain" />
                            </div>
                          ) : (
                            <div className="text-3xl">📄</div>
                          )}
                          <p className="text-sm font-medium text-gray-800">{customizationLogoFile.name}</p>
                          <p className="text-xs text-gray-500">{(customizationLogoFile.size / 1024).toFixed(2)} KB</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setCustomizationLogoFile(null);
                              setCustomizationLogoPreview('');
                              const input = document.getElementById('customizationLogoUpload') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                            className="text-xs text-blue-600 hover:underline mt-2"
                          >
                            Change file
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">📎 Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF (Max 5MB)</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* OEM/ODM Requirement */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">OEM/ODM Requirement</label>
                  <select
                    name="oem"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                  >
                    <option value="">Select option</option>
                    <option value="logo">Logo Printing Only</option>
                    <option value="design">Design Customization</option>
                    <option value="packaging">Custom Packaging</option>
                    <option value="full">Full OEM/ODM</option>
                  </select>
                </div>

                {/* Packaging Requirement */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Packaging Requirement</label>
                  <textarea
                    name="packaging"
                    placeholder="Describe your packaging requirements (box design, materials, branding, etc.)"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message <span className="text-red-500">*</span></label>
                  <textarea
                    name="message"
                    placeholder="Tell us your customization requirements in detail..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm"
                    required
                  />
                </div>

                {/* File Attachment */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Attachments <span className="text-gray-400 text-xs">(Optional)</span></label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                      className="hidden"
                      id="customizationFileUpload"
                      onChange={handleCustomizationAttachmentChange}
                    />
                    <label htmlFor="customizationFileUpload" className="cursor-pointer block">
                      {customizationAttachments.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-800">{customizationAttachments.length} file(s) selected</p>
                          <div className="text-xs text-gray-600 space-y-1">
                            {customizationAttachments.map((file, idx) => (
                              <p key={idx}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setCustomizationAttachments([]);
                              const input = document.getElementById('customizationFileUpload') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                            className="text-xs text-blue-600 hover:underline mt-2"
                          >
                            Clear files
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">📁 Click to upload files</p>
                          <p className="text-xs text-gray-500 mt-1">Images, PDFs, or documents (Max 25MB total)</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Upload Progress */}
                {isSubmittingCustomization && customizationUploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Uploading...</span>
                      <span className="text-sm font-semibold text-gray-800">{customizationUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${customizationUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSubmittingCustomization) {
                        setIsCustomizationModalOpen(false);
                      }
                    }}
                    disabled={isSubmittingCustomization}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCustomization}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingCustomization ? `Submitting (${customizationUploadProgress}%)...` : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        productId={product.id}
        productName={product.name}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onReviewAdded={() => {
          // Refresh the page to see the updated review
          window.location.reload();
        }}
      />
    </div>
  );
}
