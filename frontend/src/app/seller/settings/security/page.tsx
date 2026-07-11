'use client';

import { useState } from 'react';
import { HiOutlineShieldCheck, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

export default function SecuritySettings() {
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain uppercase letters';
    if (!/[a-z]/.test(password)) return 'Password must contain lowercase letters';
    if (!/[0-9]/.test(password)) return 'Password must contain numbers';
    return null;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!passwordForm.oldPassword) {
      toast.error('Old password is required');
      return;
    }

    const passwordError = validatePassword(passwordForm.newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.oldPassword === passwordForm.newPassword) {
      toast.error('New password must be different from old password');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success('Password changed successfully! 🔐');
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { text: '', color: '', width: '0%' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { text: 'Very Weak', color: 'bg-red-500', width: '20%' },
      { text: 'Weak', color: 'bg-orange-500', width: '40%' },
      { text: 'Fair', color: 'bg-yellow-500', width: '60%' },
      { text: 'Good', color: 'bg-blue-500', width: '80%' },
      { text: 'Strong', color: 'bg-green-500', width: '100%' },
    ];

    return levels[strength - 1] || { text: '', color: '', width: '0%' };
  };

  const strength = getPasswordStrength(passwordForm.newPassword);

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <HiOutlineShieldCheck className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        </div>
        <p className="text-gray-600">Manage your account security and authentication preferences</p>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">🔐 Change Password</h2>

        <form onSubmit={handlePasswordChange} className="space-y-5">
          {/* Old Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.old ? 'text' : 'password'}
                value={passwordForm.oldPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                }
                placeholder="Enter your current password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.old ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                placeholder="Create a strong password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.new ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {passwordForm.newPassword && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600">Password Strength</span>
                  <span className={`text-xs font-semibold ${strength.color === 'bg-green-500' ? 'text-green-600' : 'text-gray-600'}`}>
                    {strength.text}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: strength.width }}
                  />
                </div>
                <div className="mt-3 text-xs text-gray-600 space-y-1">
                  <div className={`${passwordForm.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                    ✓ At least 8 characters
                  </div>
                  <div className={`${/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    ✓ Contains uppercase letters
                  </div>
                  <div className={`${/[a-z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    ✓ Contains lowercase letters
                  </div>
                  <div className={`${/[0-9]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    ✓ Contains numbers
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                placeholder="Re-enter your new password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.confirm ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
              </button>
            </div>
            {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p className="text-sm text-red-600 mt-2">Passwords do not match</p>
            )}
            {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
              <p className="text-sm text-green-600 mt-2">✓ Passwords match</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2.5 px-4 rounded-lg transition mt-6"
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Security Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-900 mb-3">🛡️ Password Security Tips</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>✓ Use unique passwords for different accounts</li>
          <li>✓ Change password every 3-6 months</li>
          <li>✓ Never share your password with anyone</li>
          <li>✓ Avoid using personal information (name, DOB, phone)</li>
          <li>✓ Enable 2FA for extra security (coming soon)</li>
        </ul>
      </div>
    </div>
  );
}
