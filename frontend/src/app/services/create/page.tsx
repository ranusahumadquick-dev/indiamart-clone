'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { StateDropdown, CityDropdown } from "@/components/common/LocationDropdown";
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiOutlineXMark } from 'react-icons/hi2';

const CATEGORIES = [
  'Raw Materials',
  'Manufacturing',
  'Electronics',
  'Textiles',
  'Chemicals',
  'Machinery',
  'Agriculture',
  'Packaging',
  'Quality Testing',
  'Logistics',
  'Other',
];

const PRICE_TYPES = ['fixed', 'hourly', 'custom'];

interface FormData {
  serviceName: string;
  description: string;
  category: string;
  price: number | '';
  currency: string;
  priceType: string;
  deliveryTime: number | '';
  revisions: number | '';
  features: string[];
  tags: string[];
  phone: string;
  email: string;
  preferredContact: string;
  city: string;
  state: string;
  country: string;
}

export default function CreateServicePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    serviceName: '',
    description: '',
    category: '',
    price: '',
    currency: 'INR',
    priceType: 'fixed',
    deliveryTime: '',
    revisions: '',
    features: [],
    tags: [],
    phone: '',
    email: user?.email || '',
    preferredContact: 'email',
    city: '',
    state: '',
    country: 'India',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (files.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    console.log(`📸 [Image Upload] Selected ${files.length} files`);

    const validFiles = files.filter((file) => {
      if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name} has invalid format. Use PNG, JPG, or WebP.`);
        console.warn(`❌ Invalid format: ${file.name}`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Max 5MB.`);
        console.warn(`❌ File too large: ${file.name}`);
        return false;
      }
      console.log(`✅ Valid file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      return true;
    });

    if (validFiles.length === 0) {
      toast.error('No valid images to upload');
      return;
    }

    setImages((prev) => {
      const newImages = [...prev, ...validFiles];
      console.log(`📁 [Image State] Total images: ${newImages.length}`);
      return newImages;
    });

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
        console.log(`🖼️ [Preview] Added preview for ${file.name}`);
      };
      reader.readAsDataURL(file);
    });

    toast.success(`${validFiles.length} image(s) selected`);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.serviceName.trim()) {
      toast.error('Service name is required');
      return;
    }
    if (!formData.description.trim() || formData.description.length < 20) {
      toast.error('Description must be at least 20 characters');
      return;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('Valid price is required');
      return;
    }
    if (!formData.deliveryTime || formData.deliveryTime <= 0) {
      toast.error('Delivery time is required');
      return;
    }

    try {
      setLoading(true);

      console.log(`\n📝 [Service Submit] Starting service creation...`);
      console.log(`📸 Total images to upload: ${images.length}`);

      // Create FormData for multipart upload
      const uploadData = new FormData();
      uploadData.append('serviceName', formData.serviceName);
      uploadData.append('description', formData.description);
      uploadData.append('category', formData.category);
      uploadData.append('price', formData.price.toString());
      uploadData.append('currency', formData.currency);
      uploadData.append('priceType', formData.priceType);
      uploadData.append('deliveryTime', formData.deliveryTime.toString());

      if (formData.revisions) {
        uploadData.append('revisions', formData.revisions.toString());
      }

      // Add features, tags
      formData.features.forEach((f) => uploadData.append('features', f));
      formData.tags.forEach((t) => uploadData.append('tags', t));

      // Add contact info
      if (formData.phone) uploadData.append('phone', formData.phone);
      uploadData.append('email', formData.email);
      uploadData.append('preferredContact', formData.preferredContact);

      // Add location
      if (formData.city) uploadData.append('city', formData.city);
      if (formData.state) uploadData.append('state', formData.state);
      uploadData.append('country', formData.country);

      // Add images - LOG EACH FILE
      console.log(`\n🖼️ [Image Upload] Adding ${images.length} images to FormData...`);
      images.forEach((image, idx) => {
        console.log(`  ${idx + 1}. ${image.name} (${(image.size / 1024).toFixed(2)} KB) - Type: ${image.type}`);
        uploadData.append('images', image);
      });

      if (images.length === 0) {
        console.warn('⚠️  No images selected - proceeding without images');
      }

      // VERIFY FormData contents before sending
      console.log(`\n🔍 [FormData Debug] Checking FormData entries...`);
      let imageCount = 0;
      for (let [key, value] of uploadData.entries()) {
        if (key === 'images') {
          imageCount++;
          console.log(`   ${imageCount}. Field: "${key}" | File: ${(value as File).name} | Size: ${(value as File).size / 1024} KB`);
        }
      }
      console.log(`✅ [FormData Debug] Total images in FormData: ${imageCount}`);

      console.log(`\n📤 [API Call] Sending POST to /api/services with ${imageCount} images...`);
      const response = await api.post('/services', uploadData);
      // Note: Do NOT set Content-Type header - axios/FormData handles it automatically with boundary!

      console.log(`✅ [API Response] Success!`, response.data);

      if (response.data.success) {
        toast.success('Service created successfully!');
        router.push('/services');
      }
    } catch (error: any) {
      console.error('❌ [Error] Service creation failed:', error);
      console.error('Response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
            >
              <HiArrowLeft className="w-5 h-5" />
              Back to Services
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create New Service</h1>
            <p className="text-gray-600 mt-2">
              Describe your professional service and start receiving inquiries from clients
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleInputChange}
                    placeholder="e.g., Industrial Maintenance Services, Logistics & Transportation"
                    maxLength={100}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.serviceName.length}/100 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your B2B service. Include: What services/products you offer, your industry experience, certifications, quality standards, minimum order quantities, delivery locations, and terms."
                    rows={5}
                    minLength={20}
                    maxLength={2000}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/2000 characters (min 20)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price Type *
                    </label>
                    <select
                      name="priceType"
                      value={formData.priceType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {PRICE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Delivery */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing & Delivery</h2>

              <div className="space-y-4">
                {/* Row 1: Price with Currency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="Enter price amount"
                      min="0"
                      step="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Currency *
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="INR">₹ INR (Indian Rupee)</option>
                      <option value="USD">$ USD (US Dollar)</option>
                      <option value="EUR">€ EUR (Euro)</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Delivery Time & Revisions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Delivery Time (days) *
                    </label>
                    <input
                      type="number"
                      name="deliveryTime"
                      value={formData.deliveryTime}
                      onChange={handleInputChange}
                      placeholder="e.g., 5, 7, 14"
                      min="1"
                      max="365"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Revisions Included (Optional)
                    </label>
                    <input
                      type="number"
                      name="revisions"
                      value={formData.revisions}
                      onChange={handleInputChange}
                      placeholder="e.g., 2, 3, Unlimited"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Price Type Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Tip:</strong> Your price type "{formData.priceType === 'hourly' ? 'Hourly' : formData.priceType === 'custom' ? 'Custom' : 'Fixed Price'}" is set in Basic Information
                  </p>
                </div>
              </div>
            </div>

            {/* Features & Tags */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Features & Skills</h2>

              <div className="space-y-5">
                {/* Features */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    What's Included in Your Service Offering
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                      placeholder="e.g., Bulk discounts available, ISO certified, Free quality testing, On-site installation"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      Add
                    </button>
                  </div>

                  {formData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          ✓ {feature}
                          <button
                            type="button"
                            onClick={() => removeFeature(idx)}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            <HiOutlineXMark className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Business Keywords (For searchability & industry classification)
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="e.g., Manufacturing, Export, Bulk Orders, ISO Certified, GST Registered"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      Add
                    </button>
                  </div>

                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(idx)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <HiOutlineXMark className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Service Images */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Service Images</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Upload Images (Max 5, 5MB each)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                />

                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${idx}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <HiOutlineXMark className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Your phone number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preferred Contact Method
                  </label>
                  <select
                    name="preferredContact"
                    value={formData.preferredContact}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="chat">Chat</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Location</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <StateDropdown label="State" value={formData.state} onChange={(v) => handleInputChange({ target: { name: "state", value: v } } as any)} />
                  </div>
                  <div>
                    <CityDropdown label="City" value={formData.city} onChange={(v) => handleInputChange({ target: { name: "city", value: v } } as any)} state={formData.state} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Link
                href="/services"
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
