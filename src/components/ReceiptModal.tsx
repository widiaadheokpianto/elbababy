import React, { useState } from 'react';
import { 
  Printer, 
  Bluetooth, 
  Share2, 
  CheckCircle2, 
  X, 
  Store, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { SaleOrder } from '../types';
import { formatCurrency, generateTextReceipt, printToBluetoothThermal } from '../lib/printer';

interface ReceiptModalProps {
  order: SaleOrder | null;
  onClose: () => void;
  darkMode: boolean;
  bluetoothConnected: boolean;
  bluetoothName: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  onClose,
  darkMode,
  bluetoothConnected,
  bluetoothName,
}) => {
  const [isPrintingBt, setIsPrintingBt] = useState(false);
  const [printStatusMsg, setPrintStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!order) return null;

  // Handle Bluetooth Thermal Print
  const handleBluetoothPrint = async () => {
    setIsPrintingBt(true);
    setPrintStatusMsg(null);
    try {
      await printToBluetoothThermal(order);
      setPrintStatusMsg({ type: 'success', text: 'Struk berhasil dikirim ke Bluetooth Thermal Printer!' });
    } catch (err: any) {
      setPrintStatusMsg({ type: 'error', text: err.message || 'Gagal mencetak ke Bluetooth printer.' });
    } finally {
      setIsPrintingBt(false);
    }
  };

  // Standard Browser Print
  const handleStandardPrint = () => {
    window.print();
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    const rawText = generateTextReceipt(order);
    const encoded = encodeURIComponent(rawText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all my-8 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-blue-100 text-slate-800'
      }`}>
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <h3 className="font-extrabold text-lg">Transaksi Berhasil!</h3>
              <p className="text-xs text-blue-100">No. Nota: {order.invoiceNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {printStatusMsg && (
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center space-x-2 ${
            printStatusMsg.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{printStatusMsg.text}</span>
          </div>
        )}

        {/* Print Template Container (Styled Thermal Receipt 58mm) */}
        <div className="p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div 
            id="thermal-receipt-printable" 
            className="w-full max-w-[300px] p-4 bg-white text-slate-900 font-mono text-[11px] leading-tight shadow-md rounded-lg border border-slate-200"
          >
            {/* Header Store */}
            <div className="text-center font-bold">
              <p className="text-sm tracking-wider uppercase">ELBABABY</p>
              <p className="text-[10px] font-normal">Perlengkapan Bayi & Anak</p>
              <p className="text-[10px] font-normal text-slate-600">Jl. Raya Utama No. 88, Kota</p>
              <p className="text-[10px] font-normal text-slate-600">Telp/WA: 0812-3456-7890</p>
            </div>

            <div className="my-2 border-b border-dashed border-slate-300" />

            {/* Info */}
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span>No:</span>
                <span className="font-bold">{order.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Tgl:</span>
                <span>{new Date(order.date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{order.cashierName}</span>
              </div>
              {order.customerName && (
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{order.customerName}</span>
                </div>
              )}
              {order.orderType && (
                <div className="flex justify-between">
                  <span>Tipe:</span>
                  <span className="font-bold">{order.orderType === 'ONLINE' ? 'Online' : 'Offline / Toko'}</span>
                </div>
              )}
              {order.notes && (
                <div className="flex justify-between">
                  <span>Catatan:</span>
                  <span className="italic">{order.notes}</span>
                </div>
              )}
            </div>

            <div className="my-2 border-b border-dashed border-slate-300" />

            {/* Item Table */}
            <div className="space-y-1.5">
              {order.items.map((item, idx) => (
                <div key={idx}>
                  <p className="font-bold">{item.productName}</p>
                  <div className="flex justify-between text-slate-700">
                    <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(item.subtotal)}</span>
                  </div>
                  {item.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 text-[10px]">
                      <span>Diskon</span>
                      <span>-{formatCurrency(item.discountAmount)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="my-2 border-b border-dashed border-slate-300" />

            {/* Summary */}
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon Transaksi</span>
                  <span>-{formatCurrency(order.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-xs my-1 pt-1 border-t border-slate-300">
                <span>TOTAL</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Bayar ({order.paymentMethod})</span>
                <span>{formatCurrency(order.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Kembali</span>
                <span>{formatCurrency(order.changeAmount)}</span>
              </div>
            </div>

            <div className="my-3 border-b border-dashed border-slate-300" />

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-600 space-y-0.5">
              <p className="font-bold">Terima Kasih Telah Berbelanja</p>
              <p className="font-bold">di Elbababy Store!</p>
              <p className="italic text-[9px] mt-1">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="p-4 sm:p-6 space-y-3">
          {/* Bluetooth Thermal Print Button */}
          <button
            onClick={handleBluetoothPrint}
            disabled={isPrintingBt}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md ${
              bluetoothConnected
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            <Bluetooth className="w-4 h-4 text-blue-300 animate-pulse" />
            <span>
              {isPrintingBt
                ? 'Mengirim ke Bluetooth Printer...'
                : bluetoothConnected
                ? `Cetak ke Bluetooth Thermal (${bluetoothName || 'Printer'})`
                : 'Cetak ke Bluetooth Printer (Klik untuk Sambungkan)'}
            </span>
          </button>

          {/* Standard Browser Print & WhatsApp Share */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleStandardPrint}
              className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 ${
                darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Thermal LPT/USB</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20"
            >
              <Share2 className="w-4 h-4" />
              <span>Kirim Struk WA</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-center text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Tutup & Lanjut Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
};
