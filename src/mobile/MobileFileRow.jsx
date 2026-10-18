import React, { useState, useRef } from 'react';
import {
  MoreVertical,
  Check,
  Trash2,
  Share2,
  Download,
  Folder,
} from 'lucide-react';
import { getFileIcon, formatBytes, formatDate } from '../utils/formatters.jsx';
import { triggerHaptic } from './native-bridge.js';

export default function MobileFileRow({
  item,
  isSelected,
  isSelectionMode,
  onSelect,
  onOpen,
  onActionMenu,
  onQuickDelete,
  onQuickShare,
  onQuickDownload,
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isSwiping = useRef(false);
  const longPressTimer = useRef(null);
  const hasTriggeredLongPress = useRef(false);

  // Long press handler
  const handleTouchStart = (e) => {
    hasTriggeredLongPress.current = false;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isSwiping.current = false;

    longPressTimer.current = setTimeout(() => {
      hasTriggeredLongPress.current = true;
      triggerHaptic('medium');
      if (isSelectionMode) {
        onSelect(item);
      } else {
        // En móvil una pulsación larga abre el menú de acciones o activa selección
        onActionMenu(item);
      }
    }, 450);
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current || !touchStartY.current) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX.current;
    const diffY = touch.clientY - touchStartY.current;

    // Si se mueve más de 10px antes del tiempo, cancelar long press
    if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    // Si el movimiento es horizontal preponderante, es swipe
    if (!isSelectionMode && Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 15) {
      isSwiping.current = true;
      // Solo permitir swipe a la izquierda (offset negativo) hasta -160px
      if (diffX < 0) {
        setSwipeOffset(Math.max(diffX, -160));
      } else {
        setSwipeOffset(0);
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isSwiping.current) {
      if (swipeOffset < -80) {
        setSwipeOffset(-140); // Mantener abierto para mostrar acciones
      } else {
        setSwipeOffset(0);
      }
      isSwiping.current = false;
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleClick = (e) => {
    if (hasTriggeredLongPress.current) {
      e.preventDefault();
      return;
    }
    if (swipeOffset !== 0) {
      setSwipeOffset(0);
      return;
    }
    if (isSelectionMode) {
      triggerHaptic();
      onSelect(item);
    } else {
      triggerHaptic();
      onOpen(item);
    }
  };

  const closeSwipe = () => setSwipeOffset(0);

  return (
    <div className="relative overflow-hidden border-b border-white/[0.06] bg-[#161820]">
      {/* Botones de acción descubiertos por swipe (fondo) */}
      <div className="absolute inset-y-0 right-0 flex items-stretch bg-[#1f222e]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            closeSwipe();
            triggerHaptic();
            onQuickShare(item);
          }}
          className="w-16 flex flex-col items-center justify-center bg-blue-600 text-white active:bg-blue-700 touch-target"
          aria-label="Compartir"
        >
          <Share2 size={18} />
          <span className="text-[10px] mt-1 font-medium">Compartir</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            closeSwipe();
            triggerHaptic();
            onQuickDelete(item);
          }}
          className="w-16 flex flex-col items-center justify-center bg-rose-600 text-white active:bg-rose-700 touch-target"
          aria-label="Borrar"
        >
          <Trash2 size={18} />
          <span className="text-[10px] mt-1 font-medium">Borrar</span>
        </button>
      </div>

      {/* Contenido de la fila (primer plano) */}
      <div
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className={`flex items-center min-h-[64px] px-3 py-2.5 transition-transform duration-150 ease-out active:bg-white/[0.06] select-none ${
          isSelected ? 'bg-blue-900/20' : 'bg-[#161820]'
        }`}
      >
        {/* Checkbox de selección */}
        {isSelectionMode && (
          <div className="mr-3 flex items-center justify-center touch-target">
            <div
              className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'border-white/30 bg-white/5'
              }`}
            >
              {isSelected && <Check size={16} strokeWidth={3} />}
            </div>
          </div>
        )}

        {/* Icono del archivo/carpeta */}
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-white/5 mr-3">
          {getFileIcon(item, 24)}
        </div>

        {/* Título y metadatos */}
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-sm font-medium text-gray-100 truncate leading-snug">
            {item.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 truncate">
            <span>{item.isDirectory ? `${item.itemCount ?? 0} elementos` : formatBytes(item.size)}</span>
            <span>•</span>
            <span>{formatDate(item.mtime || item.updatedAt)}</span>
            {item.permissionsOctal && (
              <>
                <span>•</span>
                <span className="font-mono text-[10px] text-gray-500">{item.permissionsOctal}</span>
              </>
            )}
          </div>
        </div>

        {/* Botón de acciones contextuales (•••) */}
        {!isSelectionMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic();
              onActionMenu(item);
            }}
            className="p-2 -mr-1 text-gray-400 hover:text-white rounded-lg active:bg-white/10 touch-target flex items-center justify-center"
            aria-label={`Acciones para ${item.name}`}
          >
            <MoreVertical size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
