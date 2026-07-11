'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useParams, useRouter } from 'next/navigation';
import { HiOutlineArrowLeft, HiOutlineExclamationTriangle, HiOutlineCheckCircle } from 'react-icons/hi2';
import { resolveImageUrl } from '@/lib/imageUrl';

interface Supplier {
  _id: string;
  name: string;
  companyName?: string;
  city?: string;
  state?: string;
  isVerified?: boolean;
  averageRating?: number;
}

interface RFQResponse {
  _id: string;
  supplier: Supplier;
  message?: string;
  quotedPrice?: number;
  moq?: number;
  deliveryDays?: number;
  validityDays?: number;
  respondedAt: string;
}

interface BuyRequirement {
  _id: string;
  productName: string;
  category: { _id: string; name: string } | string;
  subCategory?: { _id: string; name: string } | string;
  description?: string;
  quantityRequired: number;
  unit: string;
  budgetMin?: number;
  budgetMax?: number;
  deliveryLocation?: {
    city?: string;
    state?: string;
    pincode?: string;
  };
  deliveryTimeline?: string;
  status: 'active' | 'closed' | 'fulfilled';
  buyer: {
    _id: string;
    name: string;
    companyName?: string;
    avatar?: string;
  };
  responses: RFQResponse[];
  createdAt: string;
}

function getCategoryName(cat: { _id: string; name: string } | string | undefined): string {
  if (!cat) return '';
  if (typeof cat === 'object') return cat.name || '';
  return cat;
}

