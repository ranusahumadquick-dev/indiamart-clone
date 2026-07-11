'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import ImageGallery from '@/components/services/ImageGallery';
import InquiryModal from '@/components/services/InquiryModal';
import {
  HiOutlineStar,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineChatBubbleLeftRight,
  HiArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';

interface Service {
  _id: string;
  serviceName: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  priceType: string;
  deliveryTime: number;
  revisions?: number;
  features: string[];
  images: Array<{ url: string; alt: string }>;
  provider: {
    userId: { _id: string; fullName: string; avatar?: string; companyName?: string; email?: string };
    isVerified: boolean;
    rating: number;
    responseTime?: string;
  };
  contact: {
    phone?: string;
    email?: string;
    preferredContact?: string;
  };
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  availability: string;
  views: number;
  inquiries: number;
  ratings: { average: number; total: number };
  portfolio?: Array<{ title: string; description: string; image?: string; link?: string }>;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  useEffect(() => {
    fetchService();
  }, [id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/services/${id}`);
      if (response.data.success) {
        setService(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      toast.error('Failed to load service details');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Service not found</h2>
          <Link href="/services" className="text-blue-600 hover:underline">
            ← Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <HiArrowLeft className="w-5 h-5" />
          Back to Services
        </Link>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Description */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6 mb-6">
              <ImageGallery images={service.images || []} serviceName={service.serviceName} />
            </div>

            {/* Service Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.serviceName}</h1>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <HiOutlineStar className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-semibold text-gray-900">{service.ratings.average.toFixed(1)}</span>
                  <span className="text-gray-500">({service.ratings.total} reviews)</span>
                </div>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-600">{service.views} views</span>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">About this service</h3>
                <p className="text-gray-700 leading-relaxed">{service.description}</p>
              </div>

              {/* Features */}
              {service.features && service.features.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">What's included</h3>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <HiOutlineCheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Portfolio */}
            {service.portfolio && service.portfolio.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Portfolio</h3>
                <div className="space-y-4">
                  {service.portfolio.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                        >
                          View →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Provider Info & CTA */}
          <div>
            {/* Price Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 sticky top-4">
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-2">Price</p>
                <p className="text-4xl font-bold text-blue-600 mb-1">₹{service.price.toLocaleString()}</p>
                <p className="text-gray-600 text-sm">
                  {service.priceType === 'hourly' ? 'Per hour' : 'Fixed price'}
                </p>
              </div>

              <div className="space-y-3 mb-6 border-t border-b border-gray-200 py-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery time</span>
                  <span className="font-semibold text-gray-900">{service.deliveryTime} days</span>
                </div>
                {service.revisions && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revisions</span>
                    <span className="font-semibold text-gray-900">{service.revisions}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowInquiryModal(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold mb-3"
              >
                <div className="flex items-center justify-center gap-2">
                  <HiOutlineChatBubbleLeftRight className="w-5 h-5" />
                  Send Inquiry
                </div>
              </button>

              {service.availability === 'available' && (
                <div className="text-center text-green-600 text-sm font-medium">
                  ✓ Available now
                </div>
              )}
            </div>

            {/* Provider Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Service Provider</h3>

              <Link
                href={`/sellers/${service.provider.userId._id}`}
                className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200 hover:opacity-80 transition group"
              >
                {service.provider.userId.avatar ? (
                  <Image
                    src={service.provider.userId.avatar}
                    alt={service.provider.userId.fullName}
                    width={60}
                    height={60}
                    className="rounded-full group-hover:ring-2 group-hover:ring-blue-400 transition"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full group-hover:ring-2 group-hover:ring-blue-400 transition" />
                )}
                <div>
                  <p className="text-lg font-bold text-blue-600 group-hover:text-blue-700 transition">
                    {service.provider.userId.companyName || service.provider.userId.fullName}
                  </p>
                  {service.provider.isVerified && (
                    <p className="text-sm text-green-600 font-medium">✓ Verified seller</p>
                  )}
                </div>
              </Link>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <HiOutlineStar className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-gray-900 font-medium">{service.provider.rating}/5</span>
                  <span className="text-gray-600 text-sm">Rating</span>
                </div>
                {service.provider.responseTime && (
                  <p className="text-sm text-gray-600">
                    Response time: <span className="font-medium">{service.provider.responseTime}</span>
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-4">
                {service.contact.phone && (
                  <a
                    href={`tel:${service.contact.phone}`}
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition"
                  >
                    <HiOutlinePhone className="w-5 h-5" />
                    {service.contact.phone}
                  </a>
                )}
                {service.contact.email && (
                  <a
                    href={`mailto:${service.contact.email}`}
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition"
                  >
                    <HiOutlineEnvelope className="w-5 h-5" />
                    {service.contact.email}
                  </a>
                )}
              </div>

              {/* View Profile Button */}
              <Link
                href={`/sellers/${service.provider.userId._id}`}
                className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition font-medium text-sm text-center border border-blue-200"
              >
                View Seller Profile
              </Link>
            </div>

            {/* Location */}
            {service.location && (service.location.city || service.location.state) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Location</h3>
                <div className="flex items-start gap-3">
                  <HiOutlineMapPin className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    {service.location.city && <p className="text-gray-900 font-medium">{service.location.city}</p>}
                    {service.location.state && <p className="text-gray-600 text-sm">{service.location.state}</p>}
                    {service.location.country && (
                      <p className="text-gray-600 text-sm">{service.location.country}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      <InquiryModal
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        serviceId={service._id}
        serviceName={service.serviceName}
        sellerId={service.provider.userId._id}
        sellerName={service.provider.userId.companyName || service.provider.userId.fullName}
      />
    </div>
  );
}
