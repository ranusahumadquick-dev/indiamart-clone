'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import api from '@/lib/axios';
import { resolveImageUrl } from '@/lib/imageUrl';
import toast from 'react-hot-toast';
import {
  HiOutlinePlusCircle,
  HiOutlineArrowLeft,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineEnvelope,
  HiOutlineStar,
  HiOutlineSparkles,
  HiOutlineExclamationTriangle,
  HiOutlinePencil,
} from 'react-icons/hi2';

interface Service {
  _id: string;
  serviceName: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  priceType: string;
  deliveryTime: number;
  images: Array<{ url: string; alt: string }>;
  availability: string;
  status: string;
  views: number;
  inquiries: number;
  ratings: { average: number; total: number };
  createdAt: string;
}

export default function SellerServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchServices();
  }, [filterStatus]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/services/dashboard/my-services?status=${filterStatus}&limit=100`);
      if (response.data.success) {
        setServices(response.data.data.services);
      }
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.delete(`/services/${id}`);
      toast.success('Service deleted successfully');
      setServices(services.filter((s) => s._id !== id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete service');
    } finally {
      setDeletingId(null);
    }
  };

  const totalViews = services.reduce((sum, s) => sum + (s.views || 0), 0);
  const totalInquiries = services.reduce((sum, s) => sum + (s.inquiries || 0), 0);
  const totalValue = services.reduce((sum, s) => sum + (s.price || 0), 0);

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/seller/dashboard"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
            >
              <HiOutlineArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <HiOutlineSparkles className="w-8 h-8 text-purple-600" />
                  My Services
                </h1>
                <p className="text-gray-600 mt-1">Manage and track your professional services</p>
              </div>
              <Link
                href="/services/create"
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                <HiOutlinePlusCircle className="w-5 h-5" />
                Add New Service
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          {services.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-gray-600 text-sm font-medium">Total Services</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{services.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-gray-600 text-sm font-medium">Total Views</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{totalViews}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-gray-600 text-sm font-medium">Inquiries</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{totalInquiries}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-gray-600 text-sm font-medium">Total Value</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ₹{totalValue.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          {services.length > 0 && (
            <div className="mb-6 flex gap-2 flex-wrap">
              {['all', 'active', 'inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterStatus === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Services Grid or Empty State */}
          {loading ? (
            <div className="flex justify-center items-center min-h-96">
              <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : services.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <HiOutlineSparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No services yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first professional service to start offering specialized work to clients
              </p>
              <Link
                href="/services/create"
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                <HiOutlinePlusCircle className="w-5 h-5" />
                Create Service
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition"
                >
                  {/* Service Image */}
                  <div className="relative w-full h-40 bg-gray-200">
                    {service.images && service.images.length > 0 ? (
                      <Image
                        src={resolveImageUrl(service.images[0].url)}
                        alt={service.images[0].alt || service.serviceName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-50">
                        <HiOutlineSparkles className="w-12 h-12 text-purple-300" />
                      </div>
                    )}
                    {service.availability === 'available' && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        Available
                      </div>
                    )}
                  </div>

                  {/* Service Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">
                      {service.serviceName}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{service.description}</p>

                    {/* Category & Price */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                      <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {service.category}
                      </span>
                      <p className="text-lg font-bold text-purple-600">
                        ₹{service.price.toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900">{service.views || 0}</p>
                        <p className="text-xs text-gray-600 flex items-center justify-center gap-1 mt-1">
                          <HiOutlineEye className="w-3 h-3" /> Views
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900">{service.inquiries || 0}</p>
                        <p className="text-xs text-gray-600 flex items-center justify-center gap-1 mt-1">
                          <HiOutlineEnvelope className="w-3 h-3" /> Inquiries
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900">
                          {service.ratings.average.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center justify-center gap-1 mt-1">
                          <HiOutlineStar className="w-3 h-3" /> Rating
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/services/${service._id}`}
                        className="flex-1 text-center bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-medium text-sm"
                      >
                        View
                      </Link>
                      <Link
                        href={`/services/${service._id}/edit`}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition"
                        title="Edit Service"
                      >
                        <HiOutlinePencil className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(service._id)}
                        disabled={deletingId === service._id}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition disabled:opacity-50"
                        title="Delete Service"
                      >
                        {deletingId === service._id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <HiOutlineTrash className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Delivery Time */}
                    <p className="text-xs text-gray-500 text-center mt-3 pt-3 border-t border-gray-100">
                      {service.deliveryTime} days delivery
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
