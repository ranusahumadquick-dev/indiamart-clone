"use client";

// Returns null when no real image — UI shows a placeholder box instead
function getProductImage(product: { images?: { url: string }[]; name: string }): string | null {
  if (product.images?.[0]?.url) return product.images[0].url;
  return null;
}

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import { resolveImageUrl } from "@/lib/imageUrl";
import toast from "react-hot-toast";
import {
  HiOutlineCamera,
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineChatBubbleLeftRight,
  HiOutlineFunnel,
  HiOutlineShoppingBag,
} from "@/lib/icons";

interface Product {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number;
  status: string;
  isActive: boolean;
  views: number;
  inquiryCount: number;
  images: { url: string }[];
  category: { name: string };
  stock: number;
  minOrderQuantity: number;
  createdAt: string;
}

interface ApiError {
  message: string;
}

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/products/seller/mine?page=${page}&limit=10`);
      const { products: prods, pagination } = res.data.data;

      const productsWithAbsoluteUrls = prods?.map((prod: any) => ({
        ...prod,
        images: prod.images?.map((img: any) => ({
          ...img,
          url: resolveImageUrl(img.url),
        })),
      })) || [];

      setProducts(productsWithAbsoluteUrls);
      setTotalProducts(pagination?.totalProducts || 0);
      setTotalPages(pagination?.totalPages || 1);
      setCurrentPage(pagination?.currentPage || 1);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted successfully");
      fetchProducts(currentPage);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete product");
    } finally {
      setDeleting(null);
    }
  };

  const [publishing, setPublishing] = useState<string | null>(null);

  const handlePublish = async (product: Product) => {
    setPublishing(product._id);
    try {
      await api.put(`/products/${product._id}`, { status: "approved", isActive: true });
      toast.success(`"${product.name}" published! Now visible to buyers.`);
      fetchProducts(currentPage);
    } catch (err: any) {
      toast.error(err.message || "Failed to publish product");
    } finally {
      setPublishing(null);
    }
  };

  const handleDraft = async (product: Product) => {
    setPublishing(product._id);
    try {
      await api.put(`/products/${product._id}`, { status: "pending", isActive: false });
      toast.success(`"${product.name}" moved to draft.`);
      fetchProducts(currentPage);
    } catch (err: any) {
      toast.error(err.message || "Failed to unpublish product");
    } finally {
      setPublishing(null);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await api.put(`/products/${product._id}`, {
        isActive: !product.isActive,
      });
      toast.success(product.isActive ? "Product deactivated" : "Product activated");
      fetchProducts(currentPage);
    } catch (err: any) {
      toast.error(err.message || "Failed to update product");
    }
  };

  // Client-side filtering
  const filtered = products.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.isActive && p.status === "approved") ||
      (statusFilter === "inactive" && !p.isActive) ||
      (statusFilter === "pending" && p.status === "pending") ||
      (statusFilter === "rejected" && p.status === "rejected");
    return matchesSearch && matchesStatus;
  });

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalProducts} product{totalProducts !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/seller/products/new"
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[var(--primary-dark)] transition shrink-0"
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
          Add New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <HiOutlineFunnel className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-[var(--primary)] outline-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-900 font-medium">
            {selectedProducts.length} product{selectedProducts.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedProducts([])}
              className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
            >
              Clear
            </button>
            <Link
              href="/seller/products/bulk-variants"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              🔢 Bulk Generate Variants
            </Link>
          </div>
        </div>
      )}

      {/* Products Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <HiOutlineShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-600 mb-2">
            {products.length === 0 ? "No products yet" : "No matching products"}
          </h4>
          <p className="text-sm text-gray-400 mb-4">
            {products.length === 0
              ? "Start selling by adding your first product"
              : "Try adjusting your search or filters"}
          </p>
          {products.length === 0 && (
            <Link
              href="/seller/products/new"
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[var(--primary-dark)] transition"
            >
              <HiOutlinePlusCircle className="w-5 h-5" />
              Add Your First Product
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left py-3.5 px-5 font-medium">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filtered.length && filtered.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(filtered.map((p) => p._id));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-3.5 px-5 font-medium">Product</th>
                  <th className="text-left py-3.5 px-5 font-medium">Category</th>
                  <th className="text-left py-3.5 px-5 font-medium">Price</th>
                  <th className="text-left py-3.5 px-5 font-medium">Stock</th>
                  <th className="text-center py-3.5 px-5 font-medium">Status</th>
                  <th className="text-center py-3.5 px-5 font-medium">Views</th>
                  <th className="text-center py-3.5 px-5 font-medium">Inquiries</th>
                  <th className="text-right py-3.5 px-5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr
                    key={product._id}
                    className="border-t border-gray-50 hover:bg-gray-50/50 transition"
                  >
                    <td className="py-3 px-5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts([...selectedProducts, product._id]);
                          } else {
                            setSelectedProducts(selectedProducts.filter((id) => id !== product._id));
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <Link href={`/seller/products/${product._id}/edit`} title="Add image">
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center hover:bg-blue-50 hover:ring-2 hover:ring-blue-300 transition cursor-pointer group">
                            {product.images?.[0]?.url ? (
                              <img
                                src={resolveImageUrl(product.images[0].url)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-0.5">
                                <HiOutlineCamera className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition" />
                                <span className="text-[9px] text-gray-300 group-hover:text-blue-400 transition">Add</span>
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate max-w-[220px]">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            MOQ: {product.minOrderQuantity || 1} pcs
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-gray-600">
                      {typeof product.category === "object"
                        ? product.category?.name || "—"
                        : "—"}
                    </td>
                    <td className="py-3 px-5">
                      <p className="font-semibold text-gray-800">
                        ₹{product.price?.toLocaleString("en-IN")}
                      </p>
                      {product.comparePrice && (
                        <p className="text-xs text-gray-400 line-through">
                          ₹{product.comparePrice?.toLocaleString("en-IN")}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className={`text-sm font-medium ${
                          product.stock > 10
                            ? "text-green-600"
                            : product.stock > 0
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <button
                        onClick={() => handleToggleActive(product)}
                        title={product.isActive ? "Click to deactivate" : "Click to activate"}
                      >
                        <span
                          className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-medium cursor-pointer hover:opacity-80 ${
                            product.isActive && product.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : product.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : product.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {!product.isActive
                            ? "Inactive"
                            : product.status === "approved"
                            ? "Active"
                            : product.status}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-5 text-center text-gray-500">
                      {product.views || 0}
                    </td>
                    <td className="py-3 px-5 text-center text-gray-500">
                      {product.inquiryCount || 0}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center justify-end gap-2">
                        {product.status === "approved" && product.isActive ? (
                          /* Draft button — for published products */
                          <button
                            onClick={() => handleDraft(product)}
                            disabled={publishing === product._id}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-1"
                            title="Move to draft"
                          >
                            {publishing === product._id ? (
                              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : "📄 Draft"}
                          </button>
                        ) : (
                          /* Publish button — for pending/draft/inactive products */
                          <button
                            onClick={() => handlePublish(product)}
                            disabled={publishing === product._id}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-1"
                            title="Publish product"
                          >
                            {publishing === product._id ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : "🚀 Publish"}
                          </button>
                        )}
                        <Link
                          href={`/seller/products/${product._id}/edit`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          disabled={deleting === product._id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === product._id ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <HiOutlineTrash className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {product.images?.[0]?.url ? (
                      <img
                        src={resolveImageUrl(product.images[0].url)}
                        alt={product.name}
                        className="w-14 h-14 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 flex items-center justify-center text-gray-300">
                        <HiOutlineShoppingBag className="w-7 h-7" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-[var(--primary)] font-semibold mt-0.5">
                      ₹{product.price?.toLocaleString("en-IN")}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <HiOutlineEye className="w-3.5 h-3.5" />
                        {product.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
                        {product.inquiryCount || 0}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          product.isActive && product.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : product.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {!product.isActive ? "Inactive" : product.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {product.status === "approved" && product.isActive ? (
                      <button
                        onClick={() => handleDraft(product)}
                        disabled={publishing === product._id}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                      >
                        {publishing === product._id ? "..." : "📄 Draft"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(product)}
                        disabled={publishing === product._id}
                        className="px-2 py-1 bg-green-600 text-white text-[10px] font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {publishing === product._id ? "..." : "🚀 Publish"}
                      </button>
                    )}
                    <Link
                      href={`/seller/products/${product._id}/edit`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id, product.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => fetchProducts(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => fetchProducts(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SellerProductsPage() {
  return (
    <ProtectedRoute allowedRoles={["seller"]}>
      <ProductsContent />
    </ProtectedRoute>
  );
}
