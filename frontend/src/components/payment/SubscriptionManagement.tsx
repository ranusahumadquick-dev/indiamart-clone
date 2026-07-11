'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePayment } from '@/contexts/PaymentContext';
import { User } from '@/types';
import toast from 'react-hot-toast';

interface ApiError {
  message: string;
  response?: {
    data?: {
      message: string;
    };
  };
}

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
}

interface Subscription {
  _id: string;
  name: string;
  price: number;
  duration: number;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  daysRemaining: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  plan: SubscriptionPlan;
}

interface SubscriptionManagementProps {
  user: User | null;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ user }) => {
  const { loading, subscription, getActiveSubscription, cancelSubscription, getSubscriptionPlans } = usePayment();
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchSubscription = useCallback(async () => {
    try {
      const response = await getActiveSubscription();
      setSubscriptionData(response.data.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  }, [getActiveSubscription, setSubscriptionData]);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await getSubscriptionPlans();
      setAllPlans(response.data.plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  }, [getSubscriptionPlans, setAllPlans]);

  useEffect(() => {
    if (user) {
      fetchSubscription();
      fetchPlans();
    }
  }, [user, fetchSubscription, fetchPlans]);

  const handleCancelSubscription = async () => {
    if (!subscriptionData) return;

    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
      return;
    }

    try {
      setCancelling(true);
      await cancelSubscription('User requested cancellation');
      toast.success('Subscription cancelled successfully');
      fetchSubscription();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(error?.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price}/month`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Subscription Management</h2>
          <p className="text-gray-600">Please login to manage your subscription.</p>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">No Active Subscription</h2>
          <p className="text-gray-600 mb-8">You currently don't have an active subscription.</p>
          <a
            href="/subscription/plans"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            View Plans
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Subscription Management</h2>
        <p className="text-gray-600">Manage your active subscription and billing information</p>
      </div>

      {/* Current Subscription Card */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {subscriptionData.name}
            </h3>
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {formatPrice(subscriptionData.price)}
            </p>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                subscriptionData.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1)}
              </span>
              {subscriptionData.isExpiringSoon && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  Expiring Soon
                </span>
              )}
              {subscriptionData.isExpired && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  Expired
                </span>
              )}
            </div>
          </div>

          {subscriptionData.status === 'active' && !subscriptionData.isExpired && (
            <button
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Start Date</div>
            <div className="font-semibold text-gray-900">{formatDate(subscriptionData.startDate)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">End Date</div>
            <div className="font-semibold text-gray-900">{formatDate(subscriptionData.endDate)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Days Remaining</div>
            <div className="font-semibold text-gray-900">{subscriptionData.daysRemaining}</div>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Features</h4>
          <ul className="space-y-2">
            {subscriptionData.plan.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Usage Limits</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Products</div>
              <div className="font-semibold text-gray-900">
                {subscriptionData.plan.limits.maxProducts === -1 ? 'Unlimited' : subscriptionData.plan.limits.maxProducts}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Daily Inquiries</div>
              <div className="font-semibold text-gray-900">
                {subscriptionData.plan.limits.maxInquiriesPerDay === -1 ? 'Unlimited' : subscriptionData.plan.limits.maxInquiriesPerDay}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Product Images</div>
              <div className="font-semibold text-gray-900">{subscriptionData.plan.limits.maxImagesPerProduct}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Featured Listings</div>
              <div className="font-semibold text-gray-900">
                {subscriptionData.plan.limits.featuredListings === -1 ? 'Unlimited' : subscriptionData.plan.limits.featuredListings}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-gray-900">Auto Renewal</div>
              <div className="text-sm text-gray-600">
                {subscriptionData.autoRenew ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
          {subscriptionData.autoRenew && (
            <button
              onClick={() => {
                // TODO: Implement toggle auto-renewal
                toast.success('Auto-renewal settings updated');
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Change
            </button>
          )}
        </div>
      </div>

      {/* Upgrade Section */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Upgrade Your Plan</h3>
        <p className="text-gray-600 mb-8">
          See other available plans if you need more features or higher limits.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {allPlans
            .filter(plan => plan._id !== subscriptionData.plan._id)
            .map((plan) => (
              <div
                key={plan._id}
                className={`relative bg-white border border-gray-200 rounded-xl overflow-hidden ${
                  plan.isPopular ? 'ring-2 ring-orange-500' : ''
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                    Popular
                  </span>
                )}

                <div className="p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                  <p className="text-2xl font-bold text-blue-600 mb-4">
                    {formatPrice(plan.price)}
                  </p>
                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  <ul className="space-y-2 mb-6">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      // TODO: Implement upgrade flow
                      toast.success('Redirecting to upgrade...');
                    }}
                    className="w-full py-3 px-6 rounded-lg font-semibold transition duration-200 ${
                      plan.isPopular
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;