'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { resolveImageUrl } from '@/lib/imageUrl';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import InquiryModal from '@/components/seller/InquiryModal';
import VerificationBadges from '@/components/seller/VerificationBadges';
import CompanyHeader from '@/components/seller/CompanyHeader';
import StickyContactCard from '@/components/seller/StickyContactCard';
import BusinessInfoCards from '@/components/seller/BusinessInfoCards';
import TrustIndicators from '@/components/seller/TrustIndicators';
import ProductGalleryCarousel from '@/components/seller/ProductGalleryCarousel';
import SaveAndShareActions from '@/components/seller/SaveAndShareActions';
import MobileActionBar from '@/components/seller/MobileActionBar';
import CTASection from '@/components/seller/CTASection';
import ImageGallery from '@/components/seller/ImageGallery';
import RelatedProducts from '@/components/seller/RelatedProducts';
import {
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiStar,
  HiOutlineStar,
  HiMiniShieldCheck,
  HiChevronLeft,
  HiChevronRight,
  HiMagnifyingGlass,
} from 'react-icons/hi2';
import SellerProductCard from '@/components/seller/SellerProductCard';

interface CertificationDoc {
  _id: string;
  name: string;
  issuingBody?: string;
  certNumber?: string;
  issuedDate?: string;
  expiryDate?: string;
  imageUrl?: string;
  fileType?: 'image' | 'pdf';
  isAdminVerified?: boolean;
}

interface GalleryImage {
  _id: string;
  url: string;
  caption?: string;
  category?: string;
  isCover?: boolean;
  order?: number;
}

interface Seller {
  _id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  businessDescription: string;
  businessLogo: string;
  website: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  isVerified: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isGSTVerified?: boolean;
  isAadhaarVerified?: boolean;
  isPANVerified?: boolean;
  isPremiumSeller?: boolean;
  isTopRatedSeller?: boolean;
  averageRating: number;
  totalReviews: number;
  totalProducts: number;
  yearEstablished?: number;
  businessType?: string;
  annualTurnover?: string;
  numberOfEmployees?: string;
  trustScore?: number;
  // Video & virtual tour
  companyVideo?: string;
  companyVideos?: { url: string; title: string; description: string }[];
  uploadedVideos?: { url: string; title: string }[];
  virtualTourUrl?: string;
  // Certifications
  certificationDocs?: CertificationDoc[];
  certifications?: string[];
  // Gallery (also fetched separately via /gallery/:id)
  galleryImages?: GalleryImage[];
  // Social
  socialLinks?: { linkedin?: string; facebook?: string; instagram?: string };
}

interface Product {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number;
  images: Array<{ url: string }>;
  category: string | { _id: string; name: string };
  brand?: { _id: string; brandName: string } | null;
  stock: number;
  minOrderQuantity?: number;
}

