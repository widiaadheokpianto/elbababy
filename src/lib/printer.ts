import { SaleOrder } from '../types';

export interface BluetoothDeviceState {
  device: any | null;
  server: any | null;
  characteristic: any | null;
  isConnected: boolean;
  deviceName: string;
}

let activeBluetoothState: BluetoothDeviceState = {
  device: null,
  server: null,
  characteristic: null,
  isConnected: false,
  deviceName: '',
};

export function getActiveBluetoothState(): BluetoothDeviceState {
  return activeBluetoothState;
}

export function isWebBluetoothSupported(): boolean {
  return typeof window !== 'undefined' && 'bluetooth' in navigator;
}

export async function connectBluetoothPrinter(): Promise<BluetoothDeviceState> {
  if (!isWebBluetoothSupported()) {
    throw new Error('Web Bluetooth tidak didukung di peramban ini. Anda tetap dapat mencetak melalui Cetak Thermal Standar.');
  }

  try {
    const navBt = (navigator as any).bluetooth;
    const device = await navBt.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard Serial / Thermal printer UUID
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '00001101-0000-1000-8000-00805f9b34fb'  // SPP UUID
      ]
    });

    if (!device) {
      throw new Error('Tidak ada perangkat Bluetooth printer yang dipilih.');
    }

    const server = await device.gatt.connect();
    
    // Attempt to discover primary service for printer
    let primaryService: any = null;
    const services = await server.getPrimaryServices();
    if (services && services.length > 0) {
      primaryService = services[0];
    }

    let characteristic: any = null;
    if (primaryService) {
      const characteristics = await primaryService.getCharacteristics();
      if (characteristics && characteristics.length > 0) {
        characteristic = characteristics.find((c: any) => c.properties.write || c.properties.writeWithoutResponse) || characteristics[0];
      }
    }

    activeBluetoothState = {
      device,
      server,
      characteristic,
      isConnected: true,
      deviceName: device.name || 'Printer Thermal Bluetooth',
    };

    device.addEventListener('gattserverdisconnected', () => {
      activeBluetoothState = {
        device: null,
        server: null,
        characteristic: null,
        isConnected: false,
        deviceName: '',
      };
    });

    return activeBluetoothState;
  } catch (err: any) {
    console.error('Bluetooth connection error:', err);
    const msg = err.message || '';
    if (err.name === 'SecurityError' || msg.includes('permissions policy') || msg.includes('disallowed')) {
      throw new Error('Akses Bluetooth diblokir oleh kebijakan keamanan iframe peramban. Silakan klik "Buka di Tab Baru" di pojok kanan atas untuk menggunakan Bluetooth printer, atau gunakan fitur Cetak Struk Thermal / PDF bawaan.');
    }
    throw new Error(msg || 'Gagal terhubung dengan Bluetooth printer.');
  }
}

export async function disconnectBluetoothPrinter(): Promise<void> {
  if (activeBluetoothState.device && activeBluetoothState.device.gatt.connected) {
    activeBluetoothState.device.gatt.disconnect();
  }
  activeBluetoothState = {
    device: null,
    server: null,
    characteristic: null,
    isConnected: false,
    deviceName: '',
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateTextReceipt(order: SaleOrder, storeName = 'ELBABABY'): string {
  const line = '--------------------------------';
  const doubleLine = '================================';
  const width = 32; // Standard 58mm paper ~32 columns

  const center = (str: string) => {
    const pad = Math.max(0, Math.floor((width - str.length) / 2));
    return ' '.repeat(pad) + str;
  };

  const justify = (left: string, right: string) => {
    const spaceCount = Math.max(1, width - (left.length + right.length));
    return left + ' '.repeat(spaceCount) + right;
  };

  const dateFormatted = new Date(order.date).toLocaleString('id-ID', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  let text = '';
  text += center(storeName.toUpperCase()) + '\n';
  text += center('Perlengkapan Bayi & Anak') + '\n';
  text += center('Jl. Raya Utama No. 88, Kota') + '\n';
  text += center('Telp/WA: 0812-3456-7890') + '\n';
  text += doubleLine + '\n';
  text += justify('No:', order.invoiceNo) + '\n';
  text += justify('Tgl:', dateFormatted) + '\n';
  text += justify('Kasir:', order.cashierName) + '\n';
  if (order.customerName) {
    text += justify('Pelanggan:', order.customerName) + '\n';
  }
  if (order.orderType) {
    text += justify('Saluran:', order.orderType === 'ONLINE' ? 'Online' : 'Offline / Toko') + '\n';
  }
  if (order.notes) {
    text += justify('Catatan:', order.notes) + '\n';
  }
  text += line + '\n';

  order.items.forEach((item) => {
    text += item.productName + '\n';
    const qtyStr = `${item.quantity} x ${formatCurrency(item.unitPrice)}`;
    const subStr = formatCurrency(item.subtotal);
    text += justify(`  ${qtyStr}`, subStr) + '\n';
    if (item.discountAmount > 0) {
      text += justify('  Diskon Item', `-${formatCurrency(item.discountAmount)}`) + '\n';
    }
  });

  text += line + '\n';
  text += justify('Subtotal', formatCurrency(order.subtotal)) + '\n';
  if (order.discountTotal > 0) {
    text += justify('Diskon Transaksi', `-${formatCurrency(order.discountTotal)}`) + '\n';
  }
  if (order.taxAmount > 0) {
    text += justify('Pajak (PPN)', formatCurrency(order.taxAmount)) + '\n';
  }
  text += doubleLine + '\n';
  text += justify('TOTAL', formatCurrency(order.totalAmount)) + '\n';
  text += justify(`Bayar (${order.paymentMethod})`, formatCurrency(order.amountPaid)) + '\n';
  text += justify('Kembali', formatCurrency(order.changeAmount)) + '\n';
  text += doubleLine + '\n';
  text += center('Terima Kasih Telah Berbelanja') + '\n';
  text += center('di Elbababy Store!') + '\n';
  text += center('Barang yang sudah dibeli') + '\n';
  text += center('tidak dapat ditukar/dikembalikan') + '\n\n\n';

  return text;
}

export async function printToBluetoothThermal(order: SaleOrder): Promise<boolean> {
  if (!activeBluetoothState.isConnected || !activeBluetoothState.characteristic) {
    throw new Error('Printer Bluetooth belum terhubung. Silakan hubungkan printer di menu Pengaturan Bluetooth.');
  }

  try {
    const rawText = generateTextReceipt(order);
    const encoder = new TextEncoder();
    const data = encoder.encode(rawText);

    // Send data in chunks of 50 bytes for smooth Bluetooth transmission
    const chunkSize = 50;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await activeBluetoothState.characteristic.writeValue(chunk);
    }
    return true;
  } catch (err: any) {
    console.error('Error writing to printer characteristic:', err);
    throw new Error('Gagal mengirim data cetak ke Bluetooth printer: ' + (err.message || ''));
  }
}
