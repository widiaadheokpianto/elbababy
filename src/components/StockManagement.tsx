import React, { useState } from 'react';
import { 
  Plus, 
  Package, 
  ArrowDownRight, 
  ArrowUpRight, 
  AlertTriangle, 
  Search, 
  Edit, 
  Layers, 
  Calculator, 
  FileText, 
  Tag, 
  X,
  CheckCircle2,
  Filter,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Product, Category, StockLog } from '../types';
import { formatCurrency } from '../lib/printer';
import { calculateMovingAverageCost, LocalStorageManager, DataController } from '../lib/storage';

interface StockManagementProps {
  products: Product[];
  categories: Category[];
  stockLogs: StockLog[];
  darkMode: boolean;
  onRefreshData: () => void;
  openStockInModalDirectly?: boolean;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  products,
  categories,
  stockLogs,
  darkMode,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'logs' | 'categories'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Stock In Modal (Stok Masuk HPP Rata-rata)
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [selectedStockInProduct, setSelectedStockInProduct] = useState<Product | null>(null);
  const [incomingQty, setIncomingQty] = useState<number>(1);
  const [incomingBuyPrice, setIncomingBuyPrice] = useState<number>(0);
  const [supplierName, setSupplierName] = useState('');
  const [stockInNotes, setStockInNotes] = useState('');

  // Stock Out Modal
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [selectedStockOutProduct, setSelectedStockOutProduct] = useState<Product | null>(null);
  const [outgoingQty, setOutgoingQty] = useState<number>(1);
  const [stockOutNotes, setStockOutNotes] = useState('Rusak / Kedaluwarsa');

