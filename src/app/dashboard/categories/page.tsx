"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Tag, 
  Plus, 
  PackageOpen, 
  Edit, 
  Trash2, 
  Search,
  AlertTriangle,
  X,
  Check,
  Folder,
  FolderPlus,
  Filter
} from "lucide-react";
import Pagination from "@/components/Pagination";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  productCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const settings = useSettings();
  
  // Translation function
  const t = (key: string) => {
    const lang = settings.language;
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'category_management': 'Manajemen Kategori',
        'organize_products': 'Atur produk Anda ke dalam kategori',
        'add_new_category': 'Tambah Kategori Baru',
        'filters': 'Filter',
        'search_categories': 'Cari kategori...',
        'clear': 'Hapus',
        'categories_list': 'Daftar Kategori',
        'categories': 'Kategori',
        'loading_categories': 'Memuat kategori...',
        'no_categories_found': 'Tidak Ada Kategori Ditemukan',
        'no_categories_match': 'Tidak ada kategori yang cocok dengan pencarian Anda:',
        'no_categories_yet': 'Anda belum membuat kategori apa pun. Kategori membantu mengatur produk Anda.',
        'clear_search': 'Hapus Pencarian',
        'create_first_category': 'Buat Kategori Pertama',
        'name': 'Nama',
        'products': 'Produk',
        'actions': 'Aksi',
        'product': 'produk',
        'no_products': 'Tidak ada produk',
        'edit_category': 'Edit kategori',
        'delete_category': 'Hapus kategori',
        'cannot_delete': 'Tidak dapat menghapus kategori dengan produk',
        'confirm_delete': 'Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.',
        'failed_add': 'Gagal menambahkan kategori',
        'failed_update': 'Gagal memperbarui kategori',
        'failed_delete': 'Gagal menghapus kategori',
        'failed_load': 'Gagal memuat kategori. Silakan coba lagi.',
        'add_category': 'Tambah Kategori Baru',
        'category_name': 'Nama Kategori',
        'enter_category_name': 'Masukkan nama kategori',
        'cancel': 'Batal',
        'saving': 'Menyimpan...',
        'save_category': 'Simpan Kategori',
        'edit_category_title': 'Edit Kategori',
        'category_added_success': 'Kategori berhasil ditambahkan',
        'category_updated_success': 'Kategori berhasil diperbarui',
        'category_deleted_success': 'Kategori berhasil dihapus'
      },
      'en': {
        'category_management': 'Category Management',
        'organize_products': 'Organize your products into categories',
        'add_new_category': 'Add New Category',
        'filters': 'Filters',
        'search_categories': 'Search categories...',
        'clear': 'Clear',
        'categories_list': 'Categories List',
        'categories': 'Categories',
        'loading_categories': 'Loading categories...',
        'no_categories_found': 'No Categories Found',
        'no_categories_match': 'No categories match your search:',
        'no_categories_yet': 'You haven\'t created any categories yet. Categories help organize your products.',
        'clear_search': 'Clear Search',
        'create_first_category': 'Create First Category',
        'name': 'Name',
        'products': 'Products',
        'actions': 'Actions',
        'product': 'product',
        'no_products': 'No products',
        'edit_category': 'Edit category',
        'delete_category': 'Delete category',
        'cannot_delete': 'Cannot delete categories with products',
        'confirm_delete': 'Are you sure you want to delete this category? This action cannot be undone.',
        'failed_add': 'Failed to add category',
        'failed_update': 'Failed to update category',
        'failed_delete': 'Failed to delete category',
        'failed_load': 'Failed to load categories. Please try again.',
        'add_category': 'Add New Category',
        'category_name': 'Category Name',
        'enter_category_name': 'Enter category name',
        'cancel': 'Cancel',
        'saving': 'Saving...',
        'save_category': 'Save Category',
        'edit_category_title': 'Edit Category',
        'category_added_success': 'Category added successfully',
        'category_updated_success': 'Category updated successfully',
        'category_deleted_success': 'Category deleted successfully'
      }
    };
    
    return (translations[lang] && translations[lang][key]) || key;
  };
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedCategories, setPaginatedCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const pageParam = searchParams.get('page');
  const perPageParam = searchParams.get('perPage');

  useEffect(() => {
    setCurrentPage(pageParam ? parseInt(pageParam) : 1);
    setItemsPerPage(perPageParam ? parseInt(perPageParam) : 10);
    
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchTerm, categories]);

  useEffect(() => {
    const total = Math.ceil(filteredCategories.length / itemsPerPage);
    setTotalPages(total);
    
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
      return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedCategories(filteredCategories.slice(startIndex, endIndex));
  }, [filteredCategories, currentPage, itemsPerPage]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        router.push('/stores');
        return;
      }
      
      const response = await fetch(`/api/categories?storeId=${storeId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      
      const data = await response.json();
      setCategories(data.categories);
      setFilteredCategories(data.categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(t('failed_load'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        router.push('/stores');
        return;
      }
      
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: newCategoryName,
          storeId: storeId
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add category");
      }
      
      // Reset form and close modal
      setNewCategoryName("");
      setIsAddModalOpen(false);
      
      // Refresh categories
      fetchCategories();
      toast.success(t('category_added_success'));
    } catch (err) {
      console.error("Error adding category:", err);
      toast.error(t('failed_add'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editCategory) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        router.push('/stores');
        return;
      }
      
      const response = await fetch(`/api/categories/${editCategory.id}?storeId=${storeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategoryName }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update category");
      }
      
      // Reset form and close modal
      setNewCategoryName("");
      setIsEditModalOpen(false);
      setEditCategory(null);
      
      // Refresh categories
      fetchCategories();
      toast.success(t('category_updated_success'));
    } catch (err) {
      console.error("Error updating category:", err);
      toast.error(t('failed_update'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(t('confirm_delete'))) {
      return;
    }
    
    try {
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        router.push('/stores');
        return;
      }
      
      const response = await fetch(`/api/categories/${id}?storeId=${storeId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete category");
      }
      
      // Refresh categories
      fetchCategories();
      toast.success(t('category_deleted_success'));
    } catch (err) {
      console.error("Error deleting category:", err);
      toast.error(t('failed_delete'));
    }
  };

  const openEditModal = (category: Category) => {
    setEditCategory(category);
    setNewCategoryName(category.name);
    setIsEditModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlWithPagination(page, itemsPerPage);
  };

  const handleItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1);
    updateUrlWithPagination(1, perPage);
  };

  const updateUrlWithPagination = (page: number, perPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    params.set('perPage', perPage.toString());
    
    router.push(`/dashboard/categories?${params.toString()}`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Tag className="mr-2 text-brutalism-blue" />
            {t('category_management')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('organize_products')}
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="btn btn-primary flex items-center"
        >
          <FolderPlus size={16} className="mr-2" /> {t('add_new_category')}
        </button>
      </div>
      
      {error && (
        <div className="error-alert flex items-center">
          <AlertTriangle size={16} className="mr-2" /> {error}
        </div>
      )}
      
      {/* Search & Filter */}
      <div className="brutalism-card mb-6">
        <div className="card-header flex items-center">
          <Filter className="mr-2" /> 
          {t('filters')}
        </div>
        <div className="card-content p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('search_categories')}
                className="w-full py-2 px-4 pl-10 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal-md focus:translate-y-[-2px] transition-all"
              />
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="btn btn-sm btn-outline flex items-center"
              >
                <X size={14} className="mr-1" /> {t('clear')}
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="brutalism-card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center">
            <Tag className="mr-2" /> {t('categories_list')}
          </div>
          <span className="text-sm bg-brutalism-yellow/20 py-1 px-3 border-2 border-black font-medium">
            {filteredCategories.length} {t('categories')}
          </span>
        </div>
        
        <div className="card-content p-0">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-brutalism-black border-t-brutalism-yellow rounded-full animate-spin mb-4 mx-auto"></div>
                <p className="font-medium">{t('loading_categories')}</p>
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <Folder size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('no_categories_found')}</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? (
                  <>{t('no_categories_match')} <strong>"{searchTerm}"</strong></>
                ) : (
                  t('no_categories_yet')
                )}
              </p>
              {searchTerm ? (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="btn btn-secondary flex items-center mx-auto"
                >
                  <X size={16} className="mr-2" /> {t('clear_search')}
                </button>
              ) : (
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn btn-primary flex items-center mx-auto"
                >
                  <FolderPlus size={16} className="mr-2" /> {t('create_first_category')}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="brutal-table w-full">
                <thead>
                  <tr>
                    <th>
                      <div className="flex items-center">
                        <Folder size={14} className="mr-2" /> {t('name')}
                      </div>
                    </th>
                    <th>
                      <div className="flex items-center">
                        <PackageOpen size={14} className="mr-2" /> {t('products')}
                      </div>
                    </th>
                    <th className="text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCategories.map((category) => (
                    <tr key={category.id} className="category-item">
                      <td className="py-3 px-4 font-medium">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-brutalism-blue/15 flex items-center justify-center mr-3 border-2 border-brutalism-blue">
                            <Folder size={14} className="text-brutalism-blue" />
                          </div>
                          {category.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {category.productCount > 0 ? (
                          <Link 
                            href={`/dashboard/products?category=${category.id}`} 
                            className="inline-block px-3 py-1 bg-brutalism-green/15 border-2 border-brutalism-green text-brutalism-green text-xs font-medium rounded-full"
                          >
                            <PackageOpen size={14} className="mr-1 inline-block" />
                            {category.productCount} {category.productCount === 1 ? t('product') : t('products')}
                          </Link>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full border-2 border-gray-400">
                            <X size={14} className="mr-1 inline-block" />
                            {t('no_products')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(category)}
                            className="btn btn-sm btn-info flex items-center justify-center"
                            title={t('edit_category')}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(category.id)}
                            className="btn btn-sm btn-danger flex items-center justify-center"
                            disabled={category.productCount > 0}
                            title={category.productCount > 0 ? t('cannot_delete') : t('delete_category')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={filteredCategories.length}
          setItemsPerPage={handleItemsPerPageChange}
        />
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="flex items-center"><FolderPlus className="mr-2" /> {t('add_category')}</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="modal-close"
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCategory}>
              <div className="input-group mb-6">
                <label htmlFor="name" className="block mb-1 font-medium text-brutalism-black flex items-center">
                  <Tag size={14} className="mr-2" /> {t('category_name')}
                </label>
                <input
                  type="text"
                  id="name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full py-2 px-3 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal focus:translate-y-[-2px] transition-all"
                  placeholder={t('enter_category_name')}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-outline flex items-center"
                  disabled={submitting}
                >
                  <X size={16} className="mr-2" /> {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t('saving')}
                    </>
                  ) : (
                    <>
                      <Check size={16} className="mr-2" /> {t('save_category')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {isEditModalOpen && editCategory && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="flex items-center"><Edit className="mr-2" /> {t('edit_category_title')}</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="modal-close"
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditCategory}>
              <div className="input-group mb-6">
                <label htmlFor="edit-name" className="block mb-1 font-medium text-brutalism-black flex items-center">
                  <Tag size={14} className="mr-2" /> {t('category_name')}
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full py-2 px-3 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal focus:translate-y-[-2px] transition-all"
                  placeholder={t('enter_category_name')}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-outline flex items-center"
                  disabled={submitting}
                >
                  <X size={16} className="mr-2" /> {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t('saving')}
                    </>
                  ) : (
                    <>
                      <Check size={16} className="mr-2" /> {t('save_category')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 