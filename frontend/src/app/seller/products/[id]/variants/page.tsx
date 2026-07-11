"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useVariantManagement } from "@/hooks/useVariantManagement";
import { VariantManagementTable } from "@/components/seller/variants/VariantManagementTable";
import { VariantSearchFilter } from "@/components/seller/variants/VariantSearchFilter";
import { VariantEditModal } from "@/components/seller/variants/VariantEditModal";
import { BulkActionsPanel } from "@/components/seller/variants/BulkActionsPanel";
import { PaginationControl } from "@/components/seller/variants/PaginationControl";
import { HiOutlineArrowLeft, HiOutlineArrowPath, HiOutlinePlus } from "react-icons/hi2";
import axios from "@/lib/axios";

interface Variant {
  _id: string;
  sku: string;
  name: string;
  attributeValues: Record<string, string>;
  price: number;
  stock: number;
  status: "active" | "inactive" | "out_of_stock";
  source: "auto" | "manual";
}

interface Product {
  _id: string;
  name: string;
  variantTypes: any[];
}

export default function VariantsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const variantManagement = useVariantManagement({ productId, pageSize: 20 });

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  // Fetch product details
  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setProductLoading(true);
        const response = await axios.get(`/products/${productId}`);
        setProduct(response.data.data);
      } catch (error) {
        console.error("Failed to fetch product", error);
      } finally {
        setProductLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleEditVariant = (variant: Variant) => {
    setEditingVariant(variant);
    setIsEditModalOpen(true);
  };

  const handleSaveVariant = async (
    variantId: string,
    data: { price: number; stock: number; status: string }
  ) => {
    await variantManagement.updateVariant(variantId, data);
    setIsEditModalOpen(false);
  };

  const handleDeleteVariant = (variantId: string) => {
    if (confirm("Are you sure you want to delete this variant?")) {
      variantManagement.deleteVariant(variantId);
    }
  };

  const handleBulkAction = async (action: string, value: string | number) => {
    await variantManagement.bulkUpdate(action, value);
  };

  const handleRegenerateVariants = async () => {
    if (confirm("Regenerate variants from variantTypes? Manual variants will be preserved.")) {
      await variantManagement.regenerateVariants(true);
    }
  };

  if (!isAuthenticated || !productId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
              title="Go back"
            >
              <HiOutlineArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Variant Management</h1>
              {product && (
                <p className="text-gray-600 mt-1">Managing variants for <span className="font-medium">{product.name}</span></p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <button
            onClick={handleRegenerateVariants}
            disabled={variantManagement.loading || !product?.variantTypes?.length}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
          >
            <HiOutlineArrowPath size={18} />
            Regenerate Variants
          </button>
        </div>

        {/* Search & Filter */}
        <div className="mb-6">
          <VariantSearchFilter
            search={variantManagement.filters.search}
            status={variantManagement.filters.status}
            stockFilter={variantManagement.filters.stockFilter}
            sortBy={variantManagement.filters.sortBy}
            onSearchChange={(search) =>
              variantManagement.applyFilters({ search, page: 1 })
            }
            onStatusChange={(status) =>
              variantManagement.applyFilters({ status, page: 1 })
            }
            onStockFilterChange={(stockFilter) =>
              variantManagement.applyFilters({ stockFilter, page: 1 })
            }
            onSortChange={(sortBy) =>
              variantManagement.applyFilters({ sortBy, page: 1 })
            }
            onReset={() => {
              variantManagement.applyFilters({
                search: "",
                status: "",
                stockFilter: "",
                sortBy: "sku",
                page: 1,
              });
            }}
          />
        </div>

        {/* Bulk Actions Panel */}
        {variantManagement.selectedCount > 0 && (
          <div className="mb-6">
            <BulkActionsPanel
              selectedCount={variantManagement.selectedCount}
              onAction={handleBulkAction}
              loading={variantManagement.loading}
            />
          </div>
        )}

        {/* Variant Table */}
        <div className="mb-6">
          <VariantManagementTable
            variants={variantManagement.variants}
            loading={variantManagement.loading && variantManagement.variants.length === 0}
            selectedIds={variantManagement.selectedVariantIds}
            onSelectVariant={variantManagement.toggleVariantSelection}
            onSelectAll={variantManagement.toggleSelectAll}
            onEdit={handleEditVariant}
            onDelete={handleDeleteVariant}
            isAllSelected={variantManagement.isAllSelected}
          />
        </div>

        {/* Pagination */}
        {variantManagement.variants.length > 0 && (
          <PaginationControl
            currentPage={variantManagement.pagination.page}
            totalPages={variantManagement.pagination.totalPages}
            totalCount={variantManagement.pagination.totalCount}
            pageSize={variantManagement.pagination.limit}
            onPageChange={variantManagement.goToPage}
          />
        )}
      </div>

      {/* Edit Modal */}
      <VariantEditModal
        isOpen={isEditModalOpen}
        variant={editingVariant}
        loading={variantManagement.loading}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingVariant(null);
        }}
        onSave={handleSaveVariant}
      />
    </div>
  );
}
