"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";

// =============================================
// TYPES
// =============================================
interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "buyer" | "seller" | "admin" | "premium";
  companyName?: string;
  avatar?: string;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  businessType?: string;
  gstNumber?: string;
  profileCompleted?: boolean;
  verificationRequested?: boolean;
  verificationRequestedAt?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  getToken: () => string | null;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  companyName?: string;
  businessType?: string;
}

// =============================================
// CONTEXT
// =============================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // =============================================
  // INITIALIZE — Check for existing session
  // =============================================
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          // Parse saved user first for instant UI
          setUser(JSON.parse(savedUser));

          // Then verify with backend
          const res = await api.get("/auth/profile");
          // getMe returns { user, subscription } — extract the user object
          const freshUser = res.data.data?.user ?? res.data.data;
          setUser(freshUser);
          localStorage.setItem("user", JSON.stringify(freshUser));
        } catch {
          // Token expired or invalid — clear session
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // =============================================
  // LOGIN
  // =============================================
  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { accessToken, user: loggedInUser } = res.data.data;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    toast.success(`Welcome back, ${loggedInUser.name}!`);

    // Role-based redirect after login
    if (loggedInUser.role === "admin") {
      router.push("/admin/dashboard");
    } else if (loggedInUser.role === "seller") {
      if (!loggedInUser.profileCompleted) {
        router.push("/seller-register");
      } else {
        router.push("/seller/dashboard");
      }
    } else {
      // buyer, premium
      router.push("/buyer/dashboard");
    }
  }, [router]);

  // =============================================
  // REGISTER
  // =============================================
  const register = useCallback(async (data: RegisterData) => {
    const res = await api.post("/auth/register", data);
    const { accessToken, user: newUser } = res.data.data;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
    toast.success(`Welcome, ${newUser.name}!`);

    if (newUser.role === "seller") {
      router.push("/seller-register");
    } else {
      router.push("/buyer/dashboard");
    }
  }, [router]);

  // =============================================
  // LOGOUT
  // =============================================
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if API fails, clear local session
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
      toast.success("Logged out successfully");
      router.push("/");
    }
  }, [router]);

  // =============================================
  // UPDATE PROFILE
  // =============================================
  const updateProfile = useCallback(async (data: Partial<User>) => {
    const res = await api.put("/auth/profile", data);
    const updatedUser = res.data.data;
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    toast.success("Profile updated!");
  }, []);

  // =============================================
  // REFRESH USER — Re-fetch profile from backend
  // =============================================
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/profile");
      const freshUser = res.data.data?.user ?? res.data.data;
      setUser(freshUser);
      localStorage.setItem("user", JSON.stringify(freshUser));
    } catch {
      // Silently fail
    }
  }, []);

  // =============================================
  // GET TOKEN — Retrieve auth token from storage
  // =============================================
  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================
// HOOK
// =============================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
