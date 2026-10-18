import React, { useEffect, useRef } from 'react';
import {
  FolderOpen,
  Scissors,
  Copy,
  ClipboardPaste,
  Files,
  Edit2,
  Trash2,
  FolderArchive,
  Download,
  Link,
  Info,
  ExternalLink,
  Eye,
} from 'lucide-react';

export default function ContextMenu({
  x,
  y,
  targetItem,
  onClose,
  onOpen,
  onCut,
  onCopy,
  onPaste,
  onDuplicate,
  onRename,
  onTrash,
  onPermanentDelete,
  onCompress,
  onExtract,
  onViewArchive,
  onDownload,
  onCopyPath,
  onProperties,
  canPaste,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', onClose);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', onClose);
    };
  }, [onClose]);

  // Asegurar que el menú no se salga de los bordes de la ventana
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 380);

  const isArchive = targetItem && (
    targetItem.name.endsWith('.zip') ||
    targetItem.name.endsWith('.tar.gz') ||
    targetItem.name.endsWith('.tar') ||
    targetItem.name.endsWith('.gz')
  );

  return (
    <div
      ref={menuRef}
      style={{ left: adjustedX, top: adjustedY }}
      className="fixed z-50 w-56 bg-white/95 dark:bg-fluent-darkSurface/95 backdrop-blur-md border border-fluent-border rounded-xl shadow-fluent-flyout py-1.5 text-xs text-fluent-text dark:text-fluent-darkText select-none"
    >
      {targetItem ? (
        <>
          <button
            onClick={() => { onOpen(targetItem); onClose(); }}
            className="w-full flex items-center px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <FolderOpen size={14} className="mr-2.5 text-fluent-blue" />
            <span className="flex-1">Abrir</span>
            <span className="text-[10px] text-fluent-textMuted">Enter</span>
          </button>

          {isArchive && (
            <>
              <button
                onClick={() => { onViewArchive(targetItem); onClose(); }}
                className="w-full flex items-center px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
              >
                <Eye size={14} className="mr-2.5 text-sky-600" />
                <span>Explorar archivo sin extraer</span>
              </button>
              <button
                onClick={() => { onExtract(targetItem); onClose(); }}
                className="w-full flex items-center px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
              >
                <ExternalLink size={14} className="mr-2.5 text-emerald-600" />
                <span>Extraer aquí</span>
              </button>
            </>
          )}

          <div className="h-px bg-fluent-border my-1" />

          <button
            onClick={() => { onCut(); onClose(); }}
            className="w-full flex items-center px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <Scissors size={14} className="mr-2.5" />
            <span className="flex-1">Cortar</span>
            <span className="text-[10px] text-fluent-textMuted">Ctrl+X</span>
          </button>

          <button
            onClick={() => { onCopy(); onClose(); }}
            className="w-full flex items-center px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <Copy size={14} className="mr-2.5" />
            <span className="flex-1">Copiar</span>
            <span className="text-[10px] text-fluent-textMuted">Ctrl+C</span>
          </button>

          <button
            onClick={() => { onDuplicate(); onClose(); }}
            className="w-full flex items-center px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <Files size={14} className="mr-2.5" />
            <span>Duplicar</span>
          </button>

          <button
            onClick={() => { onRename(); onClose(); }}
            className="w-full flex items-center px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <Edit2 size={14} className="mr-2.5" />
            <span className="flex-1">Renombrar</span>
            <span className="text-[10px] text-fluent-textMuted">F2</span>
          </button>

          <div className="h-px bg-fluent-border my-1" />

          <button
            onClick={() => { onCompress(); onClose(); }}
            className="w-full flex items-center px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <FolderArchive size={14} className="mr-2.5 text-amber-600" />
            <span>Comprimir</span>
          </button>

          <button
            onClick={() => { onDownload(targetItem); onClose(); }}
            className="w-full flex items-center px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <Download size={14} className="mr-2.5 text-blue-600" />
            <span>Descargar</span>
          </button>

          <button
            onClick={() => { onCopyPath(targetItem); onClose(); }}
            className="w-full flex items-center px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <Link size={14} className="mr-2.5 text-purple-600" />
            <span>Copiar ruta</span>
          </button>

          <div className="h-px bg-fluent-border my-1" />

          <button
            onClick={() => { onTrash(); onClose(); }}
            className="w-full flex items-center px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 transition-colors text-left"
          >
            <Trash2 size={14} className="mr-2.5" />
            <span className="flex-1">Mover a papelera</span>
            <span className="text-[10px] text-red-400">Supr</span>
          </button>

          <button
            onClick={() => { onPermanentDelete(); onClose(); }}
            className="w-full flex items-center px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-700 transition-colors text-left font-medium"
          >
            <Trash2 size={14} className="mr-2.5" />
            <span>Eliminar permanentemente</span>
          </button>

          <div className="h-px bg-fluent-border my-1" />

          <button
            onClick={() => { onProperties(targetItem); onClose(); }}
            className="w-full flex items-center px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <Info size={14} className="mr-2.5 text-fluent-blue" />
            <span>Propiedades</span>
          </button>
        </>
      ) : (
        /* Menú contextual al hacer clic en área vacía */
        <>
          <button
            onClick={() => { onPaste(); onClose(); }}
            disabled={!canPaste}
            className="w-full flex items-center px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition-colors text-left"
          >
            <ClipboardPaste size={14} className="mr-2.5" />
            <span className="flex-1">Pegar</span>
            <span className="text-[10px] text-fluent-textMuted">Ctrl+V</span>
          </button>
        </>
      )}
    </div>
  );
}
