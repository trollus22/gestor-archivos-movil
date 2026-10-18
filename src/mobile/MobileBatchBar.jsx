import React from 'react';
import {
  Trash2,
  Move,
  Copy,
  Archive,
  Download,
} from 'lucide-react';
import { triggerHaptic } from './native-bridge.js';

export default function MobileBatchBar({
  selectedCount,
  onBatchDelete,
  onBatchMove,
  onBatchCopy,
  onBatchCompress,
  onBatchDownload,
}) {
  if (selectedCount === 0) return null;

  const actions = [
    { id: 'download', icon: Download, label: 'Descargar', onClick: onBatchDownload },
    { id: 'move', icon: Move, label: 'Mover', onClick: onBatchMove },
    { id: 'copy', icon: Copy, label: 'Copiar', onClick: onBatchCopy },
    { id: 'compress', icon: Archive, label: 'Comprimir', onClick: onBatchCompress },
    { id: 'delete', icon: Trash2, label: 'Borrar', danger: true, onClick: onBatchDelete },
  ];

  return (
    <div className="fixed z-40 inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] max-w-lg mx-auto bg-[#1b1e2a]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-2 animate-in slide-in-from-bottom duration-200">
      <div className="flex items-center justify-around gap-1">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={() => {
                triggerHaptic();
                act.onClick();
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl active:bg-white/10 touch-target transition-colors ${
                act.danger ? 'text-rose-400' : 'text-gray-200'
              }`}
              title={act.label}
              aria-label={act.label}
            >
              <Icon size={20} className={act.danger ? 'text-rose-400' : 'text-blue-400'} />
              <span className="text-[10px] mt-1 font-medium tracking-tight truncate max-w-full">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
