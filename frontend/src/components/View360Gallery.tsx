'use client';
import { resolveImageUrl } from '@/lib/imageUrl';

import { useState } from 'react';
import Image from 'next/image';
import { HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi2';

interface View360Image {
  url: string;
  angle: number;
}

interface View360GalleryProps {
  images: View360Image[];
  onImagesChange: (images: View360Image[]) => void;
  isEditable?: boolean;
}

export default function View360Gallery({ images = [], onImagesChange, isEditable = false }: View360GalleryProps) {
  const [selectedAngle, setSelectedAngle] = useState(0);
  const [newUrl, setNewUrl] = useState('');
  const [newAngle, setNewAngle] = useState(0);

  const sortedImages = [...images].sort((a, b) => a.angle - b.angle);

  const addImage = () => {
    if (newUrl && newAngle >= 0 && newAngle <= 360) {
      const updated = [...images, { url: newUrl, angle: newAngle }];
      onImagesChange(updated);
      setNewUrl('');
      setNewAngle(0);
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  if (!isEditable && images.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
        <p>No 360° images available</p>
      </div>
    );
  }

  if (isEditable) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🔄 360° View (Optional)</h3>

        {/* Current Images */}
        {images.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3">Added Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sortedImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={resolveImageUrl(img.url)}
                      alt={`360 view ${img.angle}°`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <button
                        onClick={() => removeImage(images.indexOf(img))}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <HiOutlineTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">{img.angle}°</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Image */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <HiOutlinePlus className="w-5 h-5" /> Add 360° Image
          </h4>

          <div className="space-y-4">
            {/* Image URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Angle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Angle (0-360°)
              </label>
              <input
                type="number"
                min="0"
                max="360"
                value={newAngle}
                onChange={(e) => setNewAngle(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">0° = front, 90° = side, 180° = back, 270° = other side</p>
            </div>

            <button
              onClick={addImage}
              disabled={!newUrl || newAngle < 0 || newAngle > 360}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              ✓ Add Image
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p>
            <strong>💡 Tip:</strong> Add 4-8 images at different angles (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
            to create a smooth 360° view for your product.
          </p>
        </div>
      </div>
    );
  }

  // Display Mode
  if (images.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-900 mb-4">🔄 360° Product View</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sortedImages.map((img, idx) => (
          <div key={idx} className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={resolveImageUrl(img.url)}
              alt={`360 view ${img.angle}°`}
              fill
              className="object-cover hover:scale-105 transition-transform"
            />
            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              {img.angle}°
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
