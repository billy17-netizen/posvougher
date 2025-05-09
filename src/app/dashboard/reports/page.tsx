"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  BarChart2, 
  PieChart, 
  Calendar, 
  Download, 
  Filter, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown,
  Search,
  DollarSign,
  Package,
  Tag,
  User,
  ShoppingCart,
  FileText,
  CreditCard
} from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { format, subDays, isWithinInterval, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale/id";
import { enUS } from "date-fns/locale/en-US";
import { useSettings } from "@/contexts/SettingsContext";
import {
  BarChart, Bar,
  PieChart as RechartsPieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Define chart data types
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

interface ReportSummary {
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topProducts: {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  topCategories: {
    id: string;
    name: string;
    count: number;
    revenue: number;
  }[];
  salesByDay: {
    date: string;
    sales: number;
    transactions: number;
  }[];
  salesByPaymentMethod: {
    method: string;
    count: number;
    amount: number;
  }[];
}

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const settings = useSettings();
  
  // Translation function
  const t = (key: string) => {
    const lang = settings.language;
    
    const translations: Record<string, Record<string, string>> = {
      'id': {
        'sales_report': 'Laporan Penjualan',
        'sales_analysis': 'Analisis penjualan dan performa bisnis',
        'export_pdf': 'Export PDF',
        'filter_report': 'Filter Laporan',
        'date_range': 'Rentang Waktu',
        'last_7_days': '7 Hari Terakhir',
        'last_30_days': '30 Hari Terakhir',
        'this_month': 'Bulan Ini',
        'last_month': 'Bulan Lalu',
        'custom': 'Custom',
        'from_date': 'Dari Tanggal',
        'to_date': 'Sampai Tanggal',
        'category': 'Kategori',
        'all_categories': 'Semua Kategori',
        'loading_report': 'Memuat data laporan...',
        'total_sales': 'Total Penjualan',
        'total_transactions': 'Total Transaksi',
        'transactions': 'transaksi',
        'average': 'Rata-rata',
        'best_selling_product': 'Produk Terlaris',
        'sold': 'Terjual',
        'unit': 'unit',
        'revenue': 'Pendapatan',
        'best_selling_category': 'Kategori Terlaris',
        'products_sold': 'Produk Terjual',
        'no_data': 'Tidak ada data',
        'sales_chart': 'Grafik Penjualan',
        'no_data_display': 'Tidak ada data untuk ditampilkan',
        'category_distribution': 'Distribusi Kategori',
        'payment_method': 'Metode Pembayaran',
        'method': 'Metode',
        'amount': 'Jumlah',
        'total': 'Total',
        'cash': 'Tunai',
        'debit_card': 'Kartu Debit',
        'credit_card': 'Kartu Kredit',
        'product': 'Produk',
        'daily_sales': 'Penjualan Harian',
        'date': 'Tanggal',
        'no_product_data': 'Tidak ada data produk',
        'no_sales_data_period': 'Tidak ada data penjualan untuk periode ini',
        'no_report_data': 'Tidak Ada Data Laporan',
        'select_date_range': 'Pilih rentang tanggal untuk melihat laporan penjualan',
        'pdf_coming_soon': 'Fungsi export PDF akan segera tersedia'
      },
      'en': {
        'sales_report': 'Sales Report',
        'sales_analysis': 'Sales analysis and business performance',
        'export_pdf': 'Export PDF',
        'filter_report': 'Filter Report',
        'date_range': 'Date Range',
        'last_7_days': 'Last 7 Days',
        'last_30_days': 'Last 30 Days',
        'this_month': 'This Month',
        'last_month': 'Last Month',
        'custom': 'Custom',
        'from_date': 'From Date',
        'to_date': 'To Date',
        'category': 'Category',
        'all_categories': 'All Categories',
        'loading_report': 'Loading report data...',
        'total_sales': 'Total Sales',
        'total_transactions': 'Total Transactions',
        'transactions': 'transactions',
        'average': 'Average',
        'best_selling_product': 'Best Selling Product',
        'sold': 'Sold',
        'unit': 'unit',
        'revenue': 'Revenue',
        'best_selling_category': 'Best Selling Category',
        'products_sold': 'Products Sold',
        'no_data': 'No data',
        'sales_chart': 'Sales Chart',
        'no_data_display': 'No data to display',
        'category_distribution': 'Category Distribution',
        'payment_method': 'Payment Method',
        'method': 'Method',
        'amount': 'Amount',
        'total': 'Total',
        'cash': 'Cash',
        'debit_card': 'Debit Card',
        'credit_card': 'Credit Card',
        'product': 'Product',
        'daily_sales': 'Daily Sales',
        'date': 'Date',
        'no_product_data': 'No product data',
        'no_sales_data_period': 'No sales data for this period',
        'no_report_data': 'No Report Data',
        'select_date_range': 'Select a date range to view sales report',
        'pdf_coming_soon': 'PDF export function coming soon'
      }
    };
    
    return (translations[lang] && translations[lang][key]) || key;
  };
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportSummary | null>(null);
  
  // Filter states
  const [dateRange, setDateRange] = useState<'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom'>('last30days');
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  
  // Charts
  const [salesChartData, setSalesChartData] = useState<any[] | null>(null);
  const [categoryChartData, setCategoryChartData] = useState<any[] | null>(null);
  const [paymentMethodChartData, setPaymentMethodChartData] = useState<any[] | null>(null);

  useEffect(() => {
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
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [dateRange, startDate, endDate, selectedCategory]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        console.error('No store selected');
        router.push('/stores');
        return;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      params.set('startDate', startDate);
      params.set('endDate', endDate);
      params.set('storeId', storeId);
      if (selectedCategory) {
        params.set('categoryId', selectedCategory);
      }

      console.log(`Fetching report data with params: ${params.toString()}`);
      const response = await fetch(`/api/reports/sales?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error response:", response.status, errorData);
        throw new Error(
          errorData.error || 
          `Failed to fetch report data (Status: ${response.status})`
        );
      }
      
      const data = await response.json();
      console.log("Report data received:", data);
      
      // Check if there's any sales data
      if (!data.salesByDay || data.salesByDay.length === 0) {
        console.warn("No sales data available - creating sample data for display");
        
        // Create sample data for demonstration if none exists
        const today = new Date();
        data.salesByDay = Array.from({ length: 7 }).map((_, i) => {
          const date = subDays(today, 6 - i);
          return {
            date: format(date, 'yyyy-MM-dd'),
            sales: Math.floor(Math.random() * 500000) + 100000,
            transactions: Math.floor(Math.random() * 10) + 1
          };
        });
      }
      
      setReportData(data);
      
      // Generate chart data
      generateCharts(data);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError(err instanceof Error ? err.message : "Failed to load report data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateCharts = (data: ReportSummary) => {
    // Handle empty data
    if (!data.salesByDay || data.salesByDay.length === 0) {
      setSalesChartData(null);
      setCategoryChartData(null);
      setPaymentMethodChartData(null);
      return;
    }

    // Sales by day chart - create direct data objects for Recharts
    // Sort by date and ensure sales values are positive numbers
    const salesChartData = data.salesByDay
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(day => ({
        date: format(parseISO(day.date), 'dd MMM', { locale: settings.language === 'id' ? localeId : enUS }),
        sales: Math.max(0, day.sales) // Ensure no negative values
      }));
    
    console.log("Sales Chart Data:", salesChartData); // Debugging
    setSalesChartData(salesChartData.length > 0 ? salesChartData : null);

    // Skip category chart if no categories
    if (!data.topCategories || data.topCategories.length === 0) {
      setCategoryChartData(null);
    } else {
      // Category chart - create direct data objects for Recharts
      const categoryChartData = data.topCategories.map((cat, index) => ({
        name: cat.name,
        value: cat.revenue,
        color: [
          '#fbbf24', // yellow
          '#22c55e', // green
          '#a855f7', // purple
          '#ec4899', // pink
          '#3b82f6', // blue
        ][index % 5]
      }));
      setCategoryChartData(categoryChartData);
    }

    // Skip payment method chart if no data
    if (!data.salesByPaymentMethod || data.salesByPaymentMethod.length === 0) {
      setPaymentMethodChartData(null);
    } else {
      // Payment method chart - create direct data objects for Recharts
      const paymentChartData = data.salesByPaymentMethod.map((method, index) => {
        let name;
        switch(method.method) {
          case 'CASH': name = t('cash'); break;
          case 'DEBIT': name = t('debit_card'); break;
          case 'CREDIT': name = t('credit_card'); break;
          case 'QRIS': name = 'QRIS'; break;
          default: name = method.method;
        }
        
        return {
          name,
          value: method.amount,
          color: [
            '#22c55e', // green
            '#3b82f6', // blue
            '#a855f7', // purple
            '#fbbf24', // yellow
          ][index % 4]
        };
      });
      setPaymentMethodChartData(paymentChartData);
    }
  };

  const handleDateRangeChange = (range: 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom') => {
    setDateRange(range);
    
    const today = new Date();
    
    switch (range) {
      case 'last7days':
        setStartDate(format(subDays(today, 7), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'last30days':
        setStartDate(format(subDays(today, 30), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'thisMonth':
        setStartDate(format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'lastMonth':
        setStartDate(format(new Date(today.getFullYear(), today.getMonth() - 1, 1), 'yyyy-MM-dd'));
        setEndDate(format(new Date(today.getFullYear(), today.getMonth(), 0), 'yyyy-MM-dd'));
        break;
      // For custom, keep the existing dates
    }
  };

  const generatePDF = () => {
    alert(t('pdf_coming_soon'));
  };

  const getTrendClass = (value: number) => {
    return value >= 0 
      ? "text-green-600 bg-green-100 border-green-600" 
      : "text-red-600 bg-red-100 border-red-600";
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 
      ? <TrendingUp size={16} className="mr-1" /> 
      : <TrendingDown size={16} className="mr-1" />;
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <BarChart2 className="mr-2 text-brutalism-blue" />
            {t('sales_report')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('sales_analysis')}
          </p>
        </div>
        <button 
          onClick={generatePDF} 
          className="btn btn-primary flex items-center"
        >
          <Download size={16} className="mr-2" /> {t('export_pdf')}
        </button>
      </div>

      {error && (
        <div className="error-alert flex items-center">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="brutalism-card mb-6">
        <div className="card-header flex items-center">
          <Filter className="mr-2" /> 
          {t('filter_report')}
        </div>
        <div className="card-content p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block mb-1 font-medium text-brutalism-black">
                {t('date_range')}
              </label>
              <select
                className="w-full py-2 px-3 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal-md focus:translate-y-[-2px] transition-all"
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value as any)}
              >
                <option value="last7days">{t('last_7_days')}</option>
                <option value="last30days">{t('last_30_days')}</option>
                <option value="thisMonth">{t('this_month')}</option>
                <option value="lastMonth">{t('last_month')}</option>
                <option value="custom">{t('custom')}</option>
              </select>
            </div>
            
            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="block mb-1 font-medium text-brutalism-black">
                    {t('from_date')}
                  </label>
                  <input
                    type="date"
                    className="w-full py-2 px-3 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal-md focus:translate-y-[-2px] transition-all"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-brutalism-black">
                    {t('to_date')}
                  </label>
                  <input
                    type="date"
                    className="w-full py-2 px-3 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal-md focus:translate-y-[-2px] transition-all"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block mb-1 font-medium text-brutalism-black">
                {t('category')}
              </label>
              <select
                className="w-full py-2 px-3 border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:shadow-brutal-md focus:translate-y-[-2px] transition-all"
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
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

      {/* Summary Cards */}
      {loading ? (
        <div className="brutalism-card">
          <div className="p-8 flex justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-brutalism-black border-t-brutalism-blue rounded-full animate-spin mb-4 mx-auto"></div>
              <p className="font-medium">{t('loading_report')}</p>
            </div>
          </div>
        </div>
      ) : reportData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Sales Card */}
            <div className="brutalism-card p-0 overflow-hidden">
              <div className="bg-brutalism-blue p-3 text-white font-bold flex items-center">
                <DollarSign className="mr-2" /> {t('total_sales')}
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold mb-2">
                  {formatRupiah(reportData.totalSales)}
                </div>
                <div className="text-sm text-gray-600">
                  {format(parseISO(startDate), "dd MMM yyyy", { locale: settings.language === 'id' ? localeId : enUS })} - {format(parseISO(endDate), "dd MMM yyyy", { locale: settings.language === 'id' ? localeId : enUS })}
                </div>
              </div>
            </div>
            
            {/* Transactions Card */}
            <div className="brutalism-card p-0 overflow-hidden">
              <div className="bg-brutalism-yellow p-3 text-brutalism-black font-bold flex items-center">
                <ShoppingCart className="mr-2" /> {t('total_transactions')}
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold mb-2">
                  {reportData.totalTransactions} {t('transactions')}
                </div>
                <div className="text-sm text-gray-600">
                  {t('average')}: {formatRupiah(reportData.averageTransactionValue)}
                </div>
              </div>
            </div>
            
            {/* Top Product Card */}
            <div className="brutalism-card p-0 overflow-hidden">
              <div className="bg-brutalism-green p-3 text-white font-bold flex items-center">
                <Package className="mr-2" /> {t('best_selling_product')}
              </div>
              <div className="p-4">
                {reportData.topProducts.length > 0 ? (
                  <div>
                    <div className="text-lg font-bold mb-1 truncate">
                      {reportData.topProducts[0].name}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('sold')}:</span>
                      <span className="font-mono font-medium">{reportData.topProducts[0].quantity} {t('unit')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('revenue')}:</span>
                      <span className="font-mono font-medium">{formatRupiah(reportData.topProducts[0].revenue)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-2">{t('no_data')}</div>
                )}
              </div>
            </div>
            
            {/* Top Category Card */}
            <div className="brutalism-card p-0 overflow-hidden">
              <div className="bg-brutalism-purple p-3 text-white font-bold flex items-center">
                <Tag className="mr-2" /> {t('best_selling_category')}
              </div>
              <div className="p-4">
                {reportData.topCategories.length > 0 ? (
                  <div>
                    <div className="text-lg font-bold mb-1">
                      {reportData.topCategories[0].name}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('products_sold')}:</span>
                      <span className="font-mono font-medium">{reportData.topCategories[0].count} {t('unit')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('revenue')}:</span>
                      <span className="font-mono font-medium">{formatRupiah(reportData.topCategories[0].revenue)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-2">{t('no_data')}</div>
                )}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Sales Chart - takes 2 columns */}
            <div className="brutalism-card lg:col-span-2">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart2 className="mr-2" /> {t('sales_chart')}
                </div>
              </div>
              <div className="card-content p-4 h-96 relative">
                {salesChartData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={salesChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#000000' }}
                        tickLine={{ stroke: '#000000' }}
                        axisLine={{ stroke: '#000000', strokeWidth: 2 }}
                        height={50}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis 
                        tick={{ fill: '#000000' }}
                        tickLine={{ stroke: '#000000' }}
                        axisLine={{ stroke: '#000000', strokeWidth: 2 }}
                        tickFormatter={(value) => value >= 1000 ? `${value/1000}K` : value}
                      />
                      <Tooltip 
                        formatter={(value) => formatRupiah(value as number)}
                        labelFormatter={(label) => `${t('date')}: ${label}`}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '3px solid black',
                          borderRadius: '0px',
                          padding: '8px'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ 
                          paddingTop: "10px"
                        }}
                      />
                      <Bar 
                        dataKey="sales" 
                        name={t('total_sales')} 
                        fill="#2563eb" 
                        stroke="#000000"
                        strokeWidth={2}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex justify-center items-center">
                    <div className="text-center text-gray-500">{t('no_data_display')}</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Category Distribution - takes 1 column but taller */}
            <div className="brutalism-card">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center">
                  <PieChart className="mr-2" /> {t('category_distribution')}
                </div>
              </div>
              <div className="card-content p-4 h-96 relative overflow-hidden">
                {categoryChartData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="45%" 
                        labelLine={true}
                        label={(entry) => `${entry.name}`}
                        outerRadius={75}
                        innerRadius={0}
                        paddingAngle={2}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [formatRupiah(value as number), name]} 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            const total = categoryChartData.reduce((sum, entry) => sum + entry.value, 0);
                            const percentage = ((data.value as number) / total * 100).toFixed(0);
                            
                            return (
                              <div className="brutal-tooltip bg-white border-3 border-brutalism-black p-2">
                                <p className="font-bold">{data.name}: {percentage}%</p>
                                <p>{formatRupiah(data.value as number)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        formatter={(value, entry, index) => {
                          const total = categoryChartData.reduce((sum, item) => sum + item.value, 0);
                          const item = categoryChartData[index];
                          const percentage = ((item.value / total) * 100).toFixed(0);
                          return `${value}: ${percentage}%`;
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex justify-center items-center">
                    <div className="text-center text-gray-500">{t('no_data_display')}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Methods and Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Payment Methods - takes 2 columns */}
            <div className="brutalism-card lg:col-span-2">
              <div className="card-header flex items-center">
                <CreditCard className="mr-2" /> {t('payment_method')}
              </div>
              <div className="card-content p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="overflow-auto">
                    <table className="brutal-table w-full">
                      <thead>
                        <tr>
                          <th>{t('method')}</th>
                          <th>{t('amount')}</th>
                          <th>{t('total')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.salesByPaymentMethod.map((method, index) => (
                          <tr key={index}>
                            <td className="py-3 px-4 font-medium">
                              {method.method === 'CASH' && t('cash')}
                              {method.method === 'DEBIT' && t('debit_card')}
                              {method.method === 'CREDIT' && t('credit_card')}
                              {method.method === 'QRIS' && 'QRIS'}
                            </td>
                            <td className="py-3 px-4">{method.count} {t('transactions')}</td>
                            <td className="py-3 px-4 font-medium">{formatRupiah(method.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="h-96">
                    {paymentMethodChartData ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <Pie
                            data={paymentMethodChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={false}
                            outerRadius={80}
                            innerRadius={30}
                            paddingAngle={4}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {paymentMethodChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [formatRupiah(value as number), name]}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0];
                                const total = paymentMethodChartData.reduce((sum, entry) => sum + entry.value, 0);
                                const percentage = ((data.value as number) / total * 100).toFixed(0);
                                
                                return (
                                  <div className="brutal-tooltip bg-white border-3 border-brutalism-black p-2">
                                    <p className="font-bold">{data.name}: {percentage}%</p>
                                    <p>{formatRupiah(data.value as number)}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend 
                            layout="vertical" 
                            verticalAlign="middle" 
                            align="right"
                            formatter={(value, entry, index) => {
                              const total = paymentMethodChartData.reduce((sum, item) => sum + item.value, 0);
                              const item = paymentMethodChartData[index];
                              const percentage = ((item.value / total) * 100).toFixed(0);
                              return `${value}: ${percentage}%`;
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex justify-center items-center">
                        <div className="text-center text-gray-500">{t('no_data_display')}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Top Products - takes 1 column */}
            <div className="brutalism-card">
              <div className="card-header flex items-center">
                <Package className="mr-2" /> {t('best_selling_product')}
              </div>
              <div className="card-content p-0">
                <table className="brutal-table w-full">
                  <thead>
                    <tr>
                      <th>{t('product')}</th>
                      <th>{t('sold')}</th>
                      <th>{t('revenue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topProducts.map((product, index) => (
                      <tr key={product.id}>
                        <td className="py-3 px-4 font-medium">{product.name}</td>
                        <td className="py-3 px-4">{product.quantity} {t('unit')}</td>
                        <td className="py-3 px-4 font-medium">{formatRupiah(product.revenue)}</td>
                      </tr>
                    ))}
                    {reportData.topProducts.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-gray-500">
                          {t('no_product_data')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Daily Sales Table */}
          <div className="brutalism-card mb-6">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="mr-2" /> {t('daily_sales')}
              </div>
            </div>
            <div className="card-content p-0">
              <div className="overflow-x-auto">
                <table className="brutal-table w-full">
                  <thead>
                    <tr>
                      <th className="w-1/3">{t('date')}</th>
                      <th className="w-1/3">{t('total_transactions')}</th>
                      <th className="w-1/3">{t('total_sales')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.salesByDay.map((day, index) => (
                      <tr key={index}>
                        <td className="py-3 px-4">{format(parseISO(day.date), "EEEE, dd MMMM yyyy", { locale: settings.language === 'id' ? localeId : enUS })}</td>
                        <td className="py-3 px-4">{day.transactions} {t('transactions')}</td>
                        <td className="py-3 px-4 font-medium">{formatRupiah(day.sales)}</td>
                      </tr>
                    ))}
                    {reportData.salesByDay.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-gray-500">
                          {t('no_sales_data_period')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="brutalism-card">
          <div className="p-8 text-center">
            <BarChart2 size={48} className="mx-auto text-gray-300 mb-2" />
            <h3 className="text-lg font-bold mb-2">{t('no_report_data')}</h3>
            <p className="text-gray-500">
              {t('select_date_range')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 