'use client';

import { useState } from 'react';
import { HiOutlineCloudArrowUp, HiOutlineTrash, HiOutlineDocument } from "@/lib/icons";

interface CatalogueUploadProps {
  cataloguePdf?: { url: string; fileName: string };
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}

export default function CatalogueUpload({ cataloguePdf, onUpload, onRemove }: CatalogueUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Only PDF files are allowed');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setLoading(true);
    try {
      await onUpload(file);
      setFile(null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-900 mb-4">📄 Product Catalogue (PDF)</h3>

      {/* Current Catalogue */}
      {cataloguePdf && !file && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HiOutlineDocument className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-semibold text-green-700">{cataloguePdf.fileName}</p>
                <p className="text-sm text-green-600">Uploaded successfully</p>
              </div>
            </div>
            <button
              onClick={onRemove}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <HiOutlineTrash className="w-5 h-5" />
            </button>
          </div>
          <a
            href={cataloguePdf.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-600 hover:underline mt-3 block"
          >
            📥 Download Catalogue
          </a>
        </div>
      )}

      {/* Upload Area */}
      {!cataloguePdf && !file && (
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
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="pdf-input"
          />

          <label htmlFor="pdf-input" className="cursor-pointer">
            <p className="text-lg font-semibold text-gray-700 mb-2">
              Drag your PDF here
            </p>
            <p className="text-gray-600 mb-4">or click to select</p>
            <p className="text-sm text-gray-500">Maximum 10MB</p>
          </label>
        </div>
      )}

      {/* Selected File */}
      {file && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HiOutlineDocument className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-700">{file.name}</p>
                <p className="text-sm text-blue-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <HiOutlineTrash className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? '⏳ Uploading...' : '📤 Upload PDF'}
            </button>
            <button
              onClick={() => setFile(null)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <p>
          <strong>💡 Tip:</strong> Upload a complete product catalogue so buyers can download it for reference.
          Supports product specifications, pricing, and bulk order information.
        </p>
      </div>
    </div>
  );
}
