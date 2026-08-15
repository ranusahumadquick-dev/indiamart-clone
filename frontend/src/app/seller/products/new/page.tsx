"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProductForm from "@/components/seller/ProductForm/ProductForm";

export default function NewProductPage() {
  return (
    <ProtectedRoute allowedRoles={["seller"]}>
      <ProductForm mode="create" />
    </ProtectedRoute>
  );
}
