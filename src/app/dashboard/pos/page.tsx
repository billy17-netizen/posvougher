"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from "next/link";
import { ShoppingCart, X, Plus, Minus, CreditCard, Banknote, Search, Filter, Check, Tag, ImageIcon, FileText, DollarSign, Receipt, ArrowLeft, QrCode, Clock, RefreshCw } from "lucide-react";
import Pagination from "@/components/Pagination";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSettings } from "@/contexts/SettingsContext";
import { id as localeId } from "date-fns/locale/id";
import { enUS } from "date-fns/locale/en-US";
import { useStore } from '@/contexts/StoreContext';
import { useLoading } from '@/contexts/LoadingContext';
import QuickUserSwitch from '@/components/QuickUserSwitch';
import { midtransConfig } from '@/lib/config/midtrans';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: {
    id: string;
    name: string;
  };
  image?: string;
}

interface Category {
  id: string;
  name: string;
  productCount: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface TransactionData {
  items: {
    productId: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  paymentMethod: 'CASH' | 'MIDTRANS';
  cashierUserId?: string;
  storeId: string;
}

export default function POSPage() {
  const settings = useSettings();
  
  // Translation function
  const t = (key: string) => {
    const lang = settings.language;
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'point_of_sale': 'Point of Sale',
        'process_transactions': 'Proses transaksi dan kelola penjualan',
        'loading_pos': 'Memuat sistem POS...',
        'products': 'Produk',
        'items': 'Item',
        'search_products': 'Cari produk...',
        'all_categories': 'Semua Kategori',
        'no_products_match': 'Tidak ada produk yang cocok dengan kriteria pencarian Anda',
        'in_stock': 'dalam stok',
        'out_of_stock': 'Stok habis',
        'shopping_cart': 'Keranjang Belanja',
        'cart_empty': 'Keranjang Anda kosong',
        'add_products': 'Tambahkan produk dengan mengklik dari daftar produk',
        'subtotal': 'Subtotal',
        'tax': 'Pajak',
        'total': 'Total',
        'process_payment': 'Proses Pembayaran',
        'payment': 'Pembayaran',
        'payment_method': 'Metode Pembayaran',
        'cash': 'Tunai',
        'midtrans': 'Transfer Bank Virtual Account',
        'debit': 'Kartu Debit',
        'credit': 'Kartu Kredit',
        'amount_paid': 'Jumlah Dibayar',
        'enter_amount': 'Masukkan jumlah',
        'change': 'Kembalian',
        'complete_payment': 'Selesaikan Pembayaran',
        'processing': 'Memproses...',
        'payment_successful': 'Pembayaran Berhasil!',
        'transaction_completed': 'Transaksi telah berhasil diselesaikan',
        'transaction_id': 'ID Transaksi',
        'print_receipt': 'Cetak Struk',
        'new_transaction': 'Transaksi Baru',
        'view_details': 'Lihat Detail',
        'total_amount': 'Jumlah Total',
        'cart_empty_error': 'Keranjang kosong',
        'payment_amount_error': 'Jumlah pembayaran harus sama dengan atau lebih besar dari total',
        'no_image': 'Tidak ada gambar',
        'image_error': 'Kesalahan gambar',
        'pay_with_midtrans': 'Bayar dengan Virtual Account',
        'pay_with_cash': 'Bayar dengan Tunai',
        'open_payment_page': 'Buka Halaman Pembayaran',
        'payment_pending': 'Pembayaran Tertunda',
        'payment_pending_message': 'Pembayaran Anda dalam status tertunda. Silakan periksa status transaksi nanti.',
        'check_payment_status': 'Periksa Status Pembayaran',
        'try_again': 'Coba Lagi'
      },
      'en': {
        'point_of_sale': 'Point of Sale',
        'process_transactions': 'Process transactions and manage sales',
        'loading_pos': 'Loading POS system...',
        'products': 'Products',
        'items': 'Items',
        'search_products': 'Search products...',
        'all_categories': 'All Categories',
        'no_products_match': 'No products match your search criteria',
        'in_stock': 'in stock',
        'out_of_stock': 'Out of stock',
        'shopping_cart': 'Shopping Cart',
        'cart_empty': 'Your cart is empty',
        'add_products': 'Add products by clicking on them from the product list',
        'subtotal': 'Subtotal',
        'tax': 'Tax',
        'total': 'Total',
        'process_payment': 'Process Payment',
        'payment': 'Payment',
        'payment_method': 'Payment Method',
        'cash': 'Cash',
        'midtrans': 'Bank Virtual Account',
        'debit': 'Debit Card',
        'credit': 'Credit Card',
        'amount_paid': 'Amount Paid',
        'enter_amount': 'Enter amount',
        'change': 'Change',
        'complete_payment': 'Complete Payment',
        'processing': 'Processing...',
        'payment_successful': 'Payment Successful!',
        'transaction_completed': 'The transaction has been successfully completed',
        'transaction_id': 'Transaction ID',
        'print_receipt': 'Print Receipt',
        'new_transaction': 'New Transaction',
        'view_details': 'View Details',
        'total_amount': 'Total Amount',
        'cart_empty_error': 'Cart is empty',
        'payment_amount_error': 'Payment amount must be equal to or greater than the total',
        'no_image': 'No image',
        'image_error': 'Image error',
        'pay_with_midtrans': 'Pay with Virtual Account',
        'pay_with_cash': 'Pay with Cash',
        'open_payment_page': 'Open Payment Page',
        'payment_pending': 'Payment Pending',
        'payment_pending_message': 'Your payment is in pending status. Please check transaction status later.',
        'check_payment_status': 'Check Payment Status',
        'try_again': 'Try Again'
      }
    };
    
    return (translations[lang] && translations[lang][key]) || key;
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MIDTRANS">("CASH");
  const [amountPaid, setAmountPaid] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  // Add tax rate state
  const [taxRate, setTaxRate] = useState<number>(11); // Default to 11% if settings not loaded
  
  // Add filtered products state
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Add state for Midtrans
  const [midtransToken, setMidtransToken] = useState<string | null>(null);
  const [midtransUrl, setMidtransUrl] = useState<string | null>(null);
  const [showMidtransModal, setShowMidtransModal] = useState(false);
  // Add state for transaction total amount
  const [transactionTotal, setTransactionTotal] = useState<number>(0);
  // Add state for pending payment modal
  const [showPendingModal, setShowPendingModal] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
  const perPageParam = searchParams.get('perPage');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12); // Show more items by default for POS
  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setCurrentPage(pageParam ? parseInt(pageParam) : 1);
    setItemsPerPage(perPageParam ? parseInt(perPageParam) : 12);
    
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories and products in parallel
        const [categoriesResponse, productsResponse, settingsResponse] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
          fetch('/api/settings')
        ]);
        
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const categoriesData = await categoriesResponse.json();
        const productsData = await productsResponse.json();
        
        setCategories(categoriesData.categories);
        setProducts(productsData.products);
        setFilteredProducts(productsData.products);
        
        // Process settings response if successful
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          
          // Find the tax rate setting
          const taxRateSetting = settingsData.settings.find(
            (setting: { key: string }) => setting.key === 'taxRate'
          );
          
          // Update tax rate if found
          if (taxRateSetting) {
            const parsedTaxRate = parseFloat(taxRateSetting.value);
            if (!isNaN(parsedTaxRate)) {
              setTaxRate(parsedTaxRate);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load products and categories');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  // Update filtered products when search or category changes
  useEffect(() => {
    const filtered = products.filter(product => {
      const matchesCategory = selectedCategory ? product.category.id === selectedCategory : true;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    
    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchTerm]);

  // Apply pagination to filtered products
  useEffect(() => {
    // Calculate total pages
    const total = Math.ceil(filteredProducts.length / itemsPerPage);
    setTotalPages(total);
    
    // Ensure current page is valid
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
      return;
    }
    
    // Get products for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedProducts(filteredProducts.slice(startIndex, endIndex));
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlWithPagination(page, itemsPerPage);
  };

  const handleItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    updateUrlWithPagination(1, perPage);
  };

  const updateUrlWithPagination = (page: number, perPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    params.set('perPage', perPage.toString());
    
    if (selectedCategory) {
      params.set('category', selectedCategory);
    }
    
    router.push(`/dashboard/pos?${params.toString()}`);
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      // Ensure price is treated as a number
      const productPrice = typeof product.price === 'number' ? product.price : 0;
      
      // Check if product is already in cart
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Update quantity if already in cart
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, 
                quantity: item.quantity + 1, 
                subtotal: (item.quantity + 1) * productPrice 
              } 
            : item
        );
      } else {
        // Add new item to cart
        return [...prevCart, {
          product,
          quantity: 1,
          subtotal: productPrice
        }];
      }
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Check stock availability
    if (newQuantity > product.stock) {
      setError(`Only ${product.stock} items available in stock`);
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Ensure price is treated as a number
    const productPrice = typeof product.price === 'number' ? product.price : 0;
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { ...item, 
              quantity: newQuantity, 
              subtotal: newQuantity * productPrice 
            } 
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      // Ensure subtotal is treated as a number
      const itemSubtotal = typeof item.subtotal === 'number' ? item.subtotal : 0;
      return total + itemSubtotal;
    }, 0);
  };
  
  const calculateTaxAmount = () => {
    const subtotal = calculateSubtotal();
    // Ensure tax rate is a number and calculation doesn't result in NaN
    const rate = typeof taxRate === 'number' ? taxRate : 0;
    return Math.round(subtotal * (rate / 100));
  };
  
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTaxAmount();
    return subtotal + tax;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError(t('cart_empty_error'));
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);
      
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        setError('No store selected');
        setProcessing(false);
        return;
      }
      
      // Calculate total - ensure it's a valid number
      const total = calculateTotal();
      if (isNaN(total) || total <= 0) {
        setError('Invalid total amount');
        setProcessing(false);
        return;
      }
      
      // Ensure cart is not empty
      if (cart.length === 0) {
        setError(t('cart_empty_error'));
        setProcessing(false);
        return;
      }
      
      // Store the transaction total for display in modals
      setTransactionTotal(total);
      
      // Handle based on payment method
      if (paymentMethod === 'CASH') {
        // Validate payment amount for cash transactions
        const paid = parseFloat(amountPaid);
        if (isNaN(paid) || paid < total) {
          setError(t('payment_amount_error'));
          setProcessing(false);
          return;
        }
        
        // Ensure paid amount is a valid number
        if (isNaN(paid)) {
          setError("Invalid payment amount");
          setProcessing(false);
          return;
        }
        
        // Calculate change
        const change = Math.max(0, paid - total);
        
        // Prepare transaction data
        const transactionData: TransactionData = {
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: typeof item.product.price === 'number' ? item.product.price : 0,
            subtotal: typeof item.subtotal === 'number' ? item.subtotal : 0
          })),
          subtotal: calculateSubtotal(),
          taxRate: taxRate,
          taxAmount: calculateTaxAmount(),
          totalAmount: total,
          amountPaid: paid,
          changeAmount: change,
          paymentMethod: 'CASH',
          storeId: storeId
        };
        
        // Get current user from localStorage if available
        try {
          const userStr = localStorage.getItem('currentUser');
          if (userStr) {
            const userData = JSON.parse(userStr);
            if (userData.id) {
              transactionData.cashierUserId = userData.id;
            }
          }
        } catch (err) {
          console.error("Error reading user data:", err);
        }
        
        console.log("Sending transaction data:", transactionData);
        
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transactionData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage;
          
          try {
            // Try to parse as JSON
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || 'Transaction failed';
          } catch (e) {
            // If it's not valid JSON, use the text directly
            errorMessage = `Transaction failed: ${errorText.substring(0, 100)}`;
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Store transaction ID
        setTransactionId(data.transactionId);
        
        // For cash payments, immediately mark the transaction as COMPLETED
        if (data.transactionId) {
          await updateTransactionStatus(data.transactionId, 'COMPLETED');
        }
        
        // Close payment modal and show success modal
        setShowPaymentModal(false);
        setShowSuccessModal(true);
        
        // Clear cart and payment info
        setCart([]);
        setAmountPaid("");
      } else if (paymentMethod === 'MIDTRANS') {
        // Prepare data for Midtrans
        let customerName = 'Customer';
        let customerEmail = '';
        let customerPhone = '';
        
        // Get customer data from localStorage if available
        try {
          const userStr = localStorage.getItem('currentUser');
          if (userStr) {
            const userData = JSON.parse(userStr);
            customerName = userData.name || 'Customer';
            // Only use email if it's in a valid format
            if (userData.email && userData.email.includes('@')) {
              customerEmail = userData.email;
            }
            if (userData.phone) {
              customerPhone = userData.phone;
            }
          }
        } catch (err) {
          console.error("Error reading user data:", err);
        }
        
        // Prepare Midtrans transaction data
        const midtransData: {
          items: any[];
          totalAmount: number;
          customerName: string;
          customerEmail: string;
          customerPhone: string;
          storeId: string;
          cashierUserId?: string;
        } = {
          items: cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: typeof item.product.price === 'number' ? item.product.price : 0,
            subtotal: typeof item.subtotal === 'number' ? item.subtotal : 0
          })),
          totalAmount: total,
          customerName,
          customerEmail,
          customerPhone,
          storeId: storeId
        };
        
        // Add extensive debugging logs
        console.log("DEBUG - Cart items:", cart);
        console.log("DEBUG - Calculated subtotal:", calculateSubtotal());
        console.log("DEBUG - Calculated tax amount:", calculateTaxAmount());
        console.log("DEBUG - Calculated total:", total);
        console.log("DEBUG - Sending Midtrans data with total:", midtransData.totalAmount);
        
        // Get current user ID from localStorage if available
        try {
          const userStr = localStorage.getItem('currentUser');
          if (userStr) {
            const userData = JSON.parse(userStr);
            if (userData.id) {
              midtransData.cashierUserId = userData.id;
            }
          }
        } catch (err) {
          console.error("Error reading user data:", err);
        }
        
        console.log("Sending Midtrans data:", midtransData);
        
        // Call the Midtrans API endpoint
        const response = await fetch('/api/transactions/midtrans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(midtransData)
        });
        
        if (!response.ok) {
          let errorMessage = 'Midtrans transaction failed';
          
          try {
            // Try to get detailed error information
            const errorData = await response.json();
            console.error('Midtrans API error:', errorData);
            
            if (errorData.error) {
              // Extract and sanitize error message
              if (errorData.error.includes('Metode pembayaran QRIS tidak tersedia')) {
                // Specific error for QRIS not available
                errorMessage = 'Metode pembayaran QRIS tidak tersedia. Pastikan QRIS sudah diaktifkan di akun Midtrans Anda.';
              } else if (errorData.error.includes('Transaction amount') && (
                errorData.error.includes('below the minimum') || 
                errorData.error.includes('exceeds the maximum')
              )) {
                // Error for amount limits
                errorMessage = errorData.error;
              } else if (errorData.error.includes('transaction_details.gross_amount')) {
                errorMessage = 'Tax calculation error. Please try again.';
              } else {
                errorMessage = errorData.error;
              }
            }
          } catch (e) {
            // If parsing fails, use response text but limit length
            const errorText = await response.text();
            errorMessage = `Midtrans transaction failed: ${errorText.substring(0, 100)}`;
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Store transaction ID
        setTransactionId(data.transactionId);
        
        // Store Midtrans token and URL
        setMidtransToken(data.token);
        setMidtransUrl(data.redirectUrl);
        
        // Close payment modal and show Midtrans modal
        setShowPaymentModal(false);
        setShowMidtransModal(true);
        
        // Clear cart
        setCart([]);
      }
      
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const calculateChange = () => {
    const paid = parseFloat(amountPaid);
    if (isNaN(paid)) return 0;
    return Math.max(0, paid - calculateTotal());
  };

  // Add a function to update transaction status directly
  const updateTransactionStatus = async (transId: string, status: 'COMPLETED' | 'CANCELLED' | 'EXPIRED') => {
    try {
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        return false;
      }
      
      console.log(`Updating transaction ${transId} status to ${status}`);
      
      const response = await fetch(`/api/transactions/${transId}/status?storeId=${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status
        })
      });
      
      const data = await response.json();
      console.log('Status update response:', data);
      
      return response.ok;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return false;
    }
  };

  // Function to open Midtrans Snap popup
  const openMidtransSnap = () => {
    if (!midtransToken) return;
    
    // Make sure the transaction total is valid
    if (isNaN(transactionTotal) || transactionTotal <= 0) {
      // Set transaction total using the current calculated total
      setTransactionTotal(calculateTotal());
    }
    
    // Access the snap global variable from the Midtrans script
    // @ts-ignore - snap is loaded from external script
    if (window.snap) {
      // @ts-ignore
      window.snap.pay(midtransToken, {
        onSuccess: async function(result: any) {
          console.log('Midtrans payment success:', result);
          
          // Update transaction status to COMPLETED
          if (transactionId) {
            await updateTransactionStatus(transactionId, 'COMPLETED');
          }
          
          setShowMidtransModal(false);
          setShowSuccessModal(true);
        },
        onPending: function(result: any) {
          console.log('Midtrans payment pending:', result);
          // For pending status, we'll handle in onClose
        },
        onError: function(result: any) {
          console.log('Midtrans payment error:', result);
          setError('Payment failed: ' + (result.status_message || 'Unknown error'));
        },
        onClose: async function() {
          console.log('Customer closed the popup without finishing the payment');
          
          // Since we removed Midtrans integration, let's just mark the transaction as COMPLETED
          if (transactionId) {
            const success = await updateTransactionStatus(transactionId, 'COMPLETED');
            
            if (success) {
              // Show success modal
              setShowMidtransModal(false);
              setShowSuccessModal(true);
            } else {
              // Show pending modal in case of error
              setShowMidtransModal(false);
              setShowPendingModal(true);
            }
          } else {
            // If no transaction ID, just close the modal
            setShowMidtransModal(false);
          }
        }
      });
    } else {
      console.error('Snap.js is not loaded correctly');
      setError('Payment gateway not loaded. Please try again.');
    }
  };

  // Add function to check transaction status manually
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
        return data.status;
      } else {
        console.error('Error response from status API:', response.status, response.statusText);
        // For error 500, default to pending state to avoid breaking the flow
        return 'PENDING';
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
      // Return pending for any errors to avoid breaking the flow
      return 'PENDING';
    }
  };

  // Add this function to ensure we have valid transaction total for display
  const getDisplayTotal = () => {
    // If transactionTotal is not valid, try to calculate it
    if (isNaN(transactionTotal) || transactionTotal <= 0) {
      // Use direct calculation if cart items exist
      if (cart.length > 0) {
        const calculatedTotal = calculateTotal();
        return calculatedTotal;
      }
      return 0; // Fallback if no cart items
    }
    return transactionTotal; // Use stored transaction total
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="text-2xl font-bold">{t('point_of_sale')}</h1>
        </div>
        <div className="dashboard-content">
          <div className="brutalism-card p-8 text-center">
            <div className="w-16 h-16 border-4 border-brutalism-black border-t-brutalism-blue rounded-full animate-spin mb-4 mx-auto"></div>
            <p className="font-medium">{t('loading_pos')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <QuickUserSwitch />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <CreditCard className="mr-2 text-brutalism-blue" />
              {t('point_of_sale')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{t('process_transactions')}</p>
          </div>
        </div>

        {error && (
          <div className="error-alert mb-4 flex items-center">
            <X size={18} className="mr-2" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Product Selection */}
          <div className="md:col-span-2">
            <div className="brutalism-card">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingCart className="mr-2" /> {t('products')}
                </div>
                <span className="text-sm bg-brutalism-yellow/20 py-1 px-3 border-2 border-black font-medium">
                  {filteredProducts.length} {t('items')}
                </span>
              </div>
              <div className="card-content p-4">
                {/* Search and Filter */}
                <div className="mb-6 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder={t('search_products')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full py-2 px-4 pl-10 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal-md focus:translate-y-[-2px] transition-all"
                    />
                  </div>
                  
                  <select
                    className="py-2 px-3 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal-md focus:translate-y-[-2px] transition-all sm:w-40"
                    value={selectedCategory || ""}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                  >
                    <option value="">{t('all_categories')}</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.productCount})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {paginatedProducts.length > 0 ? (
                    paginatedProducts.map(product => (
                      <div 
                        key={product.id} 
                        className={`border-3 border-brutalism-black bg-white p-3 rounded-md shadow-brutal-xs hover:shadow-brutal-sm hover:-translate-y-1 transition-all cursor-pointer ${product.stock === 0 ? 'opacity-60' : ''}`}
                        onClick={() => product.stock > 0 && addToCart(product)}
                      >
                        {/* Product Image */}
                        <div className="aspect-square w-full overflow-hidden border-2 border-brutalism-black mb-3 relative bg-gray-100 flex items-center justify-center">
                          {product.image && product.image.startsWith("http") ? (
                            <Image 
                              src={product.image} 
                              alt={product.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 200px"
                              className="object-cover"
                              priority={false}
                              onError={(e) => {
                                // When image fails to load, replace with fallback icon
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.classList.add('img-fallback');
                                  parent.innerHTML = `<div class="flex flex-col items-center justify-center h-full w-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 mb-1"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                                    <span class="text-xs text-gray-400">${t('image_error')}</span>
                                  </div>`;
                                }
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-4 h-full w-full">
                              <ImageIcon size={36} className="text-gray-400 mb-1" />
                              <span className="text-xs text-gray-400">{t('no_image')}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Category Badge */}
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2 py-1 bg-brutalism-yellow/20 text-xs font-medium border-2 border-brutalism-black rounded-sm">
                            <Tag size={12} className="mr-1" />
                            {product.category.name}
                          </span>
                        </div>
                        
                        {/* Product Details */}
                        <div className="font-bold mb-1 truncate">{product.name}</div>
                        <div className="font-mono mt-1 text-lg text-brutalism-blue font-bold">Rp {product.price.toLocaleString()}</div>
                        <div className={`text-sm mt-1 flex items-center ${
                          product.stock > 10 
                            ? 'text-green-600' 
                            : product.stock > 0 
                              ? 'text-yellow-600' 
                              : 'text-red-600'
                        }`}>
                          <span className="w-2 h-2 rounded-full mr-1 bg-current"></span>
                          {product.stock > 0 ? `${product.stock} ${t('in_stock')}` : t('out_of_stock')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 p-8 text-center">
                      <p className="text-gray-500">{t('no_products_match')}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center mt-4">
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredProducts.length}
                    setItemsPerPage={handleItemsPerPageChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Cart */}
          <div className="md:col-span-1">
            <div className="brutalism-card sticky top-4">
              <div className="card-header flex items-center">
                <ShoppingCart className="mr-2" /> {t('shopping_cart')}
              </div>
              <div className="card-content p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ShoppingCart className="text-gray-400" size={24} />
                    </div>
                    <p className="text-gray-500 mb-4">{t('cart_empty')}</p>
                    <p className="text-sm text-gray-400">{t('add_products')}</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 max-h-96 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.product.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                          <div className="flex-1">
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-sm text-gray-500">Rp {item.product.price.toLocaleString()} x {item.quantity}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-full"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-full"
                            >
                              <Plus size={14} />
                            </button>
                            <button 
                              onClick={() => removeFromCart(item.product.id)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t-3 border-brutalism-black pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{t('subtotal')}:</span>
                          <span className="font-mono">Rp {calculateSubtotal().toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{t('tax')} ({taxRate}%):</span>
                          <span className="font-mono">Rp {calculateTaxAmount().toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold mt-2">
                          <span>{t('total')}:</span>
                          <span className="font-mono">Rp {calculateTotal().toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleCheckout}
                        className="w-full bg-brutalism-blue text-white py-3 rounded-md font-bold border-3 border-brutalism-black shadow-brutal-sm hover:shadow-brutal hover:-translate-y-1 transition-all mt-4"
                      >
                        <CreditCard className="inline-block mr-2" size={18} />
                        {t('process_payment')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white border-4 border-brutalism-black rounded-md shadow-brutal-lg w-full max-w-md">
              <div className="p-4 border-b-4 border-brutalism-black flex justify-between items-center">
                <h2 className="text-xl font-bold">{t('payment')}</h2>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <div className="font-bold mb-2">{t('total_amount')}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{t('subtotal')}:</span>
                      <span className="font-mono">Rp {calculateSubtotal().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t('tax')} ({taxRate}%):</span>
                      <span className="font-mono">Rp {calculateTaxAmount().toLocaleString()}</span>
                    </div>
                    <div className="text-xl font-bold font-mono flex justify-between border-t pt-2 mt-1">
                      <span>{t('total')}:</span>
                      <span>Rp {calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="font-bold mb-2">{t('payment_method')}</div>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-3 border-2 border-brutalism-black rounded-md flex items-center justify-center gap-2
                        ${paymentMethod === 'CASH' 
                          ? 'bg-brutalism-yellow font-bold' 
                          : 'bg-white hover:bg-gray-50'}`}
                    >
                      <Banknote size={18} /> {t('cash')}
                    </button>
                    
                    <button 
                      onClick={() => setPaymentMethod('MIDTRANS')}
                      className={`p-3 border-2 border-brutalism-black rounded-md flex items-center justify-center gap-2
                        ${paymentMethod === 'MIDTRANS' 
                          ? 'bg-brutalism-blue text-white font-bold' 
                          : 'bg-white hover:bg-gray-50'}`}
                    >
                      <CreditCard size={18} /> {t('midtrans')}
                    </button>
                  </div>
                </div>
                
                {/* Amount Paid Input Field - Show only for CASH */}
                {paymentMethod === 'CASH' && (
                  <div className="mb-4">
                    <div className="font-bold mb-2">{t('amount_paid')}</div>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder={t('enter_amount')}
                      className="w-full p-3 border-2 border-brutalism-black focus:outline-none focus:ring-2 focus:ring-brutalism-blue"
                    />
                    {parseFloat(amountPaid) > calculateTotal() && (
                      <div className="mt-2">
                        <div className="flex justify-between text-sm">
                          <span>{t('change')}:</span>
                          <span className="font-mono">Rp {calculateChange().toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <button
                  onClick={handlePayment}
                  disabled={processing || (paymentMethod === 'CASH' && (parseFloat(amountPaid) < calculateTotal() || isNaN(parseFloat(amountPaid))))}
                  className={`w-full py-3 px-4 rounded-md border-3 border-brutalism-black font-bold mt-4 
                    ${processing ? 'bg-gray-300 cursor-not-allowed' : 'bg-brutalism-green text-white shadow-brutal-sm hover:shadow-brutal hover:-translate-y-1 transition-all'}
                    ${paymentMethod === 'CASH' && (parseFloat(amountPaid) < calculateTotal() || isNaN(parseFloat(amountPaid))) ? 'bg-gray-300 cursor-not-allowed' : ''}
                  `}
                >
                  {processing ? t('processing') : paymentMethod === 'CASH' ? t('complete_payment') : t('pay_with_midtrans')}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Midtrans Modal */}
        {showMidtransModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white border-4 border-brutalism-black rounded-md shadow-brutal-lg w-full max-w-md transform transition-all duration-300 animate-scaleIn">
              {/* Header */}
              <div className="bg-gradient-to-r from-brutalism-blue to-blue-600 p-6 border-b-4 border-brutalism-black flex justify-between items-center rounded-t-sm">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <CreditCard className="mr-3" size={24} />
                  {t('midtrans')}
                </h2>
                <button 
                  onClick={() => {
                    setShowMidtransModal(false);
                    setShowSuccessModal(true);
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
                    <span className="font-mono font-bold">Rp {getDisplayTotal().toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Payment Methods */}
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 border-3 border-brutalism-black shadow-brutal-sm">
                    <CreditCard size={42} className="text-brutalism-blue" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Transfer Bank Virtual Account</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    Pembayaran melalui transfer bank virtual account BCA, BNI, BRI, dan Permata Bank.
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
                      setShowSuccessModal(true);
                    }}
                    className="w-full py-3 px-4 rounded-md border-3 border-brutalism-black font-bold bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center"
                  >
                    <ArrowLeft className="mr-2" size={18} />
                    {t('new_transaction')}
                  </button>
                </div>
                
                {/* Payment Method Icons */}
                <div className="mt-6 pt-4 border-t-2 border-gray-100">
                  <p className="text-xs text-center text-gray-500 mb-3">Bank Virtual Account yang Didukung</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {/* Bank Logos */}
                    <div className="w-16 h-12 bg-white shadow rounded flex items-center justify-center text-lg border border-gray-200 font-bold text-xs">BCA</div>
                    <div className="w-16 h-12 bg-white shadow rounded flex items-center justify-center text-lg border border-gray-200 font-bold text-xs">BNI</div>
                    <div className="w-16 h-12 bg-white shadow rounded flex items-center justify-center text-lg border border-gray-200 font-bold text-xs">BRI</div>
                  </div>
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
                      <FileText size={16} className="mr-2" /> {t('print_receipt')}
                    </Link>
                    <button
                      onClick={() => setShowSuccessModal(false)}
                      className="btn btn-outline flex-1 flex items-center justify-center"
                    >
                      <ShoppingCart size={16} className="mr-2" /> {t('new_transaction')}
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
                        // Complete the transaction and update product quantities
                        if (transactionId) {
                          const success = await updateTransactionStatus(transactionId, 'COMPLETED');
                          
                          if (success) {
                            // Show success modal
                            setShowPendingModal(false);
                            setShowSuccessModal(true);
                          } else {
                            // Show error
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
      </div>
    </div>
  );
}