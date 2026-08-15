"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  HiOutlineArrowRight,
  HiOutlineStar,
  HiOutlineClock,
  HiOutlineCheckBadge,
  HiOutlineChatBubbleLeftRight,
  HiOutlineWrench,
  HiOutlineCog6Tooth,
  HiOutlineTruck,
  HiOutlineDevicePhoneMobile,
  HiOutlineClipboardDocumentList,
} from "@/lib/icons";
import { Lightbulb, Paintbrush, type LucideIcon } from "lucide-react";
import api from "@/lib/axios";
import { resolveImageUrl } from "@/lib/imageUrl";

interface Service {
  _id: string;
  serviceName: string;
  price: number;
  category: string;
  images: { url: string; alt: string }[];
  deliveryTime: number;
  provider: {
    userId: { _id: string; fullName: string; companyName?: string };
    rating: number;
    isVerified: boolean;
  };
  ratings: { average: number; total: number };
}

const FALLBACK_SERVICES = [
  {
    _id: "s1", serviceName: "Custom Manufacturing & OEM Solutions", price: 50000, category: "Manufacturing",
    images: [{ url: "", alt: "Manufacturing" }], deliveryTime: 15,
    provider: { userId: { _id: "u1", fullName: "Rajesh Kumar", companyName: "TechFab Industries" }, rating: 4.8, isVerified: true },
    ratings: { average: 4.8, total: 120 },
  },
  {
    _id: "s2", serviceName: "Pan-India Logistics & Warehousing", price: 25000, category: "Logistics",
    images: [{ url: "", alt: "Logistics" }], deliveryTime: 5,
    provider: { userId: { _id: "u2", fullName: "Amit Patel", companyName: "FastTrack Logistics" }, rating: 4.6, isVerified: true },
    ratings: { average: 4.6, total: 85 },
  },
  {
    _id: "s3", serviceName: "Quality Testing & Certification", price: 15000, category: "Quality Testing",
    images: [{ url: "", alt: "Quality Testing" }], deliveryTime: 7,
    provider: { userId: { _id: "u3", fullName: "Dr. Neha Singh", companyName: "QualityCert Labs" }, rating: 4.9, isVerified: true },
    ratings: { average: 4.9, total: 200 },
  },
  {
    _id: "s4", serviceName: "Business Consulting & Advisory", price: 35000, category: "Consulting",
    images: [{ url: "", alt: "Consulting" }], deliveryTime: 10,
    provider: { userId: { _id: "u4", fullName: "Vikram Mehta", companyName: "Mehta Advisory" }, rating: 4.7, isVerified: true },
    ratings: { average: 4.7, total: 60 },
  },
  {
    _id: "s5", serviceName: "Packaging Design & Development", price: 20000, category: "Design",
    images: [{ url: "", alt: "Packaging" }], deliveryTime: 12,
    provider: { userId: { _id: "u5", fullName: "Priya Sharma", companyName: "DesignBox Studio" }, rating: 4.5, isVerified: true },
    ratings: { average: 4.5, total: 45 },
  },
  {
    _id: "s6", serviceName: "Digital Marketing for B2B", price: 30000, category: "Marketing",
    images: [{ url: "", alt: "Marketing" }], deliveryTime: 3,
    provider: { userId: { _id: "u6", fullName: "Arjun Rao", companyName: "B2B Digital Pro" }, rating: 4.8, isVerified: true },
    ratings: { average: 4.8, total: 150 },
  },
];

const SERVICE_META: Record<string, { icon: LucideIcon; gradient: string; bg: string }> = {
  Manufacturing: { icon: HiOutlineCog6Tooth, gradient: "from-blue-500 to-blue-700", bg: "bg-blue-50" },
  Logistics: { icon: HiOutlineTruck, gradient: "from-emerald-500 to-emerald-700", bg: "bg-emerald-50" },
  "Quality Testing": { icon: HiOutlineCheckBadge, gradient: "from-purple-500 to-purple-700", bg: "bg-purple-50" },
  Consulting: { icon: Lightbulb, gradient: "from-amber-500 to-amber-700", bg: "bg-amber-50" },
  Design: { icon: Paintbrush, gradient: "from-pink-500 to-pink-700", bg: "bg-pink-50" },
  Marketing: { icon: HiOutlineDevicePhoneMobile, gradient: "from-cyan-500 to-cyan-700", bg: "bg-cyan-50" },
};

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function FeaturedServicesSection() {
  const [services, setServices] = useState<Service[]>(FALLBACK_SERVICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/services?page=1&limit=6").then((res) => {
      if (res.data?.success && res.data?.data?.services?.length > 0) {
        setServices(res.data.data.services);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-8 bg-purple-500 rounded-full" />
              <span className="text-purple-600 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <HiOutlineWrench className="w-3.5 h-3.5" />
                B2B Services
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
              Business Services
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Manufacturing, logistics, consulting & more from verified providers
            </p>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-[#0052cc] font-semibold hover:gap-3 transition-all text-sm group"
          >
            View All Services
            <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-6 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service) => {
              const meta = SERVICE_META[service.category] || { icon: HiOutlineClipboardDocumentList, gradient: "from-gray-500 to-gray-700", bg: "bg-gray-50" };
              const hasImage = service.images?.[0]?.url;

              return (
                <Link
                  key={service._id}
                  href={`/services/${service._id}`}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-2xl hover:shadow-purple-50 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                >
                  {/* Image / Icon Header */}
                  <div className="relative h-44 overflow-hidden">
                    {hasImage ? (
                      <Image
                        src={resolveImageUrl(service.images[0].url)}
                        alt={service.serviceName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`h-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
                        <meta.icon className="w-14 h-14 text-white/90" />
                      </div>
                    )}

                    {/* Overlay badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                      <span className={`${meta.bg} text-xs font-bold px-2.5 py-1 rounded-lg border border-white/50 backdrop-blur-sm`}>
                        {service.category}
                      </span>
                      {service.provider?.isVerified && (
                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <HiOutlineCheckBadge className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-3 text-sm group-hover:text-purple-600 transition-colors leading-snug">
                      {service.serviceName}
                    </h3>

                    {/* Price + Delivery */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xl font-black text-gray-900">{formatINR(service.price)}</span>
                        <span className="text-xs text-gray-400 ml-1">onwards</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <HiOutlineClock className="w-3.5 h-3.5" />
                        {service.deliveryTime} days
                      </div>
                    </div>

                    {/* Provider + Rating */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-4">
                      <p className="text-xs text-gray-600 font-medium truncate max-w-[150px]">
                        {service.provider?.userId?.companyName || service.provider?.userId?.fullName || "Provider"}
                      </p>
                      <div className="flex items-center gap-1">
                        <HiOutlineStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-gray-900">{service.ratings?.average || 0}</span>
                        <span className="text-[10px] text-gray-400">({service.ratings?.total || 0})</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <span className="w-full text-center block bg-purple-50 text-purple-700 text-xs font-bold py-2.5 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                      <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
                      Contact Provider
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
