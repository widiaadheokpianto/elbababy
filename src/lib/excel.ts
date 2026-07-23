import * as XLSX from 'xlsx';
import { SaleOrder, Product, Expense } from '../types';
import { formatCurrency } from './printer';

export function exportDailySalesToExcel(
  orders: SaleOrder[],
  selectedDateStr: string = new Date().toISOString().split('T')[0]
) {
  const rows = orders.map((ord, idx) => ({
    No: idx + 1,
    Invoice: ord.invoiceNo,
    Tanggal: new Date(ord.date).toLocaleString('id-ID'),
    Kasir: ord.cashierName,
    Pelanggan: ord.customerName || 'Pelanggan Umum',
    MetodePembayaran: ord.paymentMethod,
    JumlahItem: ord.items.reduce((sum, item) => sum + item.quantity, 0),
    Subtotal: ord.subtotal,
    Diskon: ord.discountTotal,
    TotalPenjualan: ord.totalAmount,
    TotalHPP: ord.totalCost,
    LabaKotor: ord.grossProfit,
  }));

  // Summary row
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCost = orders.reduce((sum, o) => sum + o.totalCost, 0);
  const totalGrossProfit = orders.reduce((sum, o) => sum + o.grossProfit, 0);

  const summaryRow = {
    No: '',
    Invoice: 'TOTAL KESELURUHAN',
    Tanggal: '',
    Kasir: '',
    Pelanggan: '',
    MetodePembayaran: '',
    JumlahItem: '',
    Subtotal: '',
    Diskon: '',
    TotalPenjualan: totalRevenue,
    TotalHPP: totalCost,
    LabaKotor: totalGrossProfit,
  };

  const worksheet = XLSX.utils.json_to_sheet([...rows, summaryRow]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Penjualan');

  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // Invoice
    { wch: 22 }, // Tanggal
    { wch: 16 }, // Kasir
    { wch: 20 }, // Pelanggan
    { wch: 18 }, // Metode
    { wch: 12 }, // Item
    { wch: 14 }, // Subtotal
    { wch: 12 }, // Diskon
    { wch: 16 }, // Total
    { wch: 16 }, // HPP
    { wch: 16 }, // Laba
  ];

  XLSX.writeFile(workbook, `Elbababy_Laporan_Penjualan_${selectedDateStr}.xlsx`);
}

export function exportInventoryToExcel(products: Product[]) {
  const rows = products.map((p, idx) => {
    const totalAssetVal = p.stock * p.buyPrice;
    const potentialRevenue = p.stock * p.sellPrice;
    return {
      No: idx + 1,
      SKU: p.sku,
      NamaProduk: p.name,
      Kategori: p.categoryId,
      StokSaatIni: p.stock,
      Satuan: p.unit,
      StokMinimum: p.minStock,
      StatusStok: p.stock <= p.minStock ? 'PERINGATAN MEMINIMUM' : 'Aman',
      HPP_RataRata: p.buyPrice,
      HargaJual: p.sellPrice,
      TotalNilaiAsetHPP: totalAssetVal,
      EkspektasiOmzet: potentialRevenue,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok Produk Elbababy');

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 35 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
  ];

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Elbababy_Laporan_Stok_${dateStr}.xlsx`);
}

export function exportFinancialStatementToExcel(
  periodLabel: string,
  orders: SaleOrder[],
  expenses: Expense[]
) {
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCOGS = orders.reduce((sum, o) => sum + o.totalCost, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const financialSummary = [
    { Komponen: 'PENDAPATAN (REVENUE)', Nominal: totalRevenue, Catatan: 'Total penjualan kotor dikurangi diskon' },
    { Komponen: 'BEBAN HPP (COGS)', Nominal: totalCOGS, Catatan: 'Berdasarkan HPP Rata-Rata Terhitung' },
    { Komponen: 'LABA KOTOR (GROSS PROFIT)', Nominal: grossProfit, Catatan: 'Pendapatan - HPP' },
    { Komponen: 'TOTAL OPERASIONAL / EXPENSE', Nominal: totalExpenses, Catatan: 'Sewa, listrik, gaji & operasional toko' },
    { Komponen: 'LABA BERSIH (NET PROFIT)', Nominal: netProfit, Catatan: 'Laba Kotor - Operasional' },
  ];

  const expenseRows = expenses.map((e, idx) => ({
    No: idx + 1,
    Tanggal: e.date,
    Kategori: e.category,
    Deskripsi: e.description,
    Nominal: e.amount,
    DicatatOleh: e.recordedBy,
  }));

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summarySheet = XLSX.utils.json_to_sheet(financialSummary);
  summarySheet['!cols'] = [{ wch: 32 }, { wch: 18 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Laba Rugi');

  // Sheet 2: Expenses Detail
  const expenseSheet = XLSX.utils.json_to_sheet(expenseRows);
  expenseSheet['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 18 }, { wch: 35 }, { wch: 16 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Rincian Pengeluaran');

  XLSX.writeFile(workbook, `Elbababy_Laporan_Keuangan_${periodLabel.replace(/\s+/g, '_')}.xlsx`);
}
