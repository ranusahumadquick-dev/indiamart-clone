"use client";

import HeroSection from "@/components/home/HeroSection";
import GuestWelcomePopup from "@/components/GuestWelcomePopup";
import CategoriesSection from "@/components/home/CategoriesSection";
import ProductShowcase from "@/components/home/ProductShowcase";
import FeaturedProductsSection from "@/components/home/FeaturedProducts";
import FeaturedServicesSection from "@/components/home/FeaturedServices";
import TopSuppliersSection from "@/components/home/TopSuppliers";
import WhyChooseUsSection from "@/components/home/WhyChooseUs";
import StatsSection from "@/components/home/StatsSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";
import RecentlyViewedSection from "@/components/ui/RecentlyViewedSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <GuestWelcomePopup />

      {/* 1. Hero with ticker + carousel */}
      <HeroSection />

      {/* 2. Shop by Category */}
      <CategoriesSection />

      {/* 3. Product Showcase with category tabs */}
      <ProductShowcase />

      {/* 4. Featured Products */}
      <FeaturedProductsSection />

      {/* 4. Marketplace Statistics */}
      <StatsSection />

      {/* 5. Featured Services */}
      <FeaturedServicesSection />

      {/* 6. Top Verified Suppliers */}
      <TopSuppliersSection />

      {/* 7. Why Choose IndiaMart */}
      <WhyChooseUsSection />

      {/* 8. Customer Testimonials */}
      <TestimonialsSection />

      {/* 9. CTA — Sell / App / Newsletter / Post Requirement */}
      <CTASection />

      {/* 10. Recently Viewed */}
      <RecentlyViewedSection />
    </div>
  );
}
