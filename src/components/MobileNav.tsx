import React from 'react';
import { Store, BarChart3, Package, Receipt, DollarSign } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  lowStockCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  lowStockCount,
}) => {
  const tabs = [
    { id: 'pos', label: 'Kasir POS', icon: Store },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'stock', label: 'Stok', icon: Package, badge: lowStockCount },
    { id: 'daily-sales', label: 'Laporan', icon: Receipt },
    { id: 'finance', label: 'Keuangan', icon: DollarSign },
  ];

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg ${
      darkMode ? 'bg-slate-900/95 border-slate-800 text-slate-300' : 'bg-white/95 border-blue-100 text-slate-600'
    }`}>
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive
                  ? darkMode
                    ? 'text-blue-400 font-bold'
                    : 'text-blue-600 font-bold'
                  : darkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[9px] font-bold px-1 rounded-full">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] tracking-tight line-clamp-1">{tab.label}</span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
