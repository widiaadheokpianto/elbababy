import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { POS } from './components/POS';
import { Dashboard } from './components/Dashboard';
import { StockManagement } from './components/StockManagement';
import { DailySales } from './components/DailySales';
import { FinancialReport } from './components/FinancialReport';
import { ReceiptModal } from './components/ReceiptModal';
import { BluetoothSettingsModal } from './components/BluetoothSettingsModal';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';

import { Product, Category, StockLog, SaleOrder, Expense } from './types';
import { LocalStorageManager, DataController } from './lib/storage';
import { getStoredSupabaseConfig } from './lib/supabase';
import { getActiveBluetoothState } from './lib/printer';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('elbababy_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  // State Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [saleOrders, setSaleOrders] = useState<SaleOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Connectivity States
  const [bluetoothConnected, setBluetoothConnected] = useState<boolean>(false);
  const [bluetoothName, setBluetoothName] = useState<string>('');
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(() => {
    return getStoredSupabaseConfig().isConnected;
  });

  // Modals
  const [receiptOrder, setReceiptOrder] = useState<SaleOrder | null>(null);
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // Sync Dark Mode to document HTML body class
  useEffect(() => {
    localStorage.setItem('elbababy_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load Initial Data
  const refreshAllData = async () => {
    const loadedCategories = LocalStorageManager.getCategories();
    const loadedProducts = await DataController.getProducts();
    const loadedLogs = LocalStorageManager.getStockLogs();
    const loadedOrders = LocalStorageManager.getSaleOrders();
    const loadedExpenses = LocalStorageManager.getExpenses();

    setCategories(loadedCategories);
    setProducts(loadedProducts);
    setStockLogs(loadedLogs);
    setSaleOrders(loadedOrders);
    setExpenses(loadedExpenses);

    // Update Bluetooth state
    const btState = getActiveBluetoothState();
    setBluetoothConnected(btState.isConnected);
    setBluetoothName(btState.deviceName);
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Low Stock Items
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  // Handle Checkout Completion
  const handleCheckoutComplete = async (orderData: SaleOrder) => {
    try {
      const createdOrder = await DataController.createSaleOrder(orderData);
      await refreshAllData();
      setReceiptOrder(createdOrder);
      showToast(`Transaksi ${createdOrder.invoiceNo} berhasil diproses!`);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan transaksi.');
    }
  };

  return (
    <div className={`min-h-screen transition-colors font-sans ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        lowStockProducts={lowStockProducts}
        bluetoothConnected={bluetoothConnected}
        bluetoothName={bluetoothName}
        onOpenBluetoothModal={() => setIsBluetoothModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        supabaseConnected={supabaseConnected}
      />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl animate-bounce flex items-center space-x-2">
          <span>✓ {toastMsg}</span>
        </div>
      )}

      {/* Main Page View Router */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'pos' && (
          <POS
            products={products}
            categories={categories}
            darkMode={darkMode}
            onCheckoutComplete={handleCheckoutComplete}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            products={products}
            orders={saleOrders}
            expenses={expenses}
            darkMode={darkMode}
            onNavigateTo={setActiveTab}
            onOpenStockInModal={() => {
              setActiveTab('stock');
            }}
          />
        )}

        {activeTab === 'stock' && (
          <StockManagement
            products={products}
            categories={categories}
            stockLogs={stockLogs}
            darkMode={darkMode}
            onRefreshData={refreshAllData}
          />
        )}

        {activeTab === 'daily-sales' && (
          <DailySales
            orders={saleOrders}
            darkMode={darkMode}
            onOpenReceipt={(ord) => setReceiptOrder(ord)}
          />
        )}

        {activeTab === 'finance' && (
          <FinancialReport
            orders={saleOrders}
            expenses={expenses}
            darkMode={darkMode}
            onRefreshData={refreshAllData}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        lowStockCount={lowStockProducts.length}
      />

      {/* Receipts Thermal Printer Popup */}
      <ReceiptModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
        darkMode={darkMode}
        bluetoothConnected={bluetoothConnected}
        bluetoothName={bluetoothName}
      />

      {/* Bluetooth Setup Modal */}
      <BluetoothSettingsModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
        darkMode={darkMode}
        bluetoothConnected={bluetoothConnected}
        bluetoothName={bluetoothName}
        onStatusChanged={(conn, name) => {
          setBluetoothConnected(conn);
          setBluetoothName(name);
        }}
      />

      {/* Supabase Cloud Setup Modal */}
      <SupabaseSettingsModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        darkMode={darkMode}
        supabaseConnected={supabaseConnected}
        onStatusChanged={(conn) => setSupabaseConnected(conn)}
      />
    </div>
  );
}
