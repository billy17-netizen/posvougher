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
  AlertCircle
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

export default function DashboardPage() {
  const [userName, setUserName] = useState("User");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const settings = useSettings();
  
  // Translation function
  const t = (key: string) => {
    const lang = settings.language;
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'dashboard': 'Dashboard',
        'welcome_back': 'Selamat datang kembali,',
        'dashboard_desc': 'Ini adalah dashboard POS Vougher Anda. Kelola produk, kategori, dan penjualan dari sini.',
        'go_to_pos': 'Buka Layar POS',
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
        'no_transactions': 'Tidak ada transaksi',
        'id': 'ID',
        'date': 'Tanggal',
        'customer': 'Pelanggan',
        'amount': 'Jumlah',
        'status': 'Status',
        'action': 'Aksi',
        'view': 'Lihat',
        'system_settings': 'Pengaturan Sistem',
        'error_stats': 'Gagal memuat statistik dashboard'
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
        'error_stats': 'Failed to load dashboard statistics'
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
  
  useEffect(() => {
    // Get user from localStorage
    const getUserFromLocalStorage = () => {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          setCurrentUser(user);
          setUserName(user.name);
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
      setLoading(false);
    };

    getUserFromLocalStorage();
    fetchDashboardStats();
  }, []);

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
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  // Use the current language setting for date formatting
  const locale = settings.language === 'id' ? 'id-ID' : 'en-US';
  const formattedDate = today.toLocaleDateString(locale, options);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <BarChart2 className="mr-2 text-brutalism-blue" />
            {t('dashboard')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
        </div>
        <Link 
          href="/dashboard/pengaturan" 
          className="btn btn-outline flex items-center"
        >
          <Settings size={16} className="mr-2" /> {t('system_settings')}
        </Link>
      </div>
      
      {error && (
        <div className="error-alert flex items-center mb-4">
          <AlertCircle size={18} className="mr-2" /> {error}
        </div>
      )}
      
      <div className="dashboard-content">
        {/* Welcome Card */}
        <div className="brutalism-card mb-6 bg-gradient-to-r from-brutalism-blue to-blue-500 text-white overflow-hidden">
          <div className="p-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">{t('welcome_back')} {userName}!</h2>
              <p className="opacity-90 max-w-lg">
                {t('dashboard_desc')}
              </p>
              <div className="mt-4">
                <Link href="/dashboard/pos" className="inline-block bg-white text-brutalism-blue px-4 py-2 rounded font-bold border-3 border-brutalism-black shadow-brutal-sm hover:shadow-brutal hover:translate-y-[-2px] transition-all">
                  {t('go_to_pos')} <ArrowRight size={16} className="inline ml-1" />
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center border-4 border-white">
                <ShoppingCart size={64} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
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
            <div className="bg-brutalism-yellow p-4 text-brutalism-black font-bold flex items-center">
              <ShoppingCart className="mr-2" /> {t('transactions')}
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
                  <div className="grid grid-cols-1 gap-2 mt-4">
                    <Link href="/dashboard/transactions" className="btn btn-sm btn-outline flex items-center justify-center">
                      <ShoppingCart size={14} className="mr-1" /> {t('transactions')}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="brutalism-card mb-8">
          <div className="card-header flex items-center">
            <Layers className="mr-2" /> {t('quick_actions')}
          </div>
          <div className="card-content p-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4">
              <Link href="/dashboard/pos" className="brutalism-action-card">
                <div className="icon-container bg-blue-100 text-brutalism-blue">
                  <CreditCard size={24} />
                </div>
                <span>{t('pos_screen')}</span>
              </Link>
              
              <Link href="/dashboard/products/add" className="brutalism-action-card">
                <div className="icon-container bg-green-100 text-green-600">
                  <PackageOpen size={24} />
                </div>
                <span>{t('add_product')}</span>
              </Link>
              
              <Link href="/dashboard/categories" className="brutalism-action-card">
                <div className="icon-container bg-yellow-100 text-yellow-600">
                  <Tag size={24} />
                </div>
                <span>{t('categories')}</span>
              </Link>
              
              <Link href="/dashboard/transactions" className="brutalism-action-card">
                <div className="icon-container bg-purple-100 text-purple-600">
                  <ShoppingCart size={24} />
                </div>
                <span>{t('transactions')}</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Recent Transactions */}
        <div className="brutalism-card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="mr-2" /> {t('recent_transactions')}
            </div>
            <Link href="/dashboard/transactions" className="text-sm text-brutalism-blue hover:underline flex items-center">
              {t('view_all')} <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          <div className="card-content p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b-3 border-brutalism-black">
                  <th className="py-3 px-4 text-left">{t('id')}</th>
                  <th className="py-3 px-4 text-left">{t('date')}</th>
                  <th className="py-3 px-4 text-left">{t('customer')}</th>
                  <th className="py-3 px-4 text-left">{t('amount')}</th>
                  <th className="py-3 px-4 text-left">{t('status')}</th>
                  <th className="py-3 px-4 text-left">{t('action')}</th>
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
                  stats.recentTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{tx.id.slice(0, 8)}...</td>
                      <td className="py-3 px-4 text-sm">{formatDate(tx.date)}</td>
                      <td className="py-3 px-4">{tx.customer}</td>
                      <td className="py-3 px-4">{formatRupiah(tx.amount)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          tx.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800' 
                            : tx.status === 'PENDING' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/dashboard/transactions/${tx.id}`} className="text-brutalism-blue hover:underline text-sm">
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
    </div>
  );
} 