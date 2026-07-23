import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  ArrowUpRight, 
  Package, 
  PlusCircle, 
  FileSpreadsheet, 
  Store,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { Product, SaleOrder, Expense } from '../types';
import { formatCurrency } from '../lib/printer';
import { exportDailySalesToExcel, exportInventoryToExcel } from '../lib/excel';

interface DashboardProps {
  products: Product[];
  orders: SaleOrder[];
  expenses: Expense[];
  darkMode: boolean;
  onNavigateTo: (tab: string) => void;
  onOpenStockInModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  orders,
  expenses,
  darkMode,
  onNavigateTo,
  onOpenStockInModal,
}) => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter orders by period
  const filteredOrders = orders.filter((order) => {
    const orderDateStr = new Date(order.date).toISOString().split('T')[0];
    if (timeRange === 'today') {
      return orderDateStr === todayStr;
    } else if (timeRange === 'week') {
      const now = new Date();
      const orderDate = new Date(order.date);
      const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7;
    } else {
      const now = new Date();
      const orderDate = new Date(order.date);
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }
  });

  // Calculate Metrics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCost = filteredOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const grossProfit = totalRevenue - totalCost;
  const transactionCount = filteredOrders.length;
  const avgOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  // Low Stock Items
  const lowStockItems = products.filter((p) => p.stock <= p.minStock);

  // Top Selling Products
  const productSalesMap: { [key: string]: { name: string; qty: number; revenue: number } } = {};
  filteredOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.subtotal;
    });
  });

  const topSellers = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Recent Transactions
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400">
                Real-time Analytics
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Toko Elbababy</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">
              Performa Penjualan & Stok
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ringkasan transaksi, estimasi laba kotor, dan ketersediaan barang.
            </p>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
            {(['today', 'week', 'month'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeRange(period)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  timeRange === period
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {period === 'today' ? 'Hari Ini' : period === 'week' ? '7 Hari' : 'Bulan Ini'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alert Warning */}
      {lowStockItems.length > 0 && (
        <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          darkMode ? 'bg-amber-950/30 border-amber-800/80 text-amber-200' : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500 text-white">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs">
                {lowStockItems.length} Produk Mencapai Batas Stok Minimum
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                Segera lakukan stok masuk untuk menjaga ketersediaan barang.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={onOpenStockInModal}
              className="flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors flex items-center justify-center space-x-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Stok Masuk</span>
            </button>
            <button
              onClick={() => onNavigateTo('stock')}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-amber-300 dark:border-amber-700"
            >
              Detail
            </button>
          </div>
        </div>
      )}

      {/* Top KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Omzet */}
        <div className={`p-4 rounded-2xl border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Omzet</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold mt-2 text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-semibold mt-1">
            {transactionCount} Transaksi
          </p>
        </div>

        {/* Laba Kotor */}
        <div className={`p-4 rounded-2xl border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Laba Kotor</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">{formatCurrency(grossProfit)}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Omzet - HPP Rata-rata
          </p>
        </div>

        {/* Rata-Rata Belanja */}
        <div className={`p-4 rounded-2xl border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rata-rata Nota</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold mt-2 text-slate-900 dark:text-white">{formatCurrency(avgOrderValue)}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Per transaksi
          </p>
        </div>

        {/* Total SKU & Low Stock */}
        <div className={`p-4 rounded-2xl border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Katalog Produk</span>
            <Package className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold mt-2 text-slate-900 dark:text-white">{products.length} SKU</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold mt-1">
            {lowStockItems.length} butuh restok
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Quick Actions & Recent Sales */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Action Buttons */}
          <div className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <h3 className="font-bold text-xs mb-3 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Aksi Cepat
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => onNavigateTo('pos')}
                className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-colors"
              >
                <Store className="w-5 h-5" />
                <span>Kasir POS</span>
              </button>

              <button
                onClick={onOpenStockInModal}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition-colors ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <PlusCircle className="w-5 h-5 text-blue-500" />
                <span>Stok Masuk</span>
              </button>

              <button
                onClick={() => exportDailySalesToExcel(orders)}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition-colors ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Excel Penjualan</span>
              </button>

              <button
                onClick={() => exportInventoryToExcel(products)}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition-colors ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <span>Excel Stok</span>
              </button>
            </div>
          </div>

          {/* Recent Sales History */}
          <div className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Transaksi Terbaru
              </h3>
              <button
                onClick={() => onNavigateTo('daily-sales')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
              >
                <span>Semua</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {recentOrders.length === 0 ? (
                <p className="text-xs text-center py-6 text-slate-400">Belum ada transaksi recorded hari ini.</p>
              ) : (
                recentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      darkMode ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50/70 border-slate-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{ord.invoiceNo}</span>
                        <span className="px-2 py-0.2 text-[9px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {ord.paymentMethod}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {new Date(ord.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {ord.items.length} Item • {ord.customerName}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-xs text-blue-600 dark:text-blue-400">{formatCurrency(ord.totalAmount)}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">
                        +{formatCurrency(ord.grossProfit)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Top Best Sellers & Low Stock Status */}
        <div className="space-y-4">
          {/* Top Selling Products Card */}
          <div className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <h3 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Produk Bayi Terlaris
            </h3>

            <div className="space-y-2">
              {topSellers.length === 0 ? (
                <p className="text-xs text-center py-6 text-slate-500 dark:text-slate-400">Belum ada data penjualan.</p>
              ) : (
                topSellers.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50/60 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-[10px]">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Terjual: {item.qty} pcs
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Status */}
          <div className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Stok Kritis
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
                {lowStockItems.length} Produk
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-80" />
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold">Semua stok barang aman</p>
                </div>
              ) : (
                lowStockItems.map((prod) => (
                  <div
                    key={prod.id}
                    className={`p-2 rounded-xl border flex items-center justify-between ${
                      darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-amber-50/50 border-amber-200'
                    }`}
                  >
                    <div className="pr-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{prod.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Min: {prod.minStock} {prod.unit}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-bold text-[10px]">
                      Sisa {prod.stock}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

