import React, { useState } from 'react';
import { 
  Receipt, 
  Calendar, 
  FileSpreadsheet, 
  Search, 
  Eye, 
  CreditCard, 
  User, 
  Printer, 
  DollarSign,
  TrendingUp,
  X
} from 'lucide-react';
import { SaleOrder } from '../types';
import { formatCurrency } from '../lib/printer';
import { exportDailySalesToExcel } from '../lib/excel';

interface DailySalesProps {
  orders: SaleOrder[];
  darkMode: boolean;
  onOpenReceipt: (order: SaleOrder) => void;
}

export const DailySales: React.FC<DailySalesProps> = ({
  orders,
  darkMode,
  onOpenReceipt,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchInvoice, setSearchInvoice] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<SaleOrder | null>(null);

  // Filter Orders
  const filteredOrders = orders.filter((ord) => {
    const ordDate = new Date(ord.date).toISOString().split('T')[0];
    const matchDate = ordDate === selectedDate;
    const matchInv =
      ord.invoiceNo.toLowerCase().includes(searchInvoice.toLowerCase()) ||
      ord.cashierName.toLowerCase().includes(searchInvoice.toLowerCase()) ||
      (ord.customerName && ord.customerName.toLowerCase().includes(searchInvoice.toLowerCase()));
    const matchPay = paymentFilter === 'ALL' || ord.paymentMethod === paymentFilter;
    return matchDate && matchInv && matchPay;
  });

  // Calculate Totals for the selected date
  const totalOmzet = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalHPP = filteredOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const totalLabaKotor = totalOmzet - totalHPP;
  const totalDiscount = filteredOrders.reduce((sum, o) => sum + o.discountTotal, 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Excel Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">Laporan Penjualan Harian</h2>
          <p className="text-xs mt-0.5 text-slate-600 dark:text-slate-400">
            Rincian setiap nota transaksi, metode pembayaran, laba kotor, dan ekspor Excel.
          </p>
        </div>

        <button
          onClick={() => exportDailySalesToExcel(filteredOrders, selectedDate)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Ekspor Excel (.xlsx)</span>
        </button>
      </div>

      {/* Date Picker & Filter Controls */}
      <div className={`p-3.5 sm:p-4 rounded-3xl border grid grid-cols-1 md:grid-cols-3 gap-2.5 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100 shadow-sm'
      }`}>
        {/* Date Selector */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>

        {/* Invoice / Cashier Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchInvoice}
            onChange={(e) => setSearchInvoice(e.target.value)}
            placeholder="Cari Invoice, Kasir, atau Pelanggan..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500'
            }`}
          />
        </div>

        {/* Payment Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none ${
            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
          }`}
        >
          <option value="ALL" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Semua Pembayaran</option>
          <option value="TUNAI" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Tunai / Cash</option>
          <option value="QRIS" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">QRIS Scan</option>
          <option value="TRANSFER" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Transfer Bank</option>
          <option value="DEBIT_KREDIT" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Debit / EDC</option>
        </select>
      </div>

      {/* Daily Metrics Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className={`p-3.5 sm:p-4 rounded-2xl border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100'
        }`}>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Omzet Penjualan</p>
          <p className="text-base sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{formatCurrency(totalOmzet)}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{filteredOrders.length} Nota Transaksi</p>
        </div>

        <div className={`p-3.5 sm:p-4 rounded-2xl border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100'
        }`}>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total HPP Barang</p>
          <p className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-300 mt-0.5">{formatCurrency(totalHPP)}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Moving Avg Cost</p>
        </div>

        <div className={`p-3.5 sm:p-4 rounded-2xl border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100'
        }`}>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Laba Kotor</p>
          <p className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-500 mt-0.5">{formatCurrency(totalLabaKotor)}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">Omzet - HPP</p>
        </div>

        <div className={`p-3.5 sm:p-4 rounded-2xl border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100'
        }`}>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Diskon</p>
          <p className="text-base sm:text-xl font-black text-amber-600 dark:text-amber-500 mt-0.5">{formatCurrency(totalDiscount)}</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">Potongan Harga</p>
        </div>
      </div>

      {/* MOBILE TRANSACTIONS CARDS VIEW (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-blue-100 text-slate-500'
          }`}>
            <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
            <p className="text-xs font-bold">Tidak ada transaksi pada tanggal {selectedDate}.</p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const itemCount = ord.items.reduce((sum, i) => sum + i.quantity, 0);
            return (
              <div
                key={ord.id}
                className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100 shadow-sm'
                }`}
              >
                {/* Card Top Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <div>
                    <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">
                      {ord.invoiceNo}
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {new Date(ord.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-slate-900 dark:text-slate-100 block">
                      {formatCurrency(ord.totalAmount)}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500">
                      Laba: +{formatCurrency(ord.grossProfit)}
                    </span>
                  </div>
                </div>

                {/* Card Info Details */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      Kasir: {ord.cashierName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {ord.customerName || 'Pelanggan Umum'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                    <div className="flex items-center space-x-1">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {ord.paymentMethod}
                      </span>
                      {ord.orderType && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          ord.orderType === 'ONLINE'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {ord.orderType === 'ONLINE' ? 'Online' : 'Offline'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {itemCount} Pcs Item
                    </span>
                  </div>
                </div>

                {ord.notes && (
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 italic bg-blue-50/50 dark:bg-blue-950/20 px-2.5 py-1 rounded-lg">
                    Note: {ord.notes}
                  </p>
                )}

                {/* Card Action Buttons */}
                <div className="flex items-center space-x-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => setSelectedOrderDetail(ord)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    <span>Rincian Item</span>
                  </button>
                  <button
                    onClick={() => onOpenReceipt(ord)}
                    className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Struk</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TRANSACTION TABLE (>= md) */}
      <div className={`hidden md:block rounded-3xl border overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${
                darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-300' : 'bg-blue-50/70 border-blue-100 text-slate-700'
              }`}>
                <th className="p-3.5 font-bold">No. Invoice & Waktu</th>
                <th className="p-3.5 font-bold">Kasir & Pelanggan</th>
                <th className="p-3.5 font-bold">Metode Pembayaran</th>
                <th className="p-3.5 font-bold text-center">Jumlah Item</th>
                <th className="p-3.5 font-bold text-right">Total Transaksi</th>
                <th className="p-3.5 font-bold text-right">Laba Kotor</th>
                <th className="p-3.5 font-bold text-center">Aksi Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    Tidak ada transaksi tercatat pada tanggal {selectedDate}.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-semibold">
                      <p className="font-bold text-xs text-blue-600 dark:text-blue-400">{ord.invoiceNo}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {new Date(ord.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{ord.cashierName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{ord.customerName || 'Pelanggan Umum'}</p>
                      {ord.notes && (
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 italic mt-0.5 line-clamp-1">
                          Note: {ord.notes}
                        </p>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-col space-y-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 w-fit">
                          {ord.paymentMethod}
                        </span>
                        {ord.orderType && (
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold w-fit ${
                            ord.orderType === 'ONLINE'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            {ord.orderType === 'ONLINE' ? '🌐 Online' : '🏪 Offline'}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 text-center font-bold">
                      {ord.items.reduce((sum, i) => sum + i.quantity, 0)} Pcs
                    </td>

                    <td className="p-3.5 text-right font-black text-blue-600 dark:text-blue-400">
                      {formatCurrency(ord.totalAmount)}
                    </td>

                    <td className="p-3.5 text-right font-bold text-emerald-500">
                      +{formatCurrency(ord.grossProfit)}
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setSelectedOrderDetail(ord)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                          title="Rincian Item"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenReceipt(ord)}
                          className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                          title="Cetak Ulang Struk"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Item Details Modal */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-blue-100 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="font-extrabold text-base">Detail Nota {selectedOrderDetail.invoiceNo}</h4>
                <p className="text-xs text-slate-400">
                  {new Date(selectedOrderDetail.date).toLocaleString('id-ID')}
                </p>
              </div>
              <button onClick={() => setSelectedOrderDetail(null)} className="p-1 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1 text-xs">
              {selectedOrderDetail.items.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{item.productName}</p>
                    <p className="text-[10px] text-slate-500">SKU: {item.sku} • {item.quantity} x {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <span className="font-black text-blue-500">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedOrderDetail.subtotal)}</span>
              </div>
              {selectedOrderDetail.discountTotal > 0 && (
                <div className="flex justify-between text-amber-500">
                  <span>Diskon Nota</span>
                  <span>-{formatCurrency(selectedOrderDetail.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200 dark:border-slate-800">
                <span>Total Pembayaran</span>
                <span className="text-blue-600">{formatCurrency(selectedOrderDetail.totalAmount)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                const ord = selectedOrderDetail;
                setSelectedOrderDetail(null);
                onOpenReceipt(ord);
              }}
              className="w-full mt-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk Thermal</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
