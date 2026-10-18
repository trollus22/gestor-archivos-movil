import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCw,
  Home,
  ChevronRight,
  Search,
  CheckCircle2,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Settings,
  PanelRight,
  X,
} from 'lucide-react';

export default function Toolbar({
  currentPath,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onUp,
  onRefresh,
  onNavigate,
  onSearch,
  searchQuery,
  isSearching,
  onCancelSearch,
  viewMode,
  onChangeViewMode,
  showDetailsPanel,
  onToggleDetailsPanel,
  onOpenSettings,
}) {
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [typedPath, setTypedPath] = useState(currentPath);
  const [searchInput, setSearchInput] = useState(searchQuery || '');

  useEffect(() => {
    setTypedPath(currentPath);
  }, [currentPath]);

  useEffect(() => {
    setSearchInput(searchQuery || '');
  }, [searchQuery]);

  const handlePathSubmit = (e) => {
    e.preventDefault();
    setIsEditingPath(false);
    if (typedPath.trim()) {
      onNavigate(typedPath.trim());
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  // Desglosar la ruta para las migas de pan clicables
  const renderBreadcrumbs = () => {
    if (currentPath === 'home') {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-fluent-text dark:text-fluent-darkText">
          <Home size={15} className="text-fluent-blue mr-1" />
          <span>Home</span>
        </div>
      );
    }

    const segments = currentPath.split('/').filter(Boolean);
    return (
      <div className="flex items-center space-x-1 text-sm font-medium text-fluent-text dark:text-fluent-darkText">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('/');
          }}
          className="hover:bg-black/5 dark:hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors"
        >
          Raíz (/)
        </button>
        {segments.map((seg, idx) => {
          const segPath = '/' + segments.slice(0, idx + 1).join('/');
          const isLast = idx === segments.length - 1;
          return (
            <React.Fragment key={segPath}>
              <ChevronRight size={13} className="text-fluent-textSecondary dark:text-fluent-darkTextSecondary flex-shrink-0" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(segPath);
                }}
                className={`hover:bg-black/5 dark:hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors truncate max-w-[150px] ${
                  isLast ? 'font-semibold text-fluent-blue' : ''
                }`}
                title={seg}
              >
                {seg}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-12 bg-white/70 dark:bg-fluent-darkSurface/70 backdrop-blur-md px-3 flex items-center justify-between border-b border-fluent-border space-x-2 select-none">
      {/* Botones de navegación (Atrás, Adelante, Arriba, Refrescar) */}
      <div className="flex items-center space-x-1">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Atrás (Alt + Izquierda)"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          onClick={onForward}
          disabled={!canGoForward}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Adelante (Alt + Derecha)"
        >
          <ArrowRight size={16} />
        </button>
        <button
          onClick={onUp}
          disabled={currentPath === 'home' || currentPath === '/'}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Subir al nivel superior (Retroceso)"
        >
          <ArrowUp size={16} />
        </button>
        <button
          onClick={onRefresh}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText transition-colors"
          title="Actualizar (F5)"
        >
          <RotateCw size={15} />
        </button>
      </div>

      {/* Barra de dirección / Migas de pan */}
      <div
        onClick={() => {
          setTypedPath(currentPath === 'home' ? '/' : currentPath);
          setIsEditingPath(true);
        }}
        className="flex-1 h-8 bg-white dark:bg-fluent-darkBg/80 border border-fluent-border rounded-md px-3 flex items-center cursor-text hover:border-black/20 dark:hover:border-white/20 transition-all shadow-sm overflow-hidden"
      >
        {isEditingPath ? (
          <form onSubmit={handlePathSubmit} className="w-full">
            <input
              type="text"
              value={typedPath}
              onChange={(e) => setTypedPath(e.target.value)}
              onBlur={() => setIsEditingPath(false)}
              onFocus={(e) => e.target.select()}
              autoFocus
              className="w-full bg-transparent text-sm text-fluent-text dark:text-fluent-darkText outline-none"
              placeholder="Escriba una ruta y presione Enter (ej. /home/ubuntu)"
            />
          </form>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center overflow-x-auto no-scrollbar py-0.5">
              {renderBreadcrumbs()}
            </div>
            <span className="text-[10px] text-fluent-textMuted ml-2">⌄</span>
          </div>
        )}
      </div>

      {/* Buscador */}
      <div className="w-64 relative">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar en esta carpeta..."
            className="w-full h-8 pl-8 pr-7 bg-white dark:bg-fluent-darkBg/80 border border-fluent-border rounded-md text-xs text-fluent-text dark:text-fluent-darkText placeholder-fluent-textMuted outline-none focus:border-fluent-blue transition-all shadow-sm"
          />
          <Search size={14} className="absolute left-2.5 text-fluent-textSecondary dark:text-fluent-darkTextSecondary pointer-events-none" />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                if (isSearching) onCancelSearch();
              }}
              className="absolute right-2 text-fluent-textMuted hover:text-fluent-text dark:hover:text-fluent-darkText"
            >
              <X size={13} />
            </button>
          )}
        </form>
      </div>

      {/* Acciones y configuración a la derecha */}
      <div className="flex items-center space-x-1 pl-1">
        {/* Indicador de estado sincronizado */}
        <div className="p-1.5 text-emerald-600 dark:text-emerald-400" title="Sistema conectado y sincronizado">
          <CheckCircle2 size={16} />
        </div>

        {/* Selector de modo de vista */}
        <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-md p-0.5 border border-fluent-border">
          <button
            onClick={() => onChangeViewMode('grid')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'grid' ? 'bg-white dark:bg-fluent-darkBg shadow-sm text-fluent-blue' : 'text-fluent-textSecondary'
            }`}
            title="Vista de cuadrícula"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => onChangeViewMode('list')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'list' ? 'bg-white dark:bg-fluent-darkBg shadow-sm text-fluent-blue' : 'text-fluent-textSecondary'
            }`}
            title="Vista de lista"
          >
            <List size={15} />
          </button>
          <button
            onClick={() => onChangeViewMode('details')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'details' ? 'bg-white dark:bg-fluent-darkBg shadow-sm text-fluent-blue' : 'text-fluent-textSecondary'
            }`}
            title="Vista detallada"
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>

        {/* Panel de detalles */}
        <button
          onClick={onToggleDetailsPanel}
          className={`p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
            showDetailsPanel ? 'text-fluent-blue bg-fluent-blueLight/50 dark:bg-fluent-blue/20' : 'text-fluent-textSecondary'
          }`}
          title="Panel de detalles"
        >
          <PanelRight size={16} />
        </button>

        {/* Configuración */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-textSecondary hover:text-fluent-text transition-colors"
          title="Configuración"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}
