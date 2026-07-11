"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import VariantTemplateForm from "@/components/seller/VariantTemplateForm";
import { VariantsTab } from "@/components/seller/ProductEditForm/VariantsTab";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { StateDropdown, CityDropdown } from "@/components/common/LocationDropdown";
import {
  generateVariantCombinations,
  validateVariantTemplates,
  transformTemplateToVariantType,
  type VariantTemplate,
  type VariantType,
} from "@/utils/variantGenerator";
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
} from "react-icons/hi2";

// ─── Constants ─────────────────────────────────────────────────────────────────
const PRICE_UNITS = ["Piece", "Kg", "Meter", "Liter", "Box", "Packet", "Ton", "Set"];

const SUGGESTED_TAGS = [
  "wholesale", "bulk", "OEM", "export", "quality", "certified",
  "stainless steel", "industrial", "commercial", "eco-friendly",
];

interface SubCategory { _id: string; name: string; slug: string; }
interface Category    { _id: string; name: string; slug: string; icon?: string; subcategories?: SubCategory[]; variantTemplates?: VariantTemplate[]; }

// ─── Content ────────────────────────────────────────────────────────────────────
function NewProductContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles]       = useState<File[]>([]);
  const [videoFile, setVideoFile]         = useState<File | null>(null);
  const [videoPreview, setVideoPreview]   = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [variantTemplates, setVariantTemplates] = useState<VariantTemplate[]>([]);
  const [useAutoVariants, setUseAutoVariants] = useState(true);
  const [variantTypes, setVariantTypes] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  const [brands, setBrands] = useState<{ _id: string; brandName: string }[]>([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandCreating, setBrandCreating] = useState(false);
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState("");
  const [newBrand, setNewBrand] = useState({ brandName: "", brandDescription: "", brandFeatures: "", website: "" });
  const [form, setForm] = useState({
    name:           "",
    description:    "",
    price:          "",
    priceMax:       "",
    priceUnit:      "Piece",
    category:       "",
    subCategory:    "",
    brand:          "",
    tags:           [] as string[],
    minOrderQuantity: "1",
    stock:          "",
    city:           (user as unknown as { city?: string })?.city || "",
    state:          (user as unknown as { state?: string })?.state || "",
    specifications: [{ key: "", value: "" }] as { key: string; value: string }[],
    allowSamples:   false,
    samplePrice:    "",
    sampleMinQty:   "1",
    sampleMaxQty:   "5",
    sampleLeadTime: "3-5 days",
  });

  const selectedCategoryData  = categories.find((c) => c._id === form.category);
  const availableSubcategories = selectedCategoryData?.subcategories || [];

  // Load category with variant templates
  const handleCategoryChange = (categoryId: string) => {
    setForm({ ...form, category: categoryId, subCategory: "" });
    setVariantTemplates([]);
    setUseAutoVariants(true);

    if (categoryId) {
      api
        .get(`/categories/${categoryId}`)
        .then((res) => {
          const templates = res.data.data?.variantTemplates || [];
          if (templates.length > 0) {
            setVariantTemplates(templates);
            console.log("✅ Loaded variant templates for category:", categoryId);
          }
        })
        .catch((err) => {
          console.warn("⚠️ Failed to load category variants:", err.message);
          setVariantTemplates([]);
        });
    }
  };

  useEffect(() => {
    api.get("/categories/tree")
      .then((res) => setCategories(res.data.data || []))
      .catch(() => toast.error("Failed to load categories"));
    api.get("/brands/my")
      .then((res) => setBrands(res.data.data?.brands || []))
      .catch(() => {});
  }, []);

  const handleCreateBrand = async () => {
    if (!newBrand.brandName.trim()) { toast.error("Brand name required"); return; }
    setBrandCreating(true);
    try {
      const fd = new FormData();
      fd.append("brandName", newBrand.brandName.trim());
      if (newBrand.brandDescription) fd.append("brandDescription", newBrand.brandDescription.trim());
      if (newBrand.brandFeatures) fd.append("brandFeatures", newBrand.brandFeatures.trim());
      if (newBrand.website) fd.append("website", newBrand.website.trim());
      if (brandLogoFile) fd.append("logo", brandLogoFile);
      const res = await api.post("/brands", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const created = res.data.data?.brand || res.data.data;
      if (created?._id) {
        setBrands((prev) => [...prev, { _id: created._id, brandName: created.brandName }]);
        setForm((prev) => ({ ...prev, brand: created._id }));
        toast.success(`Brand "${created.brandName}" created!`);
      }
      setNewBrand({ brandName: "", brandDescription: "", brandFeatures: "", website: "" });
      setBrandLogoFile(null);
      setBrandLogoPreview("");
      setShowBrandModal(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create brand");
    } finally {
      setBrandCreating(false);
    }
  };

  // ── Images ──────────────────────────────────────────────────────────────────
  const compressImage = (file: File): Promise<File> =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const MAX = 1920;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.8
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 5 - imageFiles.length;
    if (!remaining) { toast.error("Max 5 images allowed"); return; }

    const toAdd = files.slice(0, remaining);
    for (const file of toAdd) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error(`Invalid format: ${file.name}. Only JPG, PNG, WebP allowed.`);
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 20MB per image.`);
        return;
      }
    }

    const compressed = await Promise.all(toAdd.map(compressImage));
    setImageFiles((prev) => [...prev, ...compressed]);
    compressed.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (i: number) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  // ── Video ───────────────────────────────────────────────────────────────────
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
    if (!allowed.includes(file.type)) {
      toast.error("Only MP4, WebM, MOV, AVI formats allowed");
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
  };

  // ── Tags ────────────────────────────────────────────────────────────────────
  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || form.tags.includes(tag)) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));

  // ── Specs ────────────────────────────────────────────────────────────────────
  const addSpec = () =>
    setForm((prev) => ({ ...prev, specifications: [...prev.specifications, { key: "", value: "" }] }));

  const removeSpec = (i: number) =>
    setForm((prev) => ({ ...prev, specifications: prev.specifications.filter((_, idx) => idx !== i) }));

  const updateSpec = (i: number, field: "key" | "value", val: string) =>
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.map((s, idx) => idx === i ? { ...s, [field]: val } : s),
    }));

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("📝 [Submit] Starting product creation...");

    if (!form.name.trim())        { toast.error("Product name is required"); console.error("❌ Name missing"); return; }
    if (!form.description.trim()) { toast.error("Description is required"); console.error("❌ Description missing"); return; }
    if (!form.price)              { toast.error("Price is required"); console.error("❌ Price missing"); return; }
    if (!form.category)           { toast.error("Category is required"); console.error("❌ Category missing"); return; }
    if (form.priceMax && Number(form.priceMax) < Number(form.price)) {
      toast.error("Max price must be greater than min price");
      console.error("❌ Price validation failed");
      return;
    }

    console.log("✅ [Submit] Form validation passed");
    console.log("   Product:", form.name);
    console.log("   Price:", form.price);
    console.log("   Images:", imageFiles.length);

    setSubmitting(true);
    try {
      const fd = new FormData();

      // ✅ Append form fields
      fd.append("name",        form.name);
      fd.append("description", form.description);
      fd.append("price",       form.price);
      if (form.priceMax)       fd.append("priceMax", form.priceMax);
      fd.append("priceUnit",   form.priceUnit);
      fd.append("category",    form.category);
      if (form.subCategory)    fd.append("subCategory", form.subCategory);
      if (form.brand)          fd.append("brand", form.brand);
      fd.append("minOrderQuantity", form.minOrderQuantity);
      if (form.stock && form.stock !== "unlimited") fd.append("stock", form.stock);
      if (form.city)           fd.append("city", form.city);
      if (form.state)          fd.append("state", form.state);
      fd.append("tags",        JSON.stringify(form.tags));

      const specs = form.specifications.filter((s) => s.key && s.value);
      if (specs.length) fd.append("specifications", JSON.stringify(specs));

      // ✅ Append variant data - from VariantsTab or auto-generate
      if (variants.length > 0 || variantTypes.length > 0) {
        // Use manual variants from VariantsTab
        // Clean up variant data - remove 'id' field and ensure proper format
        const cleanedVariants = variants.map((v: any) => ({
          sku: v.sku,
          name: v.name,
          attributeValues: v.attributeValues,
          price: Number(v.price),
          stock: Number(v.stock),
          status: v.status || "active",
        }));

        // Clean up variant types
        const cleanedVariantTypes = variantTypes.map((vt: any) => ({
          name: vt.name,
          type: vt.type || "dropdown",
          values: vt.values.map((val: any) => {
            // Handle both string and object value formats
            const stringVal = typeof val === "string" ? val : (val.label || val.value || String(val));
            return {
              label: stringVal,
              value: stringVal.toLowerCase().replace(/\s+/g, "-"),
            };
          }),
        }));

        console.log("📋 [Submit] Using manual variants from VariantsTab");
        console.log("📋 [Submit] Cleaned Variant Types:", JSON.stringify(cleanedVariantTypes, null, 2));
        console.log("📋 [Submit] Cleaned Variants (first 2):", JSON.stringify(cleanedVariants.slice(0, 2), null, 2));
        fd.append("variantTypes", JSON.stringify(cleanedVariantTypes));
        fd.append("variants", JSON.stringify(cleanedVariants));
        console.log("✅ [Submit] Added", cleanedVariants.length, "manual variants");
      } else if (variantTemplates.length > 0 && useAutoVariants) {
        // Fall back to auto-generation from category templates
        const validatedVars = validateVariantTemplates(variantTemplates);
        if (!validatedVars.valid) {
          toast.error(validatedVars.errors[0] || "Invalid variant templates");
          console.error("❌ [Submit] Variant validation failed:", validatedVars.errors);
          setSubmitting(false);
          return;
        }

        // Transform templates to proper variantTypes structure
        const transformedVariantTypes: VariantType[] = variantTemplates.map(
          (template) => transformTemplateToVariantType(template)
        );

        const combinations = generateVariantCombinations(variantTemplates, Number(form.price), "", Number(form.stock) || 0);

        console.log("📋 [Submit] Using auto-generated variants from category");
        console.log("📋 [Submit] Variant Types:", JSON.stringify(transformedVariantTypes, null, 2));
        console.log("📋 [Submit] Variants (first 3):", JSON.stringify(combinations.slice(0, 3), null, 2));

        fd.append("variantTypes", JSON.stringify(transformedVariantTypes));
        fd.append("variants", JSON.stringify(combinations));
        console.log("✅ [Submit] Added", combinations.length, "variant combinations");
      }

      fd.append("allowSamples", String(form.allowSamples));
      if (form.allowSamples) {
        if (form.samplePrice) fd.append("samplePrice", form.samplePrice);
        fd.append("sampleMinQty",  form.sampleMinQty);
        fd.append("sampleMaxQty",  form.sampleMaxQty);
        fd.append("sampleLeadTime", form.sampleLeadTime);
      }

      // ✅ Append images
      console.log("📤 [Submit] Appending", imageFiles.length, "images to FormData");
      imageFiles.forEach((f, idx) => {
        fd.append("images", f);
        console.log(`  [${idx + 1}]`, f.name, `(${(f.size / 1024).toFixed(2)}KB)`);
      });

      // ✅ Append video (optional)
      if (videoFile) {
        fd.append("video", videoFile);
        console.log("🎥 [Submit] Appending video:", videoFile.name);
      }

      console.log("🚀 [Submit] Sending FormData to API...");
      const res = await api.post("/products", fd);

      console.log("🎉 [Submit] Product created successfully!");
      console.log("   Product ID:", res.data.data._id);
      console.log("   Images stored:", res.data.data.images?.length || 0);

      toast.success("✅ Product listed successfully!");
      router.push("/seller/products");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const errMsg = e.response?.data?.message || "Failed to create product";
      console.error("❌ [Submit] Error:", errMsg);
      console.error("   Full error:", err);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/seller/products" className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400">
          <HiOutlineArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add New Product</h1>
          <p className="text-sm text-gray-400 mt-0.5">Free listing — reach thousands of buyers</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
          <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Free
        </span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Left — Main details ─── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Product Info */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="font-semibold text-gray-800">Product Information</h2>

            {/* Title */}
            <div>
              <label className="label-sm">Product Title <span className="text-red-400">*</span></label>
              <input type="text" required maxLength={200}
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Stainless Steel Water Tank 1000L"
                className="input-base" />
              <p className="text-xs text-gray-300 mt-1">{form.name.length}/200</p>
            </div>

            {/* Description */}
            <div>
              <label className="label-sm">Description <span className="text-red-400">*</span></label>
              <textarea required rows={5} maxLength={5000}
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe materials, features, applications, quality certifications…"
                className="input-base resize-none" />
              <p className="text-xs text-gray-300 mt-1">{form.description.length}/5000</p>
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-sm">Category <span className="text-red-400">*</span></label>
                <select required value={form.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="input-base bg-white">
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
                  ))}
                </select>
              </div>
              {availableSubcategories.length > 0 && (
                <div>
                  <label className="label-sm">Subcategory</label>
                  <select value={form.subCategory}
                    onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
                    className="input-base bg-white">
                    <option value="">Optional</option>
                    {availableSubcategories.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Brand */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label-sm mb-0">Brand</label>
                <button type="button" onClick={() => setShowBrandModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5">
                  + Create Brand
                </button>
              </div>
              {brands.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-sm text-gray-400">
                  No brands found.{" "}
                  <button type="button" onClick={() => setShowBrandModal(true)} className="text-blue-500 hover:underline font-medium">Create a brand first.</button>
                </div>
              ) : (
                <>
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      placeholder="Search brands..."
                      className="input-base pr-8"
                    />
                    {brandSearch && (
                      <button type="button" onClick={() => setBrandSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <HiOutlineXMark className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <select value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="input-base bg-white" size={Math.min(5, brands.filter(b => !brandSearch || b.brandName.toLowerCase().includes(brandSearch.toLowerCase())).length + 1)}>
                    <option value="">— No brand —</option>
                    {brands
                      .filter(b => !brandSearch || b.brandName.toLowerCase().includes(brandSearch.toLowerCase()))
                      .map((b) => (
                        <option key={b._id} value={b._id}>{b.brandName}</option>
                      ))}
                  </select>
                  {form.brand && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      ✓ Brand selected: {brands.find(b => b._id === form.brand)?.brandName}
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
              {/* Chip row */}
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-lg border border-blue-100 font-medium">
                      {t}
                      <button type="button" onClick={() => removeTag(t)}>
                        <HiOutlineXMark className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Input */}
              <div className="flex gap-2">
                <input value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
                  placeholder="Type tag and press Enter…"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                <button type="button" onClick={() => addTag(tagInput)}
                  className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition">
                  <HiOutlinePlusCircle className="w-5 h-5" />
                </button>
              </div>
              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SUGGESTED_TAGS.filter((t) => !form.tags.includes(t)).slice(0, 6).map((t) => (
                  <button key={t} type="button" onClick={() => addTag(t)}
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
                    value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="Min price"
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                </div>
                <span className="text-gray-300 font-medium shrink-0">—</span>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input type="number" min="0" step="0.01"
                    value={form.priceMax} onChange={(e) => setForm({ ...form, priceMax: e.target.value })}
                    placeholder="Max price (optional)"
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                </div>
                <select value={form.priceUnit}
                  onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}
                  className="shrink-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                  {PRICE_UNITS.map((u) => <option key={u} value={u}>/{u}</option>)}
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-1">Leave max blank if you have a fixed price</p>
            </div>

            {/* MOQ + Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-sm">Min. Order Quantity (MOQ) <span className="text-red-400">*</span></label>
                <input type="number" min="1" required
                  value={form.minOrderQuantity}
                  onChange={(e) => setForm({ ...form, minOrderQuantity: e.target.value })}
                  className="input-base" />
                <p className="text-xs text-gray-400 mt-1">Minimum units per order</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-sm mb-0">Available Stock</label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs text-gray-500">Unlimited</span>
                    <button type="button"
                      onClick={() => setForm({ ...form, stock: form.stock === "unlimited" ? "" : "unlimited" })}
                      className={`relative inline-flex items-center flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${form.stock === "unlimited" ? "bg-green-500" : "bg-gray-200"}`}>
                      <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${form.stock === "unlimited" ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </label>
                </div>
                {form.stock === "unlimited" ? (
                  <div className="input-base bg-green-50 border-green-200 text-green-700 text-sm flex items-center gap-2">
                    <span>✓</span> Unlimited stock — no limit set
                  </div>
                ) : (
                  <input type="number" min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="Enter stock quantity"
                    className="input-base" />
                )}
              </div>
            </div>
          </section>

          {/* Specifications */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Specifications</h2>
              <button type="button" onClick={addSpec}
                className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline">
                <HiOutlinePlusCircle className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
            {form.specifications.map((spec, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={spec.key} onChange={(e) => updateSpec(i, "key", e.target.value)}
                  placeholder="Property (e.g. Material)"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={spec.value} onChange={(e) => updateSpec(i, "value", e.target.value)}
                  placeholder="Value (e.g. Stainless Steel)"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => removeSpec(i)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
            {form.specifications.length === 0 && (
              <p className="text-sm text-gray-400 italic">No specs added.</p>
            )}
          </section>

          {/* Product Variants - Complete Management */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Product Variants</h2>
            <VariantsTab
              productName={form.name}
              basePrice={parseFloat(form.price) || 0}
              baseStock={parseInt(form.stock) || 0}
              variantTypes={variantTypes}
              variants={variants}
              onVariantTypesChange={setVariantTypes}
              onVariantsChange={setVariants}
              categoryVariantTemplate={variantTemplates}
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
                onClick={() => setForm({ ...form, allowSamples: !form.allowSamples })}
                className={`relative inline-flex items-center flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${form.allowSamples ? "bg-purple-500" : "bg-gray-200"}`}>
                <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${form.allowSamples ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            {form.allowSamples && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                <div>
                  <label className="label-sm">Sample Price (₹)</label>
                  <input type="number" min="0" value={form.samplePrice}
                    onChange={(e) => setForm({ ...form, samplePrice: e.target.value })}
                    placeholder="e.g. 500" className="input-base" />
                </div>
                <div>
                  <label className="label-sm">Lead Time</label>
                  <input type="text" value={form.sampleLeadTime}
                    onChange={(e) => setForm({ ...form, sampleLeadTime: e.target.value })}
                    placeholder="e.g. 3-5 days" className="input-base" />
                </div>
                <div>
                  <label className="label-sm">Min Sample Qty</label>
                  <input type="number" min="1" value={form.sampleMinQty}
                    onChange={(e) => setForm({ ...form, sampleMinQty: e.target.value })}
                    className="input-base" />
                </div>
                <div>
                  <label className="label-sm">Max Sample Qty</label>
                  <input type="number" min="1" value={form.sampleMaxQty}
                    onChange={(e) => setForm({ ...form, sampleMaxQty: e.target.value })}
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
              <h2 className="font-semibold text-gray-800">Product Images</h2>
              <p className="text-xs text-gray-400 mt-0.5">Up to 5 images · First = main photo</p>
            </div>

            {/* Preview grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-xl border border-gray-100" />
                    <button type="button" onClick={() => removeImage(i)}
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

            {/* Upload zone */}
            {imagePreviews.length < 5 && (
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition">
                <HiOutlinePhoto className="w-7 h-7 text-gray-300 mb-1.5" />
                <span className="text-sm text-gray-400 font-medium">Click to upload</span>
                <span className="text-xs text-gray-300">{5 - imagePreviews.length} remaining · JPG, PNG, WebP</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple
                  onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </section>

          {/* Product Video */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800">Product Video <span className="text-xs font-normal text-gray-400 ml-1">Optional</span></h2>
              <p className="text-xs text-gray-400 mt-0.5">1 video · MP4, WebM, MOV, AVI</p>
            </div>

            {videoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black">
                <video
                  src={videoPreview}
                  controls
                  className="w-full max-h-52 object-contain"
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition"
                >
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
                <div className="px-3 py-2 text-xs text-gray-400 bg-white">
                  {videoFile?.name} · {videoFile ? (videoFile.size / (1024 * 1024)).toFixed(1) : 0}MB
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition">
                <svg className="w-8 h-8 text-gray-300 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-sm text-gray-400 font-medium">Click to upload video</span>
                <span className="text-xs text-gray-300">MP4, WebM, MOV, AVI</span>
                <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime"
                  onChange={handleVideoChange} className="hidden" />
              </label>
            )}
          </section>

          {/* Location */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Location</h2>
            <StateDropdown value={form.state} onChange={(v) => setForm({ ...form, state: v, city: "" })} />
            <CityDropdown value={form.city} onChange={(v) => setForm({ ...form, city: v })} state={form.state} />
          </section>

          {/* Info box */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 flex items-start gap-2.5">
            <HiOutlineInformationCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-semibold mb-1">Listed under {user?.companyName || user?.name}</p>
              <p>Your product will be visible to buyers once approved. Accurate details = more inquiries.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button type="submit" disabled={submitting}
              className="w-full bg-[var(--primary)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--primary-dark)] disabled:opacity-60 transition flex items-center justify-center gap-2">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Listing…</>
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

      {/* Utility classes for this file */}
      <style jsx global>{`
        .label-sm { display: block; font-size: 0.8125rem; font-weight: 600; color: #374151; margin-bottom: 0.375rem; }
        .input-base { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0.625rem 1rem; font-size: 0.875rem; outline: none; transition: all 0.15s; }
        .input-base:focus { ring: 2px; border-color: transparent; box-shadow: 0 0 0 2px #3b82f6; }
      `}</style>

      {/* Inline Brand Creation Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800">Create New Brand</h3>
              <button type="button" onClick={() => { setShowBrandModal(false); setNewBrand({ brandName: "", brandDescription: "", brandFeatures: "", website: "" }); setBrandLogoFile(null); setBrandLogoPreview(""); }}
                className="text-gray-400 hover:text-gray-600">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {/* Logo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Logo</label>
                <label className="flex items-center gap-4 cursor-pointer">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center overflow-hidden transition shrink-0 bg-gray-50">
                    {brandLogoPreview
                      ? <img src={brandLogoPreview} alt="logo" className="w-full h-full object-cover" />
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
                    setBrandLogoFile(file);
                    setBrandLogoPreview(URL.createObjectURL(file));
                  }} />
                </label>
              </div>
              {/* Brand Name */}
              <div>
                <label className="label-sm">Brand Name <span className="text-red-400">*</span></label>
                <input type="text" autoFocus maxLength={100}
                  value={newBrand.brandName}
                  onChange={(e) => setNewBrand((b) => ({ ...b, brandName: e.target.value }))}
                  placeholder="e.g. Tata, Amul, Reliance"
                  className="input-base" />
              </div>
              {/* Description */}
              <div>
                <label className="label-sm">Brand Description</label>
                <textarea rows={3} maxLength={2000}
                  value={newBrand.brandDescription}
                  onChange={(e) => setNewBrand((b) => ({ ...b, brandDescription: e.target.value }))}
                  placeholder="Describe your brand, history, what makes it unique..."
                  className="input-base resize-none" />
              </div>
              {/* Features */}
              <div>
                <label className="label-sm">Brand Features</label>
                <textarea rows={3} maxLength={3000}
                  value={newBrand.brandFeatures}
                  onChange={(e) => setNewBrand((b) => ({ ...b, brandFeatures: e.target.value }))}
                  placeholder="e.g. Premium Quality, ISO Certified, Made in India..."
                  className="input-base resize-none" />
                <p className="text-xs text-gray-400 mt-1">Each line will be shown as a feature</p>
              </div>
              {/* Website */}
              <div>
                <label className="label-sm">Website URL</label>
                <input type="url"
                  value={newBrand.website}
                  onChange={(e) => setNewBrand((b) => ({ ...b, website: e.target.value }))}
                  placeholder="https://www.yourbrand.com"
                  className="input-base" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button type="button" onClick={handleCreateBrand} disabled={brandCreating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                {brandCreating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</> : "Create Brand"}
              </button>
              <button type="button" onClick={() => { setShowBrandModal(false); setNewBrand({ brandName: "", brandDescription: "", brandFeatures: "", website: "" }); setBrandLogoFile(null); setBrandLogoPreview(""); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewProductPage() {
  return (
    <ProtectedRoute allowedRoles={["seller"]}>
      <NewProductContent />
    </ProtectedRoute>
  );
}
