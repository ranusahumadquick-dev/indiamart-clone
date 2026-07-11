"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
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
  HiOutlinePencilSquare,
  HiOutlinePlusCircle,
  HiOutlineTrash,
  HiOutlineBuildingStorefront,
} from "react-icons/hi2";

interface Category {
  _id: string;
  name: string;
  variantTemplates?: VariantTemplate[];
}

interface ProductData {
  _id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  priceUnit: string;
  category: string | { _id: string; name: string };
  brand?: string | { _id: string; brandName: string };
  tags: string[];
  specifications: { key: string; value: string }[];
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  stock: number;
  city: string;
  state: string;
  images: { url: string; publicId?: string }[];
  isActive: boolean;
  status: string;
  variantTypes?: VariantTemplate[];
  variants?: any[];
}

const PRICE_UNITS = ["Piece", "Kg", "Meter", "Liter", "Box", "Packet", "Ton", "Set"];

function EditProductContent() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<{ _id: string; brandName: string }[]>([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandCreating, setBrandCreating] = useState(false);
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState("");
  const [newBrand, setNewBrand] = useState({ brandName: "", brandDescription: "", brandFeatures: "", website: "" });
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [existingVideo, setExistingVideo] = useState<string>("");
  const [variantTemplates, setVariantTemplates] = useState<VariantTemplate[]>([]);
  const [useAutoVariants, setUseAutoVariants] = useState(true);
  const [variantTypes, setVariantTypes] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    comparePrice: "",
    priceUnit: "Piece",
    category: "",
    brand: "",
    tags: [] as string[],
    minOrderQuantity: "1",
    maxOrderQuantity: "",
    stock: "0",
    city: "",
    state: "",
    specifications: [{ key: "", value: "" }],
    isActive: true,
  });

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

  // Tag management functions
  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || form.tags.includes(tag)) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));

  // Fetch product + categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, catRes, brandRes] = await Promise.all([
          api.get(`/products/seller/product/${productId}`),
          api.get("/categories"),
          api.get("/brands/my").catch(() => ({ data: { data: { brands: [] } } })),
        ]);

        const p: ProductData = productRes.data.data;
        setProduct(p);
        setCategories(catRes.data.data || []);
        setBrands(brandRes.data.data?.brands || []);

        // Populate form
        const catId = p.category ? (typeof p.category === "object" ? p.category._id : p.category) : "";
        const brandId = p.brand ? (typeof p.brand === "object" ? p.brand._id : p.brand) : "";
        setForm({
          name: p.name,
          description: p.description,
          price: String(p.price),
          comparePrice: p.comparePrice ? String(p.comparePrice) : "",
          priceUnit: p.priceUnit || "Piece",
          category: catId,
          brand: brandId,
          tags: Array.isArray(p.tags) ? p.tags : [],
          minOrderQuantity: String(p.minOrderQuantity || 1),
          maxOrderQuantity: p.maxOrderQuantity ? String(p.maxOrderQuantity) : "",
          stock: String(p.stock || 0),
          city: p.city || "",
          state: p.state || "",
          specifications:
            p.specifications?.length > 0
              ? p.specifications
              : [{ key: "", value: "" }],
          isActive: p.isActive,
        });

        // Separate images from video
        const imageItems = p.images?.filter((img: any) => img.type !== "video") || [];
        const videoItem  = p.images?.find((img: any) => img.type === "video");
        setImagePreviews(imageItems.map((img) => img.url));
        if (videoItem) setExistingVideo(videoItem.url);

        // Load existing variants
        // Transform variantTypes to match VariantsTab format (values as strings, not objects)
        if (p.variantTypes && p.variantTypes.length > 0) {
          const transformedTypes = p.variantTypes.map((vt: any) => ({
            name: vt.name,
            values: Array.isArray(vt.values)
              ? vt.values.map((v: any) => {
                  // Handle both string and object value formats
                  return typeof v === "string" ? v : (v.label || v.value || String(v));
                })
              : [],
          }));
          setVariantTypes(transformedTypes);
        }
        if (p.variants && p.variants.length > 0) {
          setVariants(p.variants);
        }

        // Load variant templates for the category
        if (catId) {
          try {
            const categoryRes = await api.get(`/categories/${catId}`);
            const categoryData = categoryRes.data.data;
            if (categoryData?.variantTemplates) {
              setVariantTemplates(categoryData.variantTemplates);
            }
          } catch (err: any) {
            console.error("Failed to load variant templates:", err);
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load product");
        router.push("/seller/products");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId, router]);

  const handleCategoryChange = async (categoryId: string) => {
    setForm({ ...form, category: categoryId });

    if (categoryId) {
      try {
        const res = await api.get(`/categories/${categoryId}`);
        const categoryData = res.data.data;
        console.log("📌 [EDIT] Category loaded:", categoryData.name);
        console.log("📌 [EDIT] variantTemplates:", categoryData.variantTemplates);
        if (categoryData?.variantTemplates) {
          setVariantTemplates(categoryData.variantTemplates);
          console.log("✅ [EDIT] Variants loaded:", categoryData.variantTemplates.length);
        } else {
          setVariantTemplates([]);
          console.log("❌ [EDIT] No variants in this category");
        }
      } catch (err: any) {
        console.error("Failed to load category variants:", err);
        setVariantTemplates([]);
      }
    }
  };

  const compressImage = (file: File): Promise<File> =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const MAX = 1600;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        canvas.width = width;
        canvas.height = height;
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
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const remaining = 5 - imagePreviews.length;
    if (remaining <= 0) { toast.error("Maximum 5 images allowed"); return; }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    for (const file of newFiles) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Only JPG, PNG, WebP allowed`);
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 20MB per image)`);
        return;
      }
    }

    const toAdd = newFiles.slice(0, remaining);
    const compressed = await Promise.all(toAdd.map((f) => compressImage(f)));
    setNewImageFiles((prev) => [...prev, ...compressed]);

    compressed.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addSpecification = () => {
    setForm((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: "", value: "" }],
    }));
  };

  const removeSpecification = (index: number) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const updateSpecification = (
    index: number,
    field: "key" | "value",
    val: string
  ) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) =>
        i === index ? { ...spec, [field]: val } : spec
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tags = Array.isArray(form.tags) ? form.tags : [];

      const specs = form.specifications.filter((s) => s.key && s.value);

      // ✅ Include variant data from VariantsTab (manual management)
      let variantData: any = {};

      // If manual variants were defined in VariantsTab, use those
      if (variants.length > 0 || variantTypes.length > 0) {
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

        variantData = {
          variantTypes: cleanedVariantTypes,
          variants: cleanedVariants,
        };
      } else if (variantTemplates.length > 0 && useAutoVariants) {
        // Fall back to auto-generation if no manual variants
        const validatedVars = validateVariantTemplates(variantTemplates);
        if (!validatedVars.valid) {
          toast.error(validatedVars.errors[0] || "Invalid variant templates");
          setSaving(false);
          return;
        }

        // Transform templates to proper variantTypes structure
        const transformedVariantTypes: VariantType[] = variantTemplates.map(
          (template) => transformTemplateToVariantType(template)
        );

        const combinations = generateVariantCombinations(variantTemplates, Number(form.price), "", Number(form.stock) || 0);
        variantData = {
          variantTypes: transformedVariantTypes,
          variants: combinations,
        };
      }

      const payload: any = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        priceUnit: form.priceUnit,
        category: form.category,
        brand: form.brand || undefined,
        tags,
        specifications: specs,
        minOrderQuantity: Number(form.minOrderQuantity),
        maxOrderQuantity: form.maxOrderQuantity ? Number(form.maxOrderQuantity) : undefined,
        stock: Number(form.stock),
        city: form.city,
        state: form.state,
        isActive: form.isActive,
        ...variantData,
      };

      if (newImageFiles.length > 0 || videoFile) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined) {
            formData.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
          }
        });
        newImageFiles.forEach((file) => formData.append("images", file));
        if (videoFile) formData.append("video", videoFile);
        await api.put(`/products/${productId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.put(`/products/${productId}`, payload);
      }

      toast.success("Product updated!");
      router.push("/seller/products");
    } catch (err: any) {
      toast.error(err.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/seller/products"
          className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Update your product details
          </p>
        </div>
        <div className="ml-auto">
          <span
            className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              product?.status === "approved"
                ? "bg-green-100 text-green-700"
                : product?.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {product?.status}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
            <h2 className="font-semibold text-gray-800 text-lg">
              Product Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                placeholder="e.g. Stainless Steel Water Tank 1000L"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition resize-none"
                placeholder="Describe your product in detail"
                maxLength={5000}
              />
              <p className="text-xs text-gray-400 mt-1">
                {form.description.length}/5000 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition bg-white"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <HiOutlineBuildingStorefront className="w-4 h-4 text-gray-400" /> Brand
                </label>
                <button type="button" onClick={() => setShowBrandModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:underline">
                  + Create Brand
                </button>
              </div>
              {brands.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-sm text-gray-400">
                  No brands found.{" "}
                  <button type="button" onClick={() => setShowBrandModal(true)} className="text-blue-500 hover:underline font-medium">Please create a brand first.</button>
                </div>
              ) : (
                <>
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      placeholder="Search brands..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition"
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition bg-white"
                    size={Math.min(5, brands.filter(b => !brandSearch || b.brandName.toLowerCase().includes(brandSearch.toLowerCase())).length + 1)}>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
              {/* Tag chips */}
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-lg border border-blue-100 font-medium">
                      {t}
                      <button type="button" onClick={() => removeTag(t)}>
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Tag input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
                  placeholder="Type tag and press Enter…"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                />
                <button type="button" onClick={() => addTag(tagInput)} className="px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium">
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
            <h2 className="font-semibold text-gray-800 text-lg">
              Pricing & Inventory
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Compare Price (₹)
                  <span className="text-gray-400 font-normal ml-1">optional</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.comparePrice}
                  onChange={(e) =>
                    setForm({ ...form, comparePrice: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Price Unit
              </label>
              <select
                value={form.priceUnit}
                onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition bg-white"
              >
                {PRICE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    Per {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Min Order Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.minOrderQuantity}
                  onChange={(e) =>
                    setForm({ ...form, minOrderQuantity: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Max Order Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxOrderQuantity}
                  onChange={(e) =>
                    setForm({ ...form, maxOrderQuantity: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 text-lg">
                Specifications
              </h2>
              <button
                type="button"
                onClick={addSpecification}
                className="text-sm text-[var(--primary)] font-medium hover:underline flex items-center gap-1"
              >
                <HiOutlinePlusCircle className="w-4 h-4" />
                Add Spec
              </button>
            </div>

            <div className="space-y-3">
              {form.specifications.map((spec, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Key (e.g. Material)"
                    value={spec.key}
                    onChange={(e) =>
                      updateSpecification(index, "key", e.target.value)
                    }
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Stainless Steel)"
                    value={spec.value}
                    onChange={(e) =>
                      updateSpecification(index, "value", e.target.value)
                    }
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecification(index)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Product Variants - Complete Management */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 text-lg mb-5">
              Product Variants
            </h2>
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
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Images */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800 text-lg">
              Product Images
            </h2>
            <p className="text-xs text-gray-400">
              Upload up to 5 images. First image will be the main photo.
            </p>

            {/* Preview Grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <HiOutlineXMark className="w-3 h-3" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] bg-[var(--primary)] text-white px-1.5 py-0.5 rounded font-medium">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {imagePreviews.length < 5 && (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[var(--primary)] hover:bg-blue-50/50 transition">
                <HiOutlinePhoto className="w-8 h-8 text-gray-300 mb-2" />
                <span className="text-sm text-gray-400">Click to upload</span>
                <span className="text-xs text-gray-300 mt-0.5">
                  JPG, PNG, WebP
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Product Video */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800 text-lg">Product Video</h2>
              <p className="text-xs text-gray-400 mt-0.5">Upload 1 video · MP4, WebM, MOV, AVI</p>
            </div>

            {/* Existing or new video preview */}
            {(videoPreview || existingVideo) && (
              <div className="relative">
                <video
                  src={videoPreview || existingVideo}
                  controls
                  className="w-full rounded-lg border border-gray-200 max-h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={() => { setVideoFile(null); setVideoPreview(""); setExistingVideo(""); }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                >
                  <HiOutlineXMark className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Upload area */}
            {!videoPreview && !existingVideo && (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[var(--primary)] hover:bg-blue-50/50 transition">
                <span className="text-3xl mb-1">🎬</span>
                <span className="text-sm text-gray-400">Click to upload video</span>
                <span className="text-xs text-gray-300 mt-0.5">MP4, WebM, MOV, AVI</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setVideoFile(file);
                    setVideoPreview(URL.createObjectURL(file));
                  }}
                  className="hidden"
                />
              </label>
            )}

            {/* Change video button when video exists */}
            {(videoPreview || existingVideo) && (
              <label className="flex items-center gap-2 text-xs text-blue-600 hover:underline cursor-pointer font-semibold">
                <span>🔄 Change Video</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setVideoFile(file);
                    setVideoPreview(URL.createObjectURL(file));
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800 text-lg">Location</h2>
            <StateDropdown value={form.state} onChange={(v) => setForm({ ...form, state: v, city: "" })} />
            <CityDropdown value={form.city} onChange={(v) => setForm({ ...form, city: v })} state={form.state} />
          </div>

          {/* Product Status Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
            <p className="font-semibold text-gray-800 text-sm">Product Status</p>

            {/* Current status badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                product?.status === "approved" && form.isActive
                  ? "bg-green-100 text-green-700"
                  : product?.status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : product?.status === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {product?.status === "approved" && form.isActive
                  ? "✓ Live — Visible to buyers"
                  : product?.status === "approved" && !form.isActive
                  ? "Hidden"
                  : product?.status === "pending"
                  ? "⏳ Pending Review"
                  : product?.status === "rejected"
                  ? "✗ Rejected"
                  : "Draft"}
              </span>
            </div>

            {/* Publish / Unpublish button */}
            {product?.status !== "approved" || !form.isActive ? (
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await api.put(`/products/${productId}`, { status: "approved", isActive: true });
                    setProduct((prev: any) => prev ? { ...prev, status: "approved" } : prev);
                    setForm((prev) => ({ ...prev, isActive: true }));
                    toast.success("Product published! Now visible to buyers.");
                  } catch {
                    toast.error("Failed to publish product.");
                  } finally {
                    setSaving(false);
                  }
                }}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
              >
                🚀 Publish — Make Visible to Buyers
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await api.put(`/products/${productId}`, { isActive: false });
                    setForm((prev) => ({ ...prev, isActive: false }));
                    toast.success("Product hidden from buyers.");
                  } catch {
                    toast.error("Failed to update.");
                  } finally {
                    setSaving(false);
                  }
                }}
                className="w-full border border-gray-300 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
              >
                Hide from Buyers
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[var(--primary)] text-white py-3 rounded-lg font-semibold hover:bg-[var(--primary-dark)] transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <HiOutlinePencilSquare className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
            <Link
              href="/seller/products"
              className="w-full text-center py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>

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
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand Name <span className="text-red-400">*</span></label>
                <input type="text" autoFocus maxLength={100}
                  value={newBrand.brandName}
                  onChange={(e) => setNewBrand((b) => ({ ...b, brandName: e.target.value }))}
                  placeholder="e.g. Tata, Amul, Reliance"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand Description</label>
                <textarea rows={3} maxLength={2000}
                  value={newBrand.brandDescription}
                  onChange={(e) => setNewBrand((b) => ({ ...b, brandDescription: e.target.value }))}
                  placeholder="Describe your brand, history, what makes it unique..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              {/* Features */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand Features</label>
                <textarea rows={3} maxLength={3000}
                  value={newBrand.brandFeatures}
                  onChange={(e) => setNewBrand((b) => ({ ...b, brandFeatures: e.target.value }))}
                  placeholder="e.g. Premium Quality, ISO Certified, Made in India..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500 transition" />
                <p className="text-xs text-gray-400 mt-1">Each line will be shown as a feature</p>
              </div>
              {/* Website */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Website URL</label>
                <input type="url"
                  value={newBrand.website}
                  onChange={(e) => setNewBrand((b) => ({ ...b, website: e.target.value }))}
                  placeholder="https://www.yourbrand.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition" />
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

export default function EditProductPage() {
  return (
    <ProtectedRoute allowedRoles={["seller"]}>
      <EditProductContent />
    </ProtectedRoute>
  );
}
