'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlinePencil, HiOutlineChatBubbleLeftRight, HiOutlineInboxArrowDown } from 'react-icons/hi2';
import toast from 'react-hot-toast';

interface CustomizationSectionProps {
  productId: string;
  productName: string;
  sellerId: string;
  categorySlug: string;
}

export const CustomizationSection: React.FC<CustomizationSectionProps> = ({
  productId,
  productName,
  sellerId,
  categorySlug
}) => {
  const [selectedOptions, setSelectedOptions] = useState({
    logoPrinting: false,
    oemOdm: false,
    customDesign: false,
    quantity: 100
  });

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const customizationOptions = [
    {
      id: 'logoPrinting',
      label: '📌 Logo Printing',
      description: 'Add your company logo to the product',
      icon: '🖨️'
    },
    {
      id: 'oemOdm',
      label: '🏭 OEM/ODM Support',
      description: 'Original Equipment Manufacturing & Original Design Manufacturing',
      icon: '⚙️'
    },
    {
      id: 'customDesign',
      label: '🎨 Custom Design',
      description: 'Create a completely custom design for your product',
      icon: '✏️'
    }
  ];

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  const handleCustomizeNow = async () => {
    const selected = Object.entries(selectedOptions)
      .filter(([key, value]) => value === true && key !== 'quantity')
      .map(([key]) => key);

    if (selected.length === 0) {
      toast.error('Please select at least one customization option');
      return;
    }

    setLoading(true);
    try {
      // Show success message
      toast.success('Customization request prepared! Contact the seller for details.');

      // Navigate to buyer chats to start conversation with seller
      setTimeout(() => {
        router.push(`/buyer/chats?seller=${sellerId}&product=${productId}&customization=${selected.join(',')}`);
      }, 1000);
    } catch (error) {
      toast.error('Failed to start customization');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInquiry = async () => {
    const selected = Object.entries(selectedOptions)
      .filter(([key, value]) => value === true && key !== 'quantity')
      .map(([key]) => key);

    if (selected.length === 0) {
      toast.error('Please select at least one customization option');
      return;
    }

    setLoading(true);
    try {
      // Send inquiry
      toast.success('Inquiry sent successfully!');
      // Navigate to inquiries or show success message
    } catch (error) {
      toast.error('Failed to send inquiry');
    } finally {
      setLoading(false);
    }
  };

  const handleChatNow = () => {
    router.push(`/chat/${sellerId}?product=${productId}&mode=customization`);
  };

  const selectedCount = Object.entries(selectedOptions)
    .filter(([key, value]) => value === true && key !== 'quantity')
    .length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-900">🎨 Customization Options</h3>
        <p className="text-sm text-gray-600 mt-1">
          Personalize the product to match your brand requirements
        </p>
      </div>

      {/* Customization Options */}
      <div className="space-y-3">
        {customizationOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => toggleOption(option.id)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition transform hover:scale-102 ${
              selectedOptions[option.id as keyof typeof selectedOptions]
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedOptions[option.id as keyof typeof selectedOptions] as boolean}
                onChange={() => toggleOption(option.id)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 mt-1"
              />
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-900 cursor-pointer block">
                  {option.label}
                </label>
                <p className="text-sm text-gray-600 mt-1">{option.description}</p>
              </div>
              <span className="text-2xl">{option.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quantity Selection */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-900">
          Estimated Quantity
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={selectedOptions.quantity}
            onChange={(e) =>
              setSelectedOptions(prev => ({
                ...prev,
                quantity: Math.max(50, parseInt(e.target.value) || 50)
              }))
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="50"
          />
          <span className="text-sm text-gray-600">units</span>
        </div>
      </div>

      {/* Summary Box */}
      {selectedCount > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✨</div>
            <div>
              <h4 className="font-semibold text-gray-900">Your Customization</h4>
              <p className="text-sm text-gray-700 mt-1">
                {selectedCount} option{selectedCount > 1 ? 's' : ''} selected for {selectedOptions.quantity} units
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(selectedOptions)
                  .filter(([key, value]) => value === true && key !== 'quantity')
                  .map(([key]) => {
                    const option = customizationOptions.find(opt => opt.id === key);
                    return (
                      <span key={key} className="inline-block bg-purple-200 text-purple-900 px-3 py-1 rounded-full text-xs font-medium">
                        {option?.label}
                      </span>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          💡 <strong>Pro Tip:</strong> Our team will contact you within 24 hours with detailed customization options and pricing.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Primary: Customize Now */}
        <button
          onClick={handleCustomizeNow}
          disabled={loading || selectedCount === 0}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold rounded-lg transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
        >
          <HiOutlinePencil size={20} />
          {loading ? 'Processing...' : '✏️ Customize Now'}
        </button>

        {/* Secondary: Send Inquiry */}
        <button
          onClick={handleSendInquiry}
          disabled={loading || selectedCount === 0}
          className="w-full py-3 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 disabled:opacity-50 font-semibold rounded-lg transition flex items-center justify-center gap-2"
        >
          <HiOutlineInboxArrowDown size={20} />
          Send Inquiry
        </button>

        {/* Tertiary: Chat Now */}
        <button
          onClick={handleChatNow}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
        >
          <HiOutlineChatBubbleLeftRight size={20} />
          💬 Chat Now
        </button>
      </div>

      {/* Details Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
      >
        {showDetails ? '▼ Hide' : '▶ Show'} Customization Details
      </button>

      {showDetails && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm text-gray-700">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">📌 Logo Printing Includes:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Single color or multi-color printing</li>
              <li>Custom placement on product</li>
              <li>High-quality print finish</li>
              <li>File format support: AI, PSD, PDF</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">⚙️ OEM/ODM Support Includes:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Custom product specifications</li>
              <li>Packaging design consultation</li>
              <li>Technical support during production</li>
              <li>Quality assurance at every stage</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">🎨 Custom Design Includes:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Design consultation with experts</li>
              <li>Multiple design iterations</li>
              <li>3D mockup visualization</li>
              <li>Unlimited revisions (up to 5 rounds)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizationSection;
