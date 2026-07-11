'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import QuotationModal from '@/components/QuotationModal';
import { resolveImageUrl } from '@/lib/imageUrl';

interface Inquiry {
  _id: string;
  buyer: {
    _id: string;
    name: string;
    email: string;
  };
  product: {
    _id: string;
    name: string;
    image?: string;
    images?: { url: string; alt?: string }[];
    price: number;
  } | null;
  quantityRequired?: number;
  message: string;
  status: 'pending' | 'read' | 'replied';
  createdAt: string;
  reply?: {
    message: string;
    createdAt: string;
  };
}

interface ResponseTemplate {
  _id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  usageCount: number;
}

const SellerInboxPage = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'read'>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateTitle, setTemplateTitle] = useState('');
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [selectedInquiryForQuote, setSelectedInquiryForQuote] = useState<Inquiry | null>(null);

  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/inquiries/seller/inbox?filter=${filter}`);
      setInquiries(response.data.data.inquiries || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch inquiries');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await axios.get(`/inquiries/templates`);
      setTemplates(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch templates:', error);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
    fetchTemplates();
  }, [filter, fetchInquiries, fetchTemplates]);

  const markAsRead = async (inquiryId: string) => {
    try {
      setMarkingAsRead(inquiryId);
      await axios.patch(`/inquiries/${inquiryId}/read`, {});

      setInquiries(prev => prev.map(inquiry => 
        inquiry._id === inquiryId ? { ...inquiry, status: 'read' as const } : inquiry
      ));
      
      toast.success('Inquiry marked as read');
    } catch (error: any) {
      console.error('Error marking inquiry as read:', error);
      toast.error(error.response?.data?.message || 'Failed to mark as read');
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleReply = async (inquiryId: string) => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      const response = await axios.put(`/inquiries/${inquiryId}/reply`,
        { sellerReply: replyMessage.trim() }
      );

      setInquiries(prev => prev.map(inquiry =>
        inquiry._id === inquiryId ? response.data : inquiry
      ));

      setReplyingTo(null);
      setReplyMessage('');
      toast.success('Reply sent successfully');
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast.error(error.response?.data?.message || 'Failed to send reply');
    }
  };

  const saveAsTemplate = async () => {
    if (!templateTitle.trim() || !replyMessage.trim()) {
      toast.error('Please enter template title and message');
      return;
    }

    try {
      await axios.post(`/inquiries/templates`,
        { title: templateTitle, content: replyMessage, category: 'custom' }
      );

      toast.success('Template saved successfully');
      setShowTemplateModal(false);
      setTemplateTitle('');
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save template');
    }
  };

  const selectTemplate = (template: ResponseTemplate) => {
    setReplyMessage(template.content);
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

  const filteredInquiries = inquiries;
  const pendingCount = inquiries.filter(i => i.status === 'pending').length;

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seller Inbox</h1>
              <p className="text-gray-600 mt-2">Manage buyer inquiries and messages</p>
            </div>
            {pendingCount > 0 && (
              <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                {pendingCount} pending
              </span>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setFilter('all')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === 'all'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  All ({inquiries.length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === 'pending'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === 'read'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Read ({inquiries.filter(i => i.status === 'read').length})
                </button>
              </nav>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
              <p className="text-gray-500">
                {filter === 'pending' ? 'No pending inquiries at the moment.' : 
                 filter === 'read' ? 'No read inquiries found.' : 
                 'No inquiries found. Buyers will contact you here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredInquiries.map((inquiry) => (
                <div
                  key={inquiry._id}
                  className={`bg-white rounded-lg shadow-sm border ${
                    inquiry.status === 'pending' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {inquiry.buyer?.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {inquiry.buyer?.name || 'Unknown Buyer'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {inquiry.buyer?.email || ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inquiry.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {inquiry.status === 'pending' ? 'Pending' : 'Read'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(inquiry.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={resolveImageUrl(
                            inquiry.product?.images?.[0]?.url ||
                            inquiry.product?.image ||
                            null
                          )}
                          alt={inquiry.product?.name || 'Product'}
                          className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                          onError={(e) => {
                            const t = e.target as HTMLImageElement;
                            t.onerror = null;
                            t.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23f3f4f6'/%3E%3Cpath d='M16 32l8-10 6 7 4-4 6 7H8z' fill='%23d1d5db'/%3E%3Ccircle cx='18' cy='20' r='3' fill='%23d1d5db'/%3E%3C/svg%3E";
                          }}
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Product: {inquiry.product?.name || 'Unknown Product'}
                          </h4>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 mb-3">{inquiry.message}</p>
                        {inquiry.reply && (
                          <div className="border-t border-gray-200 pt-3">
                            <p className="text-sm font-medium text-gray-900 mb-1">Your Reply:</p>
                            <p className="text-gray-700">{inquiry.reply.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(inquiry.reply.createdAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-3">
                        {inquiry.status === 'pending' && !inquiry.reply && (
                          <button
                            onClick={() => markAsRead(inquiry._id)}
                            disabled={markingAsRead === inquiry._id}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                          >
                            {markingAsRead === inquiry._id ? 'Marking...' : 'Mark as Read'}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedInquiryForQuote(inquiry);
                            setQuotationModalOpen(true);
                          }}
                          className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
                        >
                          📊 Generate Quote
                        </button>
                      </div>
                      {!inquiry.reply && (
                        <button
                          onClick={() => setReplyingTo(inquiry._id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                        >
                          Reply
                        </button>
                      )}
                    </div>

                    {replyingTo === inquiry._id && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        {/* Template Selection */}
                        {templates.length > 0 && (
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quick Templates
                            </label>
                            <select
                              onChange={(e) => {
                                const template = templates.find(t => t._id === e.target.value);
                                if (template) selectTemplate(template);
                                e.target.value = '';
                              }}
                              defaultValue=""
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                              <option value="">Select a template...</option>
                              {templates.map((t) => (
                                <option key={t._id} value={t._id}>
                                  {t.isPinned ? '📌 ' : ''}{t.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Reply Textarea */}
                        <div className="mb-3">
                          <label htmlFor={`reply-${inquiry._id}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Your Reply
                          </label>
                          <textarea
                            id={`reply-${inquiry._id}`}
                            rows={3}
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="Type your reply here or select a template..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleReply(inquiry._id)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                          >
                            Send Reply
                          </button>
                          <button
                            onClick={() => setShowTemplateModal(true)}
                            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                          >
                            Save as Template
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyMessage('');
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save as Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Save as Template</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateTitle}
                    onChange={(e) => setTemplateTitle(e.target.value)}
                    placeholder="e.g., Out of Stock Reply"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Preview
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 max-h-32 overflow-auto">
                    {replyMessage || 'No message entered'}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={saveAsTemplate}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    Save Template
                  </button>
                  <button
                    onClick={() => {
                      setShowTemplateModal(false);
                      setTemplateTitle('');
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quotation Generator Modal */}
        {quotationModalOpen && selectedInquiryForQuote && (
          <QuotationModal
            inquiryId={selectedInquiryForQuote._id}
            productName={selectedInquiryForQuote.product?.name || 'Unknown Product'}
            quantity={selectedInquiryForQuote.quantityRequired || 1}
            unitPrice={selectedInquiryForQuote.product?.price || 0}
            buyerName={selectedInquiryForQuote.buyer.name}
            onClose={() => {
              setQuotationModalOpen(false);
              setSelectedInquiryForQuote(null);
            }}
            onSuccess={() => {
              fetchInquiries();
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default SellerInboxPage;