"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const MAX_CART_ITEMS = 20;
const LS_KEY = "cartItems";

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variantId?: string;
  addedAt: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    variantId?: string;
  }, quantity: number) => boolean;
  removeFromCart: (id: string, variantId?: string) => void;
  updateQuantity: (id: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getCartCount: () => number;
  isInCart: (id: string, variantId?: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

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

  const addToCart = useCallback((product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    variantId?: string;
  }, quantity: number): boolean => {
    if (items.length >= MAX_CART_ITEMS) return false;

    // Check if product with same variant already exists
    const existingItem = items.find(
      (p) => p._id === product._id && p.variantId === product.variantId
    );

    if (existingItem) {
      // Update quantity if already in cart
      updateQuantity(product._id, existingItem.quantity + quantity, product.variantId);
      return true;
    }

    setItems((prev) => [...prev, {
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      variantId: product.variantId,
      addedAt: Date.now()
    }]);
    return true;
  }, [items]);

  const removeFromCart = useCallback((id: string, variantId?: string) => {
    setItems((prev) =>
      prev.filter((p) => !(p._id === id && p.variantId === variantId))
    );
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(id, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((p) =>
        p._id === id && p.variantId === variantId
          ? { ...p, quantity }
          : p
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => setItems([]), []);

  const getCartCount = useCallback(() =>
    items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const isInCart = useCallback(
    (id: string, variantId?: string) =>
      items.some((p) => p._id === id && p.variantId === variantId),
    [items]
  );

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartCount,
      isInCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
