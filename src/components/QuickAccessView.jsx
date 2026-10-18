import React from 'react';
import {
  Monitor,
  Download,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Trash2,
  HardDrive,
  Folder,
  Pin,
  ChevronDown,
  ChevronRight,
  Info,
  Clock,
} from 'lucide-react';
import { formatBytes, formatDate, getFileIcon } from '../utils/formatters.jsx';

export default function QuickAccessView({
  bookmarks,
  diskUsage,
  onNavigate,
  onOpenFile,
  onTogglePin,
}) {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'desktop':
        return <Monitor size={28} className="text-cyan-500" />;
      case 'downloads':
        return <Download size={28} className="text-emerald-500" />;
      case 'documents':
        return <FileText size={28} className="text-blue-500" />;
      case 'pictures':
        return <ImageIcon size={28} className="text-sky-500" />;
      case 'music':
        return <Music size={28} className="text-rose-500" />;
      case 'videos':
        return <Video size={28} className="text-purple-500" />;
      case 'trash':
        return <Trash2 size={28} className="text-cyan-600" />;
      default:
        return <Folder size={28} className="text-amber-500 fill-amber-400/20" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none bg-white/40 dark:bg-transparent">
      {/* SECCIÓN: Acceso rápido */}
      <div>
        <div className="flex items-center space-x-2 text-sm font-semibold text-fluent-text dark:text-fluent-darkText mb-3">
          <ChevronDown size={16} className="text-fluent-textMuted" />
          <span>Acceso rápido</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {(bookmarks?.pinned || []).map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className="group relative bg-white dark:bg-fluent-darkSurface border border-fluent-border hover:border-black/20 dark:hover:border-white/20 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(item);
                }}
                className="absolute top-2 right-2 text-fluent-textMuted group-hover:text-fluent-text dark:group-hover:text-fluent-darkText transition-colors"
                title="Desanclar"
              >
                <Pin size={13} className="rotate-45" />
              </button>
              <div className="my-2">{getIcon(item.icon)}</div>
              <span className="text-xs font-medium text-fluent-text dark:text-fluent-darkText text-center truncate w-full">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN: Unidades */}
      <div>
        <div className="flex items-center space-x-2 text-sm font-semibold text-fluent-text dark:text-fluent-darkText mb-3">
          <ChevronDown size={16} className="text-fluent-textMuted" />
          <span>Unidades</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate('/')}
            className="bg-white dark:bg-fluent-darkSurface border border-fluent-border hover:border-black/20 dark:hover:border-white/20 rounded-lg p-4 flex items-center space-x-4 cursor-pointer transition-all hover:shadow-md"
          >
            <div className="w-12 h-12 bg-fluent-blueLight dark:bg-fluent-blue/20 rounded-lg flex items-center justify-center flex-shrink-0 text-fluent-blue">
              <HardDrive size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-fluent-text dark:text-fluent-darkText truncate">
                Sistema (/) · VPS Linux
              </div>
              {diskUsage ? (
                <>
                  <div className="text-xs text-fluent-textSecondary dark:text-fluent-darkTextSecondary truncate mt-0.5">
                    {formatBytes(diskUsage.freeBytes)} libres de {formatBytes(diskUsage.totalBytes)}
                  </div>
                  {/* Barra de progreso de uso en azul */}
                  <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-fluent-blue h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, diskUsage.percent)}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="text-xs text-fluent-textMuted mt-1">Calculando espacio...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN: Ubicaciones de red */}
      <div>
        <div className="flex items-center space-x-2 text-sm font-semibold text-fluent-text dark:text-fluent-darkText mb-3">
          <ChevronDown size={16} className="text-fluent-textMuted" />
          <span>Ubicaciones de red</span>
        </div>

        <div className="bg-white/80 dark:bg-fluent-darkSurface border border-fluent-border rounded-lg p-3 flex items-center justify-between text-xs text-fluent-textSecondary dark:text-fluent-darkTextSecondary">
          <div className="flex items-center space-x-2">
            <Info size={16} className="text-fluent-blue flex-shrink-0" />
            <span>No hay ubicaciones de red configuradas en este servidor.</span>
          </div>
          <button className="px-3 py-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded border border-fluent-border text-fluent-text dark:text-fluent-darkText transition-colors">
            Configurar
          </button>
        </div>
      </div>

      {/* SECCIÓN: Archivos recientes */}
      <div>
        <div className="flex items-center space-x-2 text-sm font-semibold text-fluent-text dark:text-fluent-darkText mb-3">
          <ChevronDown size={16} className="text-fluent-textMuted" />
          <span>Archivos recientes</span>
        </div>

        {bookmarks?.recent && bookmarks.recent.length > 0 ? (
          <div className="bg-white dark:bg-fluent-darkSurface border border-fluent-border rounded-lg divide-y divide-fluent-border">
            {bookmarks.recent.map((rec) => (
              <div
                key={rec.path}
                onClick={() => (rec.isDirectory ? onNavigate(rec.path) : onOpenFile(rec))}
                className="flex items-center justify-between px-4 py-2 hover:bg-fluent-surfaceHover dark:hover:bg-white/5 cursor-pointer text-xs transition-colors"
              >
                <div className="flex items-center space-x-3 truncate">
                  {getFileIcon(rec, 18)}
                  <span className="font-medium text-fluent-text dark:text-fluent-darkText truncate">
                    {rec.name}
                  </span>
                  <span className="text-fluent-textMuted text-[11px] truncate">
                    {rec.path}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-fluent-textMuted flex-shrink-0">
                  <Clock size={12} />
                  <span>{formatDate(rec.accessedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-fluent-textMuted italic p-4 text-center bg-white/40 dark:bg-fluent-darkSurface/40 border border-fluent-border rounded-lg">
            Los archivos y carpetas abiertos recientemente aparecerán aquí.
          </div>
        )}
      </div>
    </div>
  );
}
