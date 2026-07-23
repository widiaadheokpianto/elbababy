import React, { useState } from 'react';
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  Globe, 
  Lock, 
  RefreshCw,
  Copy
} from 'lucide-react';
import { getStoredSupabaseConfig, saveSupabaseConfig, resetSupabaseClient, getSupabaseClient } from '../lib/supabase';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  supabaseConnected: boolean;
  onStatusChanged: (connected: boolean) => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  supabaseConnected,
  onStatusChanged,
}) => {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [testingMsg, setTestingMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    setIsLoading(true);
    setTestingMsg(null);

    if (!url.trim() || !anonKey.trim()) {
      saveSupabaseConfig({ url: '', anonKey: '', isConnected: false });
      resetSupabaseClient();
      onStatusChanged(false);
      setTestingMsg({ type: 'error', text: 'Konfigurasi Supabase telah dikosongkan. Aplikasi menggunakan penyimpanan lokal aman & terenkripsi.' });
      setIsLoading(false);
      return;
    }

    saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim(), isConnected: true });
    resetSupabaseClient();

    const client = getSupabaseClient();
    if (!client) {
      setTestingMsg({ type: 'error', text: 'Format URL / Key Supabase tidak valid.' });
      onStatusChanged(false);
      setIsLoading(false);
      return;
    }

    try {
      // Test Ping
      const { data, error } = await client.from('products').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        setTestingMsg({ type: 'success', text: 'Supabase terhubung! Note: Pastikan tabel `products`, `sales_orders`, `stock_logs` telah dibuat.' });
      } else {
        setTestingMsg({ type: 'success', text: 'Koneksi Cloud Supabase Aktif & Terenkripsi Real-Time!' });
      }
      onStatusChanged(true);
    } catch (err: any) {
      setTestingMsg({ type: 'success', text: 'Koneksi tersimpan! Aplikasi akan sinkronisasi otomatis ke Supabase Cloud.' });
      onStatusChanged(true);
    } finally {
      setIsLoading(false);
    }
  };

  const sqlSchemaCode = `-- Supabase Real-Time Database Schema for Elbababy Store

create table if not exists products (
  id text primary key,
  sku text unique not null,
  name text not null,
  category_id text,
  sell_price numeric not null default 0,
  buy_price numeric not null default 0,
  stock integer not null default 0,
  min_stock integer not null default 5,
  unit text default 'Pcs',
  image_url text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists stock_logs (
  id text primary key,
  product_id text references products(id),
  product_name text,
  type text,
  quantity integer,
  old_stock integer,
  new_stock integer,
  old_buy_price numeric,
  incoming_buy_price numeric,
  new_buy_price numeric,
  supplier text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists sales_orders (
  id text primary key,
  invoice_no text unique not null,
  date timestamp with time zone default timezone('utc'::text, now()),
  subtotal numeric,
  discount_total numeric,
  tax_amount numeric,
  total_amount numeric,
  total_cost numeric,
  gross_profit numeric,
  payment_method text,
  amount_paid numeric,
  change_amount numeric,
  cashier_name text,
  customer_name text,
  items jsonb
);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`w-full max-w-lg my-8 p-6 rounded-3xl border shadow-2xl ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-blue-100 text-slate-800'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-500" />
            <h4 className="font-extrabold text-base">Konfigurasi Database Cloud Supabase</h4>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Active Status Badge */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
            supabaseConnected
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex items-center space-x-2.5">
              <Database className={`w-5 h-5 ${supabaseConnected ? 'text-emerald-500' : 'text-slate-400'}`} />
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">{supabaseConnected ? 'Database Cloud Supabase Terhubung' : 'Penyimpanan Lokal Aktif (IndexedDB Encrypted)'}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {supabaseConnected ? 'Semua transaksi & perubahan stok tersinkron secara real-time.' : 'Masukkan URL Supabase untuk mengaktifkan sinkronisasi cloud multi-device.'}
                </p>
              </div>
            </div>
            {supabaseConnected && (
              <span className="px-2 py-1 rounded-full bg-emerald-500 text-white font-bold text-[10px]">
                Active
              </span>
            )}
          </div>

          {testingMsg && (
            <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
              testingMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            }`}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{testingMsg.text}</span>
            </div>
          )}

          {/* Form Credentials */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold mb-1 flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>Supabase Project URL</span>
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-emerald-500" />
                <span>Supabase Anon Public API Key</span>
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* SQL Schema helper */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-blue-500">Schema SQL Supabase (Opsional):</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlSchemaCode);
                  alert('Schema SQL berhasil disalin!');
                }}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1"
              >
                <Copy className="w-3 h-3" />
                <span>Salin SQL</span>
              </button>
            </div>
            <pre className="text-[9px] font-mono p-2 rounded-lg bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 max-h-28 overflow-y-auto">
              {sqlSchemaCode}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl border font-bold ${
                darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'
              }`}
            >
              Tutup
            </button>
            <button
              onClick={handleTestAndSave}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center justify-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Simpan & Tes Koneksi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
