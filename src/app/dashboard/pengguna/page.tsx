"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  PlusCircle, 
  Pencil, 
  Trash, 
  X, 
  UserPlus, 
  Check, 
  Search,
  Filter,
  UserX,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "react-hot-toast";

interface User {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "KASIR" | null | undefined;
  createdAt: string;
}

interface ModalState {
  isOpen: boolean;
  type: "add" | "edit" | "delete";
  user?: User;
}

interface FormState {
  name: string;
  username: string;
  password?: string;
  role: string;
}

export default function PenggunaPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const settings = useSettings();
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    // Get current user role from localStorage
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setCurrentUserRole(userData.role);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const isAdmin = currentUserRole === 'ADMIN';
  
  // Translation function
  const t = (key: string) => {
    const lang = settings.language;
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'users': 'Pengguna',
        'manage_users': 'Kelola pengguna sistem POS Vougher',
        'add_user': 'Tambah Pengguna',
        'load_users_error': 'Gagal memuat daftar pengguna. Silakan coba lagi nanti.',
        'filter_users': 'Filter Pengguna',
        'search_users': 'Cari pengguna...',
        'all_roles': 'Semua Role',
        'admin': 'Admin',
        'cashier': 'Kasir',
        'user_list': 'Daftar Pengguna',
        'user_count': '{count} Pengguna',
        'loading_users': 'Memuat pengguna...',
        'no_users': 'Tidak Ada Pengguna',
        'no_users_filter': 'Tidak ada pengguna yang cocok dengan kriteria filter. Coba ubah filter atau',
        'add_new_user': 'tambahkan pengguna baru',
        'no_users_empty': 'Belum ada pengguna yang terdaftar. Klik "Tambah Pengguna" untuk menambahkan pengguna pertama.',
        'add_new_user_btn': 'Tambah Pengguna Baru',
        'name': 'Nama',
        'username': 'Username',
        'role': 'Role',
        'date_created': 'Tanggal Dibuat',
        'actions': 'Aksi',
        'edit_user': 'Edit pengguna',
        'delete_user': 'Hapus pengguna',
        'add_new_user_title': 'Tambah Pengguna Baru',
        'edit_user_title': 'Edit Pengguna',
        'password': 'Password',
        'password_edit_note': 'Password (kosongkan jika tidak diubah)',
        'cancel': 'Batal',
        'save_changes': 'Simpan Perubahan',
        'delete_user_title': 'Hapus Pengguna',
        'delete_confirm': 'Apakah Anda yakin ingin menghapus pengguna ini?',
        'delete_user_btn': 'Hapus Pengguna',
        'required_field_error': 'Semua field wajib diisi',
        'add_user_error': 'Gagal menambahkan pengguna. Silakan coba lagi.',
        'select_role': '-- Pilih Role --',
        'password_required': 'Password wajib diisi',
        'user_added_success': 'Pengguna berhasil ditambahkan',
        'user_updated_success': 'Pengguna berhasil diperbarui',
        'user_deleted_success': 'Pengguna berhasil dihapus',
        'delete_user_error': 'Gagal menghapus pengguna'
      },
      'en': {
        'users': 'Users',
        'manage_users': 'Manage POS Vougher system users',
        'add_user': 'Add User',
        'load_users_error': 'Failed to load user list. Please try again later.',
        'filter_users': 'Filter Users',
        'search_users': 'Search users...',
        'all_roles': 'All Roles',
        'admin': 'Admin',
        'cashier': 'Cashier',
        'user_list': 'User List',
        'user_count': '{count} Users',
        'loading_users': 'Loading users...',
        'no_users': 'No Users',
        'no_users_filter': 'No users match the filter criteria. Try changing the filter or',
        'add_new_user': 'add a new user',
        'no_users_empty': 'No users registered yet. Click "Add User" to add the first user.',
        'add_new_user_btn': 'Add New User',
        'name': 'Name',
        'username': 'Username',
        'role': 'Role',
        'date_created': 'Date Created',
        'actions': 'Actions',
        'edit_user': 'Edit user',
        'delete_user': 'Delete user',
        'add_new_user_title': 'Add New User',
        'edit_user_title': 'Edit User',
        'password': 'Password',
        'password_edit_note': 'Password (leave empty if not changing)',
        'cancel': 'Cancel',
        'save_changes': 'Save Changes',
        'delete_user_title': 'Delete User',
        'delete_confirm': 'Are you sure you want to delete this user?',
        'delete_user_btn': 'Delete User',
        'required_field_error': 'All fields are required',
        'add_user_error': 'Failed to add user. Please try again.',
        'select_role': '-- Select Role --',
        'password_required': 'Password is required',
        'user_added_success': 'User added successfully',
        'user_updated_success': 'User updated successfully',
        'user_deleted_success': 'User deleted successfully',
        'delete_user_error': 'Failed to delete user'
      }
    };
    
    // Handle special cases with replacements
    if (key.startsWith('user_count') && key.includes('{count}')) {
      const count = key.split('{count}')[1];
      const template = translations[lang]['user_count'] || '';
      return template.replace('{count}', count);
    }
    
    return (translations[lang] && translations[lang][key]) || key;
  };
  
  // Add filtered users state instead of calculating on every render
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // Form state for adding/editing users
  const [form, setForm] = useState<FormState>({
    name: "",
    username: "",
    password: "",
    role: ""
  });

  // Modal state
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "add",
  });

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  // Extract page and perPage from search params
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const perPageParam = searchParams.get('perPage');

  // In the first useEffect, set initial pagination values from URL
  useEffect(() => {
    setCurrentPage(pageParam ? parseInt(pageParam) : 1);
    setItemsPerPage(perPageParam ? parseInt(perPageParam) : 10);
    
    fetchUsers();
  }, []);

  // Apply filters when search or role selection changes
  useEffect(() => {
    const filtered = users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = selectedRole === "all" || user.role === selectedRole;
      
      return matchesSearch && matchesRole;
    });
    
    setFilteredUsers(filtered);
  }, [users, searchQuery, selectedRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        router.push('/stores');
        return;
      }
      
      const response = await fetch(`/api/users?storeId=${storeId}`);
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        // Initialize filteredUsers with all users when data is loaded
        setFilteredUsers(data.users);
      } else {
        throw new Error(data.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError(t('load_users_error'));
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm({
      name: "",
      username: "",
      password: "",
      role: "",
    });
    setModal({
      isOpen: true,
      type: "add",
    });
  };

  const openEditModal = (user: User) => {
    setForm({
      name: user.name,
      username: user.username,
      password: "", // Password field is empty when editing
      role: user.role || "", // Ensure role is never null
    });
    setModal({
      isOpen: true,
      type: "edit",
      user,
    });
  };

  const openDeleteModal = (user: User) => {
    setModal({
      isOpen: true,
      type: "delete",
      user,
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: "add",
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!form.name || !form.username) {
        setError(t('required_field_error'));
        setSubmitting(false);
        return;
      }
      
      // For add mode, password is required
      if (modal.type === "add" && !form.password) {
        setError(t('password_required'));
        setSubmitting(false);
        return;
      }
      
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        router.push('/stores');
        return;
      }
      
      // Prepare request data
      let url = `/api/users?storeId=${storeId}`;
      let method = 'POST';
      let body = form;
      
      if (modal.type === "edit" && modal.user) {
        url = `/api/users/${modal.user.id}?storeId=${storeId}`;
        method = 'PUT';
        // If password is empty, don't send it
        if (!form.password) {
          const { password, ...rest } = form;
          body = rest;
        }
      }
      
      console.log(`Submitting user form: ${method} ${url}`);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('API error response:', responseData);
        throw new Error(responseData.error || 'Failed to process request');
      }
      
      console.log('User saved successfully:', responseData);
      
      // Refresh user list
      await fetchUsers();
      closeModal();
      
      // Show the appropriate success message based on the action
      if (modal.type === "add") {
        toast.success(t('user_added_success'));
      } else {
        toast.success(t('user_updated_success'));
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
      toast.error(t('add_user_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!modal.user) return;
    
    try {
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        router.push('/stores');
        return;
      }
      
      const response = await fetch(`/api/users/${modal.user.id}?storeId=${storeId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      // Refresh user list
      await fetchUsers();
      closeModal();
      
      toast.success(t('user_deleted_success'));
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(error.message || t('load_users_error'));
      toast.error(t('delete_user_error'));
    }
  };

  // Add effect for pagination
  useEffect(() => {
    // Calculate total pages
    const total = Math.ceil(filteredUsers.length / itemsPerPage);
    setTotalPages(total);
    
    // Ensure current page is valid
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
      // Remove updateUrlWithPagination call to prevent infinite loops
      return;
    }
    
    // Get users for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Add handlers for pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlWithPagination(page, itemsPerPage);
  };

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
    
    router.push(`/dashboard/pengguna?${params.toString()}`);
  };

  const handleAdd = async () => {
    try {
      if (!form.name || !form.username || !form.password) {
        setError(t('required_field_error'));
        return;
      }
      
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        router.push('/stores');
        return;
      }
      
      setSubmitting(true);
      
      const response = await fetch(`/api/users?storeId=${storeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add user');
      }
      
      // Close modal and refresh users list
      setModal({ isOpen: false, type: 'add' });
      fetchUsers();
      
      // Reset form
      setForm({
        name: '',
        username: '',
        password: '',
        role: '',
      });

      toast.success(t('user_added_success'));
    } catch (error) {
      console.error('Error adding user:', error);
      setError(t('add_user_error'));
      toast.error(t('add_user_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Users className="mr-2 text-brutalism-blue" />
            {t('users')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('manage_users')}
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={openAddModal} 
            className="btn btn-primary flex items-center gap-2"
          >
            <UserPlus size={18} /> {t('add_user')}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-3 border-brutalism-red text-red-800 font-medium flex items-center">
          <X size={18} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="brutalism-card mb-6">
        <div className="card-header flex items-center">
          <Filter className="mr-2" /> 
          {t('filter_users')}
        </div>
        <div className="card-content p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                className="w-full py-2 px-4 pl-10 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal-md focus:translate-y-[-2px] transition-all"
                placeholder={t('search_users')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <select
                className="w-full py-2 px-3 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal-md focus:translate-y-[-2px] transition-all"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="all">{t('all_roles')}</option>
                <option value="ADMIN">{t('admin')}</option>
                <option value="KASIR">{t('cashier')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="brutalism-card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center">
            <Users className="mr-2" /> {t('user_list')}
          </div>
          <span className="text-sm bg-brutalism-yellow/20 py-1 px-3 border-2 border-black font-medium">
            {t('user_count').replace('{count}', filteredUsers.length.toString())}
          </span>
        </div>
        
        <div className="card-content p-0">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-brutalism-black border-t-brutalism-blue rounded-full animate-spin mb-4 mx-auto"></div>
                <p className="font-medium">{t('loading_users')}</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <UserX size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('no_users')}</h3>
              {searchQuery || selectedRole !== "all" ? (
                <p>{t('no_users_filter')} <button onClick={openAddModal} className="text-brutalism-blue hover:underline">{t('add_new_user')}</button>.</p>
              ) : (
                <p>{t('no_users_empty')}</p>
              )}
              <div className="mt-4">
                {isAdmin && (
                  <button onClick={openAddModal} className="btn btn-primary">
                    <UserPlus size={16} className="mr-2" /> {t('add_new_user_btn')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="brutal-table w-full">
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('username')}</th>
                    <th>{t('role')}</th>
                    <th>{t('date_created')}</th>
                    <th className="text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="py-3 px-4 font-medium">{user.name}</td>
                      <td className="py-3 px-4">{user.username}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block py-1 px-3 rounded-full text-sm ${
                          user.role === "ADMIN" 
                            ? "bg-brutalism-blue/20 text-brutalism-blue border-2 border-brutalism-blue" 
                            : "bg-brutalism-green/20 text-brutalism-green border-2 border-brutalism-green"
                        }`}>
                          {user.role === "ADMIN" ? t('admin') : (user.role === "KASIR" ? t('cashier') : t('cashier'))}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(user.createdAt).toLocaleDateString(settings.language === 'id' ? 'id-ID' : 'en-US', {
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {isAdmin && (
                            <>
                              <button 
                                onClick={() => openEditModal(user)}
                                className="btn btn-sm btn-info flex items-center justify-center"
                                title={t('edit_user')}
                              >
                                <Pencil size={16} />
                              </button>
                              <button 
                                onClick={() => openDeleteModal(user)}
                                className="btn btn-sm btn-danger flex items-center justify-center"
                                title={t('delete_user')}
                              >
                                <Trash size={16} />
                              </button>
                            </>
                          )}
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

      {/* Add/Edit User Modal */}
      {modal.isOpen && modal.type !== "delete" && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{modal.type === "add" ? t('add_new_user_title') : t('edit_user_title')}</h2>
              <button onClick={closeModal} className="modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                <div className="input-group">
                  <label className="block mb-1 font-medium text-brutalism-black">{t('name')}</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                    className="w-full py-2 px-3 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal focus:translate-y-[-2px] transition-all"
                  />
                </div>
                <div className="input-group">
                  <label className="block mb-1 font-medium text-brutalism-black">{t('username')}</label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleFormChange}
                    required
                    className="w-full py-2 px-3 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal focus:translate-y-[-2px] transition-all"
                  />
                </div>
                <div className="input-group">
                  <label className="block mb-1 font-medium text-brutalism-black">
                    {modal.type === "add" ? t('password') : t('password_edit_note')}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleFormChange}
                    required={modal.type === "add"}
                    className="w-full py-2 px-3 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal focus:translate-y-[-2px] transition-all"
                  />
                </div>
                <div className="input-group">
                  <label className="block mb-1 font-medium text-brutalism-black">
                    {t('role')}
                  </label>
                  <select
                    name="role"
                    value={form.role || ""}
                    onChange={handleFormChange}
                    className="w-full py-2 px-3 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal focus:translate-y-[-2px] transition-all"
                  >
                    <option value="">{t('select_role')}</option>
                    <option value="ADMIN">{t('admin')}</option>
                    <option value="KASIR">{t('cashier')}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={closeModal}
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary flex items-center"
                >
                  {modal.type === "add" ? (
                    <>
                      <UserPlus size={16} className="mr-2" /> {t('add_user')}
                    </>
                  ) : (
                    <>
                      <Check size={16} className="mr-2" /> {t('save_changes')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modal.isOpen && modal.type === "delete" && modal.user && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{t('delete_user_title')}</h2>
              <button onClick={closeModal} className="modal-close">
                <X size={20} />
              </button>
            </div>
            <div className="mb-6">
              <p className="mb-4">{t('delete_confirm')}</p>
              <div className="p-4 border-3 border-brutalism-black bg-red-50">
                <p className="font-bold">{modal.user.name}</p>
                <p>{t('username')}: {modal.user.username}</p>
                <p>{t('role')}: {modal.user.role === "ADMIN" ? t('admin') : t('cashier')}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={closeModal}
              >
                {t('cancel')}
              </button>
              <button 
                type="button" 
                className="btn btn-danger flex items-center"
                onClick={handleDelete}
              >
                <Trash size={16} className="mr-2" /> {t('delete_user_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add pagination component below the table */}
      <div className="p-4">
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={filteredUsers.length}
          setItemsPerPage={handleItemsPerPageChange}
        />
      </div>
    </div>
  );
} 