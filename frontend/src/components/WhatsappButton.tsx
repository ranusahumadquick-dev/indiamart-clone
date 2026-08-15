'use client';

import { HiOutlinePhone } from "@/lib/icons";

interface WhatsappButtonProps {
  phoneNumber?: string;
  companyName?: string;
  productName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function WhatsappButton({
  phoneNumber,
  companyName = 'Seller',
  productName,
  className = '',
  size = 'md',
}: WhatsappButtonProps) {
  if (!phoneNumber || !phoneNumber.trim()) {
    return null;
  }

  const cleanNumber = phoneNumber.replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
    return null;
  }

  const fullNumber = `91${cleanNumber}`;

  // Build message based on context
  let message = `Hi ${companyName}`;
  if (productName) {
    message += `, I'm interested in ${productName}`;
  }
  message += '. Can you provide more details?';

  const whatsappUrl = `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center ${sizeClasses[size]} bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition ${className}`}
    >
      <HiOutlinePhone className={iconSize[size]} />
      <span>WhatsApp</span>
    </a>
  );
}
