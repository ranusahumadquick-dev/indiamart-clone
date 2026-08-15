'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';

interface Category {
  _id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  productCount: number;
  subcategories: string[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
  totalProducts: number;
}

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats>({
    total: 0,
    active: 0,
    inactive: 0,
    totalProducts: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Form states
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '📦',
    isActive: true
  });

  const [editCategory, setEditCategory] = useState({
    name: '',
    description: '',
    icon: '📦',
    isActive: true
  });

  useEffect(() => {
    fetchCategories();
  }, [filter]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/admin/categories');
      if (res.data?.success) {
        setCategories(res.data.data.categories);
        setStats(res.data.data.stats);
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const res = await axios.post('/admin/categories', newCategory);
      if (res.data?.success) {
        fetchCategories();
        setShowAddModal(false);
        setNewCategory({
          name: '',
          description: '',
          icon: '📦',
          isActive: true
        });
        toast.success('Category added successfully');
      }
    } catch (err: any) {
      console.error('Error adding category:', err);
      toast.error(err.response?.data?.message || 'Failed to add category');
    }
  };

  const updateCategory = async () => {
    if (!selectedCategory || !editCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const res = await axios.put(`/admin/categories/${selectedCategory._id}`, editCategory);
      if (res.data?.success) {
        fetchCategories();
        setShowEditModal(false);
        setSelectedCategory(null);
        setEditCategory({
          name: '',
          description: '',
          icon: '📦',
          isActive: true
        });
        toast.success('Category updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating category:', err);
      toast.error(err.response?.data?.message || 'Failed to update category');
    }
  };

  const toggleCategoryStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      const res = await axios.patch(`/admin/categories/${categoryId}/status`, { isActive: !currentStatus });
      if (res.data?.success) {
        setCategories(prev => prev.map(category => 
          category._id === categoryId ? { ...category, isActive: !currentStatus } : category
        ));
        toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (err: any) {
      console.error('Error toggling category status:', err);
      toast.error('Failed to update category status');
    }
  };

  const confirmDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const deleteCategory = async () => {
    if (!categoryToDelete) return;

    if (categoryToDelete.productCount > 0) {
      toast.error('Cannot delete category with existing products');
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      return;
    }

    try {
      const res = await axios.delete(`/admin/categories/${categoryToDelete._id}`);
      if (res.data?.success) {
        fetchCategories();
        setShowDeleteConfirm(false);
        setCategoryToDelete(null);
        toast.success('Category deleted successfully');
      }
    } catch (err: any) {
      console.error('Error deleting category:', err);
      toast.error('Failed to delete category');
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setEditCategory({
      name: category.name,
      description: category.description,
      icon: category.icon,
      isActive: category.isActive
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredCategories = categories.filter(category => {
    if (filter === 'active') return category.isActive;
    if (filter === 'inactive') return !category.isActive;
    return true;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-2">Manage product categories and their settings</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>Add Category</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">🏷️</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">✅</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">❌</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalProducts}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📦</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex space-x-2">
          {[
            { value: 'all', label: 'All Categories' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value as any)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                filter === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>No categories found</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category._id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{category.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(category.isActive)}`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{category.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Products:</span>
                  <span className="font-medium text-gray-900">{category.productCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subcategories:</span>
                  <span className="font-medium text-gray-900">{category.subcategories.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium text-gray-900">{formatDate(category.createdAt)}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(category)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleCategoryStatus(category._id, category.isActive)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    category.isActive
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {category.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => confirmDeleteCategory(category)}
                  className="px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter category description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {['📦', '🛒', '🏪', '🏭', '🔧', '💻', '📱', '🚗', '🏠', '🍎', '👔', '⚙️'].map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewCategory({...newCategory, icon})}
                      className={`w-10 h-10 rounded-lg border text-2xl transition-colors ${
                        newCategory.icon === icon
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newCategory.isActive}
                  onChange={(e) => setNewCategory({...newCategory, isActive: e.target.checked})}
                  className="text-blue-600"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Activate category immediately
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCategory({
                    name: '',
                    description: '',
                    icon: '📦',
                    isActive: true
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={addCategory}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Category - {selectedCategory.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={editCategory.name}
                  onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editCategory.description}
                  onChange={(e) => setEditCategory({...editCategory, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {['📦', '🛒', '🏪', '🏭', '🔧', '💻', '📱', '🚗', '🏠', '🍎', '👔', '⚙️'].map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setEditCategory({...editCategory, icon})}
                      className={`w-10 h-10 rounded-lg border text-2xl transition-colors ${
                        editCategory.icon === icon
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editCategory.isActive}
                  onChange={(e) => setEditCategory({...editCategory, isActive: e.target.checked})}
                  className="text-blue-600"
                />
                <label htmlFor="editIsActive" className="ml-2 text-sm text-gray-700">
                  Activate category immediately
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCategory(null);
                  setEditCategory({
                    name: '',
                    description: '',
                    icon: '📦',
                    isActive: true
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={updateCategory}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Update Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && categoryToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Delete Category</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-700">
                  Are you sure you want to delete the category "<span className="font-semibold">{categoryToDelete.name}</span>"?
                </p>
                {categoryToDelete.productCount > 0 && (
                  <p className="text-red-600 mt-2">
                    This category has {categoryToDelete.productCount} products associated with it. 
                    It cannot be deleted until all products are removed or re-categorized.
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setCategoryToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteCategory}
                  disabled={categoryToDelete.productCount > 0}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    categoryToDelete.productCount > 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagementPage;