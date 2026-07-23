import { Category, Product, StockLog, SaleOrder, Expense } from '../types';
import { getSupabaseClient } from './supabase';

const KEYS = {
  CATEGORIES: 'elbababy_categories',
  PRODUCTS: 'elbababy_products',
  STOCK_LOGS: 'elbababy_stock_logs',
  SALE_ORDERS: 'elbababy_sale_orders',
  EXPENSES: 'elbababy_expenses',
};

// Initial Sample Data tailored specifically for "elbababy" Baby Shop
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Popok & Diaper', description: 'Popok sekali pakai & kain', color: '#2563eb' },
  { id: 'cat-2', name: 'Susu & Makanan Bayi', description: 'Susu formula & MPASI', color: '#f59e0b' },
  { id: 'cat-3', name: 'Perawatan & Mandi', description: 'Sabun, sampo, lotion & minyak telon', color: '#10b981' },
  { id: 'cat-4', name: 'Botol & Perlengkapan Makan', description: 'Botol susu, sterilizer & empeng', color: '#3b82f6' },
  { id: 'cat-5', name: 'Pakaian & Tekstil', description: 'Baju, celana, bedong & selimut', color: '#8b5cf6' },
  { id: 'cat-6', name: 'Stroller & Equipment', description: 'Stroller, baby carrier & car seat', color: '#6366f1' },
  { id: 'cat-7', name: 'Mainan & Teether', description: 'Mainan edukasi & gigitan bayi', color: '#14b8a6' },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'ELBA-001',
    name: 'Pigeon Botol Susu Peristaltic Plus 250ml',
    categoryId: 'cat-4',
    sellPrice: 78000,
    buyPrice: 62000,
    stock: 24,
    minStock: 5,
    unit: 'Pcs',
    description: 'Botol susu bahan BPA Free dengan dot peristaltic lentur.',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    sku: 'ELBA-002',
    name: 'MamyPoko Pants Royal Soft Size M34',
    categoryId: 'cat-1',
    sellPrice: 95000,
    buyPrice: 81000,
    stock: 18,
    minStock: 8,
    unit: 'Pack',
    description: 'Popok celana ekstra lembut untuk bayi berat 7-12kg.',
    imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    sku: 'ELBA-003',
    name: 'Minyak Telon Cap Lang Plus 100ml',
    categoryId: 'cat-3',
    sellPrice: 38000,
    buyPrice: 30000,
    stock: 4, // Intentionally low stock to trigger alert demo
    minStock: 10,
    unit: 'Botol',
    description: 'Minyak telon penghangat tubuh bayi pencegah gigitan nyamuk.',
    imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    sku: 'ELBA-004',
    name: 'Baju Sleeveless Bayi Velvet Junior (Set isi 3)',
    categoryId: 'cat-5',
    sellPrice: 65000,
    buyPrice: 50000,
    stock: 12,
    minStock: 4,
    unit: 'Set',
    description: 'Baju singlet katun halus bersertifikat Oeko-Tex.',
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    sku: 'ELBA-005',
    name: 'Susu Bebelac 3 Madu 800g',
    categoryId: 'cat-2',
    sellPrice: 145000,
    buyPrice: 128000,
    stock: 3, // Intentionally low stock
    minStock: 6,
    unit: 'Box',
    description: 'Susu pertumbuhan rasa madu untuk anak usia 1-3 tahun.',
    imageUrl: 'https://images.unsplash.com/photo-1550572017-edf9833a9301?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    sku: 'ELBA-006',
    name: 'Stroller Pliko Mini Compact Fold',
    categoryId: 'cat-6',
    sellPrice: 850000,
    buyPrice: 690000,
    stock: 5,
    minStock: 2,
    unit: 'Pcs',
    description: 'Kereta dorong bayi lipat praktis cabin size dengan tudung kanopi.',
    imageUrl: 'https://images.unsplash.com/photo-1591154669695-5f2a8d20c089?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    sku: 'ELBA-007',
    name: 'Zwitsal Baby Bath Hair & Body Aloe Vera 450ml Pump',
    categoryId: 'cat-3',
    sellPrice: 42000,
    buyPrice: 34000,
    stock: 15,
    minStock: 5,
    unit: 'Botol',
    description: 'Sabun & sampo 2-in-1 formula lembut tidak pedih di mata.',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-8',
    sku: 'ELBA-008',
    name: 'BabySafe Steam Sterilizer & Warmer',
    categoryId: 'cat-4',
    sellPrice: 285000,
    buyPrice: 225000,
    stock: 7,
    minStock: 3,
    unit: 'Pcs',
    description: 'Alat steril botol bayi 6 botol sekali jalan & pemanas susu.',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    date: new Date().toISOString().split('T')[0],
    category: 'SEWA',
    amount: 1500000,
    description: 'Sewa ruko Toko Elbababy (Bulan ini)',
    recordedBy: 'Admin Toko',
  },
  {
    id: 'exp-2',
    date: new Date().toISOString().split('T')[0],
    category: 'LISTRIK_AIR',
    amount: 350000,
    description: 'Tagihan listrik & air toko',
    recordedBy: 'Kasir Utama',
  }
];

