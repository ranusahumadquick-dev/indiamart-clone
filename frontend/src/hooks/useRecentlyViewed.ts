import { useCallback } from "react";

const LS_KEY = "recentlyViewed";
const MAX_ITEMS = 12;

export interface RecentProduct {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number;
  images: { url: string; alt?: string }[];
  city?: string;
  state?: string;
  companyName?: string;
  averageRating?: number;
  numReviews?: number;
  minOrderQuantity?: number;
  priceUnit?: string;
  isVerified?: boolean;
  category?: string;
  viewedAt: number;
}

function readStorage(): RecentProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: RecentProduct[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export function useRecentlyViewed() {
  const addProduct = useCallback((product: Omit<RecentProduct, "viewedAt">) => {
    const current = readStorage();
    const filtered = current.filter((p) => p._id !== product._id);
    const updated = [{ ...product, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
    writeStorage(updated);
  }, []);

  const getProducts = useCallback((): RecentProduct[] => {
    return readStorage();
  }, []);

  const clearHistory = useCallback(() => {
    writeStorage([]);
  }, []);

  return { addProduct, getProducts, clearHistory };
}