export default function SellerStorefront() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const sellerId = params.id as string;
  const carouselRef = useRef<HTMLDivElement>(null);

  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);
  const [galleryImages, setGalleryImages] = useState<Array<{ _id: string; url: string; caption?: string; category?: string; isCover?: boolean }>>([]);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        setLoading(true);
        const [sellerRes, galleryRes] = await Promise.all([
          axios.get(`/sellers/${sellerId}`),
          axios.get(`/gallery/${sellerId}`).catch(() => ({ data: { data: [] } })),
        ]);
        if (sellerRes.data?.success) {
          setSeller(sellerRes.data.data.seller);
          setProducts(sellerRes.data.data.products);
        }
        setGalleryImages(galleryRes.data?.data || []);
      } catch (error) {
        toast.error('Failed to load seller store');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) fetchSellerData();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
          <p className="text-gray-600">The seller store you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Filter products by search query
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const openInquiryModal = (productId?: string, productName?: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to send inquiry');
      router.push('/auth/login');
      return;
    }
    setSelectedProduct(productId && productName ? { id: productId, name: productName } : null);
    setInquiryOpen(true);
  };

  const openChat = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to chat');
      router.push('/auth/login');
      return;
    }
    router.push(`/chat?userId=${sellerId}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* PROFESSIONAL HEADER */}
      <CompanyHeader
        seller={seller}
        onChatClick={openChat}
        onInquiryClick={() => openInquiryModal()}
        onWhatsAppClick={() => window.location.href = `https://wa.me/${seller.phone}`}
        onCallClick={() => window.location.href = `tel:${seller.phone}`}
      />

      {/* STICKY CONTACT CARD - DESKTOP ONLY */}
      <StickyContactCard
        seller={seller}
        onChatClick={openChat}
        onInquiryClick={() => openInquiryModal()}
        onWhatsAppClick={() => window.location.href = `https://wa.me/${seller.phone}`}
      />

      {/* NAVIGATION TABS */}
      <div className="bg-white border-b">
        <div className="max-w-full px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-8 overflow-x-auto">
              {[
                { id: 'home', label: 'Home' },
                { id: 'products', label: 'Products & Services' },
                { id: 'about', label: 'About Us' },
                { id: 'videos', label: 'Videos' },
                { id: 'photos', label: 'Photos' },
                { id: 'contact', label: 'Contact Us' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 font-semibold text-sm whitespace-nowrap border-b-3 transition ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-700 border-transparent hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-sm">
              <HiMagnifyingGlass className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search Products/Services"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* HOME TAB */}
      {activeTab === 'home' && (
        <div className="max-w-full px-6 py-8 space-y-12">
          {/* Company Description */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About Company</h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              {seller.businessDescription}
            </p>
          </div>

          {/* Product Categories Grid */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from(
                new Map(
                  products.map(p => [
                    typeof p.category === 'string' ? p.category : p.category?.name || 'Other',
                    p
                  ])
                )
              ).map(([categoryName, firstProduct]) => {
                const categoryCount = products.filter(
                  p => (typeof p.category === 'string' ? p.category : p.category?.name) === categoryName
                ).length;
                const categoryProducts = products.filter(
                  p => (typeof p.category === 'string' ? p.category : p.category?.name) === categoryName
                ).slice(0, 3);

                return (
                  <div key={categoryName} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                    <h3 className="font-bold text-gray-900 mb-3">{categoryName}</h3>
                    <p className="text-sm text-gray-600 mb-4">({categoryCount} items)</p>
                    <div className="space-y-2">
                      {categoryProducts.map(product => (
                        <Link
                          key={product._id}
                          href={`/products/${product._id}`}
                          className="block text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
                        >
                          {product.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Featured Products Carousel */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
            <div className="relative">
              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              >
                {products.slice(0, 8).map(product => (
                  <div key={product._id} className="flex-shrink-0 w-80">
                    <SellerProductCard
                      _id={product._id}
                      name={product.name}
                      price={product.price}
                      images={product.images}
                      companyName={seller.companyName}
                      brand={product.brand}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => scrollCarousel('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-50 z-10"
              >
                <HiChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-50 z-10"
              >
                <HiChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Company Photos/Infrastructure - Image Gallery */}
          <ImageGallery images={galleryImages} />

          {/* Call-to-Action Section */}
          <CTASection
            sellerName={seller.companyName}
            onChatClick={openChat}
            onInquiryClick={() => openInquiryModal()}
          />
        </div>
      )}

      {/* PRODUCTS & SERVICES TAB */}
      {activeTab === 'products' && (
        <div className="max-w-full px-6 py-8 bg-white">
          <div className="max-w-7xl mx-auto">
            {/* Featured Products Gallery */}
            <div className="mb-12">
              <ProductGalleryCarousel products={products} />
            </div>

            {/* Group products by category */}
            {filteredProducts.length > 0 ? (
              Array.from(
                new Map(
                  products.map(p => [
                    typeof p.category === 'string' ? p.category : p.category?.name || 'Other',
                    p
                  ])
                )
              ).map(([categoryName, firstProduct]) => {
                const categoryProducts = products.filter(
                  p => (typeof p.category === 'string' ? p.category : p.category?.name) === categoryName
                );

                return (
                  <div key={categoryName} className="mb-12">
                    {/* Category Header */}
                    <div className="mb-6 border-b-2 border-blue-600 pb-4">
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">{categoryName}</h2>
                      <p className="text-gray-700 text-sm leading-relaxed line-clamp-3 mb-2">
                        Leading Exporter of {categoryProducts.map(p => p.name).join(', ').substring(0, 150)}...
                      </p>
                      <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                        View More →
                      </button>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                      {categoryProducts.map(product => (
                        <Link
                          key={product._id}
                          href={`/products/${product._id}`}
                          className="group cursor-pointer"
                        >
                          <div className="flex flex-col h-full">
                            {/* Product Image */}
                            <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 mb-3 flex items-center justify-center group-hover:shadow-lg transition-shadow">
                              {product.images && product.images[0] ? (
                                <img
                                  src={resolveImageUrl(product.images[0].url)}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <span className="text-gray-400 text-center text-xs">No image</span>
                              )}
                            </div>

                            {/* Product Name */}
                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition">
                              {product.name}
                            </h3>

                            {/* Stock Status */}
                            {product.stock === 0 && (
                              <p className="text-xs text-red-600 font-semibold mt-2">Out of Stock</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📦</div>
                <p className="text-gray-900 font-bold text-lg mb-2">No Products Found</p>
                <p className="text-gray-600">Check back soon for new products from {seller.companyName}</p>
              </div>
            )}

            {/* View More Details Button */}
            {filteredProducts.length > 0 && (
              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-bold transition">
                  View more details →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABOUT US TAB */}
      {activeTab === 'about' && (
        <div className="max-w-full px-6 py-8 bg-gray-50">
          <div className="max-w-6xl mx-auto space-y-10">

            {/* Section 1: Company Introduction */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">👋 About Us</h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {seller.businessDescription || 'Welcome to our business. We are dedicated to providing the best products and services to our customers.'}
              </p>
            </div>

            {/* Section 2: What We Sell + Speciality */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Products */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  📦 Products We Sell
                </h3>
                <div className="space-y-3">
                  {Array.from(
                    new Map(
                      products.map(p => [
                        typeof p.category === 'string' ? p.category : p.category?.name || 'Other',
                        p
                      ])
                    )
                  )
                    .slice(0, 5)
                    .map(([categoryName]) => (
                      <div key={categoryName} className="flex items-center gap-3 p-2 hover:bg-blue-50 rounded-lg transition">
                        <span className="text-2xl">✓</span>
                        <span className="text-gray-700 font-medium">{categoryName}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Speciality */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  ⭐ Our Speciality
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 hover:bg-green-50 rounded-lg transition">
                    <span className="text-xl">✓</span>
                    <span className="text-gray-700 font-medium">Premium Quality Products</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 hover:bg-green-50 rounded-lg transition">
                    <span className="text-xl">✓</span>
                    <span className="text-gray-700 font-medium">Verified Seller Since {seller.yearEstablished || 2020}</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 hover:bg-green-50 rounded-lg transition">
                    <span className="text-xl">✓</span>
                    <span className="text-gray-700 font-medium">Competitive Pricing</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 hover:bg-green-50 rounded-lg transition">
                    <span className="text-xl">✓</span>
                    <span className="text-gray-700 font-medium">Fast Delivery Across India</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Why Choose Us */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">💡 Why Choose Us</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="text-4xl mb-3">🎯</div>
                  <h4 className="font-bold text-gray-900 mb-2">Quality Assured</h4>
                  <p className="text-gray-600 text-sm">All products are carefully selected and quality tested</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl mb-3">🚚</div>
                  <h4 className="font-bold text-gray-900 mb-2">Fast Delivery</h4>
                  <p className="text-gray-600 text-sm">Quick dispatch and reliable shipping across India</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl mb-3">💰</div>
                  <h4 className="font-bold text-gray-900 mb-2">Best Prices</h4>
                  <p className="text-gray-600 text-sm">Competitive pricing with no hidden charges</p>
                </div>
              </div>
            </div>

            {/* Section 4: Market Experience & Service Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Market Experience */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  📈 Market Experience
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl font-bold text-blue-600 min-w-fit">{seller.yearEstablished || 5}+</span>
                    <div>
                      <p className="font-semibold text-gray-900">Years in Business</p>
                      <p className="text-sm text-gray-600">Established experience in the industry</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl font-bold text-green-600 min-w-fit">{seller.totalProducts || 0}+</span>
                    <div>
                      <p className="font-semibold text-gray-900">Products Listed</p>
                      <p className="text-sm text-gray-600">Wide range of products available</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl font-bold text-yellow-600 min-w-fit">{seller.averageRating.toFixed(1)}/5</span>
                    <div>
                      <p className="font-semibold text-gray-900">Customer Rating</p>
                      <p className="text-sm text-gray-600">Trusted by thousands of buyers</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Area */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🗺️ Service Area
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="text-xs text-gray-600">Primary Location</p>
                      <p className="font-semibold text-gray-900">{seller.city}, {seller.state} {seller.pincode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                    <span className="text-xl">🇮🇳</span>
                    <div>
                      <p className="text-xs text-gray-600">Shipping Coverage</p>
                      <p className="font-semibold text-gray-900">All over India</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
                    <span className="text-xl">⚡</span>
                    <div>
                      <p className="text-xs text-gray-600">Delivery Time</p>
                      <p className="font-semibold text-gray-900">2-7 Business Days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Business Details Factsheet */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">📊 Business Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                  <p className="text-xs text-gray-600 font-medium mb-2">Nature of Business</p>
                  <p className="font-bold text-gray-900 text-sm">{seller.businessType?.replace(/_/g, ' ') || 'N/A'}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                  <p className="text-xs text-gray-600 font-medium mb-2">GST Number</p>
                  <p className="font-bold text-gray-900 text-sm">{seller.gstNumber?.slice(0, 15) || 'N/A'}...</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                  <p className="text-xs text-gray-600 font-medium mb-2">Annual Turnover</p>
                  <p className="font-bold text-gray-900 text-sm">{seller.annualTurnover || 'N/A'}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200">
                  <p className="text-xs text-gray-600 font-medium mb-2">Employees</p>
                  <p className="font-bold text-gray-900 text-sm">{seller.numberOfEmployees || 'N/A'}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border border-red-200">
                  <p className="text-xs text-gray-600 font-medium mb-2">Year Established</p>
                  <p className="font-bold text-gray-900 text-sm">{seller.yearEstablished || 'N/A'}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 rounded-xl border border-cyan-200">
                  <p className="text-xs text-gray-600 font-medium mb-2">Website</p>
                  <p className="font-bold text-gray-900 text-sm">
                    {seller.website ? <a href={seller.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Visit</a> : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 6: Certifications & Awards */}
            {(seller.certificationDocs?.length ?? 0) > 0 && (
              <SellerCertificationsSection certs={seller.certificationDocs!} />
            )}

            {/* Section 7: Company Information Cards */}
            <BusinessInfoCards seller={seller} />

            {/* Section 7: Trust Indicators */}
            <TrustIndicators seller={seller} />

            {/* Related Products */}
            <RelatedProducts products={products} />
          </div>
        </div>
      )}

      {/* VIDEOS TAB */}
      {activeTab === 'videos' && (
        <SellerVideosTab seller={seller} />
      )}

      {/* PHOTOS TAB */}
      {activeTab === 'photos' && (
        <SellerPhotosTab images={galleryImages} companyName={seller.companyName} />
      )}

      {/* CONTACT US TAB */}
      {activeTab === 'contact' && (
        <div className="max-w-full px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
            {/* Left: Contact Information */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h3>
              <div className="space-y-6">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <HiOutlinePhone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Phone</h4>
                    <p className="text-gray-700">{seller.phone}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <HiOutlineEnvelope className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Email</h4>
                    <p className="text-gray-700">{seller.email}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <HiOutlineMapPin className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Location</h4>
                    <p className="text-gray-700">{seller.city}, {seller.state}</p>
                    <p className="text-gray-600 text-sm">{seller.pincode}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Contact Form */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Send Message</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
                  <textarea
                    placeholder="Write your message here..."
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Inquiry Modal */}
      {seller && (
        <InquiryModal
          isOpen={inquiryOpen}
          onClose={() => setInquiryOpen(false)}
          productId={selectedProduct?.id}
          productName={selectedProduct?.name}
          sellerId={seller._id}
          sellerName={seller.companyName}
          sellerEmail={seller.email}
          sellerPhone={seller.phone}
        />
      )}

      {/* Save & Share Actions (Desktop Floating Buttons) */}
      {seller && (
        <SaveAndShareActions sellerId={seller._id} sellerName={seller.companyName} />
      )}

      {/* Mobile Action Bar (Mobile Only Sticky Bottom Bar) */}
      {seller && (
        <MobileActionBar
          onChatClick={openChat}
          onInquiryClick={() => openInquiryModal()}
          onWhatsAppClick={() => window.location.href = `https://wa.me/${seller.phone}`}
        />
      )}
    </div>
  );
}

// ─── Helper: convert any video URL to an embeddable src ────────────────────
function getVideoEmbed(url: string): { type: 'youtube' | 'direct' | 'link'; src: string } {
  if (!url) return { type: 'link', src: url };

  // YouTube: https://www.youtube.com/watch?v=ID or https://youtu.be/ID
  const ytMatch =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/) ||
    url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return { type: 'youtube', src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0` };
  }

  // Vimeo: https://vimeo.com/123456789
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { type: 'youtube', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  // Direct video file or Cloudinary hosted video
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.includes('cloudinary.com/video')) {
    return { type: 'direct', src: url };
  }

  // Anything else: show as a clickable link / iframe
  return { type: 'link', src: url };
}

// Returns true only for URLs we can actually render as video
function isValidVideoUrl(url: string): boolean {
  if (!url) return false;
  const isYouTube = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)/.test(url);
  const isVimeo   = url.includes('vimeo.com');
  const isDirect  = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
  const isCloud   = url.includes('cloudinary.com/video');
  return isYouTube || isVimeo || isDirect || isCloud;
}

// ─── Video Card Grid ────────────────────────────────────────────────────────
type VideoEntry = { url: string; title: string; description?: string; type: 'youtube' | 'vimeo' | 'direct' | 'tour' };

function buildVideoEntries(seller: Seller): VideoEntry[] {
  const entries: VideoEntry[] = [];
  const seen = new Set<string>();

  const add = (url: string, title: string, description?: string) => {
    const u = url.trim();
    if (!u || seen.has(u) || !isValidVideoUrl(u)) return;
    seen.add(u);
    const ytId = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)/.test(u);
    const isVimeo = u.includes('vimeo.com');
    const isDirect = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(u) || u.includes('cloudinary.com/video');
    entries.push({ url: u, title, description, type: ytId ? 'youtube' : isVimeo ? 'vimeo' : isDirect ? 'direct' : 'youtube' });
  };

  (seller.companyVideos ?? []).forEach((v) => {
    const obj = typeof v === 'string' ? { url: v, title: '', description: '' } : v;
    add(obj.url, obj.title, obj.description);
  });
  if (seller.companyVideo) add(seller.companyVideo, '');
  (seller.uploadedVideos ?? []).forEach((v) => {
    const obj = typeof v === 'string' ? { url: v, title: '' } : v;
    add(obj.url, obj.title);
  });

  return entries;
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getThumbnail(entry: VideoEntry): string {
  if (entry.type === 'youtube') {
    const id = getYouTubeId(entry.url);
    if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  }
  if (entry.type === 'vimeo') {
    const m = entry.url.match(/vimeo\.com\/(\d+)/);
    if (m) return `https://vumbnail.com/${m[1]}.jpg`;
  }
  return ''; // direct video — no static thumbnail
}

function getEmbedSrc(entry: VideoEntry): string {
  if (entry.type === 'youtube') {
    const id = getYouTubeId(entry.url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : entry.url;
  }
  if (entry.type === 'vimeo') {
    const m = entry.url.match(/vimeo\.com\/(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}?autoplay=1` : entry.url;
  }
  return entry.url; // direct
}

// ─── Video Modal ─────────────────────────────────────────────────────────────
function VideoModal({ entry, onClose }: { entry: VideoEntry; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {entry.type === 'direct' ? (
          <video src={entry.url} controls autoPlay className="w-full max-h-[80vh] bg-black">
            Your browser does not support video playback.
          </video>
        ) : (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={getEmbedSrc(entry)}
              title={entry.title || 'Video'}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Title bar below player */}
        {entry.title && (
          <div className="px-5 py-3 bg-gray-900">
            <p className="text-white font-semibold text-sm">{entry.title}</p>
            {entry.description && <p className="text-gray-400 text-xs mt-0.5">{entry.description}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Single Video Card ────────────────────────────────────────────────────────
function VideoCard({ entry, onClick }: { entry: VideoEntry; onClick: () => void }) {
  const thumb = getThumbnail(entry);
  const title = entry.title || (entry.type === 'direct' ? 'Company Video' : 'Company Video');
  const badge =
    entry.type === 'youtube' ? { label: 'YouTube', color: 'bg-red-600' } :
    entry.type === 'vimeo'   ? { label: 'Vimeo',   color: 'bg-blue-600' } :
    entry.type === 'direct'  ? { label: 'Video',   color: 'bg-purple-600' } : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100
                 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col"
      style={{ borderRadius: '12px' }}>

      {/* Thumbnail — 16:9 */}
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%' }}>
        {thumb ? (
          <img
            src={thumb}
            alt={title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
            <svg className="w-12 h-12 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
        )}

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-white/90 group-hover:bg-white group-hover:scale-110 rounded-full flex items-center justify-center shadow-lg transition-all duration-200">
            <svg className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Platform badge */}
        {badge && (
          <div className={`absolute top-2 left-2 ${badge.color} text-white text-[10px] font-bold px-2 py-0.5 rounded-md`}>
            {badge.label}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col flex-1 gap-1">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{title}</h3>
        {entry.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{entry.description}</p>
        )}
      </div>
    </button>
  );
}

const VIDEOS_PER_PAGE = 8;

// ─── Videos Tab ────────────────────────────────────────────────────────────
function SellerVideosTab({ seller }: { seller: Seller }) {
  const [activeVideo, setActiveVideo] = useState<VideoEntry | null>(null);
  const [page, setPage] = useState(1);

  const allEntries = buildVideoEntries(seller);
  const hasVideos = allEntries.length > 0;
  const displayed = allEntries.slice(0, page * VIDEOS_PER_PAGE);
  const hasMore = displayed.length < allEntries.length;

  if (!hasVideos && !seller.virtualTourUrl?.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-9 h-9 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">No videos uploaded yet</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          {seller.companyName} hasn&apos;t added any videos. Check back later for factory tours and product demos.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Videos & Virtual Tours</h2>
          {allEntries.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{allEntries.length} video{allEntries.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Video Grid — 1 col mobile / 2 tablet / 3 lg / 4 xl */}
      {hasVideos && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {displayed.map((entry) => (
            <VideoCard key={entry.url} entry={entry} onClick={() => setActiveVideo(entry)} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-2">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Load More
          </button>
        </div>
      )}

      {/* Virtual Tour card — shown below grid */}
      {seller.virtualTourUrl?.trim() && (
        <div className="mt-8 flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-800">Virtual Tour / 360°</p>
            <p className="text-xs text-indigo-500 truncate mt-0.5">{seller.virtualTourUrl}</p>
          </div>
          <a
            href={seller.virtualTourUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition">
            Open Tour →
          </a>
        </div>
      )}

      {/* Video Modal */}
      {activeVideo && (
        <VideoModal entry={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </div>
  );
}

// ─── Photos Tab ─────────────────────────────────────────────────────────────
function SellerPhotosTab({
  images,
  companyName,
}: {
  images: Array<{ _id: string; url: string; caption?: string; category?: string; isCover?: boolean }>;
  companyName: string;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (images.length === 0) {
    return (
      <div className="max-w-full px-6 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-5xl">📸</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Photos Available</h3>
          <p className="text-gray-500 max-w-md text-sm">
            {companyName} hasn't uploaded any gallery photos yet. Check back later for office, factory, and team photos.
          </p>
        </div>
      </div>
    );
  }

  // Group by category
  const categories = Array.from(new Set(images.map(img => img.category || 'other')));

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Company Photos</h2>
        <span className="text-sm text-gray-500">{images.length} photo{images.length !== 1 ? 's' : ''}</span>
      </div>

      {categories.map(cat => {
        const catImages = images.filter(img => (img.category || 'other') === cat);
        return (
          <div key={cat} className="mb-10">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 capitalize">
              {cat}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {catImages.map(img => (
                <button
                  key={img._id}
                  onClick={() => setLightbox(resolveImageUrl(img.url))}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 hover:shadow-lg transition"
                >
                  <img
                    src={resolveImageUrl(img.url)}
                    alt={img.caption || companyName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {img.isCover && (
                    <span className="absolute top-1.5 left-1.5 bg-yellow-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      ★ COVER
                    </span>
                  )}
                  {img.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                      {img.caption}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightbox}
            alt="Gallery"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ─── Certifications Section ──────────────────────────────────────────────────
function SellerCertificationsSection({ certs }: { certs: CertificationDoc[] }) {
  if (!certs?.length) return null;

  function formatDate(dateStr?: string) {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  }

  function isExpired(expiryDate?: string) {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  }

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        🏆 Certifications & Awards
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {certs.map((cert) => (
          <div
            key={cert._id}
            className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-md transition bg-gray-50"
          >
            {/* Icon / thumbnail */}
            <div className="flex-shrink-0">
              {cert.imageUrl ? (
                cert.fileType === 'pdf' ? (
                  <a href={resolveImageUrl(cert.imageUrl)} target="_blank" rel="noopener noreferrer"
                    className="w-14 h-14 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center hover:bg-red-100 transition">
                    <span className="text-2xl">📄</span>
                  </a>
                ) : (
                  <a href={resolveImageUrl(cert.imageUrl)} target="_blank" rel="noopener noreferrer">
                    <img
                      src={resolveImageUrl(cert.imageUrl)}
                      alt={cert.name}
                      className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                    />
                  </a>
                )
              ) : (
                <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏅</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <h4 className="font-bold text-gray-900 text-sm leading-tight">{cert.name}</h4>
                {cert.isAdminVerified && (
                  <span className="flex-shrink-0 text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                    ✓ Verified
                  </span>
                )}
              </div>
              {cert.issuingBody && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{cert.issuingBody}</p>
              )}
              {cert.certNumber && (
                <p className="text-xs text-gray-400 mt-0.5 font-mono">#{cert.certNumber}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {formatDate(cert.issuedDate) && (
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    Issued: {formatDate(cert.issuedDate)}
                  </span>
                )}
                {cert.expiryDate && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    isExpired(cert.expiryDate)
                      ? 'bg-red-100 text-red-600'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {isExpired(cert.expiryDate) ? 'Expired' : 'Valid until'}: {formatDate(cert.expiryDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
