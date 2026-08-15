"use client";

import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ProductForm from "@/components/seller/ProductForm/ProductForm";

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  return (
    <ProtectedRoute allowedRoles={["seller"]}>
      <ProductForm mode="edit" productId={productId} />
    </ProtectedRoute>
  );
}
