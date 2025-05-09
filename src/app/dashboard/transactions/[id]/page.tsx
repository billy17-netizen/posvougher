"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  X, 
  Printer, 
  FileText, 
  CreditCard, 
  Calendar, 
  User, 
  ShoppingBag, 
  DollarSign, 
  Package,
  ShoppingCart
} from "lucide-react";
import InvoiceGenerator from "@/components/InvoiceGenerator";
import { useSettings } from "@/contexts/SettingsContext";
import { use } from "react";

interface User {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  image: string | null;
}

interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  categoryName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Transaction {
  id: string;
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  paymentMethod: "CASH" | "DEBIT" | "CREDIT" | "QRIS";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  cashierName: string;
  items: TransactionItem[];
}

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const settings = useSettings();
  const { language } = settings;
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);
  
  // Translation function
  const t = (key: string) => {
    const lang = language || 'id';
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'transaction_detail': 'Detail Transaksi',
        'transaction_id': 'ID Transaksi',
        'back': 'Kembali',
        'complete_transaction': 'Selesaikan Transaksi',
        'cancel_transaction': 'Batalkan Transaksi',
        'print_invoice': 'Cetak Faktur',
        'confirm_complete': 'Apakah Anda yakin ingin menyelesaikan transaksi ini?',
        'confirm_cancel': 'Apakah Anda yakin ingin membatalkan transaksi ini?',
        'loading': 'Memuat detail transaksi...',
        'error_loading': 'Gagal memuat detail transaksi. Silakan coba lagi.',
        'transaction_details': 'Detail Transaksi',
        'date': 'Tanggal',
        'cashier': 'Kasir',
        'payment_method': 'Metode Pembayaran',
        'status': 'Status',
        'items': 'Item',
        'total': 'Total',
        'amount_paid': 'Jumlah Bayar',
        'change_amount': 'Kembalian',
        'status_updated': 'Status transaksi berhasil diperbarui',
        'generating_invoice': 'Membuat Faktur...'
      },
      'en': {
        'transaction_detail': 'Transaction Detail',
        'transaction_id': 'Transaction ID',
        'back': 'Back',
        'complete_transaction': 'Complete Transaction',
        'cancel_transaction': 'Cancel Transaction',
        'print_invoice': 'Print Invoice',
        'confirm_complete': 'Are you sure you want to complete this transaction?',
        'confirm_cancel': 'Are you sure you want to cancel this transaction?',
        'loading': 'Loading transaction details...',
        'error_loading': 'Failed to load transaction details. Please try again.',
        'transaction_details': 'Transaction Details',
        'date': 'Date',
        'cashier': 'Cashier',
        'payment_method': 'Payment Method',
        'status': 'Status',
        'items': 'Items',
        'total': 'Total',
        'amount_paid': 'Amount Paid',
        'change_amount': 'Change',
        'status_updated': 'Transaction status updated successfully',
        'generating_invoice': 'Generating Invoice...'
      }
    };
    
    return (translations[lang] && translations[lang][key]) || key;
  };
  
  // Properly unwrap the params Promise using React.use()
  const { id: transactionId } = use(params);
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactionDetail();
  }, []);

  const fetchTransactionDetail = async () => {
    try {
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        router.push('/stores');
        return;
      }
      
      const response = await fetch(`/api/transactions/${transactionId}?storeId=${storeId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch transaction details");
      }

      const data = await response.json();
      setTransaction(data.transaction);
    } catch (err) {
      console.error("Error fetching transaction details:", err);
      setError("Failed to load transaction details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "badge-success";
      case "PENDING":
        return "badge-warning";
      case "CANCELLED":
        return "badge-danger";
      default:
        return "badge-secondary";
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-700 bg-green-100";
      case "PENDING":
        return "text-yellow-700 bg-yellow-100";
      case "CANCELLED":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Check className="mr-2" />;
      case "PENDING":
        return <Clock className="mr-2" />;
      case "CANCELLED":
        return <X className="mr-2" />;
      default:
        return null;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH":
        return "Tunai";
      case "DEBIT":
        return "Kartu Debit";
      case "CREDIT":
        return "Kartu Kredit";
      case "QRIS":
        return "QRIS";
      default:
        return method;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "CASH":
        return "💵";
      case "DEBIT":
        return "💳";
      case "CREDIT":
        return "💳";
      case "QRIS":
        return "📱";
      default:
        return "💰";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="h-10 w-10 rounded-full border-3 border-brutalism-black bg-white shadow-brutal-xs flex items-center justify-center hover:bg-brutalism-yellow transition-colors mr-4"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <ShoppingCart className="mr-2 text-brutalism-blue" />
              {t('transaction_detail')}
            </h1>
            {transaction && (
              <p className="text-sm text-gray-500 mt-1">
                {t('transaction_id')}: <span className="font-mono font-medium">{transactionId.slice(0, 8)}...</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {transaction?.status === "PENDING" && (
            <>
              <button
                onClick={async () => {
                  if (confirm(t('confirm_complete'))) {
                    try {
                      const response = await fetch(`/api/transactions/${transactionId}/status`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "COMPLETED" }),
                      });

                      if (!response.ok) {
                        throw new Error("Failed to update transaction status");
                      }

                      // Refresh data
                      fetchTransactionDetail();
                      alert(t('status_updated'));
                    } catch (err) {
                      console.error("Error updating transaction:", err);
                      alert("Failed to update transaction status");
                    }
                  }
                }}
                className="btn btn-success"
              >
                <Check size={16} className="mr-2" /> {t('complete_transaction')}
              </button>
              <button
                onClick={async () => {
                  if (confirm(t('confirm_cancel'))) {
                    try {
                      const response = await fetch(`/api/transactions/${transactionId}/status`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "CANCELLED" }),
                      });

                      if (!response.ok) {
                        throw new Error("Failed to update transaction status");
                      }

                      // Refresh data
                      fetchTransactionDetail();
                      alert(t('status_updated'));
                    } catch (err) {
                      console.error("Error updating transaction:", err);
                      alert("Failed to update transaction status");
                    }
                  }
                }}
                className="btn btn-danger"
              >
                <X size={16} className="mr-2" /> {t('cancel_transaction')}
              </button>
            </>
          )}
          
          {transaction && (
            <InvoiceGenerator 
              transaction={transaction} 
              buttonText={t('print_invoice')}
              className="btn btn-secondary"
            />
          )}
        </div>
      </div>

      {error && (
        <div className="error-alert flex items-center">
          <X size={16} className="mr-2" /> {error}
        </div>
      )}

      <div className="dashboard-content">
        {loading ? (
          <div className="brutalism-card">
            <div className="card-header">
              <h2>Transaction Details</h2>
            </div>
            <div className="card-content">
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-brutalism-black border-t-brutalism-green rounded-full animate-spin mb-4 mx-auto"></div>
                  <p className="font-medium">Memuat detail transaksi...</p>
                </div>
              </div>
            </div>
          </div>
        ) : transaction ? (
          <div className="transaction-detail">
            {/* Status Banner */}
            <div className={`brutalism-card mb-6 overflow-hidden border-l-8 ${
              transaction.status === 'COMPLETED' 
                ? 'border-l-green-500' 
                : transaction.status === 'PENDING' 
                  ? 'border-l-yellow-500' 
                  : 'border-l-red-500'
            }`}>
              <div className={`py-4 px-6 flex items-center ${getStatusColor(transaction.status)}`}>
                {getStatusIcon(transaction.status)}
                <div>
                  <h3 className="font-bold text-lg">
                    Transaction {transaction.status.charAt(0) + transaction.status.slice(1).toLowerCase()}
                  </h3>
                  <p className="text-sm opacity-75">
                    {transaction.status === 'COMPLETED' 
                      ? 'This transaction has been completed successfully.'
                      : transaction.status === 'PENDING'
                        ? 'This transaction is pending and needs to be completed or cancelled.'
                        : 'This transaction has been cancelled and cannot be modified.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">{t('transaction_details')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-brutalism-yellow mr-3">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('date')}</p>
                      <p className="font-medium">
                        {transaction ? formatDate(transaction.createdAt) : "-"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-brutalism-yellow mr-3">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('cashier')}</p>
                      <p className="font-medium">
                        {transaction ? transaction.cashierName : "-"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-brutalism-yellow mr-3">
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('payment_method')}</p>
                      <p className="font-medium">
                        {transaction ? (
                          <span className="flex items-center">
                            {getPaymentMethodIcon(transaction.paymentMethod)}{" "}
                            {getPaymentMethodLabel(transaction.paymentMethod)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-brutalism-yellow mr-3">
                      <Package size={16} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('status')}</p>
                      <p className="font-medium">
                        {transaction ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(
                              transaction.status
                            )}`}
                          >
                            {getStatusIcon(transaction.status)}
                            {transaction.status}
                          </span>
                        ) : (
                          "-"
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-brutalism-yellow mr-3">
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('items')}</p>
                      <p className="font-medium">
                        {transaction ? transaction.items.length : 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-brutalism-yellow mr-3">
                      <DollarSign size={16} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('total')}</p>
                      <p className="font-medium">
                        {transaction
                          ? new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              minimumFractionDigits: 0,
                            }).format(transaction.totalAmount)
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Add payment amount and change information */}
              {transaction && (transaction.amountPaid > 0 || transaction.changeAmount > 0) && (
                <div className="mt-6 p-4 border-3 border-brutalism-black bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-brutalism-green text-white mr-3">
                        <DollarSign size={16} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t('amount_paid')}</p>
                        <p className="font-medium">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(transaction.amountPaid)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-brutalism-blue text-white mr-3">
                        <DollarSign size={16} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t('change_amount')}</p>
                        <p className="font-medium">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(transaction.changeAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Transaction Information */}
              <div className="brutalism-card md:col-span-2">
                <div className="card-header flex items-center">
                  <CreditCard size={18} className="mr-2" /> 
                  <h2>Transaction Information</h2>
                </div>
                <div className="card-content grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="info-group">
                    <span className="info-label flex items-center text-gray-500">
                      <Calendar size={14} className="mr-1" /> Date & Time
                    </span>
                    <span className="info-value font-medium">
                      {formatDate(transaction.createdAt)}
                    </span>
                  </div>
                  <div className="info-group">
                    <span className="info-label flex items-center text-gray-500">
                      <User size={14} className="mr-1" /> Cashier
                    </span>
                    <span className="info-value font-medium">{transaction.cashierName}</span>
                  </div>
                  <div className="info-group">
                    <span className="info-label flex items-center text-gray-500">
                      <DollarSign size={14} className="mr-1" /> Payment Method
                    </span>
                    <span className="info-value font-medium">
                      <span className="mr-2 text-lg">{getPaymentMethodIcon(transaction.paymentMethod)}</span>
                      {getPaymentMethodLabel(transaction.paymentMethod)}
                    </span>
                  </div>
                  <div className="info-group">
                    <span className="info-label flex items-center text-gray-500">
                      <ShoppingBag size={14} className="mr-1" /> Items
                    </span>
                    <span className="info-value font-medium">
                      {transaction.items?.length || 0} item(s)
                    </span>
                  </div>
                  <div className="info-group md:col-span-2">
                    <span className="info-label flex items-center text-gray-500">
                      <CreditCard size={14} className="mr-1" /> Total Amount
                    </span>
                    <span className="info-value text-2xl font-bold text-brutalism-blue">
                      Rp {transaction.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Card */}
              <div className="brutalism-card">
                <div className="card-header flex items-center">
                  <FileText size={18} className="mr-2" />
                  <h2>Actions</h2>
                </div>
                <div className="card-content">
                  <div className="flex flex-col space-y-3">
                    {transaction && (
                      <InvoiceGenerator 
                        transaction={transaction} 
                        buttonText={t('print_invoice')}
                        className="btn btn-secondary w-full flex items-center justify-center"
                      />
                    )}
                    <Link
                      href="/dashboard/transactions"
                      className="btn btn-outline w-full flex items-center justify-center"
                    >
                      <ShoppingCart size={16} className="mr-2" /> All Transactions
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Items */}
            <div className="brutalism-card mt-6">
              <div className="card-header flex items-center">
                <Package size={18} className="mr-2" />
                <h2>Transaction Items</h2>
              </div>
              <div className="card-content">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-1/2">Product</th>
                      <th className="w-1/6">Price</th>
                      <th className="w-1/6">Quantity</th>
                      <th className="w-1/6">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaction.items?.map((item) => {
                      // Process image URL if needed
                      let imageUrl = item.productImage;
                      // If URL doesn't start with http or https, assume it's a relative path
                      if (imageUrl && !imageUrl.startsWith('http')) {
                        // For absolute paths starting with /
                        if (imageUrl.startsWith('/')) {
                          imageUrl = `${window.location.origin}${imageUrl}`;
                        } else {
                          imageUrl = `${window.location.origin}/${imageUrl}`;
                        }
                      }
                      
                      return (
                        <tr key={item.id} className="transition-colors hover:bg-gray-50">
                          <td className="flex items-center">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.productName}
                                className="w-12 h-12 mr-3 object-cover border-3 border-brutalism-black shadow-brutal-xs rounded"
                                onError={(e) => {
                                  // Handle image loading errors
                                  e.currentTarget.onerror = null; 
                                  e.currentTarget.src = '';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-12 h-12 bg-gray-200 mr-3 flex items-center justify-center border-3 border-brutalism-black shadow-brutal-xs rounded">
                                        <span>No img</span>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 mr-3 flex items-center justify-center border-3 border-brutalism-black shadow-brutal-xs rounded">
                                <span>No img</span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-xs text-gray-500">{item.categoryName}</div>
                            </div>
                          </td>
                          <td className="font-medium">Rp {item.price.toLocaleString()}</td>
                          <td className="text-center">
                            <span className="bg-brutalism-yellow bg-opacity-30 px-2 py-1 rounded-sm font-bold">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="font-medium">Rp {item.subtotal.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    <tr className="total-row border-t-3 border-brutalism-black">
                      <td colSpan={3} className="text-right font-bold">
                        Total
                      </td>
                      <td className="font-bold text-brutalism-blue text-lg">
                        Rp {transaction.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="brutalism-card">
            <div className="p-8 text-center">
              <ShoppingCart size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold mb-2">Transaction Not Found</h3>
              <p className="text-gray-500 mb-4">
                The transaction you're looking for doesn't exist or has been deleted.
              </p>
              <Link href="/dashboard/transactions" className="btn btn-primary">
                Return to Transactions
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 