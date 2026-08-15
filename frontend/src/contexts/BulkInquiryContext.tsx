"use client";

import { createContext, useContext, useState, useCallback } from "react";

const MAX_BULK = 10;

export interface BulkProduct {
  _id: string;
  name: string;
  price: number;
  priceUnit?: string;
  images: { url: string; alt?: string }[];
  seller?: { _id: string; name: string; companyName?: string };
}

interface BulkInquiryContextType {
  items: BulkProduct[];
  addItem: (product: BulkProduct) => boolean;
  removeItem: (id: string) => void;
  clearItems: () => void;
  isInBulk: (id: string) => boolean;
  showModal: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const BulkInquiryContext = createContext<BulkInquiryContextType | undefined>(undefined);

export function BulkInquiryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BulkProduct[]>([]);
  const [showModal, setShowModal] = useState(false);

  const addItem = useCallback((product: BulkProduct): boolean => {
    if (items.some((p) => p._id === product._id) || items.length >= MAX_BULK) return false;
    setItems((prev) => [...prev, product]);
    return true;
  }, [items]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p._id !== id));
  }, []);

  const clearItems = useCallback(() => setItems([]), []);

  const isInBulk = useCallback(
    (id: string) => items.some((p) => p._id === id),
    [items]
  );

  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);

  return (
    <BulkInquiryContext.Provider value={{ items, addItem, removeItem, clearItems, isInBulk, showModal, openModal, closeModal }}>
      {children}
    </BulkInquiryContext.Provider>
  );
}

export function useBulkInquiry() {
  const ctx = useContext(BulkInquiryContext);
  if (!ctx) throw new Error("useBulkInquiry must be used within BulkInquiryProvider");
  return ctx;
}
