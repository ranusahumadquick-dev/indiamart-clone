'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  HiOutlineShare,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

interface ProductShareProps {
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
}

export default function ProductShare({
  productId,
  productName,
  productPrice,
  productImage,
}: ProductShareProps) {
  const [isOpen, setIsOpen] = useState(false);

  const productUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/products/${productId}`
    : '';

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const shareText = `Check out this product: ${productName} - ${formatINR(productPrice)}`;

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(`${shareText}\n\n${productUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    toast.success('Opening WhatsApp...');
    setIsOpen(false);
  };

  const handleFacebookShare = () => {
    const message = encodeURIComponent(shareText);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${message}`,
      '_blank',
      'width=600,height=400'
    );
    toast.success('Opening Facebook...');
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      toast.success('Link copied to clipboard! 📋');
      setIsOpen(false);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check this product: ${productName}`);
    const body = encodeURIComponent(`${shareText}\n\n${productUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast.success('Opening email client...');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold text-gray-700"
      >
        <HiOutlineShare className="w-5 h-5" />
        Share
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-48">
          {/* Share Options */}
          <button
            onClick={handleWhatsAppShare}
            className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center gap-3 border-b transition"
          >
            <span className="text-xl">💬</span>
            <span className="text-sm font-semibold text-gray-900">WhatsApp</span>
          </button>

          <button
            onClick={handleFacebookShare}
            className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 border-b transition"
          >
            <span className="text-xl">👍</span>
            <span className="text-sm font-semibold text-gray-900">Facebook</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 border-b transition"
          >
            <span className="text-xl">📋</span>
            <span className="text-sm font-semibold text-gray-900">Copy Link</span>
          </button>

          <button
            onClick={handleEmailShare}
            className="w-full text-left px-4 py-3 hover:bg-orange-50 flex items-center gap-3 transition"
          >
            <span className="text-xl">✉️</span>
            <span className="text-sm font-semibold text-gray-900">Email</span>
          </button>
        </div>
      )}

      {/* Backdrop to close menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
