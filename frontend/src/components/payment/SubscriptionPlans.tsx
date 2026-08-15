'use client';

import { useEffect, useState } from 'react';
import { usePayment } from '@/contexts/PaymentContext';
import { User } from '@/types';

interface Subscription {
  _id: string;
  name: string;
  plan?: {
    _id: string;
    name: string;
  };
}
import toast from 'react-hot-toast';

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  benefits: string[];
  limits: {
    maxProducts: number;
    maxInquiriesPerDay: number;
    maxImagesPerProduct: number;
    featuredListings: number;
    prioritySupport: boolean;
    analytics: boolean;
  };
  isPopular: boolean;
  sortOrder: number;
}

interface SubscriptionPlansProps {
  user: User | null;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ user }) => {
  const { loading, createOrder, getSubscriptionPlans } = usePayment();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await getSubscriptionPlans();
      setPlans(response.data.plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast.error('Please login to subscribe');
      return;
    }

    if (currentSubscription && currentSubscription.plan && currentSubscription.plan._id === plan._id) {
      toast.error('You already have this active subscription');
      return;
    }

    try {
      const orderData = await createOrder(
        plan.price,
        'subscription',
        { planId: plan._id, planName: plan.name }
      );

      // Payment will be handled by RazorpayCheckout component
      toast.success('Redirecting to payment...');
    } catch (error) {
      console.error('Error creating subscription order:', error);
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price}/month`;
  };

  const PopularBadge = () => (
    <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
      Popular
    </span>
  );

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
        <p className="text-xl text-gray-600">Select the perfect plan for your business needs</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`relative bg-white rounded-xl shadow-lg overflow-hidden ${
              plan.isPopular ? 'ring-2 ring-orange-500' : ''
            }`}
          >
            {plan.isPopular && <PopularBadge />}

            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-4xl font-bold text-blue-600 mb-4">
                  {formatPrice(plan.price)}
                </p>
                <p className="text-gray-600 mb-6">{plan.description}</p>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Features</h4>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Benefits</h4>
                <ul className="space-y-3">
                  {plan.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Limits</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Products</span>
                    <span className="font-semibold">
                      {plan.limits.maxProducts === -1 ? 'Unlimited' : plan.limits.maxProducts}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Inquiries</span>
                    <span className="font-semibold">
                      {plan.limits.maxInquiriesPerDay === -1 ? 'Unlimited' : plan.limits.maxInquiriesPerDay}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product Images</span>
                    <span className="font-semibold">{plan.limits.maxImagesPerProduct}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Featured Listings</span>
                    <span className="font-semibold">
                      {plan.limits.featuredListings === -1 ? 'Unlimited' : plan.limits.featuredListings}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority Support</span>
                    <span className="font-semibold">
                      {plan.limits.prioritySupport ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loading || user?.role === 'premium'}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition duration-200 ${
                  plan.isPopular
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } ${
                  user?.role === 'premium'
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {user?.role === 'premium' ? 'Active Plan' : loading ? 'Processing...' : 'Subscribe Now'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600">
          All plans include a 30-day money-back guarantee. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;