'use client';

import { HiOutlineCheckCircle, HiOutlineExclamationTriangle } from 'react-icons/hi2';

interface VerificationStatusProps {
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isGSTVerified?: boolean;
  isAadhaarVerified?: boolean;
  isPANVerified?: boolean;
  isPremiumSeller?: boolean;
  trustScore?: number;
}

export default function VerificationStatus({
  isEmailVerified = false,
  isPhoneVerified = false,
  isGSTVerified = false,
  isAadhaarVerified = false,
  isPANVerified = false,
  isPremiumSeller = false,
  trustScore = 0,
}: VerificationStatusProps) {
  const verifications = [
    { name: 'Email', completed: isEmailVerified, difficulty: 'Easy' },
    { name: 'Mobile', completed: isPhoneVerified, difficulty: 'Easy' },
    { name: 'GST', completed: isGSTVerified, difficulty: 'Medium' },
    { name: 'Aadhaar', completed: isAadhaarVerified, difficulty: 'Medium' },
    { name: 'PAN', completed: isPANVerified, difficulty: 'Medium' },
  ];

  const completedCount = verifications.filter(v => v.completed).length;
  const totalCount = verifications.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">📋 Verification Status</h3>
        <p className="text-sm text-gray-600">
          Complete verifications to build trust and increase visibility
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-700">
            {completedCount} of {totalCount} verified
          </span>
          <span className="text-sm font-bold text-blue-600">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-blue-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Trust Score */}
      {trustScore && (
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 mb-6 border border-teal-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase">Trust Score</p>
              <p className="text-2xl font-black text-teal-600">{trustScore.toFixed(2)}/5.0</p>
            </div>
            <div className="text-4xl">🛡️</div>
          </div>
        </div>
      )}

      {/* Verification List */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-600 uppercase mb-4">Verification Checklist</p>
        {verifications.map((item) => (
          <div
            key={item.name}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition ${
              item.completed
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200 hover:border-blue-300'
            }`}
          >
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                item.completed
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {item.completed ? (
                <HiOutlineCheckCircle className="w-4 h-4" />
              ) : (
                <span className="text-xs font-bold">○</span>
              )}
            </div>

            <div className="flex-1">
              <p className={`font-semibold text-sm ${item.completed ? 'text-green-700' : 'text-gray-900'}`}>
                {item.name}
              </p>
              <p className="text-xs text-gray-600">
                {item.completed ? '✓ Verified' : `Verify ${item.difficulty}`}
              </p>
            </div>

            {item.completed ? (
              <div className="text-green-600 font-bold text-xs">✓</div>
            ) : (
              <button className="text-blue-600 hover:text-blue-800 font-bold text-xs hover:underline">
                Verify
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Premium Seller Info */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">👑</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">Become a Premium Seller</p>
            <p className="text-xs text-gray-600 mt-1">
              Complete all verifications to unlock Premium Seller status with enhanced visibility and priority support.
            </p>
            {completedCount === totalCount && !isPremiumSeller && (
              <button className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition">
                Upgrade to Premium
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mt-4">
        <p className="font-bold text-gray-900 text-sm mb-3">Benefits of Verification:</p>
        <ul className="space-y-2 text-xs text-gray-700">
          <li>✓ Higher buyer confidence & trust</li>
          <li>✓ Increased visibility in search results</li>
          <li>✓ Priority placement on category pages</li>
          <li>✓ Access to premium features & tools</li>
          <li>✓ Better inquiry conversion rates</li>
        </ul>
      </div>
    </div>
  );
}
