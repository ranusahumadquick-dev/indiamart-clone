"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const MAX_COMPARE = 4;
const LS_KEY = "compareItems";

export interface CompareProduct {
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
  description?: string;
  allowSamples?: boolean;
  samplePrice?: number;
}

interface CompareContextType {
  items: CompareProduct[];
  addItem: (product: CompareProduct) => boolean;
  removeItem: (id: string) => void;
  clearItems: () => void;
  isInCompare: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareProduct[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: CompareProduct): boolean => {
    if (items.length >= MAX_COMPARE) return false;
    if (items.some((p) => p._id === product._id)) return false;
    setItems((prev) => [...prev, product]);
    return true;
  }, [items]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p._id !== id));
  }, []);

  const clearItems = useCallback(() => setItems([]), []);

  const isInCompare = useCallback(
    (id: string) => items.some((p) => p._id === id),
    [items]
  );

  return (
    <CompareContext.Provider value={{ items, addItem, removeItem, clearItems, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
