'use client';

interface SupplierInfo {
  _id: string;
  name: string;
  companyName?: string;
  city?: string;
  state?: string;
  isVerified?: boolean;
  businessType?: string;
  yearEstablished?: number;
  averageRating?: number;
  numReviews?: number;
}

interface SupplierResponse {
  _id: string;
  message: string;
  quotedPrice?: number;
  moq?: number;
  deliveryDays?: number;
  validityDays?: number;
  supplier: SupplierInfo;
  respondedAt: string;
}

interface BuyRequirement {
  _id: string;
  productName: string;
  quantityRequired: number;
  unit: string;
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  deliveryTimeline?: string;
  deliveryLocation?: { city?: string; state?: string };
  category?: { name: string };
  buyer?: { _id: string; name: string; companyName?: string };
  status: string;
  responses: SupplierResponse[];
  selectedSupplier?: { _id: string; name: string; companyName?: string } | null;
  createdAt: string;
}

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  HiOutlineCheckBadge,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineClipboardDocumentList,
  HiOutlineShieldCheck,
  HiOutlineArrowLeft,
  HiOutlineStar,
} from 'react-icons/hi2';

export default function BuyRequirementDetail() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  const [req, setReq] = useState<BuyRequirement | null>(null);
  const [loadingReq, setLoadingReq] = useState(true);
  const [responding, setResponding] = useState(false);
  const [form, setForm] = useState({
    message: '',
    quotedPrice: '',
    moq: '',
    deliveryDays: '',
    validityDays: '7',
  });

  useEffect(() => {
    if (id) fetchReq();
  }, [id]);

  const fetchReq = async () => {
    try {
      setLoadingReq(true);
      const res = await axios.get(`/buy-requirements/${id}`);
      if (res.data?.success) setReq(res.data.data);
    } catch {
      toast.error('Failed to load requirement');
    } finally {
      setLoadingReq(false);
    }
  };

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || loading) {
      router.push(`/auth/login?redirect=/buy-requirements/${id}`);
      return;
    }
    if (!form.message.trim()) {
      toast.error('Enter a response message');
      return;
    }
    try {
      setResponding(true);
      await axios.post(`/buy-requirements/${id}/respond`, {
        message: form.message,
        quotedPrice: form.quotedPrice ? Number(form.quotedPrice) : undefined,
        moq: form.moq ? Number(form.moq) : undefined,
        deliveryDays: form.deliveryDays ? Number(form.deliveryDays) : undefined,
        validityDays: form.validityDays ? Number(form.validityDays) : 7,
      });
      toast.success('Quote submitted successfully!');
      setForm({ message: '', quotedPrice: '', moq: '', deliveryDays: '', validityDays: '7' });
      fetchReq();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send response');
    } finally {
      setResponding(false);
    }
  };

  if (loadingReq) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!req) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <p className="text-gray-500">Requirement not found</p>
      <button onClick={() => router.back()} className="text-[var(--primary)] text-sm hover:underline">Go back</button>
    </div>
  );

  const alreadyResponded = isAuthenticated && user?.role === 'seller' &&
    req.responses.some(r => r.supplier?._id === user._id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to requirements
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Requirement card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  {req.category && (
                    <p className="text-xs text-[var(--primary)] font-semibold uppercase tracking-wide mb-1">{req.category.name}</p>
                  )}
                  <h1 className="text-xl font-bold text-gray-900">{req.productName}</h1>
                  <p className="text-xs text-gray-400 mt-1">
                    Posted {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {req.buyer && <> by <span className="text-gray-600">{req.buyer.companyName || req.buyer.name}</span></>}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  req.status === 'active' ? 'bg-green-100 text-green-700' :
                  req.status === 'fulfilled' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                  <HiOutlineClipboardDocumentList className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Quantity</p>
                    <p className="text-sm font-semibold text-gray-800">{req.quantityRequired} {req.unit}</p>
                  </div>
                </div>
                {(req.budgetMin || req.budgetMax) && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <HiOutlineCurrencyRupee className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Budget</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {req.budgetMin ? `₹${req.budgetMin.toLocaleString('en-IN')}` : ''}
                        {req.budgetMin && req.budgetMax ? ' – ' : ''}
                        {req.budgetMax ? `₹${req.budgetMax.toLocaleString('en-IN')}` : ''}
                      </p>
                    </div>
                  </div>
                )}
                {req.deliveryLocation?.city && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <HiOutlineMapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Delivery Location</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {req.deliveryLocation.city}{req.deliveryLocation.state ? `, ${req.deliveryLocation.state}` : ''}
                      </p>
                    </div>
                  </div>
                )}
                {req.deliveryTimeline && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <HiOutlineClock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Timeline</p>
                      <p className="text-sm font-semibold text-gray-800">{req.deliveryTimeline}</p>
                    </div>
                  </div>
                )}
              </div>

              {req.description && (
                <p className="text-sm text-gray-600 leading-relaxed">{req.description}</p>
              )}
            </div>

            {/* Responses */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-4">
                {req.responses.length > 0
                  ? `${req.responses.length} Supplier Quote${req.responses.length > 1 ? 's' : ''}`
                  : 'No Quotes Yet'}
              </h2>
              {req.responses.length === 0 ? (
                <p className="text-sm text-gray-400">Be the first supplier to respond to this requirement.</p>
              ) : (
                <div className="space-y-4">
                  {req.responses.map((r) => {
                    const isSelected = req.selectedSupplier?._id === r.supplier?._id;
                    const supplierName = r.supplier?.companyName || r.supplier?.name || 'Supplier';
                    return (
                      <div
                        key={r._id}
                        className={`rounded-xl border-2 p-4 ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-100'}`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                              isSelected ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {supplierName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <p className="text-sm font-semibold text-gray-800">{supplierName}</p>
                                {r.supplier?.isVerified && (
                                  <HiOutlineShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                )}
                              </div>
                              {r.supplier?.city && (
                                <p className="text-[10px] text-gray-400">{r.supplier.city}{r.supplier.state ? `, ${r.supplier.state}` : ''}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {r.quotedPrice && (
                              <p className="text-lg font-bold text-gray-900">₹{r.quotedPrice.toLocaleString('en-IN')}</p>
                            )}
                            <p className="text-[10px] text-gray-400">
                              {new Date(r.respondedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {r.moq && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">MOQ: {r.moq} {req.unit}</span>
                          )}
                          {r.deliveryDays && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">Delivery: {r.deliveryDays} days</span>
                          )}
                          {r.validityDays && (
                            <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">Valid: {r.validityDays} days</span>
                          )}
                          {isSelected && (
                            <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-lg font-semibold">✓ Selected</span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600">{r.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar — seller response form */}
          <div className="lg:col-span-1">
            {isAuthenticated && user?.role === 'seller' && req.status === 'active' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-6">
                {alreadyResponded ? (
                  <div className="text-center py-4">
                    <HiOutlineCheckBadge className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">Quote Submitted</p>
                    <p className="text-xs text-gray-400 mt-1">You have already responded to this requirement.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-gray-800 mb-4">Submit Your Quote</h3>
                    <form onSubmit={handleRespond} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quoted Price (₹ per {req.unit})</label>
                        <input
                          type="number"
                          min="0"
                          value={form.quotedPrice}
                          onChange={e => setForm({ ...form, quotedPrice: e.target.value })}
                          placeholder="e.g. 450"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">MOQ ({req.unit})</label>
                          <input
                            type="number"
                            min="1"
                            value={form.moq}
                            onChange={e => setForm({ ...form, moq: e.target.value })}
                            placeholder={String(req.quantityRequired)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Delivery (days)</label>
                          <input
                            type="number"
                            min="1"
                            value={form.deliveryDays}
                            onChange={e => setForm({ ...form, deliveryDays: e.target.value })}
                            placeholder="7"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quote Valid For (days)</label>
                        <select
                          value={form.validityDays}
                          onChange={e => setForm({ ...form, validityDays: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]"
                        >
                          {[3, 7, 14, 30].map(d => <option key={d} value={d}>{d} days</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Message <span className="text-red-400">*</span></label>
                        <textarea
                          required
                          rows={4}
                          value={form.message}
                          onChange={e => setForm({ ...form, message: e.target.value })}
                          placeholder="Describe your offer, quality standards, experience..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)] resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={responding}
                        className="w-full bg-[var(--primary)] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--primary-dark)] transition disabled:opacity-60"
                      >
                        {responding ? 'Submitting...' : 'Submit Quote'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}

            {!isAuthenticated && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <p className="text-sm text-gray-500 mb-3">Login as a seller to submit your quote</p>
                <button
                  onClick={() => router.push(`/auth/login?redirect=/buy-requirements/${id}`)}
                  className="w-full bg-[var(--primary)] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--primary-dark)] transition"
                >
                  Login to Respond
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
