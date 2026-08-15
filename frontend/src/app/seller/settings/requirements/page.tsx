'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { HiOutlineBell, HiOutlineCheckCircle, HiOutlineTrash } from "@/lib/icons";

const CATEGORIES = [
  'Food & Beverages',
  'Electronics',
  'Clothing & Fashion',
  'Home & Furnishings',
  'Industrial Equipment',
  'Raw Materials',
  'Others'
];

interface RequirementAlerts {
  enabled: boolean;
  categories: string[];
  minBudget: number;
  maxBudget: number;
  preferredLocations: string[];
}

export default function RequirementAlertsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState<RequirementAlerts>({
    enabled: true,
    categories: [],
    minBudget: 0,
    maxBudget: 10000000,
    preferredLocations: [],
  });
  const [newLocation, setNewLocation] = useState('');

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
      if (seller.requirementAlerts) {
        setAlerts(seller.requirementAlerts);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (alerts.categories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    if (alerts.minBudget > alerts.maxBudget) {
      toast.error('Minimum budget cannot be greater than maximum budget');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      await axios.put(
        '/sellers/me/requirement-alerts',
        alerts,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Requirement alerts settings updated successfully');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category: string) => {
    setAlerts(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const addLocation = () => {
    if (!newLocation.trim()) {
      toast.error('Please enter a city name');
      return;
    }

    if (alerts.preferredLocations.includes(newLocation.trim())) {
      toast.error('This city is already added');
      return;
    }

    setAlerts(prev => ({
      ...prev,
      preferredLocations: [...prev.preferredLocations, newLocation.trim()],
    }));
    setNewLocation('');
  };

  const removeLocation = (location: string) => {
    setAlerts(prev => ({
      ...prev,
      preferredLocations: prev.preferredLocations.filter(l => l !== location),
    }));
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
            <h1 className="text-3xl font-bold text-gray-900">Requirement Alerts</h1>
            <p className="text-gray-600 mt-2">Get instant notifications when buyer requirements match your business</p>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            {/* Enable/Disable Alerts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Enable Alerts</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {alerts.enabled
                      ? 'You will receive notifications for matching buyer requirements'
                      : 'Requirement alerts are currently disabled'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAlerts(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    alerts.enabled ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                      alerts.enabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Product Categories */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Product Categories</h2>
              <p className="text-sm text-gray-600 mb-6">Select the categories you want to receive alerts for</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map(category => (
                  <label
                    key={category}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={alerts.categories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-900">{category}</span>
                  </label>
                ))}
              </div>

              {alerts.categories.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                  <HiOutlineCheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    You selected {alerts.categories.length} categor{alerts.categories.length === 1 ? 'y' : 'ies'}
                  </p>
                </div>
              )}
            </div>

            {/* Budget Range */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Budget Range</h2>
              <p className="text-sm text-gray-600 mb-6">Only receive alerts for requirements within this budget range</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={alerts.minBudget}
                    onChange={(e) => setAlerts(prev => ({ ...prev, minBudget: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={alerts.maxBudget}
                    onChange={(e) => setAlerts(prev => ({ ...prev, maxBudget: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Preferred Locations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Preferred Delivery Locations</h2>
              <p className="text-sm text-gray-600 mb-6">
                Leave empty to receive alerts from all locations. Or add specific cities.
              </p>

              <div className="space-y-4">
                {/* Add Location */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                    placeholder="Enter city name (e.g., Mumbai, Delhi)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addLocation}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                  >
                    Add
                  </button>
                </div>

                {/* Selected Locations */}
                {alerts.preferredLocations.length > 0 && (
                  <div className="space-y-2">
                    {alerts.preferredLocations.map(location => (
                      <div
                        key={location}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-900">{location}</span>
                        <button
                          type="button"
                          onClick={() => removeLocation(location)}
                          className="text-red-600 hover:text-red-700 transition"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <HiOutlineBell className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">How it works:</p>
                  <ul className="list-disc list-inside space-y-1 opacity-90">
                    <li>When buyers post new requirements matching your categories, you'll get instant notifications</li>
                    <li>Check your inbox and notification dashboard for new opportunities</li>
                    <li>Quick reply templates help you respond faster</li>
                    <li>Generate professional quotations directly from alerts</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
