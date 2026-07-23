import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Bluetooth, 
  Database, 
  Bell, 
  Moon, 
  Sun, 
  BarChart3, 
  Package, 
  Receipt, 
  DollarSign, 
  AlertTriangle,
  X,
  Store
} from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../lib/printer';
import { ElbababyLogo } from './ElbababyLogo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  lowStockProducts: Product[];
  bluetoothConnected: boolean;
  bluetoothName: string;
  onOpenBluetoothModal: () => void;
  onOpenSupabaseModal: () => void;
  supabaseConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  lowStockProducts,
  bluetoothConnected,
  bluetoothName,
  onOpenBluetoothModal,
  onOpenSupabaseModal,
  supabaseConnected,
}) => {
  const [showLowStockDrawer, setShowLowStockDrawer] = useState(false);

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
      darkMode ? 'bg-slate-950/90 border-slate-800/80 text-slate-100' : 'bg-white/90 border-slate-200/70 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Store Brand */}
          <div className="flex items-center space-x-2 cursor-pointer py-1" onClick={() => setActiveTab('pos')}>
            <ElbababyLogo height={32} />
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md self-center ${
              darkMode ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-blue-50 text-blue-700 border border-blue-100'
            }`}>
              POS
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {[
              { id: 'pos', label: 'Kasir', icon: Store },
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'stock', label: 'Stok', icon: Package, badge: lowStockProducts.length },
              { id: 'daily-sales', label: 'Laporan', icon: Receipt },
              { id: 'finance', label: 'Keuangan', icon: DollarSign },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : darkMode
                      ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-1.5">
            {/* Stock Notification Bell */}
            <div className="relative">
              <button
                id="btn-stock-alerts"
                onClick={() => setShowLowStockDrawer(!showLowStockDrawer)}
                className={`p-2 rounded-lg relative transition-colors ${
                  lowStockProducts.length > 0
                    ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                    : darkMode
                    ? 'text-slate-400 hover:bg-slate-900'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="Peringatan Stok"
              >
                <Bell className="w-4 h-4" />
                {lowStockProducts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                )}
              </button>

              {/* Low Stock Dropdown */}
              {showLowStockDrawer && (
                <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border p-4 z-50 ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <h4 className="font-bold text-xs">Stok Kritis ({lowStockProducts.length})</h4>
                    </div>
                    <button
                      onClick={() => setShowLowStockDrawer(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 max-h-56 overflow-y-auto space-y-2 text-xs">
                    {lowStockProducts.length === 0 ? (
                      <p className="text-center py-4 text-emerald-500 font-medium">Stok dalam kondisi aman</p>
                    ) : (
                      lowStockProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className={`p-2 rounded-xl border flex items-center justify-between ${
                            darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                          }`}
                        >
                          <div className="pr-2">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{prod.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">SKU: {prod.sku}</p>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500 text-white">
                            Sisa {prod.stock}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {lowStockProducts.length > 0 && (
                    <button
                      onClick={() => {
                        setShowLowStockDrawer(false);
                        setActiveTab('stock');
                      }}
                      className="w-full mt-3 py-1.5 text-xs font-semibold text-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-xl"
                    >
                      Kelola Stok →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bluetooth Indicator */}
            <button
              id="btn-bluetooth-settings"
              onClick={onOpenBluetoothModal}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                bluetoothConnected
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold'
                  : darkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-400'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
              title="Printer Bluetooth"
            >
              <div className="flex items-center space-x-1.5">
                <Bluetooth className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {bluetoothConnected ? (bluetoothName || 'Printer') : 'BT Printer'}
                </span>
              </div>
            </button>

            {/* Supabase Cloud Indicator */}
            <button
              id="btn-supabase-settings"
              onClick={onOpenSupabaseModal}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                supabaseConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                  : darkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-400'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
              title="Database Cloud Sync"
            >
              <div className="flex items-center space-x-1.5">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {supabaseConnected ? 'Cloud Sync' : 'Local DB'}
                </span>
              </div>
            </button>

            {/* Dark Mode Toggle */}
            <button
              id="btn-darkmode-toggle"
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              }`}
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

