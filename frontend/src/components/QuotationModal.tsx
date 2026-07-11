'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';

interface QuotationModalProps {
  inquiryId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  buyerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuotationModal({
  inquiryId,
  productName,
  quantity,
  unitPrice,
  buyerName,
  onClose,
  onSuccess,
}: QuotationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryDate: '',
    paymentTerms: 'Bank Transfer',
    notes: '',
    validUntil: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.deliveryDate) {
      toast.error('Delivery date is required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      await axios.post(`/inquiries/${inquiryId}/quotations`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Quotation generated and sent successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error generating quotation:', error);
      toast.error(error.response?.data?.message || 'Failed to generate quotation');
    } finally {
      setLoading(false);
    }
  };

  const total = quantity * unitPrice;
  const minDeliveryDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Generate Quotation</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-600 p-1 rounded"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quotation Summary */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3">Quotation Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Product</p>
                <p className="font-medium text-gray-900">{productName}</p>
              </div>
              <div>
                <p className="text-gray-600">Buyer</p>
                <p className="font-medium text-gray-900">{buyerName}</p>
              </div>
              <div>
                <p className="text-gray-600">Quantity</p>
                <p className="font-medium text-gray-900">{quantity} units</p>
              </div>
              <div>
                <p className="text-gray-600">Unit Price</p>
                <p className="font-medium text-gray-900">₹{unitPrice.toFixed(2)}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-blue-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-blue-600 text-lg">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Estimated Delivery Date *
              </label>
              <input
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleChange}
                min={minDeliveryDate}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Payment Terms
              </label>
              <select
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="COD (Cash on Delivery)">COD (Cash on Delivery)</option>
                <option value="Cheque">Cheque</option>
                <option value="DD (Demand Draft)">DD (Demand Draft)</option>
                <option value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</option>
                <option value="100% Prepayment">100% Prepayment</option>
                <option value="Letter of Credit">Letter of Credit</option>
              </select>
            </div>

            {/* Quotation Validity */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Quote Valid Until
              </label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleChange}
                min={minDeliveryDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Set when this quote expires. If not set, it won't expire.
              </p>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any special conditions, discounts, or additional information..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Generating...
                </>
              ) : (
                'Generate & Send Quotation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
