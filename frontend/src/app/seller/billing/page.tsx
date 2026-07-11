"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  HiOutlineCreditCard,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineArrowUpRight,
  HiOutlineInboxArrowDown,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineArrowLeft,
  HiOutlineSparkles,
} from "react-icons/hi2";

interface Plan {
  _id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  limits: Record<string, any>;
}

interface Subscription {
  _id: string;
  plan: Plan;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  daysRemaining?: number;
}

interface Payment {
  _id: string;
  amount: number;
  invoiceNumber: string;
  completedAt: string;
  status: string;
  invoiceUrl?: string;
}

function SellerBillingContent() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, subRes, paymentsRes] = await Promise.all([
        api.get("/payments/plans?planFor=seller"),
        api.get("/payments/subscription?planFor=seller"),
        api.get("/payments/invoices")
      ]);

      setPlans(plansRes.data.data.plans);
      setCurrentSubscription(subRes.data.data.subscription);
      setPayments(paymentsRes.data.data.invoices);
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setProcessingId(planId);
    try {
      const plan = plans.find(p => p._id === planId);
      if (!plan) throw new Error("Plan not found");

      // Create order for seller plan
      const res = await api.post("/payments/subscribe-seller", { planId });

      // If free plan, no payment needed
      if (plan.price === 0) {
        toast.success("Free plan activated!");
        fetchData();
        setProcessingId(null);
        return;
      }

      // Load Razorpay script and open payment modal
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const options = {
          key: res.data.data.key,
          amount: res.data.data.amount,
          currency: "INR",
          order_id: res.data.data.orderId,
          name: "IndiaMart Seller Subscription",
          description: plan.name,
          handler: async (response: any) => {
            try {
              await api.post("/payments/verify-seller-payment", {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentId: res.data.data.paymentId,
                planId
              });

              toast.success("Payment successful! Your plan has been upgraded.");
              setTimeout(() => fetchData(), 2000);
            } catch (err: any) {
              toast.error(err?.response?.data?.message || "Payment verification failed");
            }
          },
          prefill: {
            email: user?.email,
            name: user?.name
          },
          theme: {
            color: "#1a56db"
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      document.head.appendChild(script);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to initiate payment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await api.post("/payments/cancel-subscription", { planFor: "seller" });
      toast.success("Subscription cancelled");
      setShowCancelModal(false);
      fetchData();
    } catch (err: any) {
      toast.error("Failed to cancel subscription");
    }
  };

  const downloadInvoice = async (paymentId: string) => {
    try {
      const res = await api.get(`/payments/invoice/${paymentId}`, {
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error("Failed to download invoice");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const daysRemaining = currentSubscription ? Math.ceil(
    (new Date(currentSubscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  ) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 rounded-lg hover:bg-gray-100">
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Current Plan Card */}
        {currentSubscription ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--primary)] to-blue-700 text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{currentSubscription.plan.name}</h2>
                  <p className="text-blue-100">Active subscription</p>
                </div>
                <HiOutlineCheckCircle className="w-8 h-8" />
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Plan details grid */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1 font-semibold">Monthly Price</p>
                  <p className="text-2xl font-bold text-gray-900">₹{currentSubscription.plan.price.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1 font-semibold">Valid Until</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(currentSubscription.endDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1 font-semibold">Days Remaining</p>
                  <p className={`text-2xl font-bold ${daysRemaining <= 7 ? "text-orange-600" : "text-green-600"}`}>
                    {daysRemaining}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1 font-semibold">Auto Renew</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {currentSubscription.autoRenew ? "✓ Enabled" : "✗ Disabled"}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              {daysRemaining > 0 && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Subscription validity</span>
                    <span className="text-sm font-semibold text-gray-900">{Math.max(0, 100 - Math.floor((daysRemaining / 30) * 100))}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${daysRemaining <= 7 ? "bg-orange-500" : "bg-green-500"}`}
                      style={{ width: `${Math.max(0, 100 - Math.floor((daysRemaining / 30) * 100))}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Features list */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Plan Features</h3>
                <ul className="grid md:grid-cols-2 gap-2">
                  {currentSubscription.plan.features.slice(0, 6).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-600 font-bold">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition"
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 text-center">
            <HiOutlineClock className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="text-gray-700 mb-3">No active subscription</p>
            <p className="text-sm text-gray-600 mb-4">Upgrade to Basic or Premium plan to unlock more features</p>
          </div>
        )}

        {/* Expiry warning */}
        {currentSubscription && daysRemaining <= 7 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <HiOutlineExclamationTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-orange-900">Subscription expiring soon</p>
              <p className="text-sm text-orange-800 mt-1">
                Your subscription will expire in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}. Upgrade or renew to continue enjoying premium features.
              </p>
            </div>
          </div>
        )}

        {/* Upgrade Plans Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Available Plans</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = currentSubscription?.plan._id === plan._id;
              const isHigher = currentSubscription ? plan.price > currentSubscription.plan.price : false;

              return (
                <div
                  key={plan._id}
                  className={`rounded-xl border transition ${
                    isCurrent
                      ? "border-[var(--primary)] bg-blue-50"
                      : "border-gray-100 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="p-5">
                    {isCurrent && (
                      <span className="inline-block px-3 py-1 bg-[var(--primary)] text-white text-xs font-bold rounded-full mb-3">
                        Current Plan
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                    <p className="text-3xl font-bold text-gray-900 mb-4">
                      ₹{plan.price.toLocaleString()}
                      {plan.price > 0 && <span className="text-sm text-gray-500">/month</span>}
                    </p>

                    {/* Key limits */}
                    <div className="space-y-2 mb-5 text-sm text-gray-700">
                      <p>📦 {plan.limits.maxProducts === -1 ? "Unlimited" : plan.limits.maxProducts} products</p>
                      <p>⭐ {plan.limits.featuredListings === -1 ? "Unlimited" : plan.limits.featuredListings} featured listings</p>
                      <p>📊 {plan.limits.analytics ? "Advanced" : "Basic"} analytics</p>
                    </div>

                    <button
                      onClick={() => handleUpgrade(plan._id)}
                      disabled={isCurrent || processingId === plan._id}
                      className={`w-full py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                        isCurrent
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : isHigher
                          ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {processingId === plan._id ? (
                        <>
                          <span className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : isCurrent ? (
                        "Current"
                      ) : isHigher ? (
                        <>
                          <HiOutlineArrowUpRight className="w-4 h-4" />
                          Upgrade
                        </>
                      ) : (
                        "Downgrade"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment History */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Billing History</h2>
          {payments.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(payment.completedAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-700">
                          {payment.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          ₹{payment.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                            Paid
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => downloadInvoice(payment._id)}
                            className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline text-sm font-semibold"
                          >
                            <HiOutlineInboxArrowDown className="w-4 h-4" />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <HiOutlineCreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No billing history yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mx-auto mb-4">
              <HiOutlineXMark className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Cancel Subscription?</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              You will lose access to premium features and be downgraded to the Free plan. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancelSubscription}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
              >
                Cancel Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SellerBillingPage() {
  return (
    <ProtectedRoute allowedRoles={["seller", "premium", "admin"]}>
      <SellerBillingContent />
    </ProtectedRoute>
  );
}
