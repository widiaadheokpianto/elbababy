export type PaymentMethod = 'TUNAI' | 'QRIS' | 'TRANSFER' | 'DEBIT_KREDIT';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  sellPrice: number;       // Harga Jual
  buyPrice: number;        // Harga Beli / HPP (Moving Average)
  stock: number;           // Stok Saat Ini
  minStock: number;        // Batas Minimum Stok
  unit: string;            // Pcs, Box, Pack, Botol, Set
  imageUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  oldStock: number;
  newStock: number;
  oldBuyPrice: number;
  incomingBuyPrice?: number;
  newBuyPrice: number;
  supplier?: string;
  notes?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  originalPrice: number;   // Base sell price
  customPrice: number;     // Price after item markup or custom adjustment
  discountAmount: number;  // Nominal discount per item
  discountPercent: number; // Discount percentage
  notes?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  buyPrice: number;        // HPP at time of sale
  discountAmount: number;
  subtotal: number;
}

export interface SaleOrder {
  id: string;
  invoiceNo: string;
  date: string;            // ISO String
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  totalAmount: number;
  totalCost: number;       // Total HPP for profit calculation
  grossProfit: number;     // totalAmount - totalCost
  paymentMethod: PaymentMethod;
  orderType?: 'OFFLINE' | 'ONLINE';
  amountPaid: number;
  changeAmount: number;
  cashierName: string;
  customerName?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'SEWA' | 'LISTRIK_AIR' | 'GAJI' | 'OPERASIONAL' | 'MARKETING' | 'LAINNYA';
  amount: number;
  description: string;
  recordedBy: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export interface BluetoothPrinterDevice {
  name: string;
  connected: boolean;
  paperWidth: '58mm' | '80mm';
}
