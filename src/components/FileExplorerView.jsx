import React, { useState, useRef, useEffect } from 'react';
import {
  FolderPlus,
  FilePlus,
  Scissors,
  Copy,
  ClipboardPaste,
  Edit2,
  Trash2,
  FolderArchive,
  Download,
  Upload,
  Info,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { formatBytes, formatDate, getFileIcon, getFileTypeLabel } from '../utils/formatters.jsx';

export default function FileExplorerView({
  items,
  currentPath,
  viewMode,
  selectedPaths,
  onSelect,
  onOpenItem,
  onContextMenu,
  onDropMove,
  clipboard,
  onCut,
  onCopy,
  onPaste,
  onDeleteSelected,
  onRenameSelected,
  onCompressSelected,
  onExtractItem,
  onNewFolder,
  onNewFile,
  onTriggerUpload,
  onDownloadItem,
  onShowProperties,
}) {
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [dragOverPath, setDragOverPath] = useState(null);

  // Marquee (selección por recuadro arrastrando sobre vacío)
  const containerRef = useRef(null);
  const [marquee, setMarquee] = useState(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    // Carpetas primero
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;

    let res = 0;
    if (sortField === 'name') {
      res = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortField === 'mtime') {
      res = new Date(a.mtime || 0) - new Date(b.mtime || 0);
    } else if (sortField === 'size') {
      res = (a.size || 0) - (b.size || 0);
    } else if (sortField === 'type') {
      res = getFileTypeLabel(a).localeCompare(getFileTypeLabel(b));
    }
    return sortAsc ? res : -res;
  });

  // Manejo de drag and drop interno (mover a carpeta)
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(
      selectedPaths.length > 0 && selectedPaths.includes(item.path)
        ? selectedPaths
        : [item.path]
    ));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, item) => {
    if (item && item.isDirectory && !selectedPaths.includes(item.path)) {
      e.preventDefault();
      e.stopPropagation();
      setDragOverPath(item.path);
    }
  };

  const handleDragLeave = (e, item) => {
    if (item && dragOverPath === item.path) {
      setDragOverPath(null);
    }
  };

  const handleDrop = (e, targetFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(null);

    // Comprobar si son archivos del explorador o del sistema operativo externo
    const rawData = e.dataTransfer.getData('text/plain');
    if (rawData) {
      try {
        const paths = JSON.parse(rawData);
        if (Array.isArray(paths) && targetFolder.isDirectory) {
          onDropMove(paths, targetFolder.path);
        }
      } catch (err) {
        // Ignorar
      }
    }
  };

  // Marquee selección en área vacía
  const handleMouseDown = (e) => {
    if (e.target === containerRef.current || e.target.classList.contains('empty-area')) {
      const rect = containerRef.current.getBoundingClientRect();
      setMarquee({
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        currentX: e.clientX - rect.left,
        currentY: e.clientY - rect.top,
      });
      if (!e.ctrlKey && !e.metaKey) {
        onSelect([], null);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (marquee && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMarquee((prev) => ({
        ...prev,
        currentX: e.clientX - rect.left,
        currentY: e.clientY - rect.top,
      }));
    }
  };

  const handleMouseUp = () => {
    setMarquee(null);
  };

  const isSelected = (p) => selectedPaths.includes(p);
  const selectedCount = selectedPaths.length;
  const singleSelected = selectedCount === 1 ? items.find((i) => i.path === selectedPaths[0]) : null;

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Barra de comandos (Command Bar estilo Windows 11 / Files App) */}
      <div className="h-11 bg-white/80 dark:bg-fluent-darkSurface/80 border-b border-fluent-border px-3 flex items-center justify-between text-xs font-medium space-x-1 flex-shrink-0">
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
          {/* Menú Nuevo */}
          <div className="flex items-center space-x-0.5 border-r border-fluent-border pr-2 mr-1">
            <button
              onClick={onNewFolder}
              className="flex items-center px-2.5 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText transition-colors"
              title="Nueva carpeta"
            >
              <FolderPlus size={15} className="text-fluent-blue mr-1.5" />
              <span>Nueva carpeta</span>
            </button>
            <button
              onClick={onNewFile}
              className="flex items-center px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText transition-colors"
              title="Nuevo archivo de texto"
            >
              <FilePlus size={15} className="text-emerald-600 mr-1.5" />
              <span>Nuevo archivo</span>
            </button>
          </div>

          {/* Cortar, Copiar, Pegar */}
          <button
            onClick={onCut}
            disabled={selectedCount === 0}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText disabled:opacity-30 transition-colors"
            title="Cortar (Ctrl+X)"
          >
            <Scissors size={15} />
          </button>
          <button
            onClick={onCopy}
            disabled={selectedCount === 0}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText disabled:opacity-30 transition-colors"
            title="Copiar (Ctrl+C)"
          >
            <Copy size={15} />
          </button>
          <button
            onClick={onPaste}
            disabled={!clipboard || clipboard.items.length === 0}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText disabled:opacity-30 transition-colors"
            title={`Pegar (${clipboard ? clipboard.items.length : 0} en portapapeles)`}
          >
            <ClipboardPaste size={15} />
          </button>

          <div className="h-4 w-px bg-fluent-border mx-1" />

          {/* Renombrar */}
          <button
            onClick={onRenameSelected}
            disabled={selectedCount === 0}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText disabled:opacity-30 transition-colors"
            title="Renombrar (F2)"
          >
            <Edit2 size={15} />
          </button>

          {/* Eliminar */}
          <button
            onClick={onDeleteSelected}
            disabled={selectedCount === 0}
            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 disabled:opacity-30 transition-colors"
            title="Mover a papelera (Supr)"
          >
            <Trash2 size={15} />
          </button>

          <div className="h-4 w-px bg-fluent-border mx-1" />

          {/* Comprimir */}
          <button
            onClick={onCompressSelected}
            disabled={selectedCount === 0}
            className="flex items-center px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText disabled:opacity-30 transition-colors"
            title="Comprimir a ZIP o TAR.GZ"
          >
            <FolderArchive size={15} className="mr-1 text-amber-600" />
            <span>Comprimir</span>
          </button>

          {/* Extraer si se seleccionó archivo comprimido */}
          {singleSelected && (singleSelected.name.endsWith('.zip') || singleSelected.name.endsWith('.tar.gz') || singleSelected.name.endsWith('.tar') || singleSelected.name.endsWith('.gz')) && (
            <button
              onClick={() => onExtractItem(singleSelected)}
              className="flex items-center px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText transition-colors"
              title="Extraer aquí"
            >
              <ExternalLink size={15} className="mr-1 text-emerald-600" />
              <span>Extraer aquí</span>
            </button>
          )}

          {/* Descargar */}
          <button
            onClick={() => {
              if (singleSelected) onDownloadItem(singleSelected);
              else if (selectedCount === 0) onDownloadItem({ isDirectory: true, path: currentPath, name: 'carpeta' });
            }}
            className="flex items-center px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText transition-colors"
            title="Descargar (como ZIP si es carpeta)"
          >
            <Download size={15} className="mr-1 text-blue-600" />
            <span>Descargar</span>
          </button>

          {/* Subir */}
          <button
            onClick={onTriggerUpload}
            className="flex items-center px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText transition-colors"
            title="Subir archivos (chunked)"
          >
            <Upload size={15} className="mr-1 text-purple-600" />
            <span>Subir</span>
          </button>
        </div>

        {/* Botón de propiedades */}
        {selectedCount > 0 && (
          <button
            onClick={onShowProperties}
            className="flex items-center px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText"
            title="Propiedades"
          >
            <Info size={15} className="mr-1 text-fluent-blue" />
            <span>Propiedades</span>
          </button>
        )}
      </div>

      {/* Área principal de ficheros */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => onContextMenu(e, null)}
        className="flex-1 overflow-y-auto p-4 empty-area relative focus:outline-none"
      >
        {/* Renderizado según modo de vista */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 empty-area">
            {sortedItems.map((item) => {
              const selected = isSelected(item.path);
              const isDropTarget = dragOverPath === item.path;
              return (
                <div
                  key={item.path}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, item)}
                  onDragLeave={(e) => handleDragLeave(e, item)}
                  onDrop={(e) => handleDrop(e, item)}
                  onClick={(e) => onSelect(item.path, e)}
                  onDoubleClick={() => onOpenItem(item)}
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    onContextMenu(e, item);
                  }}
                  className={`group relative flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                    selected
                      ? 'bg-fluent-blueLight/90 dark:bg-fluent-blue/20 border-fluent-blue shadow-sm ring-1 ring-fluent-blue'
                      : 'bg-white dark:bg-fluent-darkSurface border-fluent-border hover:bg-fluent-surfaceHover dark:hover:bg-white/5'
                  } ${isDropTarget ? 'ring-2 ring-emerald-500 scale-105' : ''}`}
                >
                  <div className="mb-2">
                    {getFileIcon(item, 36)}
                  </div>
                  <span
                    className="text-xs font-medium text-fluent-text dark:text-fluent-darkText text-center truncate w-full"
                    title={item.name}
                  >
                    {item.name}
                  </span>
                  {!item.isDirectory && (
                    <span className="text-[10px] text-fluent-textMuted mt-0.5">
                      {formatBytes(item.size)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 empty-area">
            {sortedItems.map((item) => {
              const selected = isSelected(item.path);
              return (
                <div
                  key={item.path}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, item)}
                  onDragLeave={(e) => handleDragLeave(e, item)}
                  onDrop={(e) => handleDrop(e, item)}
                  onClick={(e) => onSelect(item.path, e)}
                  onDoubleClick={() => onOpenItem(item)}
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    onContextMenu(e, item);
                  }}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-md border cursor-pointer transition-all ${
                    selected
                      ? 'bg-fluent-blueLight/90 dark:bg-fluent-blue/20 border-fluent-blue'
                      : 'bg-white dark:bg-fluent-darkSurface border-fluent-border hover:bg-fluent-surfaceHover dark:hover:bg-white/5'
                  }`}
                >
                  {getFileIcon(item, 18)}
                  <span className="text-xs font-medium text-fluent-text dark:text-fluent-darkText truncate flex-1">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'details' && (
          <div className="bg-white dark:bg-fluent-darkSurface border border-fluent-border rounded-lg overflow-hidden shadow-sm empty-area">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-fluent-border bg-black/[0.02] dark:bg-white/[0.02] text-fluent-textSecondary dark:text-fluent-darkTextSecondary font-semibold">
                  <th
                    onClick={() => handleSort('name')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-black/5 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nombre</span>
                      {sortField === 'name' ? (
                        sortAsc ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('mtime')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-black/5 transition-colors w-44"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Fecha de modificación</span>
                      {sortField === 'mtime' ? (
                        sortAsc ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('type')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-black/5 transition-colors w-40"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tipo</span>
                      {sortField === 'type' ? (
                        sortAsc ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('size')}
                    className="py-2.5 px-4 cursor-pointer hover:bg-black/5 transition-colors w-28 text-right"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Tamaño</span>
                      {sortField === 'size' ? (
                        sortAsc ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fluent-border">
                {sortedItems.map((item) => {
                  const selected = isSelected(item.path);
                  return (
                    <tr
                      key={item.path}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={(e) => handleDragOver(e, item)}
                      onDragLeave={(e) => handleDragLeave(e, item)}
                      onDrop={(e) => handleDrop(e, item)}
                      onClick={(e) => onSelect(item.path, e)}
                      onDoubleClick={() => onOpenItem(item)}
                      onContextMenu={(e) => {
                        e.stopPropagation();
                        onContextMenu(e, item);
                      }}
                      className={`cursor-pointer transition-colors ${
                        selected
                          ? 'bg-fluent-blueLight/90 dark:bg-fluent-blue/20 text-fluent-blue font-medium'
                          : 'hover:bg-fluent-surfaceHover dark:hover:bg-white/5 text-fluent-text dark:text-fluent-darkText'
                      }`}
                    >
                      <td className="py-2 px-4 flex items-center space-x-3 max-w-xs sm:max-w-md">
                        {getFileIcon(item, 18)}
                        <span className="truncate">{item.name}</span>
                      </td>
                      <td className="py-2 px-4 text-fluent-textSecondary dark:text-fluent-darkTextSecondary whitespace-nowrap">
                        {formatDate(item.mtime)}
                      </td>
                      <td className="py-2 px-4 text-fluent-textSecondary dark:text-fluent-darkTextSecondary whitespace-nowrap">
                        {getFileTypeLabel(item)}
                      </td>
                      <td className="py-2 px-4 text-right text-fluent-textSecondary dark:text-fluent-darkTextSecondary whitespace-nowrap">
                        {item.isDirectory ? '—' : formatBytes(item.size)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {sortedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-fluent-textMuted text-xs empty-area">
            <span className="mb-2 text-3xl">📁</span>
            <span>Esta carpeta está vacía.</span>
          </div>
        )}

        {/* Recuadro visual de selección Marquee */}
        {marquee && (
          <div
            className="absolute border border-fluent-blue bg-fluent-blue/10 pointer-events-none z-10"
            style={{
              left: Math.min(marquee.startX, marquee.currentX),
              top: Math.min(marquee.startY, marquee.currentY),
              width: Math.abs(marquee.currentX - marquee.startX),
              height: Math.abs(marquee.currentY - marquee.startY),
            }}
          />
        )}
      </div>
    </div>
  );
}
