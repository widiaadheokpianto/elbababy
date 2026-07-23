import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Edit3, 
  X,
  Tag,
  Zap,
  ChevronUp,
  DollarSign,
  List,
  LayoutGrid,
  Store,
  Globe,
  FileText
} from 'lucide-react';
import { Product, Category, CartItem, SaleOrder, PaymentMethod } from '../types';
import { formatCurrency } from '../lib/printer';

interface POSProps {
  products: Product[];
  categories: Category[];
  darkMode: boolean;
  onCheckoutComplete: (order: SaleOrder) => void;
  cashierName?: string;
}

export const POS: React.FC<POSProps> = ({
  products,
  categories,
  darkMode,
  onCheckoutComplete,
  cashierName = 'Kasir Utama',
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [orderType, setOrderType] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [orderNotes, setOrderNotes] = useState<string>('');
  
  // Mobile cart sheet modal state
  const [showMobileCartSheet, setShowMobileCartSheet] = useState<boolean>(false);

  // Transaction level discount
  const [txDiscount, setTxDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TUNAI');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  
  // Item custom price/markup modal state
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null);
  const [tempCustomPrice, setTempCustomPrice] = useState<number>(0);
  const [tempDiscountAmount, setTempDiscountAmount] = useState<number>(0);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat = selectedCategoryId === 'all' || prod.categoryId === selectedCategoryId;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        prod.name.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        (prod.description && prod.description.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const effectivePrice = item.customPrice;
      const itemSub = (effectivePrice - item.discountAmount) * item.quantity;
      return sum + Math.max(0, itemSub);
    }, 0);
  }, [cart]);

  const totalCartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);
  const finalTotal = Math.max(0, cartSubtotal - txDiscount);
  const changeAmount = paymentMethod === 'TUNAI' ? Math.max(0, amountPaid - finalTotal) : 0;

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((i) => i.product.id === product.id);
      if (existingIdx !== -1) {
        const existing = prevCart[existingIdx];
        if (existing.quantity >= product.stock) {
          alert(`Stok produk "${product.name}" terbatas (${product.stock} ${product.unit}).`);
          return prevCart;
        }
        const updated = [...prevCart];
        updated[existingIdx] = {
          ...existing,
          quantity: existing.quantity + 1,
        };
        return updated;
      }

      return [
        ...prevCart,
        {
          product,
          quantity: 1,
          originalPrice: product.sellPrice,
          customPrice: product.sellPrice,
          discountAmount: 0,
          discountPercent: 0,
        },
      ];
    });
  };

  // Change Quantity
  const handleUpdateQty = (index: number, delta: number) => {
    setCart((prevCart) => {
      const item = prevCart[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prevCart.filter((_, idx) => idx !== index);
      }
      if (newQty > item.product.stock) {
        alert(`Stok maksimal: ${item.product.stock} ${item.product.unit}`);
        return prevCart;
      }
      const updated = [...prevCart];
      updated[index] = { ...item, quantity: newQty };
      return updated;
    });
  };

  // Remove Item
  const handleRemoveCartItem = (index: number) => {
    setCart((prevCart) => prevCart.filter((_, idx) => idx !== index));
  };

  // Open Edit Item Markup / Discount Modal
  const handleOpenItemEdit = (index: number) => {
    const item = cart[index];
    setEditingCartIndex(index);
    setTempCustomPrice(item.customPrice);
    setTempDiscountAmount(item.discountAmount);
  };

  // Apply Edit Item Price / Discount
  const handleSaveItemEdit = () => {
    if (editingCartIndex === null) return;
    setCart((prevCart) => {
      const updated = [...prevCart];
      const current = updated[editingCartIndex];
      updated[editingCartIndex] = {
        ...current,
        customPrice: tempCustomPrice,
        discountAmount: tempDiscountAmount,
      };
      return updated;
    });
    setEditingCartIndex(null);
  };

  // Quick Amount Presets
  const setQuickPaid = (amount: number) => {
    setAmountPaid(amount);
  };

  // Process Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong!');
      return;
    }

    if (paymentMethod === 'TUNAI' && amountPaid < finalTotal) {
      alert(`Pembayaran kurang! Jumlah bayar harus minimal ${formatCurrency(finalTotal)}.`);
      return;
    }

    // Build Sale Order
    const saleItems = cart.map((item) => {
      const unitPrice = item.customPrice;
      const sub = (unitPrice - item.discountAmount) * item.quantity;
      return {
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice,
        buyPrice: item.product.buyPrice,
        discountAmount: item.discountAmount,
        subtotal: sub,
      };
    });

    const totalCost = saleItems.reduce((sum, i) => sum + i.buyPrice * i.quantity, 0);
    const grossProfit = finalTotal - totalCost;

    const newOrderData: Omit<SaleOrder, 'id' | 'invoiceNo'> = {
      date: new Date().toISOString(),
      items: saleItems,
      subtotal: cartSubtotal,
      discountTotal: txDiscount,
      taxAmount: 0,
      totalAmount: finalTotal,
      totalCost,
      grossProfit,
      paymentMethod,
      orderType,
      notes: orderNotes.trim() || undefined,
      amountPaid: paymentMethod === 'TUNAI' ? amountPaid : finalTotal,
      changeAmount: paymentMethod === 'TUNAI' ? changeAmount : 0,
      cashierName,
      customerName: customerName.trim() || 'Pelanggan Umum',
    };

    onCheckoutComplete(newOrderData as SaleOrder);

    // Reset Cart
    setCart([]);
    setTxDiscount(0);
    setAmountPaid(0);
    setCustomerName('');
    setOrderType('OFFLINE');
    setOrderNotes('');
    setShowMobileCartSheet(false);
  };

  // Shared Cart Details JSX Render (Used both in desktop sidebar & mobile sheet)
  const renderCartContent = () => (
    <div className="space-y-3">
      {/* Customer Name Input & Order Channel Selection */}
      <div className="space-y-2">
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Nama Pelanggan (Opsional)"
          className={`w-full px-3 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        />

        {/* Tipe Pembelian (Offline vs Online) */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setOrderType('OFFLINE')}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              orderType === 'OFFLINE'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Offline (Toko)</span>
          </button>

          <button
            type="button"
            onClick={() => setOrderType('ONLINE')}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              orderType === 'ONLINE'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Online (E-Commerce)</span>
          </button>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="max-h-60 sm:max-h-72 overflow-y-auto space-y-2 pr-1">
        {cart.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <ShoppingBag className="w-8 h-8 mx-auto mb-1 text-slate-400 dark:text-slate-600" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Keranjang kosong</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ketuk produk untuk menambah item</p>
          </div>
        ) : (
          cart.map((item, idx) => {
            const effectivePrice = item.customPrice;
            const lineTotal = (effectivePrice - item.discountAmount) * item.quantity;
            const isPriceModified = item.customPrice !== item.originalPrice || item.discountAmount > 0;

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border transition-all ${
                  darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="pr-2">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">{item.product.name}</h5>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        {formatCurrency(effectivePrice)}
                      </span>
                      {isPriceModified && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-500 text-white">
                          Disuai
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenItemEdit(idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10"
                    title="Atur Markup / Diskon"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateQty(idx, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs hover:bg-rose-500 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-xs w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQty(idx, 1)}
                      className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs hover:bg-blue-600 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                      {formatCurrency(lineTotal)}
                    </span>
                    <button
                      onClick={() => handleRemoveCartItem(idx)}
                      className="text-slate-400 hover:text-rose-500 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pricing Summary */}
      {cart.length > 0 && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal ({totalCartCount} item)</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(cartSubtotal)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Diskon Nota (Rp)</span>
            <input
              type="number"
              value={txDiscount || ''}
              onChange={(e) => setTxDiscount(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className={`w-24 text-right px-2 py-1 rounded-lg border text-xs font-bold ${
                darkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-50 border-slate-300 text-amber-600'
              }`}
            />
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-base font-black">
            <span>TOTAL AKHIR</span>
            <span className="text-lg text-blue-600 dark:text-blue-400">{formatCurrency(finalTotal)}</span>
          </div>

          {/* Payment Method Selector */}
          <div className="mt-3">
            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Metode Bayar
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'TUNAI', label: 'Tunai', icon: Banknote },
                { id: 'QRIS', label: 'QRIS', icon: QrCode },
                { id: 'TRANSFER', label: 'Transfer', icon: CreditCard },
                { id: 'DEBIT_KREDIT', label: 'Debit/EDC', icon: DollarSign },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setPaymentMethod(m.id as PaymentMethod);
                      if (m.id !== 'TUNAI') {
                        setAmountPaid(finalTotal);
                      }
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Input */}
          {paymentMethod === 'TUNAI' && (
            <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold">Uang Tunai</label>
                <input
                  type="number"
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  placeholder="0"
                  className={`w-28 text-right px-2 py-1 rounded-lg border font-bold text-xs ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center space-x-1 pt-0.5">
                <button
                  onClick={() => setQuickPaid(finalTotal)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white"
                >
                  Pas
                </button>
                <button
                  onClick={() => setQuickPaid(50000)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  50rb
                </button>
                <button
                  onClick={() => setQuickPaid(100000)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  100rb
                </button>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-xs">Kembalian</span>
                <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(changeAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Catatan Pembelian Input */}
          <div className="mt-2.5">
            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Catatan Pembelian (Opsional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="No. Resi, Dropship, Catatan Khusus..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500'
                }`}
              />
              <FileText className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            </div>
          </div>

          {/* Checkout Button */}
          <button
            id="btn-process-checkout"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>BAYAR & CETAK STRUK ({formatCurrency(finalTotal)})</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-24 lg:pb-12">
      {/* Left Area: Product Catalog & Touch Grid (7 Cols on LG) */}
      <div className="lg:col-span-7 space-y-3">
        {/* Search Bar, View Mode Switcher & Category Scroll */}
        <div className={`p-3 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk bayi (Nama, SKU)..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* View Mode Toggle Switch (List vs Grid) */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('list')}
                title="Tampilan List"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Tampilan Grid"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Grid</span>
              </button>
            </div>
          </div>

          {/* Category Horizontal Bar */}
          <div className="flex items-center space-x-1.5 mt-2 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategoryId === 'all'
                  ? 'bg-blue-600 text-white'
                  : darkMode
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Semua ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategoryId === cat.id
                    ? 'bg-blue-600 text-white'
                    : darkMode
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Display (List or Grid) */}
        {filteredProducts.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <ShoppingBag className="w-8 h-8 mx-auto mb-1 text-blue-400 opacity-60" />
            <p className="text-xs font-bold">Tidak ada produk ditemukan</p>
          </div>
        ) : viewMode === 'list' ? (
          /* LIST VIEW */
          <div className={`rounded-2xl border overflow-hidden transition-all ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((product) => {
                const isLowStock = product.stock <= product.minStock;
                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    className={`p-2.5 sm:p-3 flex items-center justify-between gap-2 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors ${
                      isOutOfStock ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                          {product.sku}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isOutOfStock
                            ? 'bg-rose-500 text-white'
                            : isLowStock
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {isOutOfStock ? 'Habis' : `Stok ${product.stock} ${product.unit}`}
                        </span>
                      </div>
                      <h4 className="font-semibold text-xs sm:text-sm line-clamp-1 mt-0.5 text-slate-800 dark:text-slate-100">
                        {product.name}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 block">
                          {formatCurrency(product.sellPrice)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition-all ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-95'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tambah</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map((product) => {
              const isLowStock = product.stock <= product.minStock;
              const isOutOfStock = product.stock <= 0;

              return (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  disabled={isOutOfStock}
                  className={`group relative p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isOutOfStock
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      : darkMode
                      ? 'bg-slate-900 border-slate-800 hover:border-blue-500/40'
                      : 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                        {product.sku}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        isOutOfStock
                          ? 'bg-rose-500 text-white'
                          : isLowStock
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isOutOfStock ? 'Habis' : `Stok ${product.stock}`}
                      </span>
                    </div>

                    <h4 className="font-semibold text-xs line-clamp-2 leading-snug group-hover:text-blue-500">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(product.sellPrice)}
                    </span>
                    <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center opacity-90">
                      <Plus className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Right Column: Cart Panel (lg:block) */}
      <div className="hidden lg:block lg:col-span-5 space-y-3">
        <div className={`p-4 rounded-2xl border sticky top-16 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-3">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              <h3 className="font-bold text-sm">Keranjang Belanja</h3>
            </div>
            <span className="text-xs font-bold text-blue-500">
              {totalCartCount} item
            </span>
          </div>

          {renderCartContent()}
        </div>
      </div>

      {/* MOBILE FLOATING BOTTOM CART BAR (lg:hidden) */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-40">
          <button
            onClick={() => setShowMobileCartSheet(true)}
            className="w-full p-3 rounded-2xl bg-slate-900 dark:bg-blue-600 text-white shadow-2xl flex items-center justify-between border border-white/10 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-white/20 flex items-center justify-center text-white">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold">{totalCartCount} Item di Keranjang</p>
                <p className="text-[10px] opacity-80">Sentuh untuk selesaikan pembayaran</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-black text-blue-400 dark:text-white">
                {formatCurrency(finalTotal)}
              </span>
              <ChevronUp className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* MOBILE CART SHEET / DRAWER MODAL */}
      {showMobileCartSheet && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-h-[85vh] overflow-y-auto rounded-t-3xl p-4 border-t shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-sm">Keranjang & Pembayaran</h3>
              </div>
              <button
                onClick={() => setShowMobileCartSheet(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderCartContent()}
          </div>
        </div>
      )}

      {/* Item Price Markup / Discount Modal */}
      {editingCartIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm p-5 rounded-2xl border shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-blue-500" />
                <h4 className="font-bold text-sm">Markup / Diskon Item</h4>
              </div>
              <button
                onClick={() => setEditingCartIndex(null)}
                className="p-1 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              {cart[editingCartIndex]?.product.name} (Asli: {formatCurrency(cart[editingCartIndex]?.originalPrice || 0)})
            </p>

            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Harga Jual Khusus / Markup (Rp)</label>
                <input
                  type="number"
                  value={tempCustomPrice || ''}
                  onChange={(e) => setTempCustomPrice(Math.max(0, Number(e.target.value)))}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Diskon Nominal Per Pcs (Rp)</label>
                <input
                  type="number"
                  value={tempDiscountAmount || ''}
                  onChange={(e) => setTempDiscountAmount(Math.max(0, Number(e.target.value)))}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-50 border-slate-200 text-amber-600'
                  }`}
                />
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 text-xs">
                <div className="flex justify-between font-bold text-blue-600 dark:text-blue-400">
                  <span>Harga Net:</span>
                  <span>{formatCurrency(Math.max(0, tempCustomPrice - tempDiscountAmount))} / pcs</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={() => setEditingCartIndex(null)}
                  className="flex-1 py-2 rounded-xl border text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveItemEdit}
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

