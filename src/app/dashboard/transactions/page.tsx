"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { 
  ShoppingCart, 
  Filter, 
  Check, 
  Clock, 
  X, 
  Eye, 
  FileText, 
  CreditCard, 
  Calendar, 
  User,
  Banknote,
  Search,
  Filter as FilterIcon
} from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import Pagination from "@/components/Pagination";
import { useSettings } from "@/contexts/SettingsContext";
import { id as localeId } from "date-fns/locale/id";
import { enUS } from "date-fns/locale/en-US";

interface User {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  totalAmount: number;
  paymentMethod: "CASH" | "DEBIT" | "CREDIT" | "QRIS" | "MIDTRANS";
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  createdAt: string;
  cashierUserId: string;
  cashierName: string;
}

// New component for invoice actions
const InvoiceAction = ({ transactionId, isCompleted }: { transactionId: string, isCompleted: boolean }) => {
  const settings = useSettings();
  const router = useRouter();
  
  // Simple translation function for the component
  const t = (key: string) => {
    const lang = settings.language;
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'view_invoice': 'Lihat faktur',
      },
      'en': {
        'view_invoice': 'View invoice',
      }
    };
    return (translations[lang] && translations[lang][key]) || key;
  };
  
  if (!isCompleted) return null;
  
  return (
    <button
      onClick={() => router.push(`/dashboard/transactions/${transactionId}`)}
      className="p-2 bg-gray-100 text-gray-700 rounded border-2 border-gray-700 hover:bg-gray-200 transition-colors"
      title={t('view_invoice')}
    >
      <FileText size={16} />
    </button>
  );
};

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');
  const settings = useSettings();
  
  // Translation function
  const t = (key: string) => {
    const lang = settings.language;
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'transaction_history': 'Riwayat Transaksi',
        'manage_sales': 'Kelola dan tinjau transaksi penjualan Anda',
        'new_transaction': 'Transaksi Baru',
        'filters': 'Filter',
        'search_placeholder': 'Cari ID transaksi atau kasir...',
        'all': 'Semua',
        'completed': 'Selesai',
        'pending': 'Tertunda',
        'cancelled': 'Dibatalkan',
        'transaction_list': 'Daftar Transaksi',
        'transactions': 'Transaksi',
        'loading_transactions': 'Memuat transaksi...',
        'no_transactions': 'Tidak Ada Transaksi',
        'no_transactions_status': 'Tidak ada transaksi dengan status {status} yang ditemukan.',
        'no_transactions_search': 'Tidak ada transaksi yang cocok dengan kriteria pencarian Anda.',
        'no_transactions_recorded': 'Belum ada transaksi yang dicatat.',
        'clear_filters': 'Hapus Filter',
        'create_new_transaction': 'Buat Transaksi Baru',
        'id': 'ID',
        'date': 'Tanggal',
        'cashier': 'Kasir',
        'amount': 'Jumlah',
        'payment': 'Pembayaran',
        'status': 'Status',
        'actions': 'Aksi',
        'cash': 'Tunai',
        'debit_card': 'Kartu Debit',
        'credit_card': 'Kartu Kredit',
        'view_details': 'Lihat detail',
        'complete_transaction': 'Selesaikan transaksi',
        'cancel_transaction': 'Batalkan transaksi',
        'view_invoice': 'Lihat faktur',
        'confirm_complete': 'Selesaikan transaksi ini?',
        'confirm_cancel': 'Batalkan transaksi ini?',
        'failed_load': 'Gagal memuat transaksi. Silakan coba lagi.'
      },
      'en': {
        'transaction_history': 'Transaction History',
        'manage_sales': 'Manage and review your sales transactions',
        'new_transaction': 'New Transaction',
        'filters': 'Filters',
        'search_placeholder': 'Search transaction ID or cashier...',
        'all': 'All',
        'completed': 'Completed',
        'pending': 'Pending',
        'cancelled': 'Cancelled',
        'transaction_list': 'Transaction List',
        'transactions': 'Transactions',
        'loading_transactions': 'Loading transactions...',
        'no_transactions': 'No Transactions Found',
        'no_transactions_status': 'No transactions with status {status} were found.',
        'no_transactions_search': 'No transactions match your search criteria.',
        'no_transactions_recorded': 'No transactions have been recorded yet.',
        'clear_filters': 'Clear Filters',
        'create_new_transaction': 'Create New Transaction',
        'id': 'ID',
        'date': 'Date',
        'cashier': 'Cashier',
        'amount': 'Amount',
        'payment': 'Payment',
        'status': 'Status',
        'actions': 'Actions',
        'cash': 'Cash',
        'debit_card': 'Debit Card',
        'credit_card': 'Credit Card',
        'view_details': 'View details',
        'complete_transaction': 'Complete transaction',
        'cancel_transaction': 'Cancel transaction',
        'view_invoice': 'View invoice',
        'confirm_complete': 'Complete this transaction?',
        'confirm_cancel': 'Cancel this transaction?',
        'failed_load': 'Failed to load transactions. Please try again.'
      }
    };
    
    // Handle special cases with replacements
    if (key.startsWith('no_transactions_status') && key.includes('{status}')) {
      const status = key.split('{status}')[1].toLowerCase();
      const template = translations[lang]['no_transactions_status'] || '';
      return template.replace('{status}', status);
    }
    
    return (translations[lang] && translations[lang][key]) || key;
  };
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedTransactions, setPaginatedTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  // Extract page and perPage from search params
  const pageParam = searchParams.get('page');
  const perPageParam = searchParams.get('perPage');

  useEffect(() => {
    setCurrentPage(pageParam ? parseInt(pageParam) : 1);
    setItemsPerPage(perPageParam ? parseInt(perPageParam) : 10);
    
    fetchTransactions();
  }, []);

  useEffect(() => {
    let results = [...transactions];
    
    // Apply status filter
    if (statusFilter) {
      results = results.filter(transaction => transaction.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      results = results.filter(transaction => 
        transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.cashierName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredTransactions(results);
  }, [statusFilter, transactions, searchQuery]);

  useEffect(() => {
    // Calculate total pages
    const total = Math.ceil(filteredTransactions.length / itemsPerPage);
    setTotalPages(total);
    
    // Ensure current page is valid
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
      // Remove updateUrlWithPagination call to prevent infinite loops
      return;
    }
    
    // Get transactions for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedTransactions(filteredTransactions.slice(startIndex, endIndex));
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        router.push('/stores');
        return;
      }
      
      const response = await fetch(`/api/transactions?storeId=${storeId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      
      const data = await response.json();
      setTransactions(data.transactions);
      setFilteredTransactions(data.transactions);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(t('failed_load'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-2 border-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-2 border-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-2 border-red-800";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800 border-2 border-gray-800";
      default:
        return "bg-gray-100 text-gray-800 border-2 border-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Check size={16} className="mr-1" />;
      case "PENDING":
        return <Clock size={16} className="mr-1" />;
      case "CANCELLED":
        return <X size={16} className="mr-1" />;
      case "EXPIRED":
        return <Clock size={16} className="mr-1" />;
      default:
        return null;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH":
        return t('cash');
      case "DEBIT":
        return t('debit_card');
      case "CREDIT":
        return t('credit_card');
      case "QRIS":
        return "QRIS";
      case "MIDTRANS":
        return "Midtrans";
      default:
        return method;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "CASH":
        return <Banknote size={16} className="mr-1 text-green-600" />;
      case "DEBIT":
        return <CreditCard size={16} className="mr-1 text-blue-600" />;
      case "CREDIT":
        return <CreditCard size={16} className="mr-1 text-purple-600" />;
      case "QRIS":
        return <CreditCard size={16} className="mr-1 text-orange-600" />;
      case "MIDTRANS":
        return <CreditCard size={16} className="mr-1 text-pink-600" />;
      default:
        return <CreditCard size={16} className="mr-1" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(
        new Date(dateString), 
        "dd/MM/yyyy HH:mm", 
        { locale: settings.language === 'id' ? localeId : enUS }
      );
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

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
    
    // Keep status filter if present
    if (statusFilter) {
      params.set('status', statusFilter);
    }
    
    router.push(`/dashboard/transactions?${params.toString()}`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <ShoppingCart className="mr-2 text-brutalism-blue" />
            {t('transaction_history')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('manage_sales')}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Link 
            href="/dashboard/pos" 
            className="btn btn-primary flex items-center"
          >
            <CreditCard size={16} className="mr-2" /> {t('new_transaction')}
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="error-alert flex items-center">
          <X size={18} className="mr-2" /> {error}
        </div>
      )}
      
      <div className="brutalism-card mb-6">
        <div className="card-header flex items-center">
          <FilterIcon className="mr-2" /> 
          {t('filters')}
        </div>
        <div className="card-content p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 px-4 pl-10 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal-md focus:translate-y-[-2px] transition-all"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Link 
                href="/dashboard/transactions"
                className={`btn ${!statusFilter ? 'btn-primary' : 'btn-outline'} flex items-center`}
              >
                <FilterIcon size={16} className="mr-1" /> {t('all')}
              </Link>
              <Link 
                href="/dashboard/transactions?status=COMPLETED"
                className={`btn ${statusFilter === 'COMPLETED' ? 'bg-green-500 text-white border-brutalism-black' : 'btn-outline'} flex items-center`}
              >
                <Check size={16} className="mr-1" /> {t('completed')}
              </Link>
              <Link 
                href="/dashboard/transactions?status=PENDING"
                className={`btn ${statusFilter === 'PENDING' ? 'bg-yellow-500 text-white border-brutalism-black' : 'btn-outline'} flex items-center`}
              >
                <Clock size={16} className="mr-1" /> {t('pending')}
              </Link>
              <Link 
                href="/dashboard/transactions?status=CANCELLED"
                className={`btn ${statusFilter === 'CANCELLED' ? 'bg-red-500 text-white border-brutalism-black' : 'btn-outline'} flex items-center`}
              >
                <X size={16} className="mr-1" /> {t('cancelled')}
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="brutalism-card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center">
            <ShoppingCart className="mr-2" /> {t('transaction_list')}
          </div>
          <span className="text-sm bg-brutalism-yellow/20 py-1 px-3 border-2 border-black font-medium">
            {filteredTransactions.length} {t('transactions')} {statusFilter ? `(${statusFilter})` : ''}
          </span>
        </div>
        
        <div className="card-content p-0">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-brutalism-black border-t-brutalism-green rounded-full animate-spin mb-4 mx-auto"></div>
                <p className="font-medium">{t('loading_transactions')}</p>
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <ShoppingCart size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('no_transactions')}</h3>
              <p className="text-gray-500 mb-4">
                {statusFilter 
                  ? t(`no_transactions_status{${statusFilter.toLowerCase()}}`)
                  : searchQuery
                    ? t('no_transactions_search')
                    : t('no_transactions_recorded')}
              </p>
              {statusFilter || searchQuery ? (
                <button 
                  onClick={() => {
                    router.push('/dashboard/transactions');
                    setSearchQuery("");
                  }}
                  className="btn btn-primary flex items-center mx-auto"
                >
                  <FilterIcon size={16} className="mr-2" /> {t('clear_filters')}
                </button>
              ) : (
                <Link href="/dashboard/pos" className="btn btn-primary flex items-center mx-auto">
                  <CreditCard size={16} className="mr-2" /> {t('create_new_transaction')}
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="brutal-table w-full">
                <thead>
                  <tr>
                    <th>
                      <div className="flex items-center">
                        <FileText size={14} className="mr-2" /> {t('id')}
                      </div>
                    </th>
                    <th>
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2" /> {t('date')}
                      </div>
                    </th>
                    <th>
                      <div className="flex items-center">
                        <User size={14} className="mr-2" /> {t('cashier')}
                      </div>
                    </th>
                    <th>
                      <div className="flex items-center">
                        <CreditCard size={14} className="mr-2" /> {t('amount')}
                      </div>
                    </th>
                    <th>{t('payment')}</th>
                    <th>{t('status')}</th>
                    <th className="text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="transaction-item">
                      <td className="py-3 px-4 font-mono text-sm font-medium">{transaction.id.slice(0, 8)}...</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span>{formatDate(transaction.createdAt).split(' ')[0]}</span>
                          <span className="text-xs text-gray-500">{formatDate(transaction.createdAt).split(' ')[1]}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{transaction.cashierName}</td>
                      <td className="py-3 px-4 font-medium text-brutalism-blue">
                        {formatRupiah(transaction.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-3 py-1 bg-brutalism-blue/15 border-2 border-brutalism-blue text-brutalism-blue text-xs font-medium rounded-full">
                          {getPaymentMethodIcon(transaction.paymentMethod)}
                          {getPaymentMethodLabel(transaction.paymentMethod)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusBadgeClass(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link 
                            href={`/dashboard/transactions/${transaction.id}`}
                            className="btn btn-sm flex items-center justify-center"
                            title={t('view_details')}
                          >
                            <Eye size={16} />
                          </Link>
                          
                          {transaction.status === "PENDING" && (
                            <>
                              <button
                                onClick={async () => {
                                  if (confirm(t('confirm_complete'))) {
                                    try {
                                      // Get current store ID from localStorage
                                      const storeId = localStorage.getItem('currentStoreId');
                                      if (!storeId) {
                                        console.error('No store selected');
                                        return;
                                      }
                                      
                                      const response = await fetch(`/api/transactions/${transaction.id}/status`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ 
                                          status: "COMPLETED",
                                          storeId: storeId
                                        })
                                      });
                                      if (response.ok) fetchTransactions();
                                    } catch (err) {
                                      console.error("Error updating transaction:", err);
                                    }
                                  }
                                }}
                                className="btn btn-sm btn-info flex items-center justify-center"
                                title={t('complete_transaction')}
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(t('confirm_cancel'))) {
                                    try {
                                      // Get current store ID from localStorage
                                      const storeId = localStorage.getItem('currentStoreId');
                                      if (!storeId) {
                                        console.error('No store selected');
                                        return;
                                      }
                                      
                                      const response = await fetch(`/api/transactions/${transaction.id}/status`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ 
                                          status: "CANCELLED",
                                          storeId: storeId
                                        })
                                      });
                                      if (response.ok) fetchTransactions();
                                    } catch (err) {
                                      console.error("Error updating transaction:", err);
                                    }
                                  }
                                }}
                                className="btn btn-sm btn-danger flex items-center justify-center"
                                title={t('cancel_transaction')}
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          
                          <InvoiceAction 
                            transactionId={transaction.id} 
                            isCompleted={transaction.status === "COMPLETED"} 
                          />
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
          totalItems={filteredTransactions.length}
          setItemsPerPage={handleItemsPerPageChange}
        />
      </div>
    </div>
  );
} 