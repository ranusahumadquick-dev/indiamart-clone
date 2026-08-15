import axios from "axios";
import { resolveImagesInObject } from "@/lib/imageUrl";

// Use relative URL in browser so HTTP/HTTPS always matches the page protocol.
// Fall back to env var for SSR or local dev.
const isProd = process.env.NODE_ENV === "production";
const API_BASE_URL =
  typeof window !== "undefined"
    ? isProd
      ? `${window.location.origin}/indiamart/api`
      : "/api"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// =============================================
// REQUEST INTERCEPTOR — Attach token
// =============================================
api.interceptors.request.use(
  (config) => {
    try {
      // Get token from localStorage with error handling
      let token = null;
      if (typeof window !== "undefined") {
        token = localStorage.getItem("accessToken");
      }

      // Ensure token exists and is a string
      if (token && typeof token === "string" && token.trim()) {
        config.headers.Authorization = `Bearer ${token.trim()}`;
      }
    } catch (err) {
      console.warn("Error retrieving auth token:", err);
    }

    // Remove Content-Type for FormData to allow browser to set multipart/form-data
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =============================================
// RESPONSE INTERCEPTOR — Handle errors & 401
// =============================================
api.interceptors.response.use(
  (response) => {
    // Auto-resolve all /uploads/ image URLs in every API response
    if (response.data && typeof response.data === "object") {
      response.data = resolveImagesInObject(response.data);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "Something went wrong";

    // 401 Unauthorized — clear session
    if (status === 401 && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      // Do NOT clear session on seller-register page — OTP flow handles auth
      if (!currentPath.startsWith("/seller-register") && !currentPath.startsWith("/auth/")) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        console.warn("[API 401] Unauthorized:", error.config?.url);
      }
      const unauthorizedErr = new Error(error.response?.data?.message || "Unauthorized");
      (unauthorizedErr as any).response = error.response;
      return Promise.reject(unauthorizedErr);
    }

    // Only show toast for actual errors, not silent catches
    if (error.response) {
      const apiErr = new Error(message);
      // Preserve .response so existing `err.response?.data?.message` call sites still work
      (apiErr as any).response = error.response;
      return Promise.reject(apiErr);
    }

    return Promise.reject(error);
  }
);

export default api;