  // Product Form State
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSellPrice, setFormSellPrice] = useState(0);
  const [formBuyPrice, setFormBuyPrice] = useState(0);
  const [formStock, setFormStock] = useState(0);
  const [formMinStock, setFormMinStock] = useState(5);
  const [formUnit, setFormUnit] = useState('Pcs');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');

  // Open Product Modal
  const handleOpenProductModal = (productToEdit?: Product) => {
    if (productToEdit) {
      setEditingProduct(productToEdit);
      setFormSku(productToEdit.sku);
      setFormName(productToEdit.name);
      setFormCategory(productToEdit.categoryId);
      setFormSellPrice(productToEdit.sellPrice);
      setFormBuyPrice(productToEdit.buyPrice);
      setFormStock(productToEdit.stock);
      setFormMinStock(productToEdit.minStock);
      setFormUnit(productToEdit.unit);
      setFormDesc(productToEdit.description || '');
      setFormImage(productToEdit.imageUrl || '');
    } else {
      setEditingProduct(null);
      setFormSku('ELBA-' + (products.length + 1).toString().padStart(3, '0'));
      setFormName('');
      setFormCategory(categories[0]?.id || 'cat-1');
      setFormSellPrice(0);
      setFormBuyPrice(0);
      setFormStock(0);
      setFormMinStock(5);
      setFormUnit('Pcs');
      setFormDesc('');
      setFormImage('');
    }
    setShowProductModal(true);
  };

  // Save Product
  const handleSaveProduct = () => {
    if (!formName.trim()) {
      alert('Nama produk wajib diisi!');
      return;
    }

    const allProducts = LocalStorageManager.getProducts();

    if (editingProduct) {
      const idx = allProducts.findIndex((p) => p.id === editingProduct.id);
      if (idx !== -1) {
        allProducts[idx] = {
          ...editingProduct,
          sku: formSku,
          name: formName,
          categoryId: formCategory,
          sellPrice: formSellPrice,
          buyPrice: formBuyPrice,
          stock: formStock,
          minStock: formMinStock,
          unit: formUnit,
          description: formDesc,
          imageUrl: formImage,
          updatedAt: new Date().toISOString(),
        };
      }
    } else {
      const newProd: Product = {
        id: 'prod-' + Date.now(),
        sku: formSku,
        name: formName,
        categoryId: formCategory,
        sellPrice: formSellPrice,
        buyPrice: formBuyPrice,
        stock: formStock,
        minStock: formMinStock,
        unit: formUnit,
        description: formDesc,
        imageUrl: formImage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      allProducts.unshift(newProd);
    }

    LocalStorageManager.saveProducts(allProducts);
    setShowProductModal(false);
    onRefreshData();
  };

  // Save New Category
  const handleSaveCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Nama kategori wajib diisi!');
      return;
    }
    const currentCats = LocalStorageManager.getCategories();
    const newCat: Category = {
      id: 'cat-' + Date.now(),
      name: newCategoryName.trim(),
      description: newCategoryDesc.trim() || 'Kategori produk bayi',
      color: '#2563eb',
    };
    currentCats.push(newCat);
    LocalStorageManager.saveCategories(currentCats);
    setNewCategoryName('');
    setNewCategoryDesc('');
    setShowCategoryModal(false);
    onRefreshData();
  };

  // Open Stock In Modal
  const handleOpenStockIn = (product: Product) => {
    setSelectedStockInProduct(product);
    setIncomingQty(10);
    setIncomingBuyPrice(product.buyPrice);
    setSupplierName('');
    setStockInNotes('Restok dari supplier');
    setShowStockInModal(true);
  };

  // Process Stock In with Moving Average HPP
  const handleProcessStockIn = async () => {
    if (!selectedStockInProduct) return;
    if (incomingQty <= 0) {
      alert('Jumlah stok masuk harus lebih dari 0!');
      return;
    }

    try {
      await DataController.addStockIncoming(
        selectedStockInProduct.id,
        incomingQty,
        incomingBuyPrice,
        supplierName.trim() || 'Supplier Umum',
        stockInNotes.trim()
      );
      setShowStockInModal(false);
      onRefreshData();
      alert(`Stok masuk berhasil dicatat! HPP rata-rata baru dihitung otomatis.`);
    } catch (e: any) {
      alert(e.message || 'Gagal memproses stok masuk.');
    }
  };

  // Open Stock Out Modal
  const handleOpenStockOut = (product: Product) => {
    setSelectedStockOutProduct(product);
    setOutgoingQty(1);
    setStockOutNotes('Barang Rusak / Display');
    setShowStockOutModal(true);
  };

  // Process Stock Out
  const handleProcessStockOut = async () => {
    if (!selectedStockOutProduct) return;
    if (outgoingQty <= 0) {
      alert('Jumlah stok keluar harus lebih dari 0!');
      return;
    }

    try {
      await DataController.addStockOutgoing(
        selectedStockOutProduct.id,
        outgoingQty,
        stockOutNotes
      );
      setShowStockOutModal(false);
      onRefreshData();
      alert('Stok keluar berhasil dicatat.');
    } catch (e: any) {
      alert(e.message || 'Gagal memproses stok keluar.');
    }
  };

  // Filtered Inventory List
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchLow = !showLowStockOnly || p.stock <= p.minStock;
    return matchSearch && matchCat && matchLow;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className={`p-4 rounded-2xl border ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Stok & Katalog Produk</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Kelola persediaan barang, batas minimum stok, dan kalkulasi HPP Rata-Rata.
              </p>
            </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-add-category"
              onClick={() => setShowCategoryModal(true)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>+ Kategori</span>
            </button>

            <button
              id="btn-add-product"
              onClick={() => handleOpenProductModal()}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Produk</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all flex-shrink-0 ${
            activeTab === 'inventory'
              ? 'bg-blue-600 text-white shadow-md'
              : darkMode
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-600 hover:text-blue-600'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Katalog Stok ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all flex-shrink-0 ${
            activeTab === 'logs'
              ? 'bg-blue-600 text-white shadow-md'
              : darkMode
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-600 hover:text-blue-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Riwayat Mutasi ({stockLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all flex-shrink-0 ${
            activeTab === 'categories'
              ? 'bg-blue-600 text-white shadow-md'
              : darkMode
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-600 hover:text-blue-600'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Kategori ({categories.length})</span>
        </button>
      </div>

      {/* TAB 1: INVENTORY CATALOG */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className={`p-3 sm:p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100'
          }`}>
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari SKU atau nama produk..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`flex-1 md:flex-initial px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="all" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">{c.name}</option>
                ))}
              </select>

              {/* Low Stock Toggle Button */}
              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center space-x-1.5 whitespace-nowrap ${
                  showLowStockOnly
                    ? 'bg-amber-500 text-white border-amber-500'
                    : darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Stok Kritis</span>
              </button>
            </div>
          </div>

          {/* MOBILE CARDS VIEW (< md) */}
          <div className="block md:hidden space-y-3">
            {filteredProducts.length === 0 ? (
              <div className={`text-center py-10 rounded-2xl border ${
                darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-blue-100 text-slate-500'
              }`}>
                <Package className="w-8 h-8 mx-auto mb-1 text-blue-400 opacity-60" />
                <p className="text-xs font-bold">Tidak ada produk ditemukan.</p>
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const isLow = prod.stock <= prod.minStock;
                const isOutOfStock = prod.stock <= 0;
                const catName = categories.find((c) => c.id === prod.categoryId)?.name || 'Umum';

                return (
                  <div
                    key={prod.id}
                    className={`p-3.5 rounded-2xl border space-y-3 transition-all ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100 shadow-sm'
                    } ${isLow ? (darkMode ? 'border-amber-900/50 bg-amber-950/10' : 'border-amber-200 bg-amber-50/20') : ''}`}
                  >
                    {/* Header: Name + SKU */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                            SKU: {prod.sku}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOutOfStock
                              ? 'bg-rose-500 text-white'
                              : isLow
                              ? 'bg-amber-500 text-white animate-pulse'
                              : darkMode
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            Stok: {prod.stock} {prod.unit}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 mt-0.5 line-clamp-2">
                          {prod.name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {catName}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            Min Stok: {prod.minStock}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Info */}
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">HPP Rata-Rata</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {formatCurrency(prod.buyPrice)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Harga Jual</span>
                        <span className="font-extrabold text-blue-600 dark:text-blue-400">
                          {formatCurrency(prod.sellPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => handleOpenStockIn(prod)}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1 shadow-sm active:scale-95 transition-all"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        <span>+ Stok Masuk</span>
                      </button>

                      <button
                        onClick={() => handleOpenStockOut(prod)}
                        className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center space-x-1 active:scale-95 transition-all"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Keluar</span>
                      </button>

                      <button
                        onClick={() => handleOpenProductModal(prod)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-500"
                        title="Edit Produk"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP TABLE CONTAINER (>= md) */}
          <div className={`hidden md:block rounded-3xl border overflow-hidden ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100 shadow-sm'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b ${
                    darkMode ? 'bg-slate-800/80 border-slate-800 text-slate-300' : 'bg-blue-50/70 border-blue-100 text-slate-700'
                  }`}>
                    <th className="p-3.5 font-bold">Produk & SKU</th>
                    <th className="p-3.5 font-bold">Kategori</th>
                    <th className="p-3.5 font-bold text-center">Stok & Batas Min</th>
                    <th className="p-3.5 font-bold">HPP Rata-Rata</th>
                    <th className="p-3.5 font-bold">Harga Jual</th>
                    <th className="p-3.5 font-bold text-right">Aksi Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500 dark:text-slate-400">
                        Tidak ada produk ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => {
                      const isLow = prod.stock <= prod.minStock;
                      const catName = categories.find((c) => c.id === prod.categoryId)?.name || 'Umum';

                      return (
                        <tr
                          key={prod.id}
                          className={`hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition-colors ${
                            isLow ? (darkMode ? 'bg-amber-950/20' : 'bg-amber-50/30') : ''
                          }`}
                        >
                          <td className="p-3.5 font-semibold">
                            <div>
                              <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{prod.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">SKU: {prod.sku}</p>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {catName}
                            </span>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isLow
                                  ? 'bg-amber-500 text-white animate-pulse'
                                  : darkMode
                                  ? 'bg-emerald-950 text-emerald-300'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {prod.stock} {prod.unit}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Min: {prod.minStock}
                              </span>
                            </div>
                          </td>

                          <td className="p-3.5 font-bold text-slate-600 dark:text-slate-300">
                            {formatCurrency(prod.buyPrice)}
                          </td>

                          <td className="p-3.5 font-black text-blue-600 dark:text-blue-400">
                            {formatCurrency(prod.sellPrice)}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Stock In Button */}
                              <button
                                onClick={() => handleOpenStockIn(prod)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-bold flex items-center space-x-1 shadow-sm hover:bg-emerald-600 transition-colors"
                                title="Tambah Stok Masuk & Hitung HPP Rata-Rata"
                              >
                                <ArrowDownRight className="w-3.5 h-3.5" />
                                <span>Stok Masuk</span>
                              </button>

                              {/* Stock Out Button */}
                              <button
                                onClick={() => handleOpenStockOut(prod)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center space-x-1 hover:bg-rose-500 hover:text-white transition-colors"
                                title="Kurangi Stok (Rusak/Sample)"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span>Keluar</span>
                              </button>

                              {/* Edit Product Button */}
                              <button
                                onClick={() => handleOpenProductModal(prod)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800"
                                title="Edit Detail Produk"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK MOVEMENT LOGS */}
      {activeTab === 'logs' && (
        <div className={`p-4 sm:p-5 rounded-3xl border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100 shadow-sm'
        }`}>
          <h3 className="font-bold text-sm mb-4 text-slate-900 dark:text-slate-100">Riwayat Mutasi Stok & Supplier</h3>
          <div className="space-y-3">
            {stockLogs.length === 0 ? (
              <p className="text-xs text-center py-8 text-slate-500 dark:text-slate-400">Belum ada catatan mutasi stok.</p>
            ) : (
              stockLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className={`p-2 rounded-xl font-bold text-xs flex-shrink-0 ${
                      log.type === 'IN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {log.type === 'IN' ? <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{log.productName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {log.type === 'IN' ? `Supplier: ${log.supplier || 'Umum'}` : 'Stok Keluar'} • {new Date(log.createdAt).toLocaleString('id-ID')}
                      </p>
                      {log.notes && (
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 italic">Catatan: {log.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700/60">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                      log.type === 'IN' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {log.type === 'IN' ? '+' : '-'}{log.quantity}
                    </span>
                    {log.type === 'IN' && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 sm:mt-1">
                        HPP Baru: {formatCurrency(log.newBuyPrice)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORY MANAGER */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`p-4 rounded-2xl border ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#2563eb' }} />
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{cat.name}</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{cat.description || 'Tidak ada deskripsi.'}</p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-3">
                {products.filter((p) => p.categoryId === cat.id).length} Produk Terkait
              </p>
            </div>
          ))}
        </div>
      )}

      {/* STOCK IN MODAL (Harga Rata-Rata Otomatis) */}
      {showStockInModal && selectedStockInProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className={`w-full max-w-lg p-4 sm:p-6 rounded-3xl border shadow-2xl my-auto max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-blue-100 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-emerald-500" />
                <h4 className="font-extrabold text-base">Input Stok Masuk & HPP Rata-Rata</h4>
              </div>
              <button onClick={() => setShowStockInModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-semibold text-blue-500 mt-2">{selectedStockInProduct.name}</p>

            <div className="mt-4 space-y-4 text-xs">
              {/* Supplier Name */}
              <div>
                <label className="block font-bold mb-1">Nama Supplier / Distributor</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Contoh: PT Pigeon Indonesia / Distributor Surabaya"
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Incoming Qty */}
                <div>
                  <label className="block font-bold mb-1">Jumlah Masuk ({selectedStockInProduct.unit})</label>
                  <input
                    type="number"
                    value={incomingQty || ''}
                    onChange={(e) => setIncomingQty(Math.max(1, Number(e.target.value)))}
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                {/* Incoming Price from Supplier */}
                <div>
                  <label className="block font-bold mb-1">Harga Beli Supplier (Rp/pcs)</label>
                  <input
                    type="number"
                    value={incomingBuyPrice || ''}
                    onChange={(e) => setIncomingBuyPrice(Math.max(0, Number(e.target.value)))}
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {/* Real-time Moving Average Formula Preview Box */}
              {(() => {
                const calc = calculateMovingAverageCost(
                  selectedStockInProduct.stock,
                  selectedStockInProduct.buyPrice,
                  incomingQty,
                  incomingBuyPrice
                );

                return (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <p className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                      <Calculator className="w-4 h-4" />
                      <span>Simulasi Kalkulasi HPP Rata-Rata Otomatis</span>
                    </p>
                    <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span>Stok Lama: {selectedStockInProduct.stock} {selectedStockInProduct.unit} @ {formatCurrency(selectedStockInProduct.buyPrice)}</span>
                        <span>Total: {formatCurrency(selectedStockInProduct.stock * selectedStockInProduct.buyPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stok Baru: +{incomingQty} {selectedStockInProduct.unit} @ {formatCurrency(incomingBuyPrice)}</span>
                        <span>Total: {formatCurrency(incomingQty * incomingBuyPrice)}</span>
                      </div>
                      <div className="flex justify-between font-black text-emerald-700 dark:text-emerald-400 pt-1 border-t border-emerald-200 dark:border-emerald-800 text-xs">
                        <span>HPP RATA-RATA BARU</span>
                        <span>{formatCurrency(calc.newBuyPrice)} / {selectedStockInProduct.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Notes */}
              <div>
                <label className="block font-bold mb-1">Catatan / No. Faktur Supplier</label>
                <input
                  type="text"
                  value={stockInNotes}
                  onChange={(e) => setStockInNotes(e.target.value)}
                  placeholder="Contoh: Faktur #INV-SUP-998"
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowStockInModal(false)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold ${
                    darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  onClick={handleProcessStockIn}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-md"
                >
                  Simpan Stok Masuk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STOCK OUT MODAL */}
      {showStockOutModal && selectedStockOutProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className={`w-full max-w-md p-4 sm:p-6 rounded-3xl border shadow-2xl my-auto max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-blue-100 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-extrabold text-base">Catat Stok Keluar Non-Penjualan</h4>
              <button onClick={() => setShowStockOutModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-semibold text-rose-500 mt-2">{selectedStockOutProduct.name}</p>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Jumlah Keluar ({selectedStockOutProduct.unit})</label>
                <input
                  type="number"
                  value={outgoingQty}
                  onChange={(e) => setOutgoingQty(Math.max(1, Number(e.target.value)))}
                  className={`w-full px-3 py-2 rounded-xl border font-bold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Alasan Pengurangan Stok</label>
                <select
                  value={stockOutNotes}
                  onChange={(e) => setStockOutNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="Barang Rusak / Bocor">Barang Rusak / Bocor</option>
                  <option value="Kedaluwarsa (Expired)">Kedaluwarsa (Expired)</option>
                  <option value="Sampel / Tester Toko">Sampel / Tester Toko</option>
                  <option value="Display Area Toko">Display Area Toko</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowStockOutModal(false)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold ${
                    darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  onClick={handleProcessStockOut}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md"
                >
                  Proses Pengurangan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className={`w-full max-w-xl my-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl border shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-blue-100 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-extrabold text-base">
                {editingProduct ? 'Edit Detail Produk' : 'Tambah Produk Bayi Baru'}
              </h4>
              <button onClick={() => setShowProductModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Kode SKU / Barcode</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Kategori Produk</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Nama Produk Bayi</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Botol Susu Pigeon 250ml BPA Free"
                  className={`w-full px-3 py-2 rounded-xl border font-bold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Harga Beli / HPP (Rp)</label>
                  <input
                    type="number"
                    value={formBuyPrice || ''}
                    onChange={(e) => setFormBuyPrice(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Harga Jual Toko (Rp)</label>
                  <input
                    type="number"
                    value={formSellPrice || ''}
                    onChange={(e) => setFormSellPrice(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-slate-50 border-slate-200 text-blue-600'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Stok Awal</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Batas Min. Stok</label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-50 border-slate-200 text-amber-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Satuan</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Box">Box</option>
                    <option value="Pack">Pack</option>
                    <option value="Botol">Botol</option>
                    <option value="Set">Set</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Deskripsi Ringkas</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowProductModal(false)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold ${
                    darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveProduct}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Simpan Produk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className={`w-full max-w-md my-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl border shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-blue-100 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-extrabold text-base">Tambah Kategori Baru</h4>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Nama Kategori</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Contoh: Perlengkapan Mandi Bayi"
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Deskripsi Kategori</label>
                <input
                  type="text"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Deskripsi singkat..."
                  className={`w-full px-3 py-2 rounded-xl border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold ${
                    darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveCategory}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Tambah Kategori
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
