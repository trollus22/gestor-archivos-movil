import React from 'react';
import {
  Folder,
  Search,
  Trash2,
  Settings,
} from 'lucide-react';
import { triggerHaptic } from './native-bridge.js';

export default function MobileBottomNav({
  activeTab,
  onTabChange,
  trashCount = 0,
}) {
  const tabs = [
    { id: 'files', label: 'Archivos', icon: Folder },
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'trash', label: 'Papelera', icon: Trash2, badge: trashCount },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-[#161820]/95 backdrop-blur-lg border-t border-white/10 pb-[max(0.35rem,env(safe-area-inset-bottom))] transition-all">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic();
                onTabChange(tab.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 touch-target transition-all relative ${
                isActive
                  ? 'text-blue-400 font-semibold'
                  : 'text-gray-400 hover:text-gray-200 active:text-white'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-4 h-0.5 bg-blue-500 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
