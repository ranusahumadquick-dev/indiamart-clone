import { useCallback } from "react";
import { useGuestVerify } from "@/contexts/GuestVerifyContext";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns a wrapper that gates any action behind mobile OTP verification.
 * If the user is already logged in OR already verified as guest → runs action immediately.
 * Otherwise → shows OTP modal, then runs action after successful verification.
 */
export function useProtectedAction() {
  const { isVerified, openModal } = useGuestVerify();
  const { user } = useAuth();

  const protect = useCallback(
    (action: () => void) => {
      if (user || isVerified) {
        action();
      } else {
        openModal(action);
      }
    },
    [user, isVerified, openModal]
  );

  return protect;
}
