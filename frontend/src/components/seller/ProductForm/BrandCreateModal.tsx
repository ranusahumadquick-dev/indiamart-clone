"use client";

import { useState } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { HiOutlineXMark, HiOutlinePhoto } from "@/lib/icons";
import type { Brand } from "./types";

interface BrandCreateModalProps {
  onClose: () => void;
  onCreated: (brand: Brand) => void;
}

export default function BrandCreateModal({ onClose, onCreated }: BrandCreateModalProps) {
  const [creating, setCreating] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandFeatures, setBrandFeatures] = useState("");
  const [website, setWebsite] = useState("");

  const handleCreate = async () => {
    if (!brandName.trim()) { toast.error("Brand name required"); return; }
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("brandName", brandName.trim());
      if (brandDescription) fd.append("brandDescription", brandDescription.trim());
      if (brandFeatures) fd.append("brandFeatures", brandFeatures.trim());
      if (website) fd.append("website", website.trim());
      if (logoFile) fd.append("logo", logoFile);
      const res = await api.post("/brands", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const created = res.data.data?.brand || res.data.data;
      if (created?._id) {
        toast.success(`Brand "${created.brandName}" created!`);
        onCreated({ _id: created._id, brandName: created.brandName });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create brand");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">Create New Brand</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Logo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Logo</label>
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center overflow-hidden transition shrink-0 bg-gray-50">
                {logoPreview
                  ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                  : <HiOutlinePhoto className="w-7 h-7 text-gray-300" />}
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Click to upload logo</p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP · Max 5MB</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
                setLogoFile(file);
                setLogoPreview(URL.createObjectURL(file));
              }} />
            </label>
          </div>
          {/* Brand Name */}
          <div>
            <label className="label-sm">Brand Name <span className="text-red-400">*</span></label>
            <input type="text" autoFocus maxLength={100}
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Tata, Amul, Reliance"
              className="input-base" />
          </div>
          {/* Description */}
          <div>
            <label className="label-sm">Brand Description</label>
            <textarea rows={3} maxLength={2000}
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              placeholder="Describe your brand, history, what makes it unique..."
              className="input-base resize-none" />
          </div>
          {/* Features */}
          <div>
            <label className="label-sm">Brand Features</label>
            <textarea rows={3} maxLength={3000}
              value={brandFeatures}
              onChange={(e) => setBrandFeatures(e.target.value)}
              placeholder="e.g. Premium Quality, ISO Certified, Made in India..."
              className="input-base resize-none" />
            <p className="text-xs text-gray-400 mt-1">Each line will be shown as a feature</p>
          </div>
          {/* Website */}
          <div>
            <label className="label-sm">Website URL</label>
            <input type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.yourbrand.com"
              className="input-base" />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={handleCreate} disabled={creating}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            {creating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</> : "Create Brand"}
          </button>
          <button type="button" onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
