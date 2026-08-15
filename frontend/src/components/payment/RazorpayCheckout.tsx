'use client';

import { useEffect, useRef, useState } from 'react';
import { usePayment } from '@/contexts/PaymentContext';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  orderData: {
    id: string;
    amount: number;
    currency: string;
    key: string;
  };
  onSuccess: (data: { success: boolean; [key: string]: any }) => void;
  onError?: (error: { message: string; [key: string]: any }) => void;
}

const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({ orderData, onSuccess, onError }) => {
  const { verifyPayment } = usePayment();
  const [loading, setLoading] = useState(false);
  const razorpayRef = useRef<any>(null);

  const handlePaymentSuccess = async (razorpayPaymentId: string, razorpayOrderId: string) => {
    try {
      setLoading(true);
      
      // Verify payment with backend
      const response = await verifyPayment(orderData.id, razorpayOrderId, razorpayPaymentId, '');
      onSuccess(response);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
      onError?.(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: any) => {
    onError?.(error);
    toast.error('Payment failed. Please try again.');
  };

  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const initializeRazorpay = async () => {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        toast.error('Failed to load Razorpay SDK');
        return;
      }

      razorpayRef.current = new window.Razorpay({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'IndiaMart Clone',
        description: 'Payment for subscription',
        image: '/favicon.ico',
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        notes: {
          address: 'IndiaMart Clone Payment'
        },
        theme: {
          color: '#3b82f6'
        }
      });

      if (razorpayRef.current) {
        razorpayRef.current.on('payment.success', (response: any) => {
          handlePaymentSuccess(response.razorpay_payment_id, response.razorpay_order_id);
        });

        razorpayRef.current.on('payment.failed', handlePaymentError);
      }
    };

    initializeRazorpay();

    return () => {
      if (razorpayRef.current) {
        razorpayRef.current.clear();
      }
    };
  }, [orderData, verifyPayment, onSuccess, onError]);

  const openCheckout = () => {
    if (razorpayRef.current) {
      razorpayRef.current.open();
    }
  };

  return (
    <button
      onClick={openCheckout}
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Processing...' : 'Pay Now'}
    </button>
  );
};

export default RazorpayCheckout;