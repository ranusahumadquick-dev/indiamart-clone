import axios from "./axios";

// Base API endpoints for variant management
const VARIANTS_BASE = "/products";

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  stockFilter?: string;
  sortBy?: string;
}

export interface VariantCreatePayload {
  sku: string;
  attributeValues: Record<string, string>;
  price: number;
  stock: number;
  status?: string;
}

export interface VariantUpdatePayload {
  price?: number;
  stock?: number;
  status?: string;
}

export interface BulkUpdatePayload {
  action: string;
  variantIds: string[];
  value: string | number;
}

export interface RegenerateOptions {
  preserveManualVariants?: boolean;
}

export const variantApi = {
  /**
   * List variants with pagination, filters, and search
   */
  async listVariants(
    productId: string,
    params: PaginationParams = {}
  ) {
    const response = await axios.get(
      `${VARIANTS_BASE}/${productId}/variants/list`,
      { params }
    );
    return response.data.data;
  },

  /**
   * Get single variant
   */
  async getVariant(productId: string, variantId: string) {
    const response = await axios.get(
      `${VARIANTS_BASE}/${productId}/variants/${variantId}`
    );
    return response.data.data;
  },

  /**
   * Create new variant
   */
  async createVariant(
    productId: string,
    variant: VariantCreatePayload
  ) {
    const response = await axios.post(
      `${VARIANTS_BASE}/${productId}/variants/create`,
      variant
    );
    return response.data.data;
  },

  /**
   * Update variant
   */
  async updateVariant(
    productId: string,
    variantId: string,
    updates: VariantUpdatePayload
  ) {
    const response = await axios.put(
      `${VARIANTS_BASE}/${productId}/variants/update/${variantId}`,
      updates
    );
    return response.data.data;
  },

  /**
   * Delete variant
   */
  async deleteVariant(productId: string, variantId: string) {
    const response = await axios.delete(
      `${VARIANTS_BASE}/${productId}/variants/delete/${variantId}`
    );
    return response.data.data;
  },

  /**
   * Bulk update variants
   */
  async bulkUpdate(
    productId: string,
    payload: BulkUpdatePayload
  ) {
    const response = await axios.put(
      `${VARIANTS_BASE}/${productId}/variants/bulk-update`,
      payload
    );
    return response.data.data;
  },

  /**
   * Regenerate auto-variants
   */
  async regenerateVariants(
    productId: string,
    options: RegenerateOptions = {}
  ) {
    const response = await axios.post(
      `${VARIANTS_BASE}/${productId}/variants/regenerate`,
      options
    );
    return response.data.data;
  },

  /**
   * Search variants by SKU
   */
  async searchVariants(
    productId: string,
    query: string,
    limit: number = 10
  ) {
    const response = await axios.get(
      `${VARIANTS_BASE}/${productId}/variants/search`,
      {
        params: { q: query, limit },
      }
    );
    return response.data.data;
  },
};
