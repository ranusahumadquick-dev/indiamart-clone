'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { HiOutlinePhone, HiOutlineCheckCircle } from "@/lib/icons";

interface WhatsappSettings {
  number: string;
  isVerified: boolean;
  verifiedAt: string | null;
  displayOnProfile: boolean;
}

export default function ContactSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [displayOnProfile, setDisplayOnProfile] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [accountPhone, setAccountPhone] = useState('');
  const [useAccountPhone, setUseAccountPhone] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get('/sellers/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const seller = response.data.data.seller;
      const phone = seller.phone || '';
      setAccountPhone(phone);
      if (seller.whatsapp) {
        setWhatsappNumber(seller.whatsapp.number || '');
        setDisplayOnProfile(seller.whatsapp.displayOnProfile || false);
        setIsVerified(seller.whatsapp.isVerified || false);
        setUseAccountPhone(!!phone && seller.whatsapp.number === phone);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!whatsappNumber || whatsappNumber.trim().length === 0) {
      toast.error('Please enter a WhatsApp number');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(whatsappNumber)) {
      toast.error('Please enter a valid Indian WhatsApp number (10 digits)');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      await axios.put(
        '/sellers/me/whatsapp',
        { number: whatsappNumber },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('WhatsApp number updated successfully');
      setIsVerified(false);
    } catch (error: any) {
      console.error('Error updating WhatsApp:', error);
      toast.error(error.response?.data?.message || 'Failed to update WhatsApp number');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUseAccountPhone = () => {
    const next = !useAccountPhone;
    setUseAccountPhone(next);
    if (next) setWhatsappNumber(accountPhone);
  };

  const handleToggleVisibility = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      await axios.put(
        '/sellers/me/whatsapp/toggle',
        { displayOnProfile: !displayOnProfile },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setDisplayOnProfile(!displayOnProfile);
      toast.success(
        !displayOnProfile ? 'WhatsApp button now visible on your profile' : 'WhatsApp button hidden from profile'
      );
    } catch (error: any) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['seller']}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Contact Settings</h1>
            <p className="text-gray-600 mt-2">Manage your contact information and communication channels</p>
          </div>

          {/* WhatsApp Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <HiOutlinePhone className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">WhatsApp Business</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Allow buyers to contact you directly on WhatsApp
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateWhatsapp} className="space-y-6">
              {/* Use account phone toggle */}
              {accountPhone && (
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Use my account phone number</p>
                    <p className="text-xs text-gray-600 mt-1">+91 {accountPhone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleUseAccountPhone}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                      useAccountPhone ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                        useAccountPhone ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Number Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-medium">+91</span>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit number"
                    maxLength={10}
                    disabled={useAccountPhone}
                    className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {useAccountPhone ? "Using your account phone number" : "Indian mobile numbers only (starts with 6-9)"}
                </p>
              </div>

              {/* Verification Status */}
              {isVerified && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <HiOutlineCheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Verified</p>
                    <p className="text-xs text-green-800">Your WhatsApp number has been verified</p>
                  </div>
                </div>
              )}

              {/* Update Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : 'Update WhatsApp Number'}
              </button>
            </form>

            {/* Visibility Toggle */}
            {whatsappNumber && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Show on profile</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {displayOnProfile
                        ? 'Buyers can see and contact you via WhatsApp'
                        : 'WhatsApp button is hidden from your profile'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleVisibility}
                    disabled={saving}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                      displayOnProfile ? 'bg-green-600' : 'bg-gray-300'
                    } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                        displayOnProfile ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> WhatsApp makes it easy for buyers to contact you instantly. Ensure you have WhatsApp Business
                app installed on your phone number for professional communication.
              </p>
            </div>
          </div>

          {/* Other Channels Info */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Other Communication Channels</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>✓ Email notifications for inquiries and orders</p>
              <p>✓ In-app messaging system for buyer-seller conversations</p>
              <p>Coming soon: SMS and additional channels</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
