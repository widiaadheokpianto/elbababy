import React, { useState } from 'react';
import { 
  Bluetooth, 
  X, 
  CheckCircle2, 
  Printer, 
  RefreshCw, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { 
  connectBluetoothPrinter, 
  disconnectBluetoothPrinter, 
  getActiveBluetoothState, 
  isWebBluetoothSupported 
} from '../lib/printer';

interface BluetoothSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  bluetoothConnected: boolean;
  bluetoothName: string;
  onStatusChanged: (connected: boolean, name: string) => void;
}

export const BluetoothSettingsModal: React.FC<BluetoothSettingsModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  bluetoothConnected,
  bluetoothName,
  onStatusChanged,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const supported = isWebBluetoothSupported();

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg('');
    try {
      const state = await connectBluetoothPrinter();
      onStatusChanged(state.isConnected, state.deviceName);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal terhubung dengan Bluetooth printer.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectBluetoothPrinter();
    onStatusChanged(false, '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-blue-100 text-slate-800'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Bluetooth className="w-5 h-5 text-blue-500" />
            <h4 className="font-extrabold text-base">Koneksi Bluetooth Thermal Printer</h4>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Status Box */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            bluetoothConnected
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${bluetoothConnected ? 'bg-blue-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'}`}>
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{bluetoothConnected ? bluetoothName : 'Belum Terhubung'}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {bluetoothConnected ? 'Status: Siap Mencetak Struk Kasir (ESC/POS)' : 'Pilih printer thermal bluetooth Android / POS'}
                </p>
              </div>
            </div>

            {bluetoothConnected ? (
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-[11px]"
              >
                Putuskan
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
              >
                {isConnecting ? 'Mencari...' : 'Hubungkan'}
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <div className="space-y-1">
                <p className="font-bold">Gagal Menghubungkan Bluetooth</p>
                <p className="text-[11px] leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Guide Instructions */}
          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 space-y-2">
            <p className="font-bold text-blue-700 dark:text-blue-300 flex items-center space-x-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Panduan Printer Thermal Bluetooth:</span>
            </p>
            <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-1 pl-1 text-[11px] leading-relaxed">
              <li>Nyalakan Bluetooth pada HP/Tablet kasir Anda & printer thermal (58mm / 80mm).</li>
              <li>Sandingkan (Pair) printer di Pengaturan Bluetooth perangkat Anda (PIN default: <code className="font-bold">0000</code> / <code className="font-bold">1234</code>).</li>
              <li>Jika menggunakan pratinjau iFrame, klik tombol <b>"Buka di Tab Baru"</b> di pojok kanan atas aplikasi agar peramban memberikan izin akses penuh ke Bluetooth.</li>
              <li>Klik tombol <b>"Hubungkan"</b> di atas lalu pilih perangkat printer dari daftar pop-up.</li>
            </ol>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
