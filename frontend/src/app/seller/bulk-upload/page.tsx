'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BulkProductUpload from '@/components/BulkProductUpload';
import { HiOutlineArrowLeft } from 'react-icons/hi2';

export default function BulkUploadPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated (you can adjust this based on your auth setup)
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/auth/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <HiOutlineArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Product Upload</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            Upload multiple products at once using a CSV file. Perfect for adding large product catalogs quickly.
          </p>
        </div>

        <BulkProductUpload />

        {/* Guide Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📝 CSV Format Guide</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>name</strong> - Product name (required)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>price</strong> - Selling price (required)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>description</strong> - Product description</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>comparePrice</strong> - Original/MRP price</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>currency</strong> - INR, USD, etc (default: INR)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>priceUnit</strong> - Piece, Meter, Kg, etc</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>category</strong> - Product category</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>stock</strong> - Quantity available</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>sku</strong> - Stock keeping unit</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>images</strong> - Image URLs separated by semicolon (;)</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-4">✨ Tips & Best Practices</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>Maximum 500 products per upload</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>Use UTF-8 encoding for special characters</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>Include at least 2 images per product for better visibility</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>Use realistic stock quantities</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>Download template and fill it with your data</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>Products will be created in "Pending" status for review</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>Failed products won't block successful uploads</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span>Check error details to fix and re-upload</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Example Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-blue-900 mb-3">📌 Example CSV Row</h3>
          <div className="bg-white p-4 rounded font-mono text-sm overflow-x-auto">
            <pre className="text-gray-700">
name,description,price,comparePrice,currency,priceUnit,category,stock,sku,images
{`"Hydraulic Cylinder","Heavy duty industrial cylinder",12500,16000,INR,Piece,"Industrial Equipment",100,SKU-001,"https://picsum.photos/600/600?random=1;https://picsum.photos/600/600?random=2"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
