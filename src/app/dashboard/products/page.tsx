"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Package, 
  Search, 
  PlusCircle, 
  Tag,
  Eye, 
  Edit, 
  Trash,
  Filter,
  X
} from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import Pagination from "@/components/Pagination";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "react-hot-toast";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string | null;
  category: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category');
  const pageParam = searchParams.get('page');
  const perPageParam = searchParams.get('perPage');
  const settings = useSettings();
  
  // Translation function
  const t = (key: string) => {
    const lang = settings.language;
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'product_management': 'Manajemen Produk',
        'showing_products_in': 'Menampilkan produk dalam:',
        'clear_filter': 'Hapus filter',
        'add_new_product': 'Tambah Produk Baru',
        'filters': 'Filter',
        'search_products': 'Cari produk...',
        'all_categories': 'Semua Kategori',
        'product_list': 'Daftar Produk',
        'products': 'Produk',
        'loading_products': 'Memuat produk...',
        'no_products_found': 'Tidak Ada Produk Ditemukan',
        'no_products_in_category': 'Tidak ada produk dalam kategori ini.',
        'no_products_match': 'Tidak ada produk yang cocok dengan pencarian Anda.',
        'start_adding_first_product': 'Mulai dengan menambahkan produk pertama Anda.',
        'name': 'Nama',
        'category': 'Kategori',
        'price': 'Harga',
        'stock': 'Stok',
        'actions': 'Aksi',
        'in_stock': 'Tersedia',
        'low_stock': 'Stok Menipis',
        'out_of_stock': 'Stok Habis',
        'view_details': 'Lihat Detail',
        'edit_product': 'Edit Produk',
        'delete_product': 'Hapus Produk',
        'confirm_delete': 'Apakah Anda yakin ingin menghapus produk ini?',
        'failed_load': 'Gagal memuat produk. Silakan coba lagi.',
        'failed_delete': 'Gagal menghapus produk. Silakan coba lagi.',
        'product_deleted_success': 'Produk berhasil dihapus'
      },
      'en': {
        'product_management': 'Product Management',
        'showing_products_in': 'Showing products in:',
        'clear_filter': 'Clear filter',
        'add_new_product': 'Add New Product',
        'filters': 'Filters',
        'search_products': 'Search products...',
        'all_categories': 'All Categories',
        'product_list': 'Product List',
        'products': 'Products',
        'loading_products': 'Loading products...',
        'no_products_found': 'No Products Found',
        'no_products_in_category': 'There are no products in this category.',
        'no_products_match': 'No products match your search.',
        'start_adding_first_product': 'Start by adding your first product.',
        'name': 'Name',
        'category': 'Category',
        'price': 'Price',
        'stock': 'Stock',
        'actions': 'Actions',
        'in_stock': 'In Stock',
        'low_stock': 'Low Stock',
        'out_of_stock': 'Out of Stock',
        'view_details': 'View Details',
        'edit_product': 'Edit Product',
        'delete_product': 'Delete Product',
        'confirm_delete': 'Are you sure you want to delete this product?',
        'failed_load': 'Failed to load products. Please try again.',
        'failed_delete': 'Failed to delete product. Please try again.',
        'product_deleted_success': 'Product deleted successfully'
      }
    };
    
    return (translations[lang] && translations[lang][key]) || key;
  };
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCategoryName, setCurrentCategoryName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Set initial page and perPage from URL
    setCurrentPage(pageParam ? parseInt(pageParam) : 1);
    setItemsPerPage(perPageParam ? parseInt(perPageParam) : 10);
    
    Promise.all([
      fetchProducts(),
      fetchCategories()
    ]).then(() => {
      setLoading(false);
    });
  }, []);

  // Apply category filter when products or category ID changes
  useEffect(() => {
    if (categoryId && products.length > 0) {
      const filtered = products.filter(product => product.category.id === categoryId);
      setFilteredProducts(filtered);
      
      // Set the current category name for display
      const category = categories.find(cat => cat.id === categoryId);
      setCurrentCategoryName(category ? category.name : null);
    } else {
      setFilteredProducts(products);
      setCurrentCategoryName(null);
    }
  }, [categoryId, products, categories]);

  // Apply search filter
  useEffect(() => {
    let results = [...products];
    
    if (searchQuery.trim() !== "") {
      results = results.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (categoryId) {
      results = results.filter(product => product.category.id === categoryId);
    }
    
    setFilteredProducts(results);
  }, [searchQuery, products, categoryId]);

  // Apply pagination
  useEffect(() => {
    // Calculate total pages
    const total = Math.ceil(filteredProducts.length / itemsPerPage);
    setTotalPages(total);
    
    // Ensure current page is valid
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
      // Remove updateUrlWithPagination call to prevent infinite loops
      return;
    }
    
    // Get products for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedProducts(filteredProducts.slice(startIndex, endIndex));
  }, [filteredProducts, currentPage, itemsPerPage]);

  const fetchProducts = async () => {
    try {
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        router.push('/stores');
        return;
      }
      
      const response = await fetch(`/api/products?storeId=${storeId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      
      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(t('failed_load'));
    }
  };
  
  const fetchCategories = async () => {
    try {
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
    } catch (err) {
      console.error("Error fetching categories:", err);
      // We don't set error here to avoid disrupting the product display
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(t('confirm_delete'))) {
      return;
    }
    
    try {
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        return;
      }
      
      const response = await fetch(`/api/products/${id}?storeId=${storeId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete product");
      }
      
      // Refresh the product list
      fetchProducts();
      toast.success(t('product_deleted_success'));
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error(t('failed_delete'));
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlWithPagination(page, itemsPerPage);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    updateUrlWithPagination(1, perPage);
  };

  // Update URL with pagination parameters
  const updateUrlWithPagination = (page: number, perPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    params.set('perPage', perPage.toString());
    
    // Keep category filter if present
    if (categoryId) {
      params.set('category', categoryId);
    }
    
    router.push(`/dashboard/products?${params.toString()}`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Package className="mr-2 text-brutalism-blue" />
            {t('product_management')}
          </h1>
          {currentCategoryName && (
            <div className="mt-2 inline-flex items-center bg-brutalism-yellow/20 border-2 border-brutalism-black px-3 py-1">
              <Tag size={16} className="mr-1" />
              <span className="text-sm font-medium mr-2">
                {t('showing_products_in')} <strong>{currentCategoryName}</strong>
              </span>
              <button 
                onClick={() => router.push('/dashboard/products')}
                className="p-1 hover:bg-white rounded-full"
                title={t('clear_filter')}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        <Link 
          href="/dashboard/products/add" 
          className="btn btn-primary flex items-center"
        >
          <PlusCircle size={16} className="mr-2" /> {t('add_new_product')}
        </Link>
      </div>
      
      {error && (
        <div className="error-alert flex items-center">
          <X size={18} className="mr-2" /> {error}
        </div>
      )}
      
      <div className="brutalism-card mb-6">
        <div className="card-header flex items-center">
          <Filter className="mr-2" /> 
          {t('filters')}
        </div>
        <div className="card-content p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={t('search_products')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 px-4 pl-10 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal-md focus:translate-y-[-2px] transition-all"
              />
            </div>
            
            <div className="w-full md:w-64">
              <select
                className="w-full py-2 px-3 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal-md focus:translate-y-[-2px] transition-all"
                value={categoryId || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    router.push(`/dashboard/products?category=${value}`);
                  } else {
                    router.push('/dashboard/products');
                  }
                }}
              >
                <option value="">{t('all_categories')}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="brutalism-card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center">
            <Package className="mr-2" /> {t('product_list')}
          </div>
          <span className="text-sm bg-brutalism-yellow/20 py-1 px-3 border-2 border-black font-medium">
            {filteredProducts.length} {t('products')}
          </span>
        </div>
        
        <div className="card-content p-0">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-brutalism-black border-t-brutalism-blue rounded-full animate-spin mb-4 mx-auto"></div>
                <p className="font-medium">{t('loading_products')}</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <Package size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('no_products_found')}</h3>
              <p className="text-gray-500 mb-4">
                {categoryId 
                  ? t('no_products_in_category') 
                  : searchQuery 
                    ? t('no_products_match') 
                    : t('start_adding_first_product')
                }
              </p>
              <Link href="/dashboard/products/add" className="btn btn-primary">
                {t('add_new_product')}
              </Link>
            </div>
          ) : (
            <>
              <table className="brutal-table w-full">
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('category')}</th>
                    <th>{t('price')}</th>
                    <th>{t('stock')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.description ? (
                            <>
                              {product.description.substring(0, 40)}
                              {product.description.length > 40 ? '...' : ''}
                            </>
                          ) : ''}
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-brutalism-yellow/20 border-2 border-brutalism-black text-xs font-medium">
                          <Tag size={12} className="mr-1" />
                          {product.category.name}
                        </span>
                      </td>
                      <td className="font-mono font-medium">{formatRupiah(product.price)}</td>
                      <td>
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                            product.stock > 10 
                              ? 'bg-green-100 text-green-800 border-2 border-green-800' 
                              : product.stock > 0 
                                ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-800' 
                                : 'bg-red-100 text-red-800 border-2 border-red-800'
                          }`}
                        >
                          {product.stock > 10 
                            ? t('in_stock') 
                            : product.stock > 0 
                              ? t('low_stock') 
                              : t('out_of_stock')
                          } ({product.stock})
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <Link 
                            href={`/dashboard/products/${product.id}`}
                            className="p-2 bg-blue-100 text-blue-700 rounded border-2 border-blue-700 hover:bg-blue-200 transition-colors"
                            title={t('view_details')}
                          >
                            <Eye size={16} />
                          </Link>
                          <Link 
                            href={`/dashboard/products/edit/${product.id}`}
                            className="p-2 bg-yellow-100 text-yellow-700 rounded border-2 border-yellow-700 hover:bg-yellow-200 transition-colors"
                            title={t('edit_product')}
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 bg-red-100 text-red-700 rounded border-2 border-red-700 hover:bg-red-200 transition-colors"
                            title={t('delete_product')}
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination */}
              <div className="p-4">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredProducts.length}
                  setItemsPerPage={handleItemsPerPageChange}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 