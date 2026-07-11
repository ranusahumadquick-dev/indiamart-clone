"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

interface GuestVerifyContextType {
  isVerified: boolean;
  showModal: boolean;
  pendingAction: (() => void) | null;
  openModal: (onSuccess?: () => void) => void;
  closeModal: () => void;
  markVerified: () => void;
}

const GuestVerifyContext = createContext<GuestVerifyContextType | null>(null);

const SESSION_KEY = "im_guest_verified";

export function GuestVerifyProvider({ children }: { children: ReactNode }) {
  const [showModal, setShowModal] = useState(false);
  const [isVerified, setIsVerified] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SESSION_KEY) === "1";
  });
  const pendingActionRef = useRef<(() => void) | null>(null);
  const [, forceRender] = useState(0);

  const openModal = useCallback((onSuccess?: () => void) => {
    if (isVerified) {
      onSuccess?.();
      return;
    }
    pendingActionRef.current = onSuccess || null;
    setShowModal(true);
  }, [isVerified]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    pendingActionRef.current = null;
  }, []);

  const markVerified = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setIsVerified(true);
    setShowModal(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setTimeout(() => action?.(), 100);
    forceRender((n) => n + 1);
  }, []);

  return (
    <GuestVerifyContext.Provider value={{
      isVerified,
      showModal,
      pendingAction: pendingActionRef.current,
      openModal,
      closeModal,
      markVerified,
    }}>
      {children}
    </GuestVerifyContext.Provider>
  );
}

export function useGuestVerify() {
  const ctx = useContext(GuestVerifyContext);
  if (!ctx) throw new Error("useGuestVerify must be used inside GuestVerifyProvider");
  return ctx;
}
