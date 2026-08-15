"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HiOutlineChevronDown,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineChatBubbleLeftRight,
  HiOutlineQuestionMarkCircle,
  HiOutlineShoppingBag,
  HiOutlineBuildingStorefront,
  HiOutlineCreditCard,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from "@/lib/icons";

const HelpCenter = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const contactMethods = [
    {
      icon: HiOutlinePhone,
      title: "Phone Support",
      description: "Call our dedicated support team",
      value: "+91 1234-567-890",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: HiOutlineEnvelope,
      title: "Email Support",
      description: "Send us an email anytime",
      value: "support@indiamart.com",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: HiOutlineChatBubbleLeftRight,
      title: "Live Chat",
      description: "Chat with our support team",
      value: "Available 9 AM - 9 PM IST",
      color: "bg-orange-100 text-orange-600",
    },
  ];

  const categories = [
    {
      icon: HiOutlineShoppingBag,
      title: "For Buyers",
      items: [
        "How to place an order",
        "Payment methods",
        "Order tracking",
        "Returns & refunds",
        "Billing inquiries",
      ],
    },
    {
      icon: HiOutlineBuildingStorefront,
      title: "For Sellers",
      items: [
        "Seller registration",
        "Product listing",
        "Pricing strategy",
        "Order fulfillment",
        "Seller analytics",
      ],
    },
    {
      icon: HiOutlineCreditCard,
      title: "Payments & Billing",
      items: [
        "Payment methods",
        "Invoice generation",
        "Refund process",
        "Wallet usage",
        "Tax information",
      ],
    },
    {
      icon: HiOutlineTruck,
      title: "Shipping & Logistics",
      items: [
        "Shipping rates",
        "Delivery times",
        "Track your order",
        "Packaging guidelines",
        "Return shipping",
      ],
    },
  ];

  const faqs = [
    {
      question: "How do I create an account on IndiaMart?",
      answer:
        "Visit our registration page, select your role (Buyer/Seller), and fill in your details. Verify your email and phone number to complete the registration.",
    },
    {
      question: "What are the payment methods accepted?",
      answer:
        "We accept credit cards, debit cards, net banking, UPI, digital wallets, and cheque/DD for B2B transactions.",
    },
    {
      question: "How long does delivery take?",
      answer:
        "Delivery time depends on your location and the seller's logistics partner. Most orders are delivered within 3-7 business days. You can track your order in real-time.",
    },
    {
      question: "What is IndiaMart's return policy?",
      answer:
        "Most products can be returned within 7-30 days of delivery (depending on the seller). The item should be in original condition. Return shipping is free for most items.",
    },
    {
      question: "How can I become a seller on IndiaMart?",
      answer:
        "Visit our Become a Seller page, register with your business details, complete KYC verification, and start listing your products.",
    },
    {
      question: "Is my payment secure on IndiaMart?",
      answer:
        "Yes, we use industry-leading encryption (SSL) and comply with PCI-DSS standards. All transactions are secure and protected.",
    },
    {
      question: "How do I contact seller support?",
      answer:
        "You can reach our seller support through phone, email, or live chat. We also have a dedicated seller dashboard with support tickets.",
    },
    {
      question: "Can I cancel my order?",
      answer:
        "Orders can be cancelled within 24 hours of placement if they haven't been shipped. After that, you can process a return.",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-lg text-blue-100 mb-8">
            Find answers to your questions and get support when you need it
          </p>
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for help topics, FAQs, articles..."
                className="w-full px-6 py-4 rounded-lg text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Contact */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Get in Touch
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition text-center"
              >
                <div
                  className={`w-16 h-16 rounded-full ${method.color} flex items-center justify-center mx-auto mb-4`}
                >
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {method.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">{method.description}</p>
                <p className="text-blue-600 font-semibold">{method.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Browse by Category */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category.title}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <button className="text-blue-600 hover:text-blue-700 hover:underline text-sm text-left w-full">
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full flex items-start gap-4 p-4 hover:bg-gray-50 transition text-left"
              >
                <HiOutlineQuestionMarkCircle className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                </div>
                <HiOutlineChevronDown
                  className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${
                    expandedFaq === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedFaq === index && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-blue-50 py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Quick Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/products"
              className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition"
            >
              <HiOutlineShoppingBag className="w-6 h-6 text-blue-600" />
              <span className="font-medium text-gray-900">Browse Products</span>
            </Link>
            <Link
              href="/sell"
              className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition"
            >
              <HiOutlineBuildingStorefront className="w-6 h-6 text-blue-600" />
              <span className="font-medium text-gray-900">Become a Seller</span>
            </Link>
            <Link
              href="/auth/login"
              className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition"
            >
              <HiOutlineCheckCircle className="w-6 h-6 text-blue-600" />
              <span className="font-medium text-gray-900">Account Login</span>
            </Link>
            <button className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition">
              <HiOutlineExclamationTriangle className="w-6 h-6 text-blue-600" />
              <span className="font-medium text-gray-900">Report an Issue</span>
            </button>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Didn't find what you're looking for?</h2>
          <p className="text-gray-300 mb-8">
            Our support team is available 24/7 to help you with any questions or concerns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              Contact Support
            </button>
            <Link
              href="/"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default HelpCenter;
