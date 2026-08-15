import type { VariantTemplate } from "@/utils/variantGenerator";

export interface SubCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  subcategories?: SubCategory[];
  variantTemplates?: VariantTemplate[];
}

export interface Brand {
  _id: string;
  brandName: string;
}

export interface ImageItem {
  url: string;
  publicId?: string;
  type?: "image" | "video";
  alt?: string;
}

export interface ProductFormState {
  name: string;
  description: string;
  price: string;
  priceMax: string;
  comparePrice: string;
  priceUnit: string;
  category: string;
  subCategory: string;
  brand: string;
  tags: string[];
  minOrderQuantity: string;
  maxOrderQuantity: string;
  stock: string;
  city: string;
  state: string;
  specifications: { key: string; value: string }[];
  allowSamples: boolean;
  samplePrice: string;
  sampleMinQty: string;
  sampleMaxQty: string;
  sampleLeadTime: string;
  isActive: boolean;
}

export const PRICE_UNITS = ["Piece", "Kg", "Meter", "Liter", "Box", "Packet", "Ton", "Set"];

export const SUGGESTED_TAGS = [
  "wholesale", "bulk", "OEM", "export", "quality", "certified",
  "stainless steel", "industrial", "commercial", "eco-friendly",
];

export const emptyProductForm = (defaults?: { city?: string; state?: string }): ProductFormState => ({
  name: "",
  description: "",
  price: "",
  priceMax: "",
  comparePrice: "",
  priceUnit: "Piece",
  category: "",
  subCategory: "",
  brand: "",
  tags: [],
  minOrderQuantity: "1",
  maxOrderQuantity: "",
  stock: "",
  city: defaults?.city || "",
  state: defaults?.state || "",
  specifications: [{ key: "", value: "" }],
  allowSamples: false,
  samplePrice: "",
  sampleMinQty: "1",
  sampleMaxQty: "5",
  sampleLeadTime: "3-5 days",
  isActive: true,
});

export interface ProductData {
  _id: string;
  name: string;
  description: string;
  price: number;
  priceMax?: number;
  comparePrice?: number;
  priceUnit: string;
  category: string | { _id: string; name: string };
  subCategory?: string | { _id: string; name: string };
  brand?: string | { _id: string; brandName: string };
  tags: string[];
  specifications: { key: string; value: string }[];
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  stock: number;
  city: string;
  state: string;
  images: ImageItem[];
  isActive: boolean;
  status: string;
  variantTypes?: VariantTemplate[];
  variants?: any[];
  allowSamples?: boolean;
  samplePrice?: number;
  sampleMinQty?: number;
  sampleMaxQty?: number;
  sampleLeadTime?: string;
}
