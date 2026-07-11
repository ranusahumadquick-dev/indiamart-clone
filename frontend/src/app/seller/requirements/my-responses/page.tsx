'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import WhatsappButton from '@/components/WhatsappButton';
import { HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineClock } from 'react-icons/hi2';

interface Response {
  _id: string;
  requirement: {
    _id: string;
    productName: string;
    budgetMin: number;
    budgetMax: number;
    status: string;
    buyer?: {
      name: string;
      companyName: string;
      whatsapp?: {
        number: string;
        displayOnProfile: boolean;
      };
    };
  };
  quotedPrice: number;
  moq: number;
  deliveryDays: number;
  validityDays: number;
  respondedAt: string;
}

export default function MyResponsesPage() {
  const router = useRouter();
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'recent' | 'expiring'>('all');

  useEffect(() => {
    fetchMyResponses();
  }, []);

  const fetchMyResponses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required');
        router.push('/auth/login');
        return;
      }

      // Get seller's buy requirements that they've responded to
      const response = await axios.get('/buy-requirements?includeMyResponses=true', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allRequirements = response.data.data.requirements || [];
      const userId = localStorage.getItem('userId'); // You'll need to store this

      // Extract seller's responses
      const myResponses: Response[] = [];
      allRequirements.forEach((req: any) => {
        if (req.responses && Array.isArray(req.responses)) {
          req.responses.forEach((resp: any) => {
            if (resp.supplier === userId || resp.supplier._id === userId) {
              myResponses.push({
                _id: resp._id,
                requirement: {
                  _id: req._id,
                  productName: req.productName,
                  budgetMin: req.budgetMin,
                  budgetMax: req.budgetMax,
                  status: req.status,
                },
                quotedPrice: resp.quotedPrice,
                moq: resp.moq,
                deliveryDays: resp.deliveryDays,
                validityDays: resp.validityDays,
                respondedAt: resp.respondedAt,
              });
            }
          });
        }
      });

      setResponses(myResponses);
    } catch (error: any) {
      console.error('Error fetching responses:', error);
      toast.error('Failed to load your responses');
    } finally {
      setLoading(false);
    }
  };

  const isExpiring = (respondedAt: string, validityDays: number) => {
    const responseDate = new Date(respondedAt);
    const expiryDate = new Date(responseDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.floor((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return daysLeft <= 3 && daysLeft > 0;
  };

  const isExpired = (respondedAt: string, validityDays: number) => {
    const responseDate = new Date(respondedAt);
    const expiryDate = new Date(responseDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
    return expiryDate < new Date();
  };

  const getDaysLeft = (respondedAt: string, validityDays: number) => {
    const responseDate = new Date(respondedAt);
    const expiryDate = new Date(responseDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
    return daysLeft;
  };

  const filteredResponses = responses.filter((resp) => {
    if (filterStatus === 'expiring') {
      return isExpiring(resp.respondedAt, resp.validityDays);
    }
    if (filterStatus === 'recent') {
      const date = new Date(resp.respondedAt);
      const now = new Date();
      const daysOld = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
      return daysOld <= 7;
    }
    return true;
  });

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Responses</h1>
            <p className="text-gray-600 mt-2">Track all your buyer requirement responses</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 text-sm">Total Responses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{responses.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 text-sm">Active Requirements</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {responses.filter((r) => r.requirement.status === 'active').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 text-sm">Expiring Soon</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {responses.filter((r) => isExpiring(r.respondedAt, r.validityDays)).length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {['all', 'recent', 'expiring'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? 'All' : status === 'recent' ? 'Recent (7 days)' : 'Expiring Soon'}
              </button>
            ))}
          </div>

          {/* Responses Table */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">No responses found</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Requirement</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Your Quote</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">MOQ</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Delivery</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredResponses.map((response) => {
                      const expired = isExpired(response.respondedAt, response.validityDays);
                      const expiring = isExpiring(response.respondedAt, response.validityDays);
                      const daysLeft = getDaysLeft(response.respondedAt, response.validityDays);

                      return (
                        <tr key={response._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{response.requirement.productName}</p>
                              <p className="text-sm text-gray-600">
                                Budget: ₹{response.requirement.budgetMin.toLocaleString()} - ₹{response.requirement.budgetMax.toLocaleString()}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">₹{response.quotedPrice.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-900">{response.moq}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-900">{response.deliveryDays} days</p>
                          </td>
                          <td className="px-6 py-4">
                            {expired ? (
                              <div className="flex items-center gap-2">
                                <HiOutlineExclamationCircle className="w-5 h-5 text-red-600" />
                                <span className="text-sm text-red-600 font-medium">Expired</span>
                              </div>
                            ) : expiring ? (
                              <div className="flex items-center gap-2">
                                <HiOutlineClock className="w-5 h-5 text-orange-600" />
                                <span className="text-sm text-orange-600 font-medium">{daysLeft} days left</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <HiOutlineCheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">Active</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => router.push(`/seller/requirements/${response.requirement._id}`)}
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