function formatMoney(amount?: number): string {
  if (amount == null) return 'N/A';
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount.toLocaleString()}`;
}

export default function RequirementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requirementId = params.id as string;

  const [requirement, setRequirement] = useState<BuyRequirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [myResponse, setMyResponse] = useState<RFQResponse | null>(null);

  // Form state
  const [quotedPrice, setQuotedPrice] = useState<number | ''>('');
  const [moq, setMoq] = useState<number>(1);
  const [deliveryDays, setDeliveryDays] = useState<number>(7);
  const [validityDays, setValidityDays] = useState<number>(30);
  const [message, setMessage] = useState('');

  const fetchRequirementDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[RFQ Detail] Fetching requirement:', requirementId);

      const response = await api.get(`/buy-requirements/${requirementId}`);
      const req: BuyRequirement = response.data.data;
      setRequirement(req);

      // Check if current seller already responded
      const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userId = userRaw ? JSON.parse(userRaw)?._id : null;
      console.log('[RFQ Detail] Current userId:', userId, '| Total responses:', req.responses?.length ?? 0);

      if (userId && req.responses?.length) {
        const existing = req.responses.find(
          (r) => r.supplier?._id === userId || (r.supplier as any) === userId
        );
        if (existing) {
          setHasResponded(true);
          setMyResponse(existing);
          setQuotedPrice(existing.quotedPrice ?? '');
          setMoq(existing.moq ?? 1);
          setDeliveryDays(existing.deliveryDays ?? 7);
          setValidityDays(existing.validityDays ?? 30);
          setMessage(existing.message ?? '');
          console.log('[RFQ Detail] Seller already responded:', existing._id);
        }
      }

      console.log('[RFQ Detail] Loaded:', req.productName, '| Status:', req.status);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err.message || 'Unknown error';
      console.error('[RFQ Detail] Error:', status, msg);

      if (status === 404) {
        setError('not_found');
      } else {
        setError('api_error');
      }
    } finally {
      setLoading(false);
    }
  }, [requirementId]);

  useEffect(() => {
    if (requirementId) fetchRequirementDetails();
  }, [fetchRequirementDetails, requirementId]);

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quotedPrice || !moq || !deliveryDays) {
      toast.error('Please fill Quoted Price, MOQ, and Delivery Days');
      return;
    }
    if (!message.trim()) {
      toast.error('Please add a message to the buyer');
      return;
    }

    try {
      setSubmitting(true);
      console.log('[RFQ Detail] Submitting response for:', requirementId);

      await api.post(`/buy-requirements/${requirementId}/respond`, {
        quotedPrice: Number(quotedPrice),
        moq: Number(moq),
        deliveryDays: Number(deliveryDays),
        validityDays: Number(validityDays),
        message: message.trim(),
      });

      toast.success('Quotation submitted successfully!');
      await fetchRequirementDetails();
    } catch (err: any) {
      console.error('[RFQ Detail] Submit error:', err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['seller']}>
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </ProtectedRoute>
    );
  }

  // ── Error states ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <ProtectedRoute allowedRoles={['seller']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <HiOutlineExclamationTriangle className="mx-auto h-14 w-14 text-red-400 mb-4" />
            {error === 'not_found' ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">RFQ Not Found</h2>
                <p className="text-gray-500 mb-6">
                  This requirement may have been deleted or the link is invalid.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load</h2>
                <p className="text-gray-500 mb-6">
                  Could not fetch the requirement details. Please try again.
                </p>
                <button
                  onClick={fetchRequirementDetails}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-3"
                >
                  Retry
                </button>
                <br />
              </>
            )}
            <button
              onClick={() => router.push('/seller/requirements')}
              className="text-blue-600 hover:underline text-sm"
            >
              ← Back to Requirements
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!requirement) return null;

  const catName = getCategoryName(requirement.category);
  const subCatName = getCategoryName(requirement.subCategory);
  const location = [requirement.deliveryLocation?.city, requirement.deliveryLocation?.state]
    .filter(Boolean)
    .join(', ') || 'Not specified';

  const budgetText =
    requirement.budgetMin != null || requirement.budgetMax != null
      ? `${formatMoney(requirement.budgetMin)} – ${formatMoney(requirement.budgetMax)}`
      : 'Not specified';

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* Back */}
          <button
            onClick={() => router.push('/seller/requirements')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 text-sm font-medium"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Back to Buyer Requirements
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left: Details ─────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Header Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <h1 className="text-2xl font-bold text-gray-900 break-words">
                      {requirement.productName}
                    </h1>
                    {(catName || subCatName) && (
                      <p className="text-sm text-gray-500 mt-1">
                        {[catName, subCatName].filter(Boolean).join(' › ')}
                      </p>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                      requirement.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : requirement.status === 'fulfilled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {requirement.status === 'active'
                      ? 'Open'
                      : requirement.status === 'fulfilled'
                      ? 'Fulfilled'
                      : 'Closed'}
                  </span>
                </div>

                {requirement.description && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-5">
                    {requirement.description}
                  </p>
                )}

                {/* Key Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Quantity</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {requirement.quantityRequired} {requirement.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Budget</p>
                    <p className="font-semibold text-gray-900 text-sm">{budgetText}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Location</p>
                    <p className="font-semibold text-gray-900 text-sm">{location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Timeline</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {requirement.deliveryTimeline || 'Flexible'}
                    </p>
                  </div>
                </div>

                {/* Buyer Info */}
                <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100">
                  <img
                    src={
                      resolveImageUrl(requirement.buyer.avatar) ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        requirement.buyer.name || 'B'
                      )}&background=3b82f6&color=fff&size=48`
                    }
                    alt={requirement.buyer.name || 'Buyer'}
                    className="w-12 h-12 rounded-full object-cover bg-gray-200 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        requirement.buyer.name || 'B'
                      )}&background=3b82f6&color=fff&size=48`;
                    }}
                  />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {requirement.buyer.companyName || requirement.buyer.name}
                    </p>
                    {requirement.buyer.companyName && (
                      <p className="text-xs text-gray-500">{requirement.buyer.name}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Posted {new Date(requirement.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Other Supplier Responses */}
              {requirement.responses.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-base font-bold text-gray-900 mb-4">
                    Supplier Quotes ({requirement.responses.length})
                  </h2>
                  <div className="space-y-3">
                    {requirement.responses.map((resp) => {
                      const suppName =
                        resp.supplier?.companyName || resp.supplier?.name || 'Supplier';
                      return (
                        <div
                          key={resp._id}
                          className="flex justify-between items-start p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm truncate">{suppName}</p>
                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-600">
                              {resp.quotedPrice != null && (
                                <span>💰 {formatMoney(resp.quotedPrice)}</span>
                              )}
                              {resp.moq != null && <span>MOQ: {resp.moq}</span>}
                              {resp.deliveryDays != null && (
                                <span>🚚 {resp.deliveryDays} days</span>
                              )}
                              {resp.validityDays != null && (
                                <span>Valid {resp.validityDays}d</span>
                              )}
                            </div>
                            {resp.message && (
                              <p className="text-xs text-gray-500 mt-1 italic line-clamp-2">
                                "{resp.message}"
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 ml-3 flex-shrink-0">
                            {new Date(resp.respondedAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short',
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Quote Form ──────────────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">

                {hasResponded && myResponse ? (
                  // Already responded view
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <HiOutlineCheckCircle className="w-5 h-5 text-green-500" />
                      <h2 className="text-base font-bold text-gray-900">Your Quotation</h2>
                    </div>
                    <div className="space-y-3 text-sm">
                      {myResponse.quotedPrice != null && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Price</span>
                          <span className="font-semibold">{formatMoney(myResponse.quotedPrice)}</span>
                        </div>
                      )}
                      {myResponse.moq != null && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">MOQ</span>
                          <span className="font-semibold">{myResponse.moq} {requirement.unit}</span>
                        </div>
                      )}
                      {myResponse.deliveryDays != null && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Delivery</span>
                          <span className="font-semibold">{myResponse.deliveryDays} days</span>
                        </div>
                      )}
                      {myResponse.validityDays != null && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Valid for</span>
                          <span className="font-semibold">{myResponse.validityDays} days</span>
                        </div>
                      )}
                      {myResponse.message && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-gray-500 text-xs mb-1">Your message</p>
                          <p className="text-gray-700 text-sm italic">"{myResponse.message}"</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-green-600 mt-4 text-center">
                      ✓ Quotation sent to buyer
                    </p>
                  </div>
                ) : requirement.status !== 'active' ? (
                  // Closed / fulfilled
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">
                      This requirement is{' '}
                      <span className="font-semibold">{requirement.status}</span> and no longer
                      accepting quotations.
                    </p>
                  </div>
                ) : (
                  // Submit form
                  <>
                    <h2 className="text-base font-bold text-gray-900 mb-4">Submit Quotation</h2>
                    <form onSubmit={handleSubmitResponse} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quoted Price (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={quotedPrice}
                          onChange={(e) =>
                            setQuotedPrice(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          placeholder="e.g. 5000"
                          required
                          min="1"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Minimum Order Qty <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={moq}
                            onChange={(e) => setMoq(Number(e.target.value))}
                            placeholder="e.g. 100"
                            required
                            min="1"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {requirement.unit}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Delivery Days <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={deliveryDays}
                          onChange={(e) => setDeliveryDays(Number(e.target.value))}
                          placeholder="e.g. 7"
                          required
                          min="1"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quote Valid For (days)
                        </label>
                        <input
                          type="number"
                          value={validityDays}
                          onChange={(e) => setValidityDays(Number(e.target.value))}
                          placeholder="e.g. 30"
                          min="1"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Message to Buyer <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Describe your offer, certifications, availability..."
                          rows={4}
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {submitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending...
                          </span>
                        ) : (
                          'Send Quotation'
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