// Helper to calculate moving average price (HPP Rata-rata Otomatis)
export function calculateMovingAverageCost(
  currentStock: number,
  currentBuyPrice: number,
  incomingQty: number,
  incomingBuyPrice: number
): { newStock: number; newBuyPrice: number } {
  const safeCurrentStock = Math.max(0, currentStock);
  const totalQty = safeCurrentStock + incomingQty;
  if (totalQty === 0) {
    return { newStock: 0, newBuyPrice: incomingBuyPrice };
  }
  const totalValue = (safeCurrentStock * currentBuyPrice) + (incomingQty * incomingBuyPrice);
  const newBuyPrice = Math.round(totalValue / totalQty);
  return { newStock: totalQty, newBuyPrice };
}

// Local Storage Helper Utilities
export const LocalStorageManager = {
  getCategories(): Category[] {
    const raw = localStorage.getItem(KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories(categories: Category[]) {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getProducts(): Product[] {
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PRODUCTS;
    }
  },

  saveProducts(products: Product[]) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getStockLogs(): StockLog[] {
    const raw = localStorage.getItem(KEYS.STOCK_LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveStockLogs(logs: StockLog[]) {
    localStorage.setItem(KEYS.STOCK_LOGS, JSON.stringify(logs));
  },

  getSaleOrders(): SaleOrder[] {
    const raw = localStorage.getItem(KEYS.SALE_ORDERS);
    if (!raw) {
      // Seed a sample order for today to populate analytics
      const today = new Date().toISOString();
      const initialOrders: SaleOrder[] = [
        {
          id: 'ord-101',
          invoiceNo: 'INV-' + Date.now().toString().slice(-6),
          date: today,
          items: [
            {
              productId: 'prod-1',
              productName: 'Pigeon Botol Susu Peristaltic Plus 250ml',
              sku: 'ELBA-001',
              quantity: 2,
              unitPrice: 78000,
              buyPrice: 62000,
              discountAmount: 0,
              subtotal: 156000,
            },
            {
              productId: 'prod-3',
              productName: 'Minyak Telon Cap Lang Plus 100ml',
              sku: 'ELBA-003',
              quantity: 1,
              unitPrice: 38000,
              buyPrice: 30000,
              discountAmount: 0,
              subtotal: 38000,
            }
          ],
          subtotal: 194000,
          discountTotal: 0,
          taxAmount: 0,
          totalAmount: 194000,
          totalCost: 154000,
          grossProfit: 40000,
          paymentMethod: 'QRIS',
          amountPaid: 194000,
          changeAmount: 0,
          cashierName: 'Kasir Elbababy',
          notes: 'Transaksi Pertama Hari Ini',
        }
      ];
      localStorage.setItem(KEYS.SALE_ORDERS, JSON.stringify(initialOrders));
      return initialOrders;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSaleOrders(orders: SaleOrder[]) {
    localStorage.setItem(KEYS.SALE_ORDERS, JSON.stringify(orders));
  },

  getExpenses(): Expense[] {
    const raw = localStorage.getItem(KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(KEYS.EXPENSES, JSON.stringify(DEFAULT_EXPENSES));
      return DEFAULT_EXPENSES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_EXPENSES;
    }
  },

  saveExpenses(expenses: Expense[]) {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  }
};

// High Level Unified Data Controller (with Supabase Sync if configured)
export const DataController = {
  async getProducts(): Promise<Product[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data && data.length > 0) {
          const mapped: Product[] = data.map(d => ({
            id: d.id,
            sku: d.sku,
            name: d.name,
            categoryId: d.category_id || d.categoryId,
            sellPrice: Number(d.sell_price || d.sellPrice || 0),
            buyPrice: Number(d.buy_price || d.buyPrice || 0),
            stock: Number(d.stock || 0),
            minStock: Number(d.min_stock || d.minStock || 0),
            unit: d.unit || 'Pcs',
            imageUrl: d.image_url || d.imageUrl,
            description: d.description,
            createdAt: d.created_at || d.createdAt || new Date().toISOString(),
            updatedAt: d.updated_at || d.updatedAt || new Date().toISOString(),
          }));
          LocalStorageManager.saveProducts(mapped);
          return mapped;
        }
      } catch (e) {
        console.warn('Supabase fetch products error, using local:', e);
      }
    }
    return LocalStorageManager.getProducts();
  },

  async addStockIncoming(
    productId: string,
    incomingQty: number,
    incomingBuyPrice: number,
    supplier: string,
    notes: string
  ): Promise<{ product: Product; log: StockLog }> {
    const products = LocalStorageManager.getProducts();
    const productIndex = products.findIndex((p) => p.id === productId);
    if (productIndex === -1) {
      throw new Error('Produk tidak ditemukan');
    }

    const prod = products[productIndex];
    const oldStock = prod.stock;
    const oldBuyPrice = prod.buyPrice;

    // Moving Weighted Average Calculation
    const { newStock, newBuyPrice } = calculateMovingAverageCost(
      oldStock,
      oldBuyPrice,
      incomingQty,
      incomingBuyPrice
    );

    const updatedProduct: Product = {
      ...prod,
      stock: newStock,
      buyPrice: newBuyPrice,
      updatedAt: new Date().toISOString(),
    };

    products[productIndex] = updatedProduct;
    LocalStorageManager.saveProducts(products);

    const log: StockLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      productId: prod.id,
      productName: prod.name,
      type: 'IN',
      quantity: incomingQty,
      oldStock,
      newStock,
      oldBuyPrice,
      incomingBuyPrice,
      newBuyPrice,
      supplier,
      notes,
      createdAt: new Date().toISOString(),
    };

    const logs = LocalStorageManager.getStockLogs();
    logs.unshift(log);
    LocalStorageManager.saveStockLogs(logs);

    // Sync Supabase async if client is active
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('products').upsert({
        id: updatedProduct.id,
        sku: updatedProduct.sku,
        name: updatedProduct.name,
        category_id: updatedProduct.categoryId,
        sell_price: updatedProduct.sellPrice,
        buy_price: updatedProduct.buyPrice,
        stock: updatedProduct.stock,
        min_stock: updatedProduct.minStock,
        unit: updatedProduct.unit,
        image_url: updatedProduct.imageUrl,
        updated_at: updatedProduct.updatedAt,
      }).then(() => {});

      supabase.from('stock_logs').insert({
        id: log.id,
        product_id: log.productId,
        product_name: log.productName,
        type: log.type,
        quantity: log.quantity,
        old_stock: log.oldStock,
        new_stock: log.newStock,
        old_buy_price: log.oldBuyPrice,
        incoming_buy_price: log.incomingBuyPrice,
        new_buy_price: log.newBuyPrice,
        supplier: log.supplier,
        notes: log.notes,
        created_at: log.createdAt,
      }).then(() => {});
    }

    return { product: updatedProduct, log };
  },

  async addStockOutgoing(
    productId: string,
    outgoingQty: number,
    notes: string
  ): Promise<{ product: Product; log: StockLog }> {
    const products = LocalStorageManager.getProducts();
    const productIndex = products.findIndex((p) => p.id === productId);
    if (productIndex === -1) {
      throw new Error('Produk tidak ditemukan');
    }

    const prod = products[productIndex];
    if (prod.stock < outgoingQty) {
      throw new Error(`Stok tidak mencukupi. Stok saat ini: ${prod.stock} ${prod.unit}`);
    }

    const oldStock = prod.stock;
    const newStock = oldStock - outgoingQty;

    const updatedProduct: Product = {
      ...prod,
      stock: newStock,
      updatedAt: new Date().toISOString(),
    };

    products[productIndex] = updatedProduct;
    LocalStorageManager.saveProducts(products);

    const log: StockLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      productId: prod.id,
      productName: prod.name,
      type: 'OUT',
      quantity: outgoingQty,
      oldStock,
      newStock,
      oldBuyPrice: prod.buyPrice,
      newBuyPrice: prod.buyPrice,
      notes,
      createdAt: new Date().toISOString(),
    };

    const logs = LocalStorageManager.getStockLogs();
    logs.unshift(log);
    LocalStorageManager.saveStockLogs(logs);

    return { product: updatedProduct, log };
  },

  async createSaleOrder(orderData: Omit<SaleOrder, 'id' | 'invoiceNo'>): Promise<SaleOrder> {
    const products = LocalStorageManager.getProducts();
    
    // Deduct stock for each sale item
    for (const item of orderData.items) {
      const pIndex = products.findIndex(p => p.id === item.productId);
      if (pIndex !== -1) {
        products[pIndex].stock = Math.max(0, products[pIndex].stock - item.quantity);
        products[pIndex].updatedAt = new Date().toISOString();
      }
    }
    LocalStorageManager.saveProducts(products);

    const invoiceNo = 'INV-' + Date.now().toString().slice(-8);
    const newOrder: SaleOrder = {
      ...orderData,
      id: 'ord-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      invoiceNo,
    };

    const orders = LocalStorageManager.getSaleOrders();
    orders.unshift(newOrder);
    LocalStorageManager.saveSaleOrders(orders);

    // Sync Supabase if present
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('sales_orders').insert({
        id: newOrder.id,
        invoice_no: newOrder.invoiceNo,
        date: newOrder.date,
        subtotal: newOrder.subtotal,
        discount_total: newOrder.discountTotal,
        tax_amount: newOrder.taxAmount,
        total_amount: newOrder.totalAmount,
        total_cost: newOrder.totalCost,
        gross_profit: newOrder.grossProfit,
        payment_method: newOrder.paymentMethod,
        amount_paid: newOrder.amountPaid,
        change_amount: newOrder.changeAmount,
        cashier_name: newOrder.cashierName,
        customer_name: newOrder.customerName,
        items: JSON.stringify(newOrder.items),
      }).then(() => {});
    }

    return newOrder;
  }
};
