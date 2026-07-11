"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  HiOutlineShoppingCart,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBeaker,
  HiOutlineDocumentText,
  HiOutlineCreditCard,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineStar,
  HiOutlineArrowRight,
} from "react-icons/hi2";

const STAGES = [
  {
    num: 1,
    title: "Find Supplier",
    description: "Search products and identify suppliers",
    icon: HiOutlineShoppingCart,
    status: "completed",
    href: "/products",
  },
  {
    num: 2,
    title: "Compare Prices",
    description: "View pricing, MOQ, bulk discounts",
    icon: HiOutlineChatBubbleLeftRight,
    status: "active",
    href: "/buyer/cart",
  },
  {
    num: 3,
    title: "Send Inquiry",
    description: "Request quote from supplier",
    icon: HiOutlineDocumentText,
    status: "pending",
    href: "/buyer/inquiries",
  },
  {
    num: 4,
    title: "Get Quote",
    description: "Receive pricing and payment terms",
    icon: HiOutlineCreditCard,
    status: "pending",
    href: "/buyer/inquiries",
  },
  {
    num: 5,
    title: "Negotiate",
    description: "Discuss price, MOQ, bulk discounts, payment terms",
    icon: HiOutlineChatBubbleLeftRight,
    status: "pending",
    href: "/buyer/procurement/stage5",
  },
  {
    num: 6,
    title: "Request Sample",
    description: "Order sample (5-20 units) for quality check",
    icon: HiOutlineBeaker,
    status: "pending",
    href: "/buyer/procurement/stage6",
  },
  {
    num: 7,
    title: "Create PO",
    description: "Generate Purchase Order with specs & terms",
    icon: HiOutlineDocumentText,
    status: "pending",
    href: "/buyer/orders",
  },
  {
    num: 8,
    title: "Make Payment",
    description: "Pay advance (30-50%) + track payments",
    icon: HiOutlineCreditCard,
    status: "pending",
    href: "/buyer/orders",
  },
  {
    num: 9,
    title: "Track Production",
    description: "Monitor production + get weekly updates",
    icon: HiOutlineArrowPath,
    status: "pending",
    href: "/buyer/orders",
  },
  {
    num: 10,
    title: "Inspect Delivery",
    description: "Verify quality, quantity, packaging on delivery",
    icon: HiOutlineCheckCircle,
    status: "pending",
    href: "/buyer/orders",
  },
  {
    num: 11,
    title: "Review Supplier",
    description: "Write review & save supplier as favorite",
    icon: HiOutlineStar,
    status: "pending",
    href: "/buyer/chats",
  },
];

function ProcurementDashboard() {
  const { user, loading } = useAuth();
  const [activeStage, setActiveStage] = useState(2);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your procurement journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">B2B Procurement Journey</h1>
          <p className="text-gray-600 mt-1">Complete 11-stage buying process from supplier search to relationship building</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Progress Overview */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Your Procurement Workflow</h2>

          {/* Horizontal Timeline */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const isCompleted = stage.status === "completed";
                const isActive = stage.status === "active";
                const isPending = stage.status === "pending";

                return (
                  <div
                    key={stage.num}
                    className={`flex-shrink-0 w-32 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isCompleted
                        ? "border-green-400 bg-green-50"
                        : isActive
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-300"
                        : "border-gray-200 bg-gray-50"
                    }`}
                    onClick={() => setActiveStage(stage.num)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="w-5 h-5 text-gray-700" />
                      <span className={`text-xs font-bold ${isCompleted ? "text-green-600" : isActive ? "text-blue-600" : "text-gray-400"}`}>
                        {isCompleted ? "✓" : stage.num}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800">{stage.title}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connection lines */}
          <div className="h-1 bg-gradient-to-r from-green-400 via-blue-500 to-gray-300 rounded-full mt-4 opacity-30"></div>
        </div>

        {/* Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STAGES.map((stage) => {
            const Icon = stage.icon;
            const isCompleted = stage.status === "completed";
            const isActive = stage.status === "active";

            return (
              <div
                key={stage.num}
                className={`rounded-2xl border-2 p-6 transition-all ${
                  isCompleted
                    ? "border-green-200 bg-green-50"
                    : isActive
                    ? "border-blue-400 bg-blue-50 shadow-lg shadow-blue-200"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isCompleted ? "bg-green-500 text-white" : isActive ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isCompleted ? "bg-green-200 text-green-800" : isActive ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-700"
                  }`}>
                    {isCompleted ? "Completed" : isActive ? "Active" : "Coming"}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Stage {stage.num}: {stage.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{stage.description}</p>

                {/* CTA Button */}
                {stage.href ? (
                  <Link href={stage.href}>
                    <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2">
                      Start <HiOutlineArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                ) : (
                  <button disabled className="w-full bg-gray-200 text-gray-500 font-semibold py-2.5 rounded-xl cursor-not-allowed">
                    Coming Soon
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Resources Section */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">📚 Resources & Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Negotiation Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ask for volume-based discounts</li>
                <li>• Negotiate payment terms (advance %)</li>
                <li>• Request sample before bulk order</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">✓ Quality Check Points</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Verify product specifications</li>
                <li>• Check packaging & labeling</li>
                <li>• Document with photos/videos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProcurementPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "premium"]}>
      <ProcurementDashboard />
    </ProtectedRoute>
  );
}
