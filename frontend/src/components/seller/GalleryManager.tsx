'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import { resolveImageUrl } from '@/lib/imageUrl';
import toast from 'react-hot-toast';
import {
  HiOutlinePhoto,
  HiOutlineTrash,
  HiOutlineStar,
  HiStar,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineArrowUpTray,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
} from "@/lib/icons";

interface GalleryImage {
  _id: string;
  url: string;
  caption: string;
  category: string;
  isCover: boolean;
  order: number;
}

interface PendingFile {
  file: File;
  caption: string;
  category: string;
  preview: string; // object URL
  error?: string;  // per-file validation error
}

const CATEGORIES = [
  { value: 'office', label: 'Office' },
  { value: 'factory', label: 'Factory' },
  { value: 'team', label: 'Team' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'showroom', label: 'Showroom' },
  { value: 'logo', label: 'Logo' },
  { value: 'other', label: 'Other' },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 50;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GalleryManager({ sellerId }: { sellerId: string }) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editCategory, setEditCategory] = useState('other');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => { pending.forEach(p => URL.revokeObjectURL(p.preview)); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGallery = useCallback(async () => {
    setFetchError(false);
    try {
      const res = await api.get(`/gallery/${sellerId}`);
      setImages(res.data?.data || []);
    } catch {
      setFetchError(true);
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  // ── File selection ──────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // reset so same file can be re-selected
    if (!files.length) return;

    const totalAfter = images.length + pending.length + files.length;
    if (totalAfter > MAX_IMAGES) {
      toast.error(`Max ${MAX_IMAGES} images allowed. You can add ${MAX_IMAGES - images.length - pending.length} more.`);
      return;
    }

    const newPending: PendingFile[] = files.map(file => {
      let error: string | undefined;
      if (!ALLOWED_TYPES.includes(file.type)) {
        error = 'Only JPG, PNG, WebP allowed';
      } else if (file.size > MAX_FILE_SIZE) {
        error = `Too large (${formatBytes(file.size)} — max 5MB)`;
      }
      return { file, caption: '', category: 'other', preview: URL.createObjectURL(file), error };
    });

    // Show errors for invalid files but still add valid ones
    const invalid = newPending.filter(p => p.error);
    if (invalid.length) {
      invalid.forEach(p => toast.error(`${p.file.name}: ${p.error}`));
    }
    const valid = newPending.filter(p => !p.error);
    if (valid.length) setPending(prev => [...prev, ...valid]);
  };

  const removePending = (idx: number) => {
    setPending(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const updatePending = (idx: number, field: 'caption' | 'category', value: string) => {
    setPending(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  // ── Upload ──────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!pending.length || uploading) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const fd = new FormData();
    pending.forEach(p => fd.append('images', p.file));
    pending.forEach(p => fd.append('captions', p.caption));
    pending.forEach(p => fd.append('categories', p.category));

    try {
      await api.post('/gallery/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) {
            setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      });

      // Revoke object URLs for uploaded files
      pending.forEach(p => URL.revokeObjectURL(p.preview));
      setPending([]);
      setUploadProgress(100);
      toast.success(`${pending.length} image${pending.length > 1 ? 's' : ''} uploaded!`);
      fetchGallery();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;

      let friendlyError: string;
      if (status === 413) {
        const totalMB = (pending.reduce((s, p) => s + p.file.size, 0) / (1024 * 1024)).toFixed(1);
        friendlyError = `Upload too large (${totalMB} MB total). Try uploading fewer images at once.`;
      } else if (status === 401) {
        friendlyError = 'Session expired — please log in again.';
      } else if (status === 403) {
        friendlyError = 'Only sellers can upload gallery images.';
      } else {
        friendlyError = msg || 'Upload failed — please try again.';
      }

      setUploadError(friendlyError);
      toast.error(friendlyError);
      console.error('[GalleryManager] Upload error:', status, msg);
      // Files are NOT cleared — user can retry
    } finally {
      setUploading(false);
    }
  };

  // ── Gallery actions ─────────────────────────────────────────────────
  const handleDelete = async (imageId: string) => {
    if (!confirm('Delete this image from your gallery?')) return;
    try {
      await api.delete(`/gallery/${imageId}`);
      setImages(prev => prev.filter(img => img._id !== imageId));
      toast.success('Image deleted');
    } catch {
      toast.error('Failed to delete image');
    }
  };

  const handleSetCover = async (imageId: string) => {
    try {
      await api.patch(`/gallery/${imageId}`, { isCover: true });
      setImages(prev => prev.map(img => ({ ...img, isCover: img._id === imageId })));
      toast.success('Cover image updated');
    } catch {
      toast.error('Failed to update cover');
    }
  };

  const startEdit = (img: GalleryImage) => {
    setEditingId(img._id);
    setEditCaption(img.caption || '');
    setEditCategory(img.category || 'other');
  };

  const saveEdit = async (imageId: string) => {
    try {
      await api.patch(`/gallery/${imageId}`, { caption: editCaption, category: editCategory });
      setImages(prev => prev.map(img =>
        img._id === imageId ? { ...img, caption: editCaption, category: editCategory } : img
      ));
      setEditingId(null);
      toast.success('Updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="aspect-square bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <HiOutlineExclamationTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium mb-3">Failed to load gallery</p>
        <button onClick={fetchGallery}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2 mx-auto">
          <HiOutlineArrowPath className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const remainingSlots = MAX_IMAGES - images.length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Company Gallery</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {images.length}/{MAX_IMAGES} images · JPG, PNG, WebP · Max 5MB each
            </p>
          </div>
          {remainingSlots > 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold disabled:opacity-50"
            >
              <HiOutlineArrowUpTray className="w-4 h-4" />
              Add Photos
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Pending files — preview + caption/category + upload button */}
        {pending.length > 0 && (
          <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-blue-700">
                {pending.length} photo{pending.length > 1 ? 's' : ''} ready to upload
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || images.length + pending.length >= MAX_IMAGES}
                className="text-xs text-blue-600 hover:underline disabled:opacity-40"
              >
                + Add more
              </button>
            </div>

            {/* Per-file rows */}
            <div className="space-y-2">
              {pending.map((p, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-blue-100">
                  <img
                    src={p.preview}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-xs text-gray-500 truncate flex-1">{p.file.name}</p>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{formatBytes(p.file.size)}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Caption (optional)"
                      value={p.caption}
                      disabled={uploading}
                      onChange={e => updatePending(idx, 'caption', e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50"
                    />
                    <select
                      value={p.category}
                      disabled={uploading}
                      onChange={e => updatePending(idx, 'category', e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => removePending(idx)}
                    disabled={uploading}
                    className="text-gray-400 hover:text-red-500 transition flex-shrink-0 mt-1 disabled:opacity-40"
                  >
                    <HiOutlineXMark className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Upload error */}
            {uploadError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
                <HiOutlineExclamationTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{uploadError}</span>
                <button
                  onClick={() => setUploadError(null)}
                  className="text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Progress bar */}
            {uploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-blue-600">
                  <span>Uploading…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload / Retry button */}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Uploading {pending.length} photo{pending.length > 1 ? 's' : ''}…
                </>
              ) : uploadError ? (
                <><HiOutlineArrowPath className="w-4 h-4" /> Retry Upload</>
              ) : (
                `Upload ${pending.length} Photo${pending.length > 1 ? 's' : ''}`
              )}
            </button>
          </div>
        )}

        {/* Empty state */}
        {images.length === 0 && pending.length === 0 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/40 transition cursor-pointer"
          >
            <HiOutlinePhoto className="w-10 h-10 text-gray-300 mb-2" />
            <p className="text-gray-500 font-medium text-sm">No photos yet</p>
            <p className="text-gray-400 text-xs mt-1">Click to upload office, factory, team photos</p>
          </button>
        )}

        {/* Existing images grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img._id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <div className="aspect-square relative">
                  <img
                    src={resolveImageUrl(img.url)}
                    alt={img.caption || 'Gallery'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {img.isCover && (
                    <span className="absolute top-1.5 left-1.5 bg-yellow-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <HiStar className="w-2.5 h-2.5" /> COVER
                    </span>
                  )}
                  {img.category && img.category !== 'other' && (
                    <span className="absolute top-1.5 right-1.5 bg-blue-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize">
                      {img.category}
                    </span>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    {!img.isCover && (
                      <button onClick={() => handleSetCover(img._id)} title="Set as cover"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full transition">
                        <HiOutlineStar className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => startEdit(img)} title="Edit"
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition">
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(img._id)} title="Delete"
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline edit */}
                {editingId === img._id ? (
                  <div className="p-2 space-y-1.5 bg-white border-t border-gray-100">
                    <input type="text" value={editCaption} onChange={e => setEditCaption(e.target.value)}
                      placeholder="Caption" className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300" />
                    <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300">
                      {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                    </select>
                    <div className="flex gap-1.5">
                      <button onClick={() => saveEdit(img._id)}
                        className="flex-1 bg-blue-600 text-white text-xs py-1 rounded font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-1">
                        <HiOutlineCheck className="w-3 h-3" /> Save
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="flex-1 border border-gray-200 text-gray-600 text-xs py-1 rounded hover:bg-gray-50 transition flex items-center justify-center gap-1">
                        <HiOutlineXMark className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : img.caption ? (
                  <p className="px-2 py-1.5 text-xs text-gray-600 truncate border-t border-gray-100">{img.caption}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
