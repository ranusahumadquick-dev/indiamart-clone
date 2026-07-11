'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { resolveImageUrl } from '@/lib/imageUrl';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineBuildingStorefront,
  HiOutlinePhoto,
  HiOutlineGlobeAlt,
} from 'react-icons/hi2';

interface Brand {
  _id: string;
  brandName: string;
  brandDescription: string;
  brandFeatures: string;
  logo: string;
  website: string;
  createdAt: string;
}

const EMPTY_FORM = {
  brandName: '',
  brandDescription: '',
  brandFeatures: '',
  website: '',
};

function BrandsContent() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/brands/my');
      setBrands(res.data.data.brands || []);
    } catch {
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const openCreate = () => {
    setEditBrand(null);
    setForm(EMPTY_FORM);
    setLogoFile(null);
    setLogoPreview('');
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (brand: Brand) => {
    setEditBrand(brand);
    setForm({
      brandName: brand.brandName,
      brandDescription: brand.brandDescription,
      brandFeatures: brand.brandFeatures,
      website: brand.website,
    });
    setLogoFile(null);
    setLogoPreview(brand.logo ? resolveImageUrl(brand.logo) : '');
    setErrors({});
    setShowModal(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5MB'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.brandName.trim()) errs.brandName = 'Brand name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('brandName', form.brandName.trim());
      fd.append('brandDescription', form.brandDescription.trim());
      fd.append('brandFeatures', form.brandFeatures.trim());
      fd.append('website', form.website.trim());
      if (logoFile) fd.append('logo', logoFile);

      if (editBrand) {
        await api.put(`/brands/${editBrand._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Brand updated successfully');
      } else {
        await api.post('/brands', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Brand created successfully');
      }
      setShowModal(false);
      fetchBrands();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete brand "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/brands/${id}`);
      toast.success('Brand deleted');
      setBrands((prev) => prev.filter((b) => b._id !== id));
    } catch {
      toast.error('Failed to delete brand');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Brand Management</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage your product brands</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-[var(--primary,#0052cc)] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition shrink-0"
          >
            <HiOutlinePlusCircle className="w-5 h-5" />
            Add Brand
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : brands.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <HiOutlineBuildingStorefront className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No brands yet</h3>
            <p className="text-gray-400 text-sm mb-6">Add your first brand to showcase to buyers</p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
            >
              <HiOutlinePlusCircle className="w-4 h-4" /> Add Brand
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <div key={brand._id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-5">
                {/* Logo + Name */}
                <div className="flex items-center gap-3 mb-3">
                  {brand.logo ? (
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                      <img
                        src={resolveImageUrl(brand.logo)}
                        alt={brand.brandName}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <HiOutlineBuildingStorefront className="w-7 h-7 text-blue-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{brand.brandName}</h3>
                    {brand.website && (
                      <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block">
                        {brand.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>

                {brand.brandDescription && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{brand.brandDescription}</p>
                )}

                {brand.brandFeatures && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Features</p>
                    <p className="text-xs text-gray-600 line-clamp-2 whitespace-pre-line">{brand.brandFeatures}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Link
                    href={`/brands/${brand._id}`}
                    className="flex-1 text-center text-xs font-medium text-blue-600 hover:text-blue-700 py-1.5 rounded-lg hover:bg-blue-50 transition"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => openEdit(brand)}
                    className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  >
                    <HiOutlinePencilSquare className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(brand._id, brand.brandName)}
                    disabled={deletingId === brand._id}
                    className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                    {deletingId === brand._id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editBrand ? 'Edit Brand' : 'Add New Brand'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Logo</label>
                <label className="flex items-center gap-4 cursor-pointer">
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center overflow-hidden transition shrink-0 bg-gray-50">
                    {logoPreview ? (
                      <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                      <HiOutlinePhoto className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Click to upload logo</p>
                    <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP · Max 5MB</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.brandName}
                  onChange={(e) => setForm((f) => ({ ...f, brandName: e.target.value }))}
                  placeholder="e.g. Tata, Amul, Reliance"
                  maxLength={100}
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-100 ${
                    errors.brandName ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400'
                  }`}
                />
                {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>}
              </div>

              {/* Brand Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand Description</label>
                <textarea
                  value={form.brandDescription}
                  onChange={(e) => setForm((f) => ({ ...f, brandDescription: e.target.value }))}
                  placeholder="Describe your brand, its history, and what makes it unique..."
                  rows={3}
                  maxLength={2000}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                />
              </div>

              {/* Brand Features */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand Features</label>
                <textarea
                  value={form.brandFeatures}
                  onChange={(e) => setForm((f) => ({ ...f, brandFeatures: e.target.value }))}
                  placeholder="Enter brand features (e.g. Premium Quality, Fast Delivery, ISO Certified, GST Verified, 24×7 Customer Support, Bulk Orders Accepted, Made in India)"
                  rows={4}
                  maxLength={3000}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                />
                <p className="text-xs text-gray-400 mt-1">Each line or item will be displayed as a feature</p>
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Website URL</label>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition">
                  <span className="px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-gray-400">
                    <HiOutlineGlobeAlt className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    placeholder="https://www.yourbrand.com"
                    className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><HiOutlineCheckCircle className="w-4 h-4" /> {editBrand ? 'Update Brand' : 'Create Brand'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SellerBrandsPage() {
  return (
    <ProtectedRoute allowedRoles={['seller', 'admin']}>
      <BrandsContent />
    </ProtectedRoute>
  );
}
