"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// =============================================
// PROTECTED ROUTE — Redirects unauthenticated users
// =============================================
export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Array<"buyer" | "seller" | "admin" | "premium">;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && allowedRoles && user) {
      if (!allowedRoles.includes(user.role)) {
        router.push("/?error=unauthorized");
        return;
      }
      // Incomplete sellers must finish registration before accessing any seller route
      if (user.role === "seller" && !(user as any).profileCompleted) {
        router.push("/seller-register");
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Role check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  // Incomplete seller registration guard
  if (allowedRoles && user && user.role === "seller" && !(user as any).profileCompleted) {
    return null;
  }

  return <>{children}</>;
}
