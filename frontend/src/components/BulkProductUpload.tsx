'use client';

import { useState } from 'react';
import { HiOutlineCloudArrowUp, HiOutlineCheckCircle, HiOutlineExclamationTriangle } from "@/lib/icons";
import Papa from 'papaparse';

interface UploadResult {
  successful: Array<{ id: string; name: string; sku: string }>;
  failed: Array<{ row: number; productName: string; error: string }>;
  totalProcessed: number;
}

export default function BulkProductUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      if (['text/csv', 'application/vnd.ms-excel'].includes(files[0].type) || files[0].name.endsWith('.csv')) {
        setFile(files[0]);
        setError('');
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (['text/csv', 'application/vnd.ms-excel'].includes(selectedFile.type) || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Parse CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            // Validate CSV structure
            const products = results.data as Record<string, string>[];

            if (products.length === 0) {
              setError('CSV file is empty');
              setLoading(false);
              return;
            }

            // Send to backend
            const response = await fetch('/api/products/bulk/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ products }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Upload failed');
            }

            const data = await response.json();
            setResult(data.data);
            setFile(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
          } finally {
            setLoading(false);
          }
        },
        error: (err) => {
          setError(`CSV parsing error: ${err.message}`);
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `name,description,price,comparePrice,currency,priceUnit,category,stock,sku,images
Product Name,Product Description,100,150,INR,Piece,Category,50,SKU001,https://picsum.photos/600/600?random=1;https://picsum.photos/600/600?random=2
Product 2,Description 2,200,300,INR,Meter,Category 2,100,SKU002,https://picsum.photos/600/600?random=3`;

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(template)}`);
    element.setAttribute('download', 'bulk_upload_template.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-2">📥 Bulk Product Upload</h2>
      <p className="text-gray-600 mb-6">Upload 100+ products at once using CSV file</p>

      {/* Download Template */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <button
          onClick={downloadTemplate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          📋 Download CSV Template
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Format: name, description, price, comparePrice, currency, priceUnit, category, stock, sku, images
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <HiOutlineCloudArrowUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />

        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />

        <label htmlFor="file-input" className="cursor-pointer">
          <p className="text-lg font-semibold text-gray-700 mb-2">
            Drag and drop your CSV file here
          </p>
          <p className="text-gray-600 mb-4">or click to select</p>
        </label>

        {file && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-semibold">✓ {file.name}</p>
            <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {file && !result && (
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleUpload}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-semibold flex items-center justify-center gap-2"
          >
            {loading ? '⏳ Uploading...' : '🚀 Upload Products'}
          </button>
          <button
            onClick={() => setFile(null)}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <HiOutlineExclamationTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-700 font-semibold">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Success Summary */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex gap-3 mb-3">
              <HiOutlineCheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-green-700 font-semibold">
                  ✓ {result.successful.length} products uploaded successfully
                </p>
                <p className="text-sm text-green-600">
                  Total processed: {result.totalProcessed}
                </p>
              </div>
            </div>
          </div>

          {/* Failed Products */}
          {result.failed.length > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-700 font-semibold mb-3">
                ⚠️ {result.failed.length} products failed to upload
              </p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {result.failed.map((failure, idx) => (
                  <div key={idx} className="text-sm text-orange-600 bg-white p-2 rounded">
                    <p className="font-semibold">Row {failure.row}: {failure.productName}</p>
                    <p className="text-orange-500">{failure.error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success List */}
          {result.successful.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 font-semibold mb-3">✓ Uploaded Products</p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {result.successful.slice(0, 10).map((product, idx) => (
                  <div key={idx} className="text-sm text-blue-600 bg-white p-2 rounded">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-gray-600">SKU: {product.sku}</p>
                  </div>
                ))}
                {result.successful.length > 10 && (
                  <p className="text-sm text-gray-600 text-center py-2">
                    +{result.successful.length - 10} more products
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setResult(null);
              setFile(null);
            }}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Upload More Products
          </button>
        </div>
      )}
    </div>
  );
}
