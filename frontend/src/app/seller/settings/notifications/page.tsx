'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { HiOutlineBell, HiOutlineCheckCircle } from "@/lib/icons";

interface NotificationPreferences {
  inquiryAlerts: boolean;
  replyNotifications: boolean;
  reminderNotifications: boolean;
  quotationAlerts: boolean;
  channels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    inquiryAlerts: true,
    replyNotifications: true,
    reminderNotifications: true,
    quotationAlerts: true,
    channels: {
      email: true,
      sms: false,
      whatsapp: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token');
        return;
      }

      const response = await axios.get('/users/notification-preferences', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.data?.notificationPreferences) {
        setPreferences(response.data.data.notificationPreferences);
      }
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string, value: boolean) => {
    setHasChanges(true);
    setPreferences((prev) => {
      if (key.startsWith('channels.')) {
        const channel = key.replace('channels.', '');
        return {
          ...prev,
          channels: { ...prev.channels, [channel]: value },
        };
      }
      return { ...prev, [key]: value };
    });
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('No authentication token');
        return;
      }

      await axios.put('/users/notification-preferences', { notificationPreferences: preferences }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setHasChanges(false);
      toast.success('Notification preferences saved successfully');
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error(error.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['seller']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineBell className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
            </div>
            <p className="text-gray-600">Manage how and when you receive notifications</p>
          </div>

          {/* Main Settings Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y">
            {/* Notification Types */}
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Types</h2>

              <div className="space-y-5">
                {/* Inquiry Alerts */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">New Inquiry Alerts</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Get notified when a buyer sends you a new inquiry
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.inquiryAlerts}
                      onChange={(e) => handleToggle('inquiryAlerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Reply Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Reply Notifications</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Get notified when a buyer replies to your message
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.replyNotifications}
                      onChange={(e) => handleToggle('replyNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Quotation Alerts */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Quotation Alerts</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Get notified when a quote is generated for your products
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.quotationAlerts}
                      onChange={(e) => handleToggle('quotationAlerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Reminder Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Reminder Notifications</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Get reminded about unanswered inquiries after 3 days
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.reminderNotifications}
                      onChange={(e) => handleToggle('reminderNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Channels</h2>
              <p className="text-sm text-gray-600 mb-6">
                Choose how you want to receive notifications
              </p>

              <div className="space-y-5">
                {/* Email */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 flex-1">
                    <HiOutlineCheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Email</h3>
                      <p className="text-sm text-gray-600 mt-1">Receive notifications via email</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.channels.email}
                      onChange={(e) => handleToggle('channels.email', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* SMS - Coming Soon */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-60">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">SMS</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Receive notifications via SMS <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded ml-2">Coming Soon</span>
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer opacity-50 pointer-events-none">
                    <input
                      type="checkbox"
                      checked={false}
                      disabled
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full"></div>
                  </label>
                </div>

                {/* WhatsApp - Coming Soon */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-60">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">WhatsApp</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Receive notifications via WhatsApp <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded ml-2">Coming Soon</span>
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer opacity-50 pointer-events-none">
                    <input
                      type="checkbox"
                      checked={false}
                      disabled
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="p-6 bg-gray-50 flex justify-end">
              <button
                onClick={savePreferences}
                disabled={!hasChanges || saving}
                className={`px-6 py-2 font-medium rounded-lg transition ${
                  hasChanges
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                } ${saving ? 'opacity-50' : ''}`}
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
