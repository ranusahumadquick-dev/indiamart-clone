"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";

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
  // Always start false so the first client render matches SSR output —
  // sessionStorage is only readable client-side, reading it in the
  // initializer caused a hydration mismatch for returning verified guests.
  const [isVerified, setIsVerified] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setIsVerified(true);
  }, []);

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
