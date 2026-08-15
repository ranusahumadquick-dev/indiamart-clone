'use client';

import { useState, useEffect } from 'react';
import { usePayment } from '@/contexts/PaymentContext';
import { User } from '@/types';
import toast from 'react-hot-toast';

interface Payment {
  _id: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  paymentFor: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
}

interface PaymentHistoryProps {
  user: User | null;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ user }) => {
  const { loading, getPaymentHistory } = usePayment();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    paymentFor: '',
    page: 1,
    limit: 10
  });
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user, filters]);

  const fetchPayments = async () => {
    try {
      const response = await getPaymentHistory(filters);
      setPayments(response.data.payments);
      setTotal(response.data.pagination.totalItems);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filter changes
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    const statusLabels = {
      completed: 'Completed',
      failed: 'Failed',
      pending: 'Pending',
      cancelled: 'Cancelled'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses]}`}>
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    );
  };

  const formatPaymentFor = (paymentFor: string) => {
    const labels = {
      subscription: 'Subscription',
      product: 'Product',
      listing: 'Listing',
      advertisement: 'Advertisement',
      other: 'Other'
    };
    return labels[paymentFor as keyof typeof labels] || paymentFor;
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment History</h2>
        <p className="text-gray-600">View all your past and current payments</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="paymentFor" className="block text-sm font-medium text-gray-700 mb-2">
              Payment For
            </label>
            <select
              id="paymentFor"
              value={filters.paymentFor}
              onChange={(e) => handleFilterChange('paymentFor', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="subscription">Subscription</option>
              <option value="product">Product</option>
              <option value="listing">Listing</option>
              <option value="advertisement">Advertisement</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Results: {pagination.totalItems}
            </label>
            <div className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
          </div>
        </div>

        {/* Payment Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Purpose</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-900">₹{payment.amount}</div>
                      <div className="text-sm text-gray-600">{payment.currency}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">
                        {payment.status === 'completed' && payment.completedAt
                          ? formatDate(payment.completedAt)
                          : payment.status === 'failed' && payment.failedAt
                          ? formatDate(payment.failedAt)
                          : payment.status === 'cancelled' && payment.cancelledAt
                          ? formatDate(payment.cancelledAt)
                          : formatDate(payment.createdAt)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">
                        {formatPaymentFor(payment.paymentFor)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {payment.razorpayOrderId}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">
                        {payment.razorpayPaymentId || 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(1, pagination.currentPage - 1))}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 border rounded-md ${
                        page === pagination.currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                return null;
              })}

              <button
                onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;