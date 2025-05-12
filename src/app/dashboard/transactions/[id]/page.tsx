"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import Script from 'next/script';
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
  ShoppingCart,
  RefreshCw,
  Banknote,
  QrCode
} from "lucide-react";
import InvoiceGenerator from "@/components/InvoiceGenerator";
import { useSettings } from "@/contexts/SettingsContext";
import { use } from "react";
import { midtransConfig } from '@/lib/config/midtrans';

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
  paymentMethod: "CASH" | "DEBIT" | "CREDIT" | "QRIS" | "MIDTRANS";
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "EXPIRED";
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
  
  // Add Midtrans state variables
  const [midtransToken, setMidtransToken] = useState<string | null>(null);
  const [midtransUrl, setMidtransUrl] = useState<string | null>(null);
  const [showMidtransModal, setShowMidtransModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [midtransLoading, setMidtransLoading] = useState(false);
  
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
        'generating_invoice': 'Membuat Faktur...',
        'midtrans': 'Transfer Bank Virtual Account',
        'pay_with_midtrans': 'Bayar dengan QRIS',
        'payment_pending': 'Pembayaran QRIS Tertunda',
        'payment_pending_message': 'Pembayaran QRIS Anda dalam status tertunda. Silakan periksa status transaksi nanti.',
        'check_payment_status': 'Periksa Status Pembayaran',
        'try_again': 'Coba Lagi',
        'new_transaction': 'Transaksi Baru',
        'payment_successful': 'Pembayaran Berhasil!',
        'transaction_completed': 'Transaksi telah berhasil diselesaikan',
        'transaction_expired': 'QRIS Kadaluarsa',
        'transaction_expired_message': 'Kode QRIS telah kadaluarsa. Anda dapat membuat kode QRIS baru.',
        'refresh_payment': 'Perbarui QRIS',
        'payment_expired': 'QRIS Kadaluarsa',
        'create_new_session': 'Buat QRIS Baru',
        'payment_waiting': 'Pembayaran Menunggu',
        'payment_waiting_message': 'Transaksi ini menunggu pembayaran. Klik tombol untuk menyelesaikan pembayaran.',
        'pay_now': 'Bayar Sekarang'
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
        'generating_invoice': 'Generating Invoice...',
        'midtrans': 'Bank Virtual Account',
        'pay_with_midtrans': 'Pay with QRIS',
        'payment_pending': 'QRIS Payment Pending',
        'payment_pending_message': 'Your QRIS payment is in pending status. Please check transaction status later.',
        'check_payment_status': 'Check Payment Status',
        'try_again': 'Try Again',
        'new_transaction': 'New Transaction',
        'payment_successful': 'Payment Successful!',
        'transaction_completed': 'The transaction has been successfully completed',
        'transaction_expired': 'QRIS Expired',
        'transaction_expired_message': 'QRIS code has expired. You can create a new QRIS code.',
        'refresh_payment': 'Refresh QRIS',
        'payment_expired': 'QRIS Expired',
        'create_new_session': 'Create New QRIS',
        'payment_waiting': 'Payment Waiting',
        'payment_waiting_message': 'This transaction is waiting for payment. Click the button to complete the payment.',
        'pay_now': 'Pay Now'
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
        return t("cash");
      case "DEBIT":
        return "Debit Card";
      case "CREDIT":
        return "Credit Card";
      case "QRIS":
        return "QRIS";
      case "MIDTRANS":
        return "Virtual Account";
      default:
        return method;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "CASH":
        return <Banknote className="w-5 h-5 text-brutalism-green" />;
      case "DEBIT":
        return <CreditCard className="w-5 h-5 text-brutalism-blue" />;
      case "CREDIT":
        return <CreditCard className="w-5 h-5 text-brutalism-blue" />;
      case "QRIS":
        return <QrCode className="w-5 h-5 text-purple-500" />;
      case "MIDTRANS":
        return <CreditCard className="w-5 h-5 text-brutalism-blue" />;
      default:
        return <CreditCard className="w-5 h-5 text-brutalism-blue" />;
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

  // Add function to check transaction status manually with better error handling
  const checkTransactionStatus = async (transId: string) => {
    try {
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        return null;
      }
      
      const response = await fetch(`/api/transactions/${transId}/status?storeId=${storeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Transaction status:', data);
        
        // Check if the transaction is expired
        if (data.status === 'EXPIRED') {
          setShowExpiredModal(true);
        }
        
        return data.status;
      } else {
        console.error('Error response from status API:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
      
      // If there's a network error, just close modals and show a generic error
      setShowMidtransModal(false);
      setShowPendingModal(false);
      
      // Show a generic error message
      setError('Network error. Please check your connection and try again.');
      
      return null;
    }
  };

  // Function to handle refreshing expired payments
  const handleRefreshPayment = async () => {
    setShowExpiredModal(false);
    setMidtransLoading(true);
    
    try {
      console.log("Refreshing payment for transaction:", transactionId);
      
      // Get a new Midtrans token
      const token = await getMidtransToken(transactionId);
      
      // Show the Midtrans modal again
      setShowMidtransModal(true);
      setTimeout(() => {
        openMidtransSnap();
      }, 500);
    } catch (error) {
      console.error("Error refreshing payment:", error);
      setError("Failed to refresh payment session. Please try again.");
      // Re-open expired modal if there was an error
      setShowExpiredModal(true);
    } finally {
      setMidtransLoading(false);
    }
  };

  // Function to get Midtrans token for an existing transaction
  const getMidtransToken = async (transId: string) => {
    try {
      setMidtransLoading(true);
      const response = await fetch(`/api/transactions/${transId}/midtrans-token`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Error: ${response.status} ${response.statusText}`;
        console.error("Error response from Midtrans token API:", errorData);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Successfully retrieved Midtrans token:", data);
      
      // Check if we got a valid token
      if (!data.token) {
        throw new Error("No valid payment token received");
      }
      
      setMidtransToken(data.token);
      setMidtransUrl(data.redirectUrl);
      return data.token;
    } catch (error) {
      console.error("Error getting Midtrans token:", error);
      setError(error instanceof Error ? error.message : "Failed to get payment token");
      throw error;
    } finally {
      setMidtransLoading(false);
    }
  };

  // Update the openMidtransSnap function to automatically refresh transaction data
  const openMidtransSnap = () => {
    if (!midtransToken) return;
    
    // Access the snap global variable from the Midtrans script
    // @ts-ignore - snap is loaded from external script
    if (window.snap) {
      try {
        // @ts-ignore
        window.snap.pay(midtransToken, {
          onSuccess: async function(result: any) {
            console.log('Midtrans payment success:', result);
            
            // Manually check and update transaction status
            if (transactionId) {
              await checkTransactionStatus(transactionId);
            }
            
            // Refresh transaction data to show updated status
            fetchTransactionDetail();
            
            setShowMidtransModal(false);
            setShowSuccessModal(true);
          },
          onPending: function(result: any) {
            console.log('Midtrans payment pending:', result);
            // Remain on the Midtrans modal
          },
          onError: function(result: any) {
            console.log('Midtrans payment error:', result);
            // Handle token expired error specifically
            if (result.status_code === '400' && 
                result.status_message && 
                (result.status_message.includes('token is expired') || 
                 result.status_message.includes('invalid token'))) {
              // Show expired modal
              setShowMidtransModal(false);
              setShowExpiredModal(true);
            } else {
              setError('Payment failed: ' + (result.status_message || 'Unknown error'));
            }
          },
          onClose: async function() {
            console.log('Customer closed the popup without finishing the payment');
            
            // Check status on close as well, as payment might be completed or pending
            if (transactionId) {
              const status = await checkTransactionStatus(transactionId);
              // Refresh transaction data in any case
              fetchTransactionDetail();
              
              if (status === 'COMPLETED') {
                // If completed, show success modal
                setShowMidtransModal(false);
                setShowSuccessModal(true);
              } else if (status === 'EXPIRED') {
                // If expired, the expired modal will be shown by checkTransactionStatus
                setShowMidtransModal(false);
              } else {
                // If pending or other status, show the pending modal
                setShowMidtransModal(false);
                setShowPendingModal(true);
              }
            } else {
              // If no transaction ID, just close the modal
              setShowMidtransModal(false);
            }
          }
        });
      } catch (err) {
        console.error('Error opening Midtrans Snap:', err);
        setError('Error opening payment window. Please try again.');
        setShowMidtransModal(false);
      }
    } else {
      console.error('Snap.js is not loaded correctly');
      setError('Payment gateway not loaded. Please try again.');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Midtrans Script */}
      <Script
        src={process.env.NODE_ENV === 'production' 
          ? "https://app.midtrans.com/snap/snap.js" 
          : "https://app.sandbox.midtrans.com/snap/snap.js"}
        data-client-key={midtransConfig.clientKey}
        strategy="afterInteractive"
      />

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
          {/* Add refresh button */}
          <button
            onClick={() => {
              fetchTransactionDetail();
            }}
            className="btn btn-outline"
            title="Refresh transaction details"
          >
            <RefreshCw size={16} className="mr-2" /> Refresh
          </button>
          
          {transaction?.status === "PENDING" && (
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
                      
                      // Check if this is a Midtrans transaction
                      if (transaction?.paymentMethod === 'MIDTRANS') {
                        try {
                          // Get Midtrans token
                          const token = await getMidtransToken(transactionId);
                          
                          // Show Midtrans modal
                          setShowMidtransModal(true);
                          setTimeout(() => {
                            openMidtransSnap();
                          }, 500);
                          
                          return; // Exit early - status will be updated by the payment callback
                        } catch (err) {
                          console.error("Error getting Midtrans token:", err);
                          alert("Failed to get Midtrans token. Please try again.");
                          return;
                        }
                      }
                      
                      // For non-Midtrans transactions, just update the status
                      const response = await fetch(`/api/transactions/${transactionId}/status`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                          status: "COMPLETED",
                          storeId: storeId
                        }),
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
                      // Get current store ID from localStorage
                      const storeId = localStorage.getItem('currentStoreId');
                      if (!storeId) {
                        console.error('No store selected');
                        return;
                      }
                      
                      const response = await fetch(`/api/transactions/${transactionId}/status`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                          status: "CANCELLED",
                          storeId: storeId
                        }),
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

            {/* Transaction details card */}
            <div className="brutalism-card mb-6">
              <div className="card-header flex justify-between items-center">
                <h2 className="font-bold">{t('transaction_details')}</h2>
                <div className={`status-badge ${getStatusBadgeClass(transaction.status)}`}>
                  {getStatusIcon(transaction.status)}
                  <span>{transaction.status}</span>
                </div>
              </div>
              <div className="card-content p-6">
                {/* Transaction info grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-brutalism-blue/10 flex items-center justify-center mr-3">
                        <Calendar className="w-5 h-5 text-brutalism-blue" />
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-500">{t('date')}</h3>
                        <p className="font-medium">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-brutalism-yellow/10 flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-brutalism-yellow" />
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-500">{t('cashier')}</h3>
                        <p className="font-medium">{transaction.cashierName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-brutalism-green/10 flex items-center justify-center mr-3">
                        {getPaymentMethodIcon(transaction.paymentMethod)}
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-500">{t('payment_method')}</h3>
                        <p className="font-medium">{getPaymentMethodLabel(transaction.paymentMethod)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <Package className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-500">{t('items')}</h3>
                        <p className="font-medium">{transaction.items.length} items</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-brutalism-blue/10 flex items-center justify-center mr-3">
                        <DollarSign className="w-5 h-5 text-brutalism-blue" />
                      </div>
                      <div>
                        <h3 className="text-sm text-gray-500">{t('total')}</h3>
                        <p className="font-medium font-mono">Rp {transaction.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {transaction.paymentMethod === 'CASH' && (
                      <>
                        <div className="flex items-start">
                          <div className="w-10 h-10 rounded-full bg-brutalism-green/10 flex items-center justify-center mr-3">
                            <DollarSign className="w-5 h-5 text-brutalism-green" />
                          </div>
                          <div>
                            <h3 className="text-sm text-gray-500">{t('amount_paid')}</h3>
                            <p className="font-medium font-mono">Rp {transaction.amountPaid.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="w-10 h-10 rounded-full bg-brutalism-yellow/10 flex items-center justify-center mr-3">
                            <DollarSign className="w-5 h-5 text-brutalism-yellow" />
                          </div>
                          <div>
                            <h3 className="text-sm text-gray-500">{t('change_amount')}</h3>
                            <p className="font-medium font-mono">Rp {transaction.changeAmount.toLocaleString()}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Payment action section for pending Midtrans transactions */}
                {transaction.status === 'PENDING' && transaction.paymentMethod === 'MIDTRANS' && (
                  <div className="mt-6 pt-4 border-t-2 border-gray-100">
                    <div className="bg-amber-50 border-2 border-amber-100 rounded-md p-4 mb-4">
                      <div className="flex items-start">
                        <Clock className="text-amber-500 mr-2 mt-1 flex-shrink-0" size={20} />
                        <div>
                          <h3 className="font-medium text-amber-800">{t('payment_waiting')}</h3>
                          <p className="text-sm text-amber-700">
                            {t('payment_waiting_message')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={async () => {
                        try {
                          // Get Midtrans token
                          const token = await getMidtransToken(transactionId);
                          
                          // Show Midtrans modal
                          setShowMidtransModal(true);
                          setTimeout(() => {
                            openMidtransSnap();
                          }, 500);
                        } catch (err) {
                          console.error("Error getting Midtrans token:", err);
                          alert("Failed to get payment token. Please try again.");
                        }
                      }}
                      className="w-full bg-gradient-to-r from-brutalism-blue to-blue-600 text-white py-3 px-4 rounded-md font-bold border-3 border-brutalism-black shadow-brutal-sm hover:shadow-brutal hover:-translate-y-1 transition-all flex items-center justify-center mt-4"
                    >
                      <CreditCard size={18} className="mr-2" /> {t('pay_now')}
                    </button>
                  </div>
                )}
              </div>
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

      {/* Midtrans Modal */}
      {showMidtransModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-4 border-brutalism-black rounded-md shadow-brutal-lg w-full max-w-md transform transition-all duration-300 animate-scaleIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-brutalism-blue to-blue-600 p-6 border-b-4 border-brutalism-black flex justify-between items-center rounded-t-sm">
              <h2 className="text-xl font-bold text-white flex items-center">
                <CreditCard className="mr-3" size={24} />
                QRIS Payment
              </h2>
              <button 
                onClick={() => {
                  setShowMidtransModal(false);
                }}
                className="p-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Transaction Info */}
              <div className="bg-gray-50 border-2 border-brutalism-black rounded-md p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">{t('transaction_id')}</span>
                  <span className="font-mono font-bold text-brutalism-blue">{transactionId?.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">{t('total_amount')}</span>
                  <span className="font-mono font-bold">
                    {transaction && `Rp ${transaction.totalAmount.toLocaleString()}`}
                  </span>
                </div>
              </div>
              
              {/* Payment Methods */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 border-3 border-brutalism-black shadow-brutal-sm">
                  <CreditCard size={42} className="text-brutalism-blue" />
                </div>
                <h3 className="text-lg font-bold mb-1">QRIS Payment</h3>
                <p className="text-gray-600 text-sm">
                  Scan kode QRIS dengan aplikasi e-wallet atau mobile banking Anda untuk menyelesaikan pembayaran.
                </p>
              </div>
              
              {/* Payment Buttons */}
              <div className="space-y-4">
                {midtransToken && (
                  <button 
                    onClick={openMidtransSnap}
                    className="w-full bg-gradient-to-r from-brutalism-green to-green-500 text-white py-3 px-4 rounded-md font-bold border-3 border-brutalism-black shadow-brutal-sm hover:shadow-brutal hover:-translate-y-1 transition-all flex items-center justify-center group"
                  >
                    <div className="bg-white/20 p-1.5 rounded-full mr-3 group-hover:bg-white/30 transition-colors">
                      <CreditCard size={18} className="text-white" />
                    </div>
                    <span>{t('pay_with_midtrans')}</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowMidtransModal(false);
                  }}
                  className="w-full py-3 px-4 rounded-md border-3 border-brutalism-black font-bold bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  <ArrowLeft className="mr-2" size={18} />
                  {t('back')}
                </button>
              </div>
              
              {/* Payment Method Icons */}
              <div className="mt-6 pt-4 border-t-2 border-gray-100">
                <p className="text-xs text-center text-gray-500 mb-3">Metode Pembayaran</p>
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-lg">
                    <img src="/images/qris-logo.png" alt="QRIS" className="h-12 w-auto" 
                      onError={(e) => {
                        // Safer error handling that checks if parentElement exists
                        if (e.currentTarget && e.currentTarget.parentElement) {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '';
                          e.currentTarget.parentElement.textContent = '📱';
                        }
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Pending Payment Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-brutalism-black rounded-md shadow-brutal-lg w-full max-w-md">
            <div className="p-4 border-b-4 border-brutalism-black flex justify-between items-center">
              <h2 className="text-xl font-bold text-yellow-600">{t('payment_pending')}</h2>
              <button 
                onClick={() => setShowPendingModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={36} className="text-yellow-600" />
                </div>
                <p className="mb-4 text-center">{t('payment_pending_message')}</p>
                <div className="border-2 border-brutalism-black rounded p-3 bg-gray-100 text-center mb-4">
                  <div className="text-sm text-gray-500 mb-1">{t('transaction_id')}</div>
                  <div className="font-mono font-bold">{transactionId}</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={async () => {
                      // Check the current status
                      if (transactionId) {
                        const status = await checkTransactionStatus(transactionId);
                        if (status === 'COMPLETED') {
                          setShowPendingModal(false);
                          setShowSuccessModal(true);
                        } else {
                          // Still pending or other status
                          alert(t('payment_pending_message'));
                        }
                      }
                    }}
                    className="btn btn-primary flex-1 flex items-center justify-center"
                  >
                    <RefreshCw size={16} className="mr-2" /> {t('check_payment_status')}
                  </button>
                  <button
                    onClick={() => {
                      setShowPendingModal(false);
                      // Only retry if we have a token
                      if (midtransToken) {
                        setShowMidtransModal(true);
                        setTimeout(() => {
                          openMidtransSnap();
                        }, 500);
                      }
                    }}
                    className="btn btn-outline flex-1 flex items-center justify-center"
                  >
                    <CreditCard size={16} className="mr-2" /> {t('try_again')}
                  </button>
                </div>
                <Link 
                  href={`/dashboard/transactions/${transactionId}`}
                  className="text-brutalism-blue text-sm text-center block mt-4 hover:underline"
                >
                  {t('view_details')} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-brutalism-black rounded-md shadow-brutal-lg w-full max-w-md">
            <div className="p-4 border-b-4 border-brutalism-black flex justify-between items-center">
              <h2 className="text-xl font-bold text-green-600">{t('payment_successful')}</h2>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={36} className="text-green-600" />
                </div>
                <p className="mb-4 text-center">{t('transaction_completed')}</p>
                <div className="border-2 border-brutalism-black rounded p-3 bg-gray-100 text-center mb-4">
                  <div className="text-sm text-gray-500 mb-1">{t('transaction_id')}</div>
                  <div className="font-mono font-bold">{transactionId}</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link 
                    href={`/dashboard/transactions/${transactionId}/invoice`}
                    className="btn btn-primary flex-1 flex items-center justify-center"
                  >
                    <FileText size={16} className="mr-2" /> {t('print_invoice')}
                  </Link>
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      fetchTransactionDetail(); // Refresh to get new status
                    }}
                    className="btn btn-outline flex-1 flex items-center justify-center"
                  >
                    <ShoppingCart size={16} className="mr-2" /> {t('back')}
                  </button>
                </div>
                <Link 
                  href={`/dashboard/transactions/${transactionId}`}
                  className="text-brutalism-blue text-sm text-center block mt-4 hover:underline"
                >
                  {t('view_details')} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Expired Modal */}
      {showExpiredModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-4 border-brutalism-black rounded-md shadow-brutal-lg w-full max-w-md transform transition-all duration-300 animate-scaleIn">
            <div className="p-4 border-b-4 border-brutalism-black flex justify-between items-center bg-red-100">
              <h2 className="text-xl font-bold text-red-600">{t('payment_expired')}</h2>
              <button 
                onClick={() => setShowExpiredModal(false)}
                className="p-1 hover:bg-red-200 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={36} className="text-red-600" />
                </div>
                <p className="mb-4 text-center">{t('transaction_expired_message')}</p>
                <div className="border-2 border-brutalism-black rounded p-3 bg-gray-100 text-center mb-4">
                  <div className="text-sm text-gray-500 mb-1">{t('transaction_id')}</div>
                  <div className="font-mono font-bold">{transactionId}</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleRefreshPayment}
                    disabled={midtransLoading}
                    className="btn btn-primary flex-1 flex items-center justify-center"
                  >
                    {midtransLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {t('loading')}...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} className="mr-2" /> {t('create_new_session')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowExpiredModal(false)}
                    className="btn btn-outline flex-1 flex items-center justify-center"
                  >
                    <ArrowLeft size={16} className="mr-2" /> {t('back')}
                  </button>
                </div>
                {error && (
                  <div className="mt-4 p-2 bg-red-100 border-2 border-red-600 text-red-600 rounded text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 