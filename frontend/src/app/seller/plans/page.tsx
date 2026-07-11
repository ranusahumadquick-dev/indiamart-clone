"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiCheckCircle,
  HiXCircle,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineCurrencyRupee,
  HiOutlineChartBarSquare,
} from "react-icons/hi2";

interface SellerPlanLimits {
  maxProducts: number;
  featuredListings: number;
  maxInquiriesPerDay: number;
  prioritySupport: boolean;
  analytics: boolean;
}

interface SellerPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  limits: SellerPlanLimits;
  features: string[];
  isPopular?: boolean;
}

export default function SellerPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SellerPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get("/payments/plans?planFor=seller");
      if (response.data.success) {
        setPlans(response.data.data.plans || []);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setSubscribingPlanId(planId);
      const response = await api.post("/payments/subscribe-seller", {
        planId,
        planFor: "seller",
      });

      if (response.data.success && response.data.data.sessionUrl) {
        window.location.href = response.data.data.sessionUrl;
      } else {
        toast.error("Failed to initiate subscription");
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.response?.data?.message || "Failed to subscribe");
    } finally {
      setSubscribingPlanId(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["seller"]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  const currentPlan = plans.find((p) => p.name === "Free Plan");
  const freePlan = plans.find((p) => p.price === 0);

  return (
    <ProtectedRoute allowedRoles={["seller"]}>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
        {/* Header */}
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Seller Subscription Plans
          </h1>
          <p className="text-lg text-gray-600">
            Choose the perfect plan to grow your business on India's largest B2B marketplace
          </p>
        </div>

        {/* Plans Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`relative rounded-2xl border-2 transition-all hover:shadow-lg ${
                plan.isPopular
                  ? "border-blue-600 bg-blue-50 shadow-lg md:scale-105"
                  : "border-gray-200 bg-white"
              }`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className="p-6">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      ₹{plan.price}
                    </span>
                    <span className="text-gray-600">/{plan.billingCycle}</span>
                  </div>
                  {plan.price === 0 && (
                    <p className="text-sm text-green-600 font-semibold mt-2">
                      Free Forever
                    </p>
                  )}
                </div>

                {/* Subscribe Button */}
                {plan.price === 0 ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-600 font-semibold mb-6 cursor-default"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan._id)}
                    disabled={subscribingPlanId === plan._id}
                    className={`w-full py-3 px-4 rounded-lg font-semibold mb-6 transition-all flex items-center justify-center gap-2 ${
                      plan.isPopular
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {subscribingPlanId === plan._id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      <>
                        Subscribe Now
                        <HiOutlineArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                {/* Limits */}
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <HiOutlineChartBarSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      {plan.limits.maxProducts === -1
                        ? "Unlimited Products"
                        : `${plan.limits.maxProducts} Products`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <HiOutlineSparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      {plan.limits.featuredListings === -1
                        ? "Unlimited Featured"
                        : `${plan.limits.featuredListings} Featured Listings`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <HiOutlineCurrencyRupee className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      {plan.limits.maxInquiriesPerDay === -1
                        ? "Unlimited Inquiries/Day"
                        : `${plan.limits.maxInquiriesPerDay} Inquiries/Day`}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {plan.limits.prioritySupport && (
                    <div className="flex items-center gap-2">
                      <HiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        Priority Support
                      </span>
                    </div>
                  )}
                  {plan.limits.analytics && (
                    <div className="flex items-center gap-2">
                      <HiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        Advanced Analytics
                      </span>
                    </div>
                  )}
                  {!plan.limits.prioritySupport && (
                    <div className="flex items-center gap-2">
                      <HiXCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-500">
                        Priority Support
                      </span>
                    </div>
                  )}
                  {!plan.limits.analytics && (
                    <div className="flex items-center gap-2">
                      <HiXCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-500">
                        Advanced Analytics
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit/debit cards and digital payment methods through our secure payment gateway.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! Our Free Plan gives you full access to core features. Upgrade anytime to unlock premium capabilities.
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-12">
          <Link
            href="/seller/dashboard"
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center justify-center gap-2"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
