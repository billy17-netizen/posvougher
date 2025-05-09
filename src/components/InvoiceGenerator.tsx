'use client';

import React, { useRef } from 'react';
import { formatRupiah } from '@/lib/utils/format';
import { format } from 'date-fns';
import { useSettings } from '@/contexts/SettingsContext';
import { PrinterIcon } from 'lucide-react';

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
  paymentMethod: "CASH" | "DEBIT" | "CREDIT" | "QRIS";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  cashierName: string;
  items: TransactionItem[];
}

interface InvoiceGeneratorProps {
  transaction: Transaction;
  buttonText?: string;
  className?: string;
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ 
  transaction, 
  buttonText = "Generate Invoice", 
  className = "btn btn-secondary"
}) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const settings = useSettings();
  
  // Translation function
  const t = (key: string) => {
    const lang = settings.language;
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'invoice': 'Faktur',
        'transaction_id': 'ID Transaksi',
        'date': 'Tanggal',
        'cashier': 'Kasir',
        'payment_method': 'Metode Pembayaran',
        'status': 'Status',
        'item': 'Item',
        'price': 'Harga',
        'qty': 'Jml',
        'subtotal': 'Subtotal',
        'total': 'Total',
        'thank_you': 'Terima kasih telah berbelanja di POS Vougher!',
        'cash': 'Tunai',
        'debit': 'Kartu Debit',
        'credit': 'Kartu Kredit',
        'qris': 'QRIS',
        'pending': 'Tertunda',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan',
        'receipt': 'Tanda Terima',
        'print_invoice': 'Cetak Faktur',
        'generate_invoice': 'Buat Faktur'
      },
      'en': {
        'invoice': 'Invoice',
        'transaction_id': 'Transaction ID',
        'date': 'Date',
        'cashier': 'Cashier',
        'payment_method': 'Payment Method',
        'status': 'Status',
        'item': 'Item',
        'price': 'Price',
        'qty': 'Qty',
        'subtotal': 'Subtotal',
        'total': 'Total',
        'thank_you': 'Thank you for shopping with POS Vougher!',
        'cash': 'Cash',
        'debit': 'Debit Card',
        'credit': 'Credit Card',
        'qris': 'QRIS',
        'pending': 'Pending',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'receipt': 'Receipt',
        'print_invoice': 'Print Invoice',
        'generate_invoice': 'Generate Invoice'
      }
    };
    
    return (translations[lang] && translations[lang][key]) || key;
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH":
        return t('cash');
      case "DEBIT":
        return t('debit');
      case "CREDIT":
        return t('credit');
      case "QRIS":
        return t('qris');
      default:
        return method;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return t('completed');
      case "PENDING":
        return t('pending');
      case "CANCELLED":
        return t('cancelled');
      default:
        return status;
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

  const handlePrint = () => {
    // Create a new window for printing only the invoice
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Please allow popups for this website to print invoices');
      return;
    }
    
    // Write the invoice content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice-${transaction.id.slice(0, 8)}</title>
          <style>
            body { 
              font-family: Arial, sans-serif;
              width: 80mm;
              margin: 0 auto;
              padding: 10mm;
            }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; }
            th { border-bottom: 1px solid #ddd; }
            .text-right { text-align: right; }
            .header { text-align: center; margin-bottom: 20px; }
            .info { margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; }
            .total-row { font-weight: bold; border-top: 1px solid #000; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>POS Vougher</h1>
            <p>${t('receipt')}</p>
          </div>
          <div class="info">
            <div class="info-row">
              <span>${t('transaction_id')}:</span>
              <span>${transaction.id.slice(0, 8)}</span>
            </div>
            <div class="info-row">
              <span>${t('date')}:</span>
              <span>${formatDate(transaction.createdAt)}</span>
            </div>
            <div class="info-row">
              <span>${t('cashier')}:</span>
              <span>${transaction.cashierName}</span>
            </div>
            <div class="info-row">
              <span>${t('payment_method')}:</span>
              <span>${getPaymentMethodLabel(transaction.paymentMethod)}</span>
            </div>
            <div class="info-row">
              <span>${t('status')}:</span>
              <span>${getStatusLabel(transaction.status)}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>${t('item')}</th>
                <th class="text-right">${t('price')}</th>
                <th class="text-right">${t('qty')}</th>
                <th class="text-right">${t('subtotal')}</th>
              </tr>
            </thead>
            <tbody>
              ${transaction.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td class="text-right">${formatRupiah(item.price)}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${formatRupiah(item.subtotal)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3" class="text-right">${t('total')}:</td>
                <td class="text-right">${formatRupiah(transaction.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>${t('thank_you')}</p>
          </div>
        </body>
      </html>
    `);
    
    // Add a small delay to ensure content is fully loaded
    setTimeout(() => {
      printWindow.print();
      // Close the print window after printing is done or canceled
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    }, 300);
  };

  return (
    <button 
      onClick={handlePrint} 
      className={className}
    >
      <PrinterIcon size={16} className="mr-2" />
      {buttonText || t('generate_invoice')}
    </button>
  );
};

export default InvoiceGenerator; 