"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  ShoppingCart, 
  PackageOpen, 
  Tag, 
  TrendingUp, 
  CreditCard, 
  Users, 
  BarChart2, 
  Calendar, 
  ArrowRight, 
  Clock,
  Settings,
  Layers,
  AlertCircle,
  Store
} from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { format } from "date-fns";
import { useSettings } from "@/contexts/SettingsContext";

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  pendingTransactions: number;
  dailySales: number;
  monthlyGrowth: number;
  recentTransactions: {
    id: string;
    date: string;
    amount: number;
    customer: string;
    status: string;
    cashier: string;
  }[];
}

interface StoreWithStats {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  stats: {
    totalProducts: number;
    totalCategories: number;
    pendingTransactions: number;
    dailySales: number;
    totalSales: number;
    totalTransactions: number;
    totalUsers: number;
    monthlyGrowth: number;
    monthlyData: {
      month: string;
      total: number;
    }[];
    recentTransactions: {
      id: string;
      date: string;
      amount: number;
      cashier: string;
    }[];
  };
}

export default function DashboardPage() {
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const settings = useSettings();

  // Translation function
  const t = (key: string) => {
    const lang = settings.language || 'id';
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'dashboard': 'Dashboard',
        'welcome_back': 'Selamat datang kembali,',
        'dashboard_desc': 'Ini adalah dashboard POS Vougher Anda. Kelola produk, kategori, dan penjualan dari sini.',
        'go_to_pos': 'Ke Layar POS',
        'daily_sales': 'Penjualan Harian',
        'from_last_month': 'dari bulan lalu',
        'products_categories': 'Produk & Kategori',
        'products': 'Produk',
        'categories': 'Kategori',
        'view_products': 'Lihat Produk',
        'view_categories': 'Lihat Kategori',
        'transactions': 'Transaksi',
        'pending': 'Tertunda',
        'quick_actions': 'Aksi Cepat',
        'pos_screen': 'Layar POS',
        'add_product': 'Tambah Produk',
        'recent_transactions': 'Transaksi Terbaru',
        'view_all': 'Lihat Semua',
        'loading_transactions': 'Memuat transaksi...',
        'no_transactions': 'Tidak ada transaksi ditemukan',
        'id': 'ID',
        'date': 'Tanggal',
        'customer': 'Pelanggan',
        'amount': 'Jumlah',
        'status': 'Status',
        'action': 'Aksi',
        'view': 'Lihat',
        'system_settings': 'Pengaturan Sistem',
        'error_stats': 'Gagal memuat statistik dashboard',
        'superadmin_dashboard': 'Dashboard Super Admin',
        'superadmin_desc': 'Ini adalah dashboard Super Admin. Lihat semua toko dan laporan penjualan dari sini.',
        'stores_overview': 'Ringkasan Semua Toko',
        'active_stores': 'Toko Aktif',
        'inactive_stores': 'Toko Tidak Aktif',
        'total_sales': 'Total Penjualan',
        'total_transactions': 'Total Transaksi',
        'view_details': 'Lihat Detail',
        'store_details': 'Detail Toko',
        'total_users': 'Total Pengguna',
        'no_stores': 'Tidak ada toko ditemukan',
        'loading_stores': 'Memuat data toko...',
        'store_name': 'Nama Toko',
        'today_sales': 'Penjualan Hari Ini'
      },
      'en': {
        'dashboard': 'Dashboard',
        'welcome_back': 'Welcome back,',
        'dashboard_desc': 'This is your POS Vougher dashboard. Manage your products, categories, and sales from here.',
        'go_to_pos': 'Go to POS Screen',
        'daily_sales': 'Daily Sales',
        'from_last_month': 'from last month',
        'products_categories': 'Products & Categories',
        'products': 'Products',
        'categories': 'Categories',
        'view_products': 'View Products',
        'view_categories': 'View Categories',
        'transactions': 'Transactions',
        'pending': 'Pending',
        'quick_actions': 'Quick Actions',
        'pos_screen': 'POS Screen',
        'add_product': 'Add Product',
        'recent_transactions': 'Recent Transactions',
        'view_all': 'View All',
        'loading_transactions': 'Loading transactions...',
        'no_transactions': 'No transactions found',
        'id': 'ID',
        'date': 'Date',
        'customer': 'Customer',
        'amount': 'Amount',
        'status': 'Status',
        'action': 'Action',
        'view': 'View',
        'system_settings': 'System Settings',
        'error_stats': 'Failed to load dashboard statistics',
        'superadmin_dashboard': 'Super Admin Dashboard',
        'superadmin_desc': 'This is the Super Admin dashboard. View all stores and their sales reports from here.',
        'stores_overview': 'All Stores Overview',
        'active_stores': 'Active Stores',
        'inactive_stores': 'Inactive Stores',
        'total_sales': 'Total Sales',
        'total_transactions': 'Total Transactions',
        'view_details': 'View Details',
        'store_details': 'Store Details',
        'total_users': 'Total Users',
        'no_stores': 'No stores found',
        'loading_stores': 'Loading store data...',
        'store_name': 'Store Name',
        'today_sales': 'Today\'s Sales'
      }
    };
    
    return (translations[lang] && translations[lang][key]) || key;
  };
  
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    pendingTransactions: 0,
    dailySales: 0,
    monthlyGrowth: 0,
    recentTransactions: []
  });

  const [allStoresStats, setAllStoresStats] = useState<StoreWithStats[]>([]);
  const [allStoresLoading, setAllStoresLoading] = useState(true);
  const [allStoresError, setAllStoresError] = useState<string | null>(null);
  
  useEffect(() => {
    // Get user from localStorage
    const getUserFromLocalStorage = () => {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          setCurrentUser(user);
          setUserName(user.name);
          
          // Check if user is a SUPER_ADMIN - Add robust checking
          const superAdminRole = user.role === 'SUPER_ADMIN';
          const superAdminInStores = user.stores?.some((store: any) => store.role === 'SUPER_ADMIN');
          const superAdminInLocalStorage = localStorage.getItem('isSuperAdmin') === 'true';
          
          const isSuperAdmin = superAdminRole || superAdminInStores || superAdminInLocalStorage;
          
          // Ensure the localStorage flag is set correctly
          if (isSuperAdmin && localStorage.getItem('isSuperAdmin') !== 'true') {
            localStorage.setItem('isSuperAdmin', 'true');
          }
          
          // Check for any recent navigations to this page to help avoid UI flashing
          const navTime = sessionStorage.getItem('dashboardNavTime');
          if (navTime && Date.now() - parseInt(navTime) < 5000) {
            // Clear the navigation timestamp
            sessionStorage.removeItem('dashboardNavTime');
            
            // Force a quick re-render to fix any UI inconsistencies
            setTimeout(() => {
              if (isSuperAdmin) {
                document.body.classList.add('superadmin-dashboard');
                setTimeout(() => document.body.classList.remove('superadmin-dashboard'), 100);
              }
            }, 50);
          }
          
          setIsSuperAdmin(isSuperAdmin);
          
          // If superadmin, fetch all stores stats
          if (isSuperAdmin) {
            fetchAllStoresStats();
          } else {
            // For regular users, fetch single store stats
            fetchDashboardStats();
          }
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
      setLoading(false);
    };

    getUserFromLocalStorage();
  }, []);
  
  // Add a second effect to ensure superadmin dashboard is correctly loaded
  useEffect(() => {
    // This ensures the superadmin flag is set in localStorage on every dashboard render
    if (isSuperAdmin) {
      localStorage.setItem('isSuperAdmin', 'true');
      
      // Force reload of statistics if needed
      if (allStoresStats.length === 0 && !allStoresLoading) {
        fetchAllStoresStats();
      }
    }
  }, [isSuperAdmin, allStoresStats.length, allStoresLoading]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        return;
      }
      
      const response = await fetch(`/api/statistics?storeId=${storeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.statistics);
      } else {
        throw new Error(data.error || 'Failed to fetch dashboard statistics');
      }
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      setError(t('error_stats'));
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAllStoresStats = async () => {
    try {
      setAllStoresLoading(true);
      setAllStoresError(null);
      
      const response = await fetch('/api/statistics/all-stores');
      
      if (!response.ok) {
        throw new Error('Failed to fetch all stores statistics');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAllStoresStats(data.storeStats);
      } else {
        throw new Error(data.error || 'Failed to fetch all stores statistics');
      }
    } catch (error) {
      console.error('Error fetching all stores statistics:', error);
      setAllStoresError(t('error_stats'));
    } finally {
      setAllStoresLoading(false);
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      // Using the current language for date formatting
      const locale = settings.language === 'id' ? 'id-ID' : 'en-US';
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Get current date in Indonesian format
  const today = new Date();
  const todayDate = today.toLocaleDateString(settings.language === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate overview stats for superadmin
  const calculateOverviewStats = () => {
    if (!allStoresStats.length) return {
      totalActiveStores: 0,
      totalInactiveStores: 0,
      totalSales: 0,
      totalTransactions: 0
    };

    const activeStores = allStoresStats.filter(store => store.isActive);
    const inactiveStores = allStoresStats.filter(store => !store.isActive);
    
    const totalSales = allStoresStats.reduce((sum, store) => 
      sum + (store.stats.totalSales || 0), 0);
    
    const totalTransactions = allStoresStats.reduce((sum, store) => 
      sum + (store.stats.totalTransactions || 0), 0);
    
    return {
      totalActiveStores: activeStores.length,
      totalInactiveStores: inactiveStores.length,
      totalSales,
      totalTransactions
    };
  };

  const overviewStats = calculateOverviewStats();

  // Render the superadmin dashboard
  if (isSuperAdmin) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="dashboard-header mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('superadmin_dashboard')}</h1>
          <p className="text-gray-600">{t('superadmin_desc')}</p>
        </div>

        {allStoresError && (
          <div className="bg-red-50 border-3 border-brutalism-red p-4 rounded-md mb-6">
            <AlertCircle className="inline-block mr-2 text-brutalism-red" />
            {allStoresError}
          </div>
        )}

        {/* Overview Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Layers className="mr-2 text-brutalism-blue" />
            {t('stores_overview')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="brutalism-card bg-white p-0 overflow-hidden">
              <div className="bg-brutalism-blue p-4 text-white font-bold flex items-center">
                <Store className="mr-2" /> {t('active_stores')}
              </div>
              <div className="p-6">
                {allStoresLoading ? (
                  <div className="flex justify-center items-center h-16">
                    <div className="w-8 h-8 border-4 border-brutalism-black border-t-brutalism-blue rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-brutalism-black">
                    {overviewStats.totalActiveStores}
                  </div>
                )}
              </div>
            </div>
            
            <div className="brutalism-card bg-white p-0 overflow-hidden">
              <div className="bg-brutalism-red p-4 text-white font-bold flex items-center">
                <Store className="mr-2" /> {t('inactive_stores')}
              </div>
              <div className="p-6">
                {allStoresLoading ? (
                  <div className="flex justify-center items-center h-16">
                    <div className="w-8 h-8 border-4 border-brutalism-black border-t-brutalism-red rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-brutalism-black">
                    {overviewStats.totalInactiveStores}
                  </div>
                )}
              </div>
            </div>
            
            <div className="brutalism-card bg-white p-0 overflow-hidden">
              <div className="bg-brutalism-green p-4 text-white font-bold flex items-center">
                <CreditCard className="mr-2" /> {t('total_sales')}
              </div>
              <div className="p-6">
                {allStoresLoading ? (
                  <div className="flex justify-center items-center h-16">
                    <div className="w-8 h-8 border-4 border-brutalism-black border-t-brutalism-green rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-brutalism-black">
                    {formatRupiah(overviewStats.totalSales)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="brutalism-card bg-white p-0 overflow-hidden">
              <div className="bg-brutalism-purple p-4 text-white font-bold flex items-center">
                <ShoppingCart className="mr-2" /> {t('total_transactions')}
              </div>
              <div className="p-6">
                {allStoresLoading ? (
                  <div className="flex justify-center items-center h-16">
                    <div className="w-8 h-8 border-4 border-brutalism-black border-t-brutalism-purple rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-brutalism-black">
                    {overviewStats.totalTransactions}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stores Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Store className="mr-2 text-brutalism-blue" />
            {t('store_details')}
          </h2>
          
          {allStoresLoading ? (
            <div className="brutalism-card">
              <div className="p-8 flex justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-brutalism-black border-t-brutalism-blue rounded-full animate-spin mb-4 mx-auto"></div>
                  <p className="font-medium">{t('loading_stores')}</p>
                </div>
              </div>
            </div>
          ) : allStoresStats.length === 0 ? (
            <div className="brutalism-card">
              <div className="p-8 text-center">
                <p>{t('no_stores')}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allStoresStats.map(store => (
                <div 
                  key={store.id} 
                  className={`brutalism-card p-0 overflow-hidden ${!store.isActive ? 'opacity-70' : ''}`}
                >
                  <div className={`p-4 text-white font-bold flex items-center justify-between ${store.isActive ? 'bg-brutalism-blue' : 'bg-brutalism-red'}`}>
                    <div className="flex items-center">
                      <Store className="mr-2" /> 
                      <span className="truncate max-w-[200px]">{store.name}</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-white rounded-full text-brutalism-black">
                      {store.isActive ? t('active_stores') : t('inactive_stores')}
                    </span>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-500">{t('today_sales')}</div>
                        <div className="text-lg font-bold">{formatRupiah(store.stats.dailySales)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">{t('total_sales')}</div>
                        <div className="text-lg font-bold">{formatRupiah(store.stats.totalSales)}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      <div>
                        <div className="text-xs text-gray-500">{t('products')}</div>
                        <div className="text-md font-bold">{store.stats.totalProducts}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">{t('transactions')}</div>
                        <div className="text-md font-bold">{store.stats.totalTransactions}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">{t('total_users')}</div>
                        <div className="text-md font-bold">{store.stats.totalUsers}</div>
                      </div>
                    </div>
                    
                    {store.stats.recentTransactions.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-2">{t('recent_transactions')}</div>
                        <div className="space-y-2">
                          {store.stats.recentTransactions.map(tx => (
                            <div key={tx.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-1">
                              <span className="truncate max-w-[150px]">{tx.cashier}</span>
                              <span className="font-medium">{formatRupiah(tx.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Link 
                        href={`/dashboard/reports?storeId=${store.id}`}
                        className="btn btn-sm btn-outline flex items-center mt-2"
                      >
                        <BarChart2 size={14} className="mr-1" /> {t('view_details')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular user dashboard (existing code)
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="dashboard-header mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('dashboard')}</h1>
        <p className="text-gray-600">{t('dashboard_desc')}</p>
      </div>

      {error && (
        <div className="bg-red-50 border-3 border-brutalism-red p-4 rounded-md mb-6">
          <AlertCircle className="inline-block mr-2 text-brutalism-red" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="brutalism-card bg-white p-0 overflow-hidden">
          <div className="bg-brutalism-blue p-4 text-white font-bold flex items-center">
            <CreditCard className="mr-2" /> {t('daily_sales')}
          </div>
          <div className="p-6">
            {statsLoading ? (
              <div className="flex justify-center items-center h-16">
                <div className="w-8 h-8 border-4 border-brutalism-black border-t-brutalism-blue rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-brutalism-black mb-2">
                  {formatRupiah(stats.dailySales)}
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  <TrendingUp size={16} className="mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">{stats.monthlyGrowth}%</span> {t('from_last_month')}
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="brutalism-card bg-white p-0 overflow-hidden">
          <div className="bg-brutalism-green p-4 text-white font-bold flex items-center">
            <PackageOpen className="mr-2" /> {t('products_categories')}
          </div>
          <div className="p-6">
            {statsLoading ? (
              <div className="flex justify-center items-center h-16">
                <div className="w-8 h-8 border-4 border-brutalism-black border-t-brutalism-green rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="flex justify-between mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalProducts}</div>
                    <div className="text-sm text-gray-500">{t('products')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalCategories}</div>
                    <div className="text-sm text-gray-500">{t('categories')}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Link href="/dashboard/products" className="btn btn-sm btn-outline flex items-center justify-center">
                    <PackageOpen size={14} className="mr-1" /> {t('view_products')}
                  </Link>
                  <Link href="/dashboard/categories" className="btn btn-sm btn-outline flex items-center justify-center">
                    <Tag size={14} className="mr-1" /> {t('view_categories')}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="brutalism-card bg-white p-0 overflow-hidden">
          <div className="bg-brutalism-yellow p-4 text-white font-bold flex items-center">
            <Clock className="mr-2" /> {t('transactions')}
          </div>
          <div className="p-6">
            {statsLoading ? (
              <div className="flex justify-center items-center h-16">
                <div className="w-8 h-8 border-4 border-brutalism-black border-t-brutalism-yellow rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold">{stats.pendingTransactions}</div>
                  <div className="text-sm text-gray-500">{t('pending')}</div>
                </div>
                <div className="flex justify-center">
                  <Link href="/dashboard/transactions" className="btn btn-sm btn-outline flex items-center justify-center w-full">
                    <Calendar size={14} className="mr-1" /> {t('view_all')}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 brutalism-card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center">
              <ShoppingCart className="mr-2" /> {t('recent_transactions')}
            </div>
            <Link href="/dashboard/transactions" className="btn btn-sm btn-outline flex items-center">
              {t('view_all')} <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          <div className="card-content p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brutalism-gray text-brutalism-black">
                  <tr>
                    <th className="px-4 py-2 text-left">{t('date')}</th>
                    <th className="px-4 py-2 text-left">{t('id')}</th>
                    <th className="px-4 py-2 text-left">{t('customer')}</th>
                    <th className="px-4 py-2 text-right">{t('amount')}</th>
                    <th className="px-4 py-2 text-center">{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {statsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center">
                        <div className="flex justify-center items-center">
                          <div className="w-8 h-8 border-4 border-brutalism-black border-t-brutalism-blue rounded-full animate-spin mr-2"></div>
                          <span>{t('loading_transactions')}</span>
                        </div>
                      </td>
                    </tr>
                  ) : stats.recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        {t('no_transactions')}
                      </td>
                    </tr>
                  ) : (
                    stats.recentTransactions.map((transaction, index) => (
                      <tr key={transaction.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="px-4 py-3">{formatDate(transaction.date)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-brutalism-gray px-2 py-1 rounded-md">
                            #{transaction.id.substring(0, 8)}
                          </span>
                        </td>
                        <td className="px-4 py-3">{transaction.customer}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatRupiah(transaction.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link href={`/dashboard/transactions/${transaction.id}`} className="btn btn-xs btn-outline">
                            {t('view')}
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="brutalism-card">
          <div className="card-header flex items-center">
            <Calendar className="mr-2" /> {todayDate}
          </div>
          <div className="card-content">
            <h3 className="text-lg font-bold mb-4">{t('quick_actions')}</h3>
            <div className="space-y-3">
              <Link href="/dashboard/pos" className="btn btn-outline w-full flex items-center">
                <ShoppingCart size={16} className="mr-2" /> {t('pos_screen')}
              </Link>
              <Link href="/dashboard/products/add" className="btn btn-outline w-full flex items-center">
                <PackageOpen size={16} className="mr-2" /> {t('add_product')}
              </Link>
              <Link href="/dashboard/pengaturan" className="btn btn-outline w-full flex items-center">
                <Settings size={16} className="mr-2" /> {t('system_settings')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 