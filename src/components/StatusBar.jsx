import React from 'react';
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { formatBytes } from '../utils/formatters.jsx';

export default function StatusBar({
  totalItems,
  selectedItems,
  viewMode,
  onChangeViewMode,
}) {
  const selectedCount = selectedItems.length;
  const selectedBytes = selectedItems.reduce((acc, item) => acc + (item.size || 0), 0);

  return (
    <div className="h-6 bg-[#f3f4f6]/95 dark:bg-fluent-darkBg/95 backdrop-blur-md border-t border-fluent-border px-4 flex items-center justify-between text-[11px] text-fluent-textSecondary dark:text-fluent-darkTextSecondary select-none">
      <div>
        {selectedCount === 0 ? (
          <span>{totalItems} elementos</span>
        ) : (
          <span>
            {selectedCount} seleccionado{selectedCount > 1 ? 's' : ''}
            {selectedBytes > 0 && ` · ${formatBytes(selectedBytes)}`}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onChangeViewMode('grid')}
          className={`hover:text-fluent-blue transition-colors ${viewMode === 'grid' ? 'text-fluent-blue' : ''}`}
          title="Vista de cuadrícula"
        >
          <LayoutGrid size={13} />
        </button>
        <button
          onClick={() => onChangeViewMode('list')}
          className={`hover:text-fluent-blue transition-colors ${viewMode === 'list' ? 'text-fluent-blue' : ''}`}
          title="Vista de lista"
        >
          <List size={13} />
        </button>
        <button
          onClick={() => onChangeViewMode('details')}
          className={`hover:text-fluent-blue transition-colors ${viewMode === 'details' ? 'text-fluent-blue' : ''}`}
          title="Vista de detalles"
        >
          <SlidersHorizontal size={13} />
        </button>
      </div>
    </div>
  );
}
