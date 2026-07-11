'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SellerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params.id as string;

  useEffect(() => {
    if (sellerId) {
      router.replace(`/seller-store/${sellerId}`);
    }
  }, [sellerId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
