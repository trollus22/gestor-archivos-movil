import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FolderOpen,
  AlertTriangle,
  RotateCw,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import MobileFileRow from './MobileFileRow.jsx';
import { triggerHaptic } from './native-bridge.js';

export default function MobileFileList({
  items,
  loading,
  error,
  currentPath,
  isSelectionMode,
  selectedPaths,
  onToggleSelect,
  onOpenItem,
  onActionMenu,
  onQuickDelete,
  onQuickShare,
  onQuickDownload,
  onRefresh,
  sortBy,
  sortDirection,
}) {
  const containerRef = useRef(null);

  // Pull to refresh state
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const canPull = useRef(false);

  // Paginación / Scroll progresivo
  const [visibleCount, setVisibleCount] = useState(50);

  // Reset pagination on path change
  useEffect(() => {
    setVisibleCount(50);
  }, [currentPath]);

  // Ordenar items
  const sortedItems = useMemo(() => {
    if (!items || !items.length) return [];
    return [...items].sort((a, b) => {
      // Carpetas siempre primero
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;

      let valA, valB;
      if (sortBy === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (sortBy === 'date') {
        valA = new Date(a.mtime || a.updatedAt || 0).getTime();
        valB = new Date(b.mtime || b.updatedAt || 0).getTime();
      } else if (sortBy === 'size') {
        valA = a.size || 0;
        valB = b.size || 0;
      } else {
        valA = a.name;
        valB = b.name;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortBy, sortDirection]);

  const visibleItems = sortedItems.slice(0, visibleCount);

  // Handlers para pull to refresh
  const handleTouchStart = (e) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      canPull.current = true;
      touchStartY.current = e.touches[0].clientY;
    } else {
      canPull.current = false;
    }
  };

  const handleTouchMove = (e) => {
    if (!canPull.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      // Amortiguación no lineal
      const resistance = Math.min(diff * 0.45, 90);
      setPullY(resistance);
      setIsPulling(true);
    }
  };

  const handleTouchEnd = () => {
    if (pullY > 55) {
      triggerHaptic('medium');
      onRefresh();
    }
    setPullY(0);
    setIsPulling(false);
    canPull.current = false;
  };

  // Scroll infinito al llegar abajo
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      if (visibleCount < sortedItems.length) {
        setVisibleCount((prev) => Math.min(prev + 40, sortedItems.length));
      }
    }
  };

  // Estado de carga inicial
  if (loading && (!items || items.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-400">
        <Loader2 size={36} className="animate-spin text-blue-500 mb-3" />
        <p className="text-sm font-medium">Cargando archivos...</p>
        <span className="text-xs text-gray-500 mt-1">{currentPath}</span>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-base font-semibold text-gray-100">No se pudo abrir la carpeta</h3>
        <p className="text-xs text-rose-300 mt-1 max-w-xs">{error}</p>
        <button
          onClick={() => {
            triggerHaptic();
            onRefresh();
          }}
          className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/15 active:bg-white/20 text-white rounded-xl text-sm font-medium touch-target flex items-center gap-2"
        >
          <RotateCw size={16} />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  // Estado vacío
  if (!items || items.length === 0) {
    return (
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-y-auto"
      >
        {/* Pull to refresh indicator */}
        {pullY > 0 && (
          <div
            style={{ transform: `translateY(${pullY - 40}px)` }}
            className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white shadow-lg transition-transform"
          >
            <RotateCw size={18} className={pullY > 55 ? 'rotate-180 transition-transform' : ''} />
          </div>
        )}
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
          <FolderOpen size={36} />
        </div>
        <h3 className="text-base font-semibold text-gray-200">Carpeta vacía</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">
          No hay archivos ni carpetas en este directorio. Usa el botón flotante (+) para subir fotos o crear elementos.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="flex-1 overflow-y-auto overflow-x-hidden relative divide-y divide-white/[0.04] overscroll-y-contain pb-24"
    >
      {/* Pull to refresh visual indicator */}
      {pullY > 0 && (
        <div
          style={{ height: `${pullY}px` }}
          className="w-full flex items-center justify-center bg-blue-950/20 text-blue-400 overflow-hidden transition-all duration-75"
        >
          <div className="flex items-center gap-2 text-xs font-medium">
            <RotateCw size={16} className={pullY > 55 ? 'rotate-180 text-blue-300 transition-transform' : ''} />
            <span>{pullY > 55 ? 'Suelta para actualizar' : 'Desliza para actualizar'}</span>
          </div>
        </div>
      )}

      {/* Lista de filas */}
      {visibleItems.map((item) => (
        <MobileFileRow
          key={item.path || item.name}
          item={item}
          isSelected={selectedPaths.includes(item.path)}
          isSelectionMode={isSelectionMode}
          onSelect={onToggleSelect}
          onOpen={onOpenItem}
          onActionMenu={onActionMenu}
          onQuickDelete={onQuickDelete}
          onQuickShare={onQuickShare}
          onQuickDownload={onQuickDownload}
        />
      ))}

      {/* Indicador de paginación o fin de lista */}
      {visibleCount < sortedItems.length ? (
        <div className="p-4 text-center">
          <button
            onClick={() => {
              triggerHaptic();
              setVisibleCount((prev) => Math.min(prev + 50, sortedItems.length));
            }}
            className="w-full py-2.5 bg-white/5 active:bg-white/10 rounded-xl text-xs font-semibold text-gray-300 touch-target"
          >
            Cargar más archivos ({visibleCount} de {sortedItems.length})
          </button>
        </div>
      ) : (
        <div className="py-4 text-center text-xs text-gray-600">
          {sortedItems.length} {sortedItems.length === 1 ? 'elemento' : 'elementos'} en total
        </div>
      )}
    </div>
  );
}
