import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  PlusCircle, 
  FileSpreadsheet, 
  Calendar, 
  Wallet, 
  X,
  FileText
} from 'lucide-react';
import { SaleOrder, Expense } from '../types';
import { formatCurrency } from '../lib/printer';
import { exportFinancialStatementToExcel } from '../lib/excel';
import { LocalStorageManager } from '../lib/storage';

interface FinancialReportProps {
  orders: SaleOrder[];
  expenses: Expense[];
  darkMode: boolean;
  onRefreshData: () => void;
}

export const FinancialReport: React.FC<FinancialReportProps> = ({
  orders,
  expenses,
  darkMode,
  onRefreshData,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  // Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseCat, setExpenseCat] = useState<Expense['category']>('OPERASIONAL');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDesc, setExpenseDesc] = useState<string>('');

  // Filter Data by selected month
  const monthOrders = orders.filter((o) => {
    return o.date.startsWith(selectedMonth);
  });

  const monthExpenses = expenses.filter((e) => {
    return e.date.startsWith(selectedMonth);
  });

  // Calculate Financial Statement Numbers
  const totalRevenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCOGS = monthOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Add Expense
  const handleSaveExpense = () => {
    if (expenseAmount <= 0) {
      alert('Nominal pengeluaran harus lebih dari 0!');
      return;
    }

    const newExp: Expense = {
      id: 'exp-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      category: expenseCat,
      amount: expenseAmount,
      description: expenseDesc.trim() || 'Pengeluaran Toko Elbababy',
      recordedBy: 'Admin Toko',
    };

    const currentExps = LocalStorageManager.getExpenses();
    currentExps.unshift(newExp);
    LocalStorageManager.saveExpenses(currentExps);

    setShowExpenseModal(false);
    setExpenseAmount(0);
    setExpenseDesc('');
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Month Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">Laporan Keuangan & Laba Rugi Toko</h2>
          <p className="text-xs mt-0.5 text-slate-600 dark:text-slate-400">
            Terintegrasi otomatis dari penjualan kasir, kalkulasi HPP rata-rata, dan biaya operasional.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Month Selector */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-blue-200 text-slate-800'
            }`}
          />

          {/* Export Financial Excel */}
          <button
            onClick={() => exportFinancialStatementToExcel(`Bulan_${selectedMonth}`, monthOrders, monthExpenses)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel Keuangan</span>
          </button>
        </div>
      </div>

      {/* Main Income Statement Card */}
      <div className={`p-4 sm:p-6 rounded-3xl border ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100 shadow-xl shadow-blue-500/5'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-1">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-blue-500" />
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">Laporan Laba Rugi (Income Statement)</h3>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Periode: {selectedMonth}</span>
        </div>

        {/* Financial Flow Breakdown Table */}
        <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 text-sm">
          {/* 1. Revenue */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 gap-1 sm:gap-4">
            <div>
              <p className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">1. Pendapatan Kotor (Revenue)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Total transaksi berhasil dari POS Kasir</p>
            </div>
            <span className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 self-end sm:self-auto">
              {formatCurrency(totalRevenue)}
            </span>
          </div>

          {/* 2. COGS / HPP */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 gap-1 sm:gap-4">
            <div>
              <p className="font-bold text-xs text-rose-700 dark:text-rose-300 uppercase tracking-wider">2. Beban HPP (Cost of Goods Sold)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Dihitung dari Moving Average Cost tiap item terjual</p>
            </div>
            <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 self-end sm:self-auto">
              -{formatCurrency(totalCOGS)}
            </span>
          </div>

          {/* 3. Gross Profit */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 gap-1 sm:gap-4">
            <div>
              <p className="font-extrabold text-xs text-blue-700 dark:text-blue-300 uppercase tracking-wider">3. LABA KOTOR (GROSS PROFIT)</p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">Margin Kotor: {grossMarginPercent.toFixed(1)}%</p>
            </div>
            <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 self-end sm:self-auto">
              {formatCurrency(grossProfit)}
            </span>
          </div>

          {/* 4. Operating Expenses */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 gap-2 sm:gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-bold text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">4. Total Biaya Operasional Toko</p>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 active:scale-95 transition-all"
                >
                  + Catat Biaya
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Sewa ruko, listrik/air, gaji karyawan, dll.</p>
            </div>
            <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 self-end sm:self-auto">
              -{formatCurrency(totalExpenses)}
            </span>
          </div>

          {/* 5. Net Profit */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/20 gap-2">
            <div>
              <p className="font-black text-xs sm:text-sm uppercase tracking-widest text-emerald-100">5. LABA BERSIH (NET PROFIT)</p>
              <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5">Net Margin: {netMarginPercent.toFixed(1)}%</p>
            </div>
            <span className="text-xl sm:text-3xl font-black self-end sm:self-auto">
              {formatCurrency(netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Expenses History List */}
      <div className={`p-4 sm:p-6 rounded-3xl border ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="font-extrabold text-xs sm:text-sm flex items-center space-x-2 text-slate-900 dark:text-slate-100">
            <Wallet className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>Rincian Biaya Operasional ({monthExpenses.length})</span>
          </h3>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all flex-shrink-0"
          >
            + Biaya Baru
          </button>
        </div>

        <div className="space-y-2.5">
          {monthExpenses.length === 0 ? (
            <p className="text-xs text-center py-8 text-slate-500 dark:text-slate-400">Belum ada biaya operasional dicatat bulan ini.</p>
          ) : (
            monthExpenses.map((exp) => (
              <div
                key={exp.id}
                className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between text-xs gap-2 ${
                  darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {exp.category}
                  </span>
                  <p className="font-bold text-xs mt-1 text-slate-900 dark:text-slate-100 truncate">{exp.description}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{exp.date} • {exp.recordedBy}</p>
                </div>
                <span className="font-black text-rose-600 dark:text-rose-500 text-xs sm:text-sm flex-shrink-0">
                  -{formatCurrency(exp.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-blue-100 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-extrabold text-base">Catat Pengeluaran Operasional</h4>
              <button onClick={() => setShowExpenseModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Kategori Pengeluaran</label>
                <select
                  value={expenseCat}
                  onChange={(e) => setExpenseCat(e.target.value as Expense['category'])}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="SEWA">Sewa Tempat / Ruko</option>
                  <option value="LISTRIK_AIR">Tagihan Listrik & Air</option>
                  <option value="GAJI">Gaji Karyawan Toko</option>
                  <option value="OPERASIONAL">Peralatan & Operasional Toko</option>
                  <option value="MARKETING">Iklan & Promosi</option>
                  <option value="LAINNYA">Lain-Lain</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Nominal Biaya (Rp)</label>
                <input
                  type="number"
                  value={expenseAmount || ''}
                  onChange={(e) => setExpenseAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className={`w-full px-3 py-2 rounded-xl border font-bold text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-rose-400' : 'bg-slate-50 border-slate-200 text-rose-600'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Keterangan / Deskripsi</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Contoh: Tagihan Listrik Toko Bulan Ini"
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold ${
                    darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveExpense}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Simpan Biaya
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
