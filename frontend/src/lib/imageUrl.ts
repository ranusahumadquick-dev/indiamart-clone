// Recursively walk an API response and fix all image URL fields in-place
export function resolveImagesInObject(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(resolveImagesInObject);
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (
      typeof val === "string" &&
      (key === "url" || key === "image" || key === "avatar" || key === "logo") &&
      (val.includes("/uploads/") || val.includes("localhost:"))
    ) {
      result[key] = resolveImageUrl(val);
    } else {
      result[key] = resolveImagesInObject(val);
    }
  }
  return result;
}


const PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23f3f4f6'/%3E%3Cpath d='M16 32l8-10 6 7 4-4 6 7H8z' fill='%23d1d5db'/%3E%3Ccircle cx='18' cy='20' r='3' fill='%23d1d5db'/%3E%3C/svg%3E";

export function resolveImageUrl(url: string | undefined | null): string {
  if (!url || url.trim() === "") return PLACEHOLDER_SVG;

  // Already correct absolute URL (not localhost)
  if (
    (url.startsWith("http://") || url.startsWith("https://")) &&
    !url.includes("localhost")
  ) {
    return url;
  }

  // Any localhost URL — extract the path after the port
  if (url.includes("localhost")) {
    // e.g. http://localhost:8000/uploads/... or http://localhost:3004/uploads/...
    const match = url.match(/localhost:\d+(\/.*)/);
    const path = match ? match[1] : null;
    if (!path) return PLACEHOLDER_SVG;

    if (typeof window !== "undefined") {
      const isLocalDev =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (isLocalDev) {
        // On local dev, backend is on port 8000
        return `http://localhost:8000${path}`;
      }
      return `${window.location.origin}/indiamart${path}`;
    }
    return path;
  }

  // Relative path starting with /uploads/
  if (url.startsWith("/uploads/")) {
    if (typeof window !== "undefined") {
      const isLocalDev =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (isLocalDev) {
        return `http://localhost:8000${url}`;
      }
      return `${window.location.origin}/indiamart${url}`;
    }
    return url;
  }

  return url;
}
