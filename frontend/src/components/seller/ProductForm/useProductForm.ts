"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  generateVariantCombinations,
  validateVariantTemplates,
  transformTemplateToVariantType,
  type VariantTemplate,
  type VariantType,
} from "@/utils/variantGenerator";
import {
  type Category,
  type Brand,
  type ImageItem,
  type ProductData,
  type ProductFormState,
  emptyProductForm,
} from "./types";

export type PhotoSlot =
  | { kind: "existing"; image: ImageItem }
  | { kind: "new"; file: File; previewUrl: string };

interface UseProductFormOptions {
  mode: "create" | "edit";
  productId?: string;
  userDefaults?: { city?: string; state?: string };
}

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

export function useProductForm({ mode, productId, userDefaults }: UseProductFormOptions) {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [showBrandModal, setShowBrandModal] = useState(false);

  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);

  const [product, setProduct] = useState<ProductData | null>(null);
  const [form, setForm] = useState<ProductFormState>(() =>
    emptyProductForm({ city: userDefaults?.city, state: userDefaults?.state })
  );

  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [videoSlot, setVideoSlot] = useState<PhotoSlot | null>(null);

  const [tagInput, setTagInput] = useState("");
  const [variantTemplates, setVariantTemplates] = useState<VariantTemplate[]>([]);
  const [useAutoVariants, setUseAutoVariants] = useState(true);
  const [variantTypes, setVariantTypes] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  const selectedCategoryData = categories.find((c) => c._id === form.category);
  const availableSubcategories = selectedCategoryData?.subcategories || [];

  // ── Load categories + brands (+ product for edit) ──────────────────────────
  useEffect(() => {
    api.get("/categories/tree")
      .then((res) => setCategories(res.data.data || []))
      .catch(() => toast.error("Failed to load categories"));
    api.get("/brands/my")
      .then((res) => setBrands(res.data.data?.brands || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !productId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/products/seller/product/${productId}`);
        const p: ProductData = res.data.data;
        if (cancelled) return;

        setProduct(p);

        const catId = p.category ? (typeof p.category === "object" ? p.category._id : p.category) : "";
        const subCatId = p.subCategory ? (typeof p.subCategory === "object" ? p.subCategory._id : p.subCategory) : "";
        const brandId = p.brand ? (typeof p.brand === "object" ? p.brand._id : p.brand) : "";

        setForm({
          name: p.name,
          description: p.description,
          price: String(p.price ?? ""),
          priceMax: p.priceMax ? String(p.priceMax) : "",
          comparePrice: p.comparePrice ? String(p.comparePrice) : "",
          priceUnit: p.priceUnit || "Piece",
          category: catId,
          subCategory: subCatId,
          brand: brandId,
          tags: Array.isArray(p.tags) ? p.tags : [],
          minOrderQuantity: String(p.minOrderQuantity || 1),
          maxOrderQuantity: p.maxOrderQuantity ? String(p.maxOrderQuantity) : "",
          stock: String(p.stock ?? 0),
          city: p.city || "",
          state: p.state || "",
          specifications: p.specifications?.length > 0 ? p.specifications : [{ key: "", value: "" }],
          allowSamples: !!p.allowSamples,
          samplePrice: p.samplePrice ? String(p.samplePrice) : "",
          sampleMinQty: String(p.sampleMinQty || 1),
          sampleMaxQty: String(p.sampleMaxQty || 5),
          sampleLeadTime: p.sampleLeadTime || "3-5 days",
          isActive: p.isActive,
        });

        const imageItems = (p.images || []).filter((img) => img.type !== "video");
        const videoItem = (p.images || []).find((img) => img.type === "video");
        setPhotos(imageItems.map((image) => ({ kind: "existing", image })));
        setVideoSlot(videoItem ? { kind: "existing", image: videoItem } : null);

        if (p.variantTypes && p.variantTypes.length > 0) {
          const transformedTypes = p.variantTypes.map((vt: any) => ({
            name: vt.name,
            values: Array.isArray(vt.values)
              ? vt.values.map((v: any) => (typeof v === "string" ? v : (v.label || v.value || String(v))))
              : [],
          }));
          setVariantTypes(transformedTypes);
        }
        if (p.variants && p.variants.length > 0) setVariants(p.variants);

        if (catId) {
          try {
            const categoryRes = await api.get(`/categories/${catId}`);
            if (categoryRes.data.data?.variantTemplates) {
              setVariantTemplates(categoryRes.data.data.variantTemplates);
            }
          } catch {
            /* non-fatal — variant templates are an enhancement, not required */
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load product");
        router.push("/seller/products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [mode, productId, router]);

  // ── Category / subcategory ──────────────────────────────────────────────────
  const handleCategoryChange = useCallback((categoryId: string) => {
    setForm((prev) => ({ ...prev, category: categoryId, subCategory: "" }));
    setVariantTemplates([]);
    setUseAutoVariants(true);

    if (!categoryId) return;
    api.get(`/categories/${categoryId}`)
      .then((res) => {
        const templates = res.data.data?.variantTemplates || [];
        setVariantTemplates(templates);
      })
      .catch(() => setVariantTemplates([]));
  }, []);

  // ── Brand ────────────────────────────────────────────────────────────────────
  const handleBrandCreated = useCallback((brand: Brand) => {
    setBrands((prev) => [...prev, brand]);
    setForm((prev) => ({ ...prev, brand: brand._id }));
    setShowBrandModal(false);
  }, []);

  // ── Photos ───────────────────────────────────────────────────────────────────
  const addPhotos = useCallback(async (files: File[]) => {
    const remaining = 5 - photos.length;
    if (remaining <= 0) { toast.error("Max 5 images allowed"); return; }

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
    const newSlots: PhotoSlot[] = compressed.map((file) => ({
      kind: "new",
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newSlots]);
  }, [photos.length]);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      const slot = prev[index];
      if (slot?.kind === "new") URL.revokeObjectURL(slot.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // ── Video ────────────────────────────────────────────────────────────────────
  const setVideoFile = useCallback((file: File) => {
    const allowed = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
    if (!allowed.includes(file.type)) {
      toast.error("Only MP4, WebM, MOV, AVI formats allowed");
      return;
    }
    setVideoSlot((prev) => {
      if (prev?.kind === "new") URL.revokeObjectURL(prev.previewUrl);
      return { kind: "new", file, previewUrl: URL.createObjectURL(file) };
    });
  }, []);

  const removeVideo = useCallback(() => {
    setVideoSlot((prev) => {
      if (prev?.kind === "new") URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, []);

  // ── Tags ─────────────────────────────────────────────────────────────────────
  const addTag = useCallback((raw: string) => {
    const tag = raw.trim().toLowerCase();
    setForm((prev) => (!tag || prev.tags.includes(tag) ? prev : { ...prev, tags: [...prev.tags, tag] }));
    setTagInput("");
  }, []);

  const removeTag = useCallback((tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  }, []);

  // ── Specifications ───────────────────────────────────────────────────────────
  const addSpec = useCallback(() => {
    setForm((prev) => ({ ...prev, specifications: [...prev.specifications, { key: "", value: "" }] }));
  }, []);

  const removeSpec = useCallback((i: number) => {
    setForm((prev) => ({ ...prev, specifications: prev.specifications.filter((_, idx) => idx !== i) }));
  }, []);

  const updateSpec = useCallback((i: number, field: "key" | "value", val: string) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)),
    }));
  }, []);

  // ── Variant payload (shared between create + edit) ──────────────────────────
  const buildVariantPayload = (): { variantTypes: any[]; variants: any[] } | null => {
    if (variants.length > 0 || variantTypes.length > 0) {
      const cleanedVariants = variants.map((v: any) => ({
        sku: v.sku,
        name: v.name,
        attributeValues: v.attributeValues,
        price: Number(v.price),
        stock: Number(v.stock),
        status: v.status || "active",
      }));
      const cleanedVariantTypes = variantTypes.map((vt: any) => ({
        name: vt.name,
        type: vt.type || "dropdown",
        values: vt.values.map((val: any) => {
          const stringVal = typeof val === "string" ? val : (val.label || val.value || String(val));
          return { label: stringVal, value: stringVal.toLowerCase().replace(/\s+/g, "-") };
        }),
      }));
      return { variantTypes: cleanedVariantTypes, variants: cleanedVariants };
    }

    if (variantTemplates.length > 0 && useAutoVariants) {
      const validated = validateVariantTemplates(variantTemplates);
      if (!validated.valid) {
        toast.error(validated.errors[0] || "Invalid variant templates");
        return null;
      }
      const transformedVariantTypes: VariantType[] = variantTemplates.map(transformTemplateToVariantType);
      const combinations = generateVariantCombinations(variantTemplates, Number(form.price), "", Number(form.stock) || 0);
      return { variantTypes: transformedVariantTypes, variants: combinations };
    }

    return { variantTypes: [], variants: [] };
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim())        { toast.error("Product name is required"); return; }
    if (!form.description.trim()) { toast.error("Description is required"); return; }
    if (!form.price)              { toast.error("Price is required"); return; }
    if (!form.category)           { toast.error("Category is required"); return; }
    if (photos.length === 0)      { toast.error("At least one product image is required"); return; }
    if (!form.state || !form.city) { toast.error("Location (state and city) is required"); return; }
    if (form.priceMax && Number(form.priceMax) < Number(form.price)) {
      toast.error("Max price must be greater than min price");
      return;
    }

    const variantPayload = buildVariantPayload();
    if (variantPayload === null) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("price", form.price);
      if (form.priceMax) fd.append("priceMax", form.priceMax);
      if (form.comparePrice) fd.append("comparePrice", form.comparePrice);
      fd.append("priceUnit", form.priceUnit);
      fd.append("category", form.category);
      if (form.subCategory) fd.append("subCategory", form.subCategory);
      if (form.brand) fd.append("brand", form.brand);
      fd.append("minOrderQuantity", form.minOrderQuantity);
      if (form.maxOrderQuantity) fd.append("maxOrderQuantity", form.maxOrderQuantity);
      if (form.stock && form.stock !== "unlimited") fd.append("stock", form.stock);
      if (form.city) fd.append("city", form.city);
      if (form.state) fd.append("state", form.state);
      fd.append("tags", JSON.stringify(form.tags));

      const specs = form.specifications.filter((s) => s.key && s.value);
      if (specs.length) fd.append("specifications", JSON.stringify(specs));

      fd.append("variantTypes", JSON.stringify(variantPayload.variantTypes));
      fd.append("variants", JSON.stringify(variantPayload.variants));

      fd.append("allowSamples", String(form.allowSamples));
      if (form.allowSamples) {
        if (form.samplePrice) fd.append("samplePrice", form.samplePrice);
        fd.append("sampleMinQty", form.sampleMinQty);
        fd.append("sampleMaxQty", form.sampleMaxQty);
        fd.append("sampleLeadTime", form.sampleLeadTime);
      }

      // New files
      photos.filter((p) => p.kind === "new").forEach((p) => fd.append("images", (p as any).file));
      if (videoSlot?.kind === "new") fd.append("video", videoSlot.file);

      if (mode === "edit") {
        fd.append("isActive", String(form.isActive));
        // Existing items to retain — anything not listed here is dropped server-side.
        const retained: ImageItem[] = photos
          .filter((p): p is Extract<PhotoSlot, { kind: "existing" }> => p.kind === "existing")
          .map((p) => p.image);
        if (videoSlot?.kind === "existing") retained.push(videoSlot.image);
        fd.append("existingImages", JSON.stringify(retained));

        await api.put(`/products/${productId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Product updated!");
      } else {
        await api.post("/products", fd);
        toast.success("Product listed successfully!");
      }

      router.push("/seller/products");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || `Failed to ${mode === "edit" ? "update" : "create"} product`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Publish / unpublish (edit-only) ──────────────────────────────────────────
  const publishProduct = async () => {
    if (!productId) return;
    setSubmitting(true);
    try {
      await api.put(`/products/${productId}`, { status: "approved", isActive: true });
      setProduct((prev) => (prev ? { ...prev, status: "approved" } : prev));
      setForm((prev) => ({ ...prev, isActive: true }));
      toast.success("Product published! Now visible to buyers.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to publish product.");
    } finally {
      setSubmitting(false);
    }
  };

  const unpublishProduct = async () => {
    if (!productId) return;
    setSubmitting(true);
    try {
      await api.put(`/products/${productId}`, { isActive: false });
      setForm((prev) => ({ ...prev, isActive: false }));
      toast.success("Product hidden from buyers.");
    } catch {
      toast.error("Failed to update.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    // data
    categories, brands, product, loading, submitting,
    selectedCategoryData, availableSubcategories,
    // form
    form, setForm,
    // brand
    brandSearch, setBrandSearch, showBrandModal, setShowBrandModal, handleBrandCreated,
    // category
    handleCategoryChange,
    // photos / video
    photos, addPhotos, removePhoto,
    videoSlot, setVideoFile, removeVideo,
    // tags
    tagInput, setTagInput, addTag, removeTag,
    // specs
    addSpec, removeSpec, updateSpec,
    // variants
    variantTemplates, useAutoVariants, setUseAutoVariants, variantTypes, setVariantTypes, variants, setVariants,
    // submit
    handleSubmit, publishProduct, unpublishProduct,
  };
}
