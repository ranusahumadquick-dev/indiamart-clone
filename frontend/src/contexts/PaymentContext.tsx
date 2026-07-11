'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { User } from '@/types';

interface PaymentContextType {
  loading: boolean;
  createOrder: (amount: number, paymentFor: string, metadata?: any) => Promise<any>;
  verifyPayment: (paymentId: string, orderId: string, razorpayPaymentId: string, signature: string) => Promise<any>;
  getPaymentHistory: (filters?: any) => Promise<any>;
  getActiveSubscription: () => Promise<any>;
  cancelSubscription: (reason?: string) => Promise<any>;
  getSubscriptionPlans: () => Promise<any>;
  subscription: any;
  paymentHistory: any[];
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

interface PaymentProviderProps {
  children: ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  // Note: Subscription is fetched by individual pages that know the user type (seller/buyer)
  // Don't fetch here without knowing planFor parameter

  const createOrder = async (amount: number, paymentFor: string, metadata?: any) => {
    try {
      setLoading(true);
      const response = await api.post('/payments/create-order', {
        amount,
        currency: 'INR',
        paymentFor,
        metadata: metadata || {}
      });
      
      toast.success('Payment order created successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      toast.error(error.response?.data?.message || 'Failed to create payment order');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) => {
    try {
      setLoading(true);
      const response = await api.post(`/payments/verify-payment/${paymentId}`, {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature
      });
      
      toast.success('Payment verified successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      toast.error(error.response?.data?.message || 'Payment verification failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getPaymentHistory = async (filters?: any) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, String(value));
          }
        });
      }
      
      const response = await api.get(`/payments/history?${params.toString()}`);
      setPaymentHistory(response.data.data.payments);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch payment history');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getActiveSubscription = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/subscription');
      const subscription = response.data.data?.subscription || null;
      setSubscription(subscription);
      return subscription;
    } catch (error: any) {
      // Silently fail
      setSubscription(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (reason?: string) => {
    try {
      setLoading(true);
      const response = await api.post('/payments/cancel-subscription', {
        reason: reason || 'User requested cancellation'
      });
      
      setSubscription(response.data.data.subscription);
      toast.success('Subscription cancelled successfully');
      return response.data.data.subscription;
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/plans');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching subscription plans:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch subscription plans');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaymentContext.Provider value={{
      loading,
      createOrder,
      verifyPayment,
      getPaymentHistory,
      getActiveSubscription,
      cancelSubscription,
      getSubscriptionPlans,
      subscription,
      paymentHistory
    }}>
      {children}
    </PaymentContext.Provider>
  );
};