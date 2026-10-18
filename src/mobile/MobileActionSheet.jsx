import React from 'react';
import {
  Download,
  Share2,
  Edit2,
  Move,
  Copy,
  Archive,
  Lock,
  Info,
  Trash2,
  X,
  FileText,
} from 'lucide-react';
import { getFileIcon, formatBytes, formatDate } from '../utils/formatters.jsx';
import { triggerHaptic } from './native-bridge.js';

export default function MobileActionSheet({
  isOpen,
  item,
  onClose,
  onDownload,
  onShare,
  onRename,
  onMove,
  onCopy,
  onCompress,
  onChmod,
  onProperties,
  onDelete,
}) {
  if (!isOpen || !item) return null;

  const actions = [
    {
      id: 'download',
      icon: Download,
      label: 'Descargar al dispositivo',
      show: !item.isDirectory,
      onClick: () => onDownload(item),
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Compartir enlace / archivo',
      show: true,
      onClick: () => onShare(item),
    },
    {
      id: 'rename',
      icon: Edit2,
      label: 'Renombrar',
      show: true,
      onClick: () => onRename(item),
    },
    {
      id: 'move',
      icon: Move,
      label: 'Mover a otra carpeta',
      show: true,
      onClick: () => onMove(item),
    },
    {
      id: 'copy',
      icon: Copy,
      label: 'Copiar',
      show: true,
      onClick: () => onCopy(item),
    },
    {
      id: 'compress',
      icon: Archive,
      label: 'Comprimir a ZIP',
      show: true,
      onClick: () => onCompress(item),
    },
    {
      id: 'chmod',
      icon: Lock,
      label: 'Cambiar permisos (chmod)',
      show: true,
      onClick: () => onChmod(item),
    },
    {
      id: 'properties',
      icon: Info,
      label: 'Detalles y checksums',
      show: true,
      onClick: () => onProperties(item),
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Mover a la papelera',
      danger: true,
      show: true,
      onClick: () => onDelete(item),
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end transition-opacity duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-auto bg-[#181a24] border-t border-white/10 rounded-t-3xl p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl max-h-[85dvh] flex flex-col animate-in slide-in-from-bottom duration-200"
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3" />

        {/* Item preview header */}
        <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
            {getFileIcon(item, 24)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{item.name}</h3>
            <p className="text-xs text-gray-400">
              {item.isDirectory ? 'Carpeta' : formatBytes(item.size)} • {formatDate(item.mtime || item.updatedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full touch-target flex items-center justify-center"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action list */}
        <div className="overflow-y-auto no-scrollbar space-y-1 flex-1 py-1">
          {actions
            .filter((a) => a.show)
            .map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  onClick={() => {
                    triggerHaptic();
                    onClose();
                    act.onClick();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-colors touch-target text-left ${
                    act.danger
                      ? 'text-rose-400 active:bg-rose-500/10'
                      : 'text-gray-200 active:bg-white/10'
                  }`}
                >
                  <Icon size={20} className={act.danger ? 'text-rose-400' : 'text-gray-400'} />
                  <span className="text-sm font-medium">{act.label}</span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
