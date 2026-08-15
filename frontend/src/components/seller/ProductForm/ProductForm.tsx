"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { VariantsTab } from "@/components/seller/ProductEditForm/VariantsTab";
import { StateDropdown, CityDropdown } from "@/components/common/LocationDropdown";
import {
  HiOutlineArrowLeft,
  HiOutlinePhoto,
  HiOutlineXMark,
  HiOutlinePlusCircle,
  HiOutlineInformationCircle,
  HiOutlineTrash,
  HiOutlineBeaker,
  HiOutlineTag,
  HiOutlineCurrencyRupee,
  HiOutlineCheckCircle,
  HiOutlinePencilSquare,
  HiOutlineBuildingStorefront,
  HiOutlineVideoCamera,
  HiOutlineRocketLaunch,
  HiOutlineClock,
  HiOutlineXCircle,
} from "@/lib/icons";
import { useProductForm } from "./useProductForm";
import BrandCreateModal from "./BrandCreateModal";
import { PRICE_UNITS, SUGGESTED_TAGS } from "./types";

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
}

export default function ProductForm({ mode, productId }: ProductFormProps) {
  const { user } = useAuth();
  const f = useProductForm({
    mode,
    productId,
    userDefaults: { city: (user as any)?.city, state: (user as any)?.state },
  });

  if (f.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEdit = mode === "edit";

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/seller/products" className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400">
          <HiOutlineArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "Edit Product" : "Add New Product"}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isEdit ? "Update your product details" : "Free listing — reach thousands of buyers"}
          </p>
        </div>
        {isEdit ? (
          <span className={`ml-auto text-xs px-3 py-1.5 rounded-full font-medium ${
            f.product?.status === "approved" ? "bg-green-100 text-green-700"
              : f.product?.status === "pending" ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}>
            {f.product?.status}
          </span>
        ) : (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
            <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Free
          </span>
        )}
      </div>

      <form onSubmit={f.handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Left — Main details ─── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Product Info */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="font-semibold text-gray-800">Product Information</h2>

            {/* Title */}
            <div>
              <label className="label-sm">Product Title <span className="text-red-400">*</span></label>
              <input type="text" required maxLength={200}
                value={f.form.name} onChange={(e) => f.setForm({ ...f.form, name: e.target.value })}
                placeholder="e.g. Stainless Steel Water Tank 1000L"
                className="input-base" />
              <p className="text-xs text-gray-300 mt-1">{f.form.name.length}/200</p>
            </div>

            {/* Description */}
            <div>
              <label className="label-sm">Description <span className="text-red-400">*</span></label>
              <textarea required rows={5} maxLength={5000}
                value={f.form.description} onChange={(e) => f.setForm({ ...f.form, description: e.target.value })}
                placeholder="Describe materials, features, applications, quality certifications…"
                className="input-base resize-none" />
              <p className="text-xs text-gray-300 mt-1">{f.form.description.length}/5000</p>
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-sm">Category <span className="text-red-400">*</span></label>
                <select required value={f.form.category}
                  onChange={(e) => f.handleCategoryChange(e.target.value)}
                  className="input-base bg-white">
                  <option value="">Select category</option>
                  {f.categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {f.availableSubcategories.length > 0 && (
                <div>
                  <label className="label-sm">Subcategory</label>
                  <select value={f.form.subCategory}
                    onChange={(e) => f.setForm({ ...f.form, subCategory: e.target.value })}
                    className="input-base bg-white">
                    <option value="">Optional</option>
                    {f.availableSubcategories.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Brand */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label-sm mb-0 flex items-center gap-1.5">
                  <HiOutlineBuildingStorefront className="w-3.5 h-3.5 text-gray-400" /> Brand
                </label>
                <button type="button" onClick={() => f.setShowBrandModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5">
                  + Create Brand
                </button>
              </div>
              {f.brands.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-sm text-gray-400">
                  No brands found.{" "}
                  <button type="button" onClick={() => f.setShowBrandModal(true)} className="text-blue-500 hover:underline font-medium">Create a brand first.</button>
                </div>
              ) : (
                <>
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={f.brandSearch}
                      onChange={(e) => f.setBrandSearch(e.target.value)}
                      placeholder="Search brands..."
                      className="input-base pr-8"
                    />
                    {f.brandSearch && (
                      <button type="button" onClick={() => f.setBrandSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <HiOutlineXMark className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <select value={f.form.brand}
                    onChange={(e) => f.setForm({ ...f.form, brand: e.target.value })}
                    className="input-base bg-white" size={Math.min(5, f.brands.filter(b => !f.brandSearch || b.brandName.toLowerCase().includes(f.brandSearch.toLowerCase())).length + 1)}>
                    <option value="">— No brand —</option>
                    {f.brands
                      .filter(b => !f.brandSearch || b.brandName.toLowerCase().includes(f.brandSearch.toLowerCase()))
                      .map((b) => (
                        <option key={b._id} value={b._id}>{b.brandName}</option>
                      ))}
                  </select>
                  {f.form.brand && (
                    <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                      <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                      Brand selected: {f.brands.find(b => b._id === f.form.brand)?.brandName}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="label-sm flex items-center gap-1.5">
                <HiOutlineTag className="w-3.5 h-3.5 text-gray-400" /> Tags
              </label>
              {f.form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {f.form.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-lg border border-blue-100 font-medium">
                      {t}
                      <button type="button" onClick={() => f.removeTag(t)}>
                        <HiOutlineXMark className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={f.tagInput}
                  onChange={(e) => f.setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); f.addTag(f.tagInput); } }}
                  placeholder="Type tag and press Enter…"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                <button type="button" onClick={() => f.addTag(f.tagInput)}
                  className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition">
                  <HiOutlinePlusCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SUGGESTED_TAGS.filter((t) => !f.form.tags.includes(t)).slice(0, 6).map((t) => (
                  <button key={t} type="button" onClick={() => f.addTag(t)}
                    className="text-[11px] px-2 py-0.5 rounded-md border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition">
                    + {t}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing & MOQ */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <HiOutlineCurrencyRupee className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-800">Pricing & Order Details</h2>
            </div>

            {/* Price range */}
            <div>
              <label className="label-sm">Price Range (₹) <span className="text-red-400">*</span></label>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input type="number" required min="0" step="0.01"
                    value={f.form.price} onChange={(e) => f.setForm({ ...f.form, price: e.target.value })}
                    placeholder="Min price"
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                </div>
                <span className="text-gray-300 font-medium shrink-0">—</span>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input type="number" min="0" step="0.01"
                    value={f.form.priceMax} onChange={(e) => f.setForm({ ...f.form, priceMax: e.target.value })}
                    placeholder="Max price (optional)"
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                </div>
                <select value={f.form.priceUnit}
                  onChange={(e) => f.setForm({ ...f.form, priceUnit: e.target.value })}
                  className="shrink-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                  {PRICE_UNITS.map((u) => <option key={u} value={u}>/{u}</option>)}
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-1">Leave max blank if you have a fixed price</p>
            </div>

            {/* Compare price */}
            <div>
              <label className="label-sm">
                Compare-at Price (₹) <span className="text-gray-400 font-normal">optional</span>
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input type="number" min="0" step="0.01"
                  value={f.form.comparePrice} onChange={(e) => f.setForm({ ...f.form, comparePrice: e.target.value })}
                  placeholder="Original price"
                  className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Shown struck-through to highlight the discount</p>
            </div>

            {/* MOQ + Max order + Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label-sm">Min. Order Qty (MOQ) <span className="text-red-400">*</span></label>
                <input type="number" min="1" required
                  value={f.form.minOrderQuantity}
                  onChange={(e) => f.setForm({ ...f.form, minOrderQuantity: e.target.value })}
                  className="input-base" />
              </div>
              <div>
                <label className="label-sm">Max. Order Qty <span className="text-gray-400 font-normal">optional</span></label>
                <input type="number" min="1"
                  value={f.form.maxOrderQuantity}
                  onChange={(e) => f.setForm({ ...f.form, maxOrderQuantity: e.target.value })}
                  className="input-base" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-sm mb-0">Stock</label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs text-gray-500">Unlimited</span>
                    <button type="button"
                      onClick={() => f.setForm({ ...f.form, stock: f.form.stock === "unlimited" ? "" : "unlimited" })}
                      className={`relative inline-flex items-center flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${f.form.stock === "unlimited" ? "bg-green-500" : "bg-gray-200"}`}>
                      <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${f.form.stock === "unlimited" ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </label>
                </div>
                {f.form.stock === "unlimited" ? (
                  <div className="input-base bg-green-50 border-green-200 text-green-700 text-sm flex items-center gap-2">
                    <HiOutlineCheckCircle className="w-4 h-4" /> No limit
                  </div>
                ) : (
                  <input type="number" min="0"
                    value={f.form.stock}
                    onChange={(e) => f.setForm({ ...f.form, stock: e.target.value })}
                    placeholder="Quantity"
                    className="input-base" />
                )}
              </div>
            </div>
          </section>

          {/* Specifications */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Specifications</h2>
              <button type="button" onClick={f.addSpec}
                className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline">
                <HiOutlinePlusCircle className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
            {f.form.specifications.map((spec, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={spec.key} onChange={(e) => f.updateSpec(i, "key", e.target.value)}
                  placeholder="Property (e.g. Material)"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={spec.value} onChange={(e) => f.updateSpec(i, "value", e.target.value)}
                  placeholder="Value (e.g. Stainless Steel)"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => f.removeSpec(i)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
            {f.form.specifications.length === 0 && (
              <p className="text-sm text-gray-400 italic">No specs added.</p>
            )}
          </section>

          {/* Product Variants */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Product Variants</h2>
            <VariantsTab
              productName={f.form.name}
              basePrice={parseFloat(f.form.price) || 0}
              baseStock={parseInt(f.form.stock) || 0}
              variantTypes={f.variantTypes}
              variants={f.variants}
              onVariantTypesChange={f.setVariantTypes}
              onVariantsChange={f.setVariants}
              categoryVariantTemplate={f.variantTemplates}
            />
          </section>

          {/* Sample Settings */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiOutlineBeaker className="w-5 h-5 text-purple-500" />
                <div>
                  <h2 className="font-semibold text-gray-800">Sample Orders</h2>
                  <p className="text-xs text-gray-400">Let buyers test before bulk ordering</p>
                </div>
              </div>
              <button type="button"
                onClick={() => f.setForm({ ...f.form, allowSamples: !f.form.allowSamples })}
                className={`relative inline-flex items-center flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${f.form.allowSamples ? "bg-purple-500" : "bg-gray-200"}`}>
                <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${f.form.allowSamples ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            {f.form.allowSamples && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                <div>
                  <label className="label-sm">Sample Price (₹)</label>
                  <input type="number" min="0" value={f.form.samplePrice}
                    onChange={(e) => f.setForm({ ...f.form, samplePrice: e.target.value })}
                    placeholder="e.g. 500" className="input-base" />
                </div>
                <div>
                  <label className="label-sm">Lead Time</label>
                  <input type="text" value={f.form.sampleLeadTime}
                    onChange={(e) => f.setForm({ ...f.form, sampleLeadTime: e.target.value })}
                    placeholder="e.g. 3-5 days" className="input-base" />
                </div>
                <div>
                  <label className="label-sm">Min Sample Qty</label>
                  <input type="number" min="1" value={f.form.sampleMinQty}
                    onChange={(e) => f.setForm({ ...f.form, sampleMinQty: e.target.value })}
                    className="input-base" />
                </div>
                <div>
                  <label className="label-sm">Max Sample Qty</label>
                  <input type="number" min="1" value={f.form.sampleMaxQty}
                    onChange={(e) => f.setForm({ ...f.form, sampleMaxQty: e.target.value })}
                    className="input-base" />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ─── Right — Images, Location, Submit ─── */}
        <div className="space-y-5">

          {/* Images */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800">Product Images <span className="text-red-500">*</span></h2>
              <p className="text-xs text-gray-400 mt-0.5">Up to 5 images · First = main photo</p>
            </div>

            {f.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {f.photos.map((slot, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img
                      src={slot.kind === "existing" ? slot.image.url : slot.previewUrl}
                      alt=""
                      className="w-full h-full object-cover rounded-xl border border-gray-100"
                    />
                    <button type="button" onClick={() => f.removePhoto(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow">
                      <HiOutlineXMark className="w-3 h-3" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">
                        MAIN
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {f.photos.length < 5 && (
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition">
                <HiOutlinePhoto className="w-7 h-7 text-gray-300 mb-1.5" />
                <span className="text-sm text-gray-400 font-medium">Click to upload</span>
                <span className="text-xs text-gray-300">{5 - f.photos.length} remaining · JPG, PNG, WebP</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple
                  onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) f.addPhotos(files); e.target.value = ""; }}
                  className="hidden" />
              </label>
            )}
          </section>

          {/* Product Video */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800">Product Video <span className="text-xs font-normal text-gray-400 ml-1">Optional</span></h2>
              <p className="text-xs text-gray-400 mt-0.5">1 video · MP4, WebM, MOV, AVI</p>
            </div>

            {f.videoSlot ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black">
                <video
                  src={f.videoSlot.kind === "existing" ? f.videoSlot.image.url : f.videoSlot.previewUrl}
                  controls
                  className="w-full max-h-52 object-contain"
                />
                <button
                  type="button"
                  onClick={f.removeVideo}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition"
                >
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
                {f.videoSlot.kind === "new" && (
                  <div className="px-3 py-2 text-xs text-gray-400 bg-white">
                    {f.videoSlot.file.name} · {(f.videoSlot.file.size / (1024 * 1024)).toFixed(1)}MB
                  </div>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition">
                <HiOutlineVideoCamera className="w-8 h-8 text-gray-300 mb-1.5" />
                <span className="text-sm text-gray-400 font-medium">Click to upload video</span>
                <span className="text-xs text-gray-300">MP4, WebM, MOV, AVI</span>
                <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) f.setVideoFile(file); e.target.value = ""; }}
                  className="hidden" />
              </label>
            )}
          </section>

          {/* Location */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Location <span className="text-red-500">*</span></h2>
            <StateDropdown value={f.form.state} onChange={(v) => f.setForm({ ...f.form, state: v, city: "" })} />
            <CityDropdown value={f.form.city} onChange={(v) => f.setForm({ ...f.form, city: v })} state={f.form.state} />
          </section>

          {/* Product Status (edit only) */}
          {isEdit && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <p className="font-semibold text-gray-800 text-sm">Product Status</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  f.product?.status === "approved" && f.form.isActive ? "bg-green-100 text-green-700"
                    : f.product?.status === "pending" ? "bg-yellow-100 text-yellow-700"
                    : f.product?.status === "rejected" ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {f.product?.status === "approved" && f.form.isActive ? (<><HiOutlineCheckCircle className="w-3.5 h-3.5" /> Live — Visible to buyers</>)
                    : f.product?.status === "approved" && !f.form.isActive ? "Hidden"
                    : f.product?.status === "pending" ? (<><HiOutlineClock className="w-3.5 h-3.5" /> Pending Review</>)
                    : f.product?.status === "rejected" ? (<><HiOutlineXCircle className="w-3.5 h-3.5" /> Rejected</>)
                    : "Draft"}
                </span>
              </div>

              {f.product?.status !== "approved" || !f.form.isActive ? (
                <button type="button" disabled={f.submitting} onClick={f.publishProduct}
                  className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                  <HiOutlineRocketLaunch className="w-4 h-4" />
                  Publish — Make Visible to Buyers
                </button>
              ) : (
                <button type="button" disabled={f.submitting} onClick={f.unpublishProduct}
                  className="w-full border border-gray-300 text-gray-600 py-2 rounded-xl font-medium hover:bg-gray-50 transition text-sm">
                  Hide from Buyers
                </button>
              )}
            </div>
          )}

          {/* Info box (create only) */}
          {!isEdit && (
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 flex items-start gap-2.5">
              <HiOutlineInformationCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-semibold mb-1">Listed under {user?.companyName || user?.name}</p>
                <p>Your product will be visible to buyers once approved. Accurate details = more inquiries.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button type="submit" disabled={f.submitting}
              className="w-full bg-[var(--primary)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--primary-dark)] disabled:opacity-60 transition flex items-center justify-center gap-2">
              {f.submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {isEdit ? "Saving…" : "Listing…"}</>
              ) : isEdit ? (
                <><HiOutlinePencilSquare className="w-5 h-5" /> Save Changes</>
              ) : (
                <><HiOutlinePlusCircle className="w-5 h-5" /> List Product Free</>
              )}
            </button>
            <Link href="/seller/products"
              className="w-full text-center py-2.5 text-sm text-gray-400 hover:text-gray-600 font-medium transition">
              Cancel
            </Link>
          </div>
        </div>
      </form>

      {/* Utility classes for this form */}
      <style jsx global>{`
        .label-sm { display: block; font-size: 0.8125rem; font-weight: 600; color: #374151; margin-bottom: 0.375rem; }
        .input-base { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0.625rem 1rem; font-size: 0.875rem; outline: none; transition: all 0.15s; }
        .input-base:focus { border-color: transparent; box-shadow: 0 0 0 2px #3b82f6; }
      `}</style>

      {f.showBrandModal && (
        <BrandCreateModal onClose={() => f.setShowBrandModal(false)} onCreated={f.handleBrandCreated} />
      )}
    </div>
  );
}
