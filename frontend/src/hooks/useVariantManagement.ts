import { useState, useCallback, useEffect } from "react";
import { variantApi } from "@/lib/variantApi";
import toast from "react-hot-toast";

export interface VariantFilters {
  search: string;
  status: string;
  stockFilter: string;
  sortBy: string;
  page: number;
}

interface Variant {
  _id: string;
  sku: string;
  name: string;
  attributeValues: Record<string, string>;
  price: number;
  stock: number;
  status: "active" | "inactive" | "out_of_stock";
  source: "auto" | "manual";
  createdAt: string;
  [key: string]: any;
}

interface PaginationState {
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

interface UseVariantManagementOptions {
  productId: string;
  pageSize?: number;
}

export function useVariantManagement(options: UseVariantManagementOptions) {
  const { productId, pageSize = 20 } = options;

  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    totalCount: 0,
    page: 1,
    limit: pageSize,
    hasMore: false,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<VariantFilters>({
    search: "",
    status: "",
    stockFilter: "",
    sortBy: "sku",
    page: 1,
  });

  const fetchVariants = useCallback(
    async (filterOverrides?: Partial<VariantFilters>) => {
      setLoading(true);
      setError(null);
      try {
        const queryFilters = { ...filters, ...filterOverrides };
        const response = await variantApi.listVariants(productId, {
          page: queryFilters.page,
          limit: pageSize,
          search: queryFilters.search,
          status: queryFilters.status,
          stockFilter: queryFilters.stockFilter,
          sortBy: queryFilters.sortBy,
        });

        setVariants(response.variants);
        setPagination({
          totalCount: response.totalCount,
          page: response.page,
          limit: response.limit,
          hasMore: response.hasMore,
          totalPages: response.totalPages,
        });
        setFilters(queryFilters);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch variants";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [productId, pageSize]
  );

  const createVariant = useCallback(
    async (variantData: {
      sku: string;
      attributeValues: Record<string, string>;
      price: number;
      stock: number;
      status?: string;
    }) => {
      setLoading(true);
      try {
        const response = await variantApi.createVariant(productId, variantData);
        toast.success("Variant created successfully");
        await fetchVariants();
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create variant";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [productId, fetchVariants]
  );

  const updateVariant = useCallback(
    async (
      variantId: string,
      updates: { price?: number; stock?: number; status?: string }
    ) => {
      setLoading(true);
      try {
        const response = await variantApi.updateVariant(productId, variantId, updates);
        toast.success("Variant updated successfully");
        await fetchVariants();
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update variant";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [productId, fetchVariants]
  );

  const deleteVariant = useCallback(
    async (variantId: string) => {
      setLoading(true);
      try {
        await variantApi.deleteVariant(productId, variantId);
        toast.success("Variant deleted successfully");
        await fetchVariants();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete variant";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [productId, fetchVariants]
  );

  const bulkUpdate = useCallback(
    async (action: string, value: string | number) => {
      if (selectedVariantIds.length === 0) {
        toast.error("No variants selected");
        return;
      }

      setLoading(true);
      try {
        const response = await variantApi.bulkUpdate(productId, {
          action,
          variantIds: selectedVariantIds,
          value,
        });
        toast.success(`${response.updated} variants updated`);
        setSelectedVariantIds([]);
        await fetchVariants();
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Bulk update failed";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [productId, selectedVariantIds, fetchVariants]
  );

  const regenerateVariants = useCallback(
    async (preserveManual: boolean = true) => {
      setLoading(true);
      try {
        const response = await variantApi.regenerateVariants(productId, {
          preserveManualVariants: preserveManual,
        });
        toast.success(
          `Variants regenerated: ${response.autoVariants} auto + ${response.manualVariants} manual`
        );
        await fetchVariants();
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Regeneration failed";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [productId, fetchVariants]
  );

  const applyFilters = useCallback(
    (newFilters: Partial<VariantFilters>) => {
      const updatedFilters = { ...filters, ...newFilters, page: 1 };
      setFilters(updatedFilters);
      fetchVariants(updatedFilters);
    },
    [filters, fetchVariants]
  );

  const toggleVariantSelection = useCallback((variantId: string) => {
    setSelectedVariantIds((prev) =>
      prev.includes(variantId) ? prev.filter((id) => id !== variantId) : [...prev, variantId]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedVariantIds((prev) =>
      prev.length === variants.length ? [] : variants.map((v) => v._id)
    );
  }, [variants]);

  const goToPage = useCallback(
    (page: number) => {
      if (page > 0 && page <= pagination.totalPages) {
        fetchVariants({ ...filters, page });
      }
    },
    [filters, pagination.totalPages, fetchVariants]
  );

  // Initial fetch
  useEffect(() => {
    fetchVariants();
  }, []);

  return {
    // State
    variants,
    loading,
    error,
    selectedVariantIds,
    pagination,
    filters,

    // Actions
    fetchVariants,
    createVariant,
    updateVariant,
    deleteVariant,
    bulkUpdate,
    regenerateVariants,
    applyFilters,
    toggleVariantSelection,
    toggleSelectAll,
    goToPage,

    // Helpers
    isAllSelected: selectedVariantIds.length === variants.length && variants.length > 0,
    selectedCount: selectedVariantIds.length,
  };
}
