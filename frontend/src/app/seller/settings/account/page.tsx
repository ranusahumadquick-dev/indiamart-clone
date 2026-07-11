'use client';

import { useState } from 'react';
import { HiOutlineExclamationTriangle, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountSettings() {
  const router = useRouter();
  const { user, logout } = useAuth();
  // OTP-registered sellers have auto-generated email ending with @indiamart.in
  const isOtpUser = user?.email?.endsWith('@indiamart.in');
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTyped, setDeleteTyped] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    deactivate: false,
    delete: false,
  });
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async () => {
    if (!isOtpUser && !deactivatePassword) {
      toast.error('Password is required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/deactivate-account', {
        password: isOtpUser ? undefined : deactivatePassword,
      });

      toast.success('Account deactivated. You can reactivate by logging in anytime.');
      setDeactivateModal(false);
      setDeactivatePassword('');

      // Logout user
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to deactivate account');
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (deleteTyped !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    if (!deleteConfirm) {
      toast.error('Please check the confirmation checkbox');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/delete-account', {
        password: deletePassword || undefined,
      });

      toast.success('Account deleted permanently. Redirecting...');
      setDeleteModal(false);

      // Clear session and redirect
      await logout();
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <HiOutlineExclamationTriangle className="w-6 h-6 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        </div>
        <p className="text-gray-600">Manage account access, deactivation, and deletion</p>
      </div>

      {/* Deactivate Account Section */}
      <div className="bg-white rounded-xl border border-yellow-200 p-6 shadow-sm mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800 mb-2">⏸️ Temporary Pause</h2>
            <p className="text-gray-600 text-sm mb-3">
              Temporarily deactivate your account. You can reactivate anytime by logging in with your password.
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>✓ Your profile will be hidden from buyers</li>
              <li>✓ You won't receive new inquiries</li>
              <li>✓ You can reactivate anytime</li>
            </ul>
            <button
              onClick={() => setDeactivateModal(true)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Deactivate Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Section - Danger Zone */}
      <div className="bg-red-50 rounded-xl border-2 border-red-300 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-red-900 mb-2">🚨 Permanent Delete</h2>
            <p className="text-red-800 text-sm mb-3 font-semibold">
              This action is permanent and cannot be undone.
            </p>
            <ul className="text-sm text-red-800 space-y-2 mb-4 bg-red-100 p-3 rounded">
              <li>⚠️ Your account will be completely deleted</li>
              <li>⚠️ All your products will be deleted</li>
              <li>⚠️ All inquiries and orders will be deleted</li>
              <li>⚠️ All data and history will be permanently removed</li>
              <li>⚠️ This cannot be recovered</li>
            </ul>
            <button
              onClick={() => setDeleteModal(true)}
              className="bg-red-700 hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Permanently Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Deactivate Modal */}
      {deactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Deactivate Account?</h3>
            <p className="text-gray-600 mb-4">
              Your account will be temporarily paused. You can reactivate anytime by logging in.
            </p>

            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-700">
              ⚠️ Your account will be temporarily paused. You can reactivate anytime by logging in.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeactivateModal(false);
                  setDeactivatePassword('');
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {loading ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-red-900 mb-2">🚨 Delete Account Permanently?</h3>
            <p className="text-red-800 text-sm mb-4 font-semibold">This action cannot be undone.</p>

            {/* Confirmation Checkbox */}
            <div className="mb-4 bg-red-50 p-3 rounded border border-red-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.checked)}
                  className="mt-1 w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-red-900">
                  I understand my data will be permanently deleted and cannot be recovered
                </span>
              </label>
            </div>

            {/* Type DELETE */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "DELETE" to confirm
              </label>
              <input
                type="text"
                value={deleteTyped}
                onChange={(e) => setDeleteTyped(e.target.value)}
                placeholder='Type "DELETE"'
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  deleteTyped === 'DELETE'
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-red-500'
                }`}
              />
            </div>

            {/* Password — hidden for OTP-registered sellers */}
            {isOtpUser ? (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                ℹ️ Your account was created via phone OTP — no password required to delete.
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Your Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.delete ? 'text' : 'password'}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, delete: !showPasswords.delete })
                    }
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.delete ? (
                      <HiOutlineEyeSlash className="w-5 h-5" />
                    ) : (
                      <HiOutlineEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModal(false);
                  setDeletePassword('');
                  setDeleteTyped('');
                  setDeleteConfirm(false);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={loading || deleteTyped !== 'DELETE' || !deleteConfirm}
                className="flex-1 px-4 py-2 bg-red-700 hover:bg-red-800 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
              >
                {loading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
