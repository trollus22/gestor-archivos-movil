import React, { useRef, useEffect } from 'react';
import {
  ChevronLeft,
  CheckSquare,
  Square,
  ArrowUpDown,
  RotateCw,
  X,
  Folder,
  Server,
  Home,
} from 'lucide-react';
import { triggerHaptic } from './native-bridge.js';

export default function MobileHeader({
  currentPath,
  onNavigate,
  onGoBack,
  canGoBack,
  isSelectionMode,
  selectedCount,
  totalCount,
  onToggleSelectionMode,
  onSelectAll,
  onDeselectAll,
  onRefresh,
  isRefreshing,
  sortBy,
  sortDirection,
  onToggleSort,
}) {
  const breadcrumbScrollRef = useRef(null);

  // Parse path into segments
  const segments = [];
  const parts = currentPath.split('/').filter(Boolean);
  let accumulated = '';
  segments.push({ name: 'Raíz', path: '/' });
  parts.forEach((p) => {
    accumulated += '/' + p;
    segments.push({ name: p, path: accumulated });
  });

  // Auto-scroll breadcrumbs to the right on path change
  useEffect(() => {
    if (breadcrumbScrollRef.current) {
      breadcrumbScrollRef.current.scrollLeft = breadcrumbScrollRef.current.scrollWidth;
    }
  }, [currentPath]);

  if (isSelectionMode) {
    const allSelected = totalCount > 0 && selectedCount === totalCount;
    return (
      <header className="sticky top-0 z-30 bg-[#16181f]/95 backdrop-blur-md border-b border-white/10 px-3 py-2 pt-[max(0.75rem,env(safe-area-inset-top))] transition-all">
        <div className="flex items-center justify-between h-11">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic();
                onToggleSelectionMode();
              }}
              className="p-2 -ml-1 text-gray-300 hover:text-white rounded-lg active:bg-white/10 touch-target flex items-center justify-center"
              aria-label="Cerrar selección"
            >
              <X size={22} />
            </button>
            <span className="text-base font-semibold text-white">
              {selectedCount} {selectedCount === 1 ? 'seleccionado' : 'seleccionados'}
            </span>
          </div>

          <button
            onClick={() => {
              triggerHaptic();
              if (allSelected) {
                onDeselectAll();
              } else {
                onSelectAll();
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 active:bg-white/20 text-blue-400 touch-target flex items-center gap-1.5"
          >
            {allSelected ? <Square size={16} /> : <CheckSquare size={16} />}
            <span>{allSelected ? 'Desmarcar' : 'Todo'}</span>
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 bg-[#16181f]/95 backdrop-blur-md border-b border-white/10 px-3 py-2 pt-[max(0.75rem,env(safe-area-inset-top))] transition-all">
      <div className="flex items-center justify-between h-11 gap-2">
        {/* Botón Atrás */}
        <button
          onClick={() => {
            triggerHaptic();
            onGoBack();
          }}
          disabled={!canGoBack && currentPath === '/'}
          className={`p-2 -ml-1 rounded-lg touch-target flex items-center justify-center transition-opacity ${
            !canGoBack && currentPath === '/'
              ? 'opacity-20 cursor-not-allowed text-gray-500'
              : 'text-gray-200 active:bg-white/10'
          }`}
          aria-label="Volver atrás"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Migas de pan horizontales scrollables */}
        <div
          ref={breadcrumbScrollRef}
          className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-1"
        >
          {segments.map((seg, idx) => {
            const isLast = idx === segments.length - 1;
            return (
              <React.Fragment key={seg.path}>
                <button
                  onClick={() => {
                    triggerHaptic();
                    if (!isLast) onNavigate(seg.path);
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-colors min-h-[32px] ${
                    isLast
                      ? 'bg-blue-600/30 text-blue-300 font-semibold'
                      : 'text-gray-300 active:bg-white/10 hover:text-white'
                  }`}
                >
                  {idx === 0 ? <Server size={12} className="inline" /> : null}
                  <span>{seg.name}</span>
                </button>
                {!isLast && <span className="text-gray-600 text-xs">/</span>}
              </React.Fragment>
            );
          })}
        </div>

        {/* Acciones Rápidas Superior */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              triggerHaptic();
              onToggleSort();
            }}
            className="p-2 text-gray-300 rounded-lg active:bg-white/10 touch-target flex items-center justify-center"
            title={`Ordenar por ${sortBy} (${sortDirection})`}
            aria-label="Ordenar"
          >
            <ArrowUpDown size={19} className={sortDirection === 'desc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>

          <button
            onClick={() => {
              triggerHaptic();
              onRefresh();
            }}
            disabled={isRefreshing}
            className="p-2 text-gray-300 rounded-lg active:bg-white/10 touch-target flex items-center justify-center"
            title="Refrescar"
            aria-label="Refrescar"
          >
            <RotateCw size={19} className={isRefreshing ? 'animate-spin text-blue-400' : ''} />
          </button>

          <button
            onClick={() => {
              triggerHaptic();
              onToggleSelectionMode();
            }}
            className="p-2 text-gray-300 rounded-lg active:bg-white/10 touch-target flex items-center justify-center"
            title="Seleccionar varios"
            aria-label="Seleccionar varios"
          >
            <CheckSquare size={19} />
          </button>
        </div>
      </div>
    </header>
  );
}
