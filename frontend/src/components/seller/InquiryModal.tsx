'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { HiXMark, HiOutlineEnvelope, HiOutlinePhone } from "@/lib/icons";
import axios from '@/lib/axios';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  productName?: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
}

export default function InquiryModal({
  isOpen,
  onClose,
  productId,
  productName = 'Product',
  sellerId,
  sellerName,
  sellerEmail,
  sellerPhone,
}: InquiryModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    buyerName: '',
    mobileNumber: '',
    email: '',
    quantity: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.buyerName || !formData.mobileNumber || !formData.email || !formData.quantity) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/inquiries', {
        buyerName: formData.buyerName,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        quantity: formData.quantity,
        message: formData.message,
        productId,
        productName,
        sellerId,
        sellerName,
        sellerEmail,
        sellerPhone,
      });

      if (response.data?.success) {
        toast.success('✓ Inquiry sent successfully!');
        setFormData({ buyerName: '', mobileNumber: '', email: '', quantity: '', message: '' });
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppInquiry = () => {
    const message = `Hi ${sellerName}, I'm interested in ${productName}. Quantity: ${formData.quantity || '1'}. ${formData.message || ''}`;
    const whatsappUrl = `https://wa.me/${sellerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Send Inquiry</h2>
            <p className="text-blue-100 text-sm mt-1">{productName} - {sellerName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-lg p-2 transition"
          >
            <HiXMark className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Buyer Name */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Your Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="buyerName"
              value={formData.buyerName}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition"
              required
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Mobile Number <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              placeholder="Enter 10-digit mobile number"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition"
              pattern="[0-9]{10}"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Email Address <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition"
              required
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Required Quantity <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="e.g., 100 units"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Additional Requirements
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Any specific requirements or questions?"
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition resize-none"
            />
          </div>

          {/* Seller Contact Info */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-bold">Seller:</span> {sellerName}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <HiOutlinePhone className="w-4 h-4" />
                {sellerPhone}
              </span>
              <span className="flex items-center gap-1">
                <HiOutlineEnvelope className="w-4 h-4" />
                {sellerEmail}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {/* Send Inquiry Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <HiOutlineEnvelope className="w-5 h-5" />
              {loading ? 'Sending...' : 'Send Inquiry'}
            </button>

            {/* Get Best Quote Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
            >
              💰 Get Best Quote
            </button>

            {/* WhatsApp Inquiry Button */}
            <button
              type="button"
              onClick={handleWhatsAppInquiry}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              💬 WhatsApp Inquiry
            </button>
          </div>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-4">
            By sending this inquiry, you agree to our Terms & Conditions. Seller will contact you soon.
          </p>
        </form>
      </div>
    </div>
  );
}
