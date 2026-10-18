import React, { useState } from 'react';
import {
  Home,
  Monitor,
  Download,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Trash2,
  HardDrive,
  Cloud,
  Network,
  Pin,
  ChevronDown,
  ChevronRight,
  Folder,
} from 'lucide-react';
import { formatBytes } from '../utils/formatters.jsx';

export default function Sidebar({
  currentPath,
  onNavigate,
  bookmarks,
  onTogglePin,
  diskUsage,
}) {
  const [collapsedSections, setCollapsedSections] = useState({
    pinned: false,
    drives: false,
    cloud: true,
    network: true,
    tags: false,
  });

  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getPinnedIcon = (iconName) => {
    switch (iconName) {
      case 'desktop': return <Monitor size={16} className="text-cyan-600" />;
      case 'downloads': return <Download size={16} className="text-emerald-600" />;
      case 'documents': return <FileText size={16} className="text-blue-600" />;
      case 'pictures': return <ImageIcon size={16} className="text-sky-500" />;
      case 'music': return <Music size={16} className="text-rose-500" />;
      case 'videos': return <Video size={16} className="text-purple-600" />;
      case 'trash': return <Trash2 size={16} className="text-cyan-700" />;
      default: return <Folder size={16} className="text-amber-500" />;
    }
  };

  const isHomeActive = currentPath === 'home';

  return (
    <div className="w-60 bg-[#f9fafb]/90 dark:bg-fluent-darkBg/95 backdrop-blur-md border-r border-fluent-border flex flex-col h-full select-none text-xs font-medium overflow-y-auto no-scrollbar py-3 px-2">
      {/* Home Button con barra indicadora azul Fluent */}
      <button
        onClick={() => onNavigate('home')}
        className={`w-full flex items-center px-3 py-2 rounded-md mb-3 transition-colors relative ${
          isHomeActive
            ? 'bg-fluent-blueLight/80 dark:bg-fluent-blue/20 text-fluent-blue dark:text-blue-400 font-semibold'
            : 'text-fluent-text dark:text-fluent-darkText hover:bg-black/5 dark:hover:bg-white/5'
        }`}
      >
        {isHomeActive && (
          <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-fluent-blue rounded-r" />
        )}
        <Home size={16} className="mr-3 text-fluent-blue" />
        <span>Home</span>
      </button>

      {/* SECCIÓN: Anclados (Pinned) */}
      <div className="mb-4">
        <div
          onClick={() => toggleSection('pinned')}
          className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-fluent-textSecondary dark:text-fluent-darkTextSecondary hover:text-fluent-text cursor-pointer group"
        >
          <span>Anclados</span>
          <span className="text-fluent-textMuted group-hover:text-fluent-text">
            {collapsedSections.pinned ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </span>
        </div>

        {!collapsedSections.pinned && (
          <div className="mt-1 space-y-0.5">
            {(bookmarks?.pinned || []).map((item) => {
              const isActive = currentPath === item.path;
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.path)}
                  className={`group flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer transition-colors relative ${
                    isActive
                      ? 'bg-fluent-blueLight/80 dark:bg-fluent-blue/20 text-fluent-blue dark:text-blue-400 font-semibold'
                      : 'text-fluent-text dark:text-fluent-darkText hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1 bottom-1 w-1 bg-fluent-blue rounded-r" />
                  )}
                  <div className="flex items-center truncate">
                    <span className="mr-3 flex-shrink-0">{getPinnedIcon(item.icon)}</span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(item);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-fluent-textMuted hover:text-fluent-text transition-opacity p-0.5"
                    title="Desanclar"
                  >
                    <Pin size={12} className="rotate-45" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECCIÓN: Unidades (Drives) */}
      <div className="mb-4">
        <div
          onClick={() => toggleSection('drives')}
          className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-fluent-textSecondary dark:text-fluent-darkTextSecondary hover:text-fluent-text cursor-pointer group"
        >
          <span>Unidades</span>
          <span className="text-fluent-textMuted group-hover:text-fluent-text">
            {collapsedSections.drives ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </span>
        </div>

        {!collapsedSections.drives && (
          <div className="mt-1 space-y-1">
            <div
              onClick={() => onNavigate('/')}
              className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors relative ${
                currentPath === '/'
                  ? 'bg-fluent-blueLight/80 dark:bg-fluent-blue/20 text-fluent-blue dark:text-blue-400 font-semibold'
                  : 'text-fluent-text dark:text-fluent-darkText hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {currentPath === '/' && (
                <div className="absolute left-0 top-1 bottom-1 w-1 bg-fluent-blue rounded-r" />
              )}
              <HardDrive size={16} className="mr-3 text-fluent-blue flex-shrink-0" />
              <div className="flex-1 truncate">
                <div className="truncate font-medium">/ (raíz)</div>
                {diskUsage && (
                  <div className="text-[10px] text-fluent-textMuted dark:text-fluent-darkTextSecondary truncate">
                    {formatBytes(diskUsage.freeBytes)} libres de {formatBytes(diskUsage.totalBytes)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN: Unidades en nube (Cloud Drives) */}
      <div className="mb-4">
        <div
          onClick={() => toggleSection('cloud')}
          className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-fluent-textSecondary dark:text-fluent-darkTextSecondary hover:text-fluent-text cursor-pointer group"
        >
          <span>Unidades en nube</span>
          <span className="text-fluent-textMuted group-hover:text-fluent-text">
            {collapsedSections.cloud ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </span>
        </div>
        {!collapsedSections.cloud && (
          <div className="px-3 py-2 text-[11px] text-fluent-textMuted">
            No hay unidades en nube sincronizadas.
          </div>
        )}
      </div>

      {/* SECCIÓN: Red (Network) */}
      <div className="mb-4">
        <div
          onClick={() => toggleSection('network')}
          className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-fluent-textSecondary dark:text-fluent-darkTextSecondary hover:text-fluent-text cursor-pointer group"
        >
          <span>Red</span>
          <span className="text-fluent-textMuted group-hover:text-fluent-text">
            {collapsedSections.network ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </span>
        </div>
        {!collapsedSections.network && (
          <div className="px-3 py-2 text-[11px] text-fluent-textMuted">
            No se detectaron recursos compartidos de red.
          </div>
        )}
      </div>

      {/* SECCIÓN: Etiquetas (Tags) */}
      <div className="mb-4">
        <div
          onClick={() => toggleSection('tags')}
          className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-fluent-textSecondary dark:text-fluent-darkTextSecondary hover:text-fluent-text cursor-pointer group"
        >
          <span>Etiquetas</span>
          <span className="text-fluent-textMuted group-hover:text-fluent-text">
            {collapsedSections.tags ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </span>
        </div>
        {!collapsedSections.tags && (
          <div className="mt-1 space-y-0.5">
            {(bookmarks?.tags || []).map((tag) => (
              <div
                key={tag.id}
                onClick={() => onNavigate(tag.path)}
                className="flex items-center px-3 py-1.5 rounded-md cursor-pointer text-fluent-text dark:text-fluent-darkText hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full mr-3 flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="truncate">{tag.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
