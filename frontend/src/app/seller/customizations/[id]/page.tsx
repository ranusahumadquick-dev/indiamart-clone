'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomizationDetailRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/seller/inbox'); }, [router]);
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );
}
