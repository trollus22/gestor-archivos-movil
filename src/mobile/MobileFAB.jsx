import React from 'react';
import { Plus } from 'lucide-react';
import { triggerHaptic } from './native-bridge.js';

export default function MobileFAB({ onClick, isVisible = true }) {
  if (!isVisible) return null;

  return (
    <button
      onClick={() => {
        triggerHaptic('medium');
        onClick();
      }}
      className="fixed z-20 right-4 bottom-[calc(4.2rem+env(safe-area-inset-bottom))] w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-xl shadow-blue-900/40 flex items-center justify-center transition-all duration-150 active:scale-95 touch-target"
      aria-label="Subir o crear archivo"
      title="Subir o crear"
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
}
