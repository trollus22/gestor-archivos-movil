import React, { useState } from 'react';
import { Upload, X, ChevronUp, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
import { formatBytes } from '../utils/formatters.jsx';

export default function UploadToast({ uploads, onCancelUpload, onDismiss }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!uploads || uploads.length === 0) return null;

  const totalCount = uploads.length;
  const activeCount = uploads.filter((u) => u.status === 'uploading').length;

  return (
    <div className="fixed bottom-10 right-6 z-50 w-80 bg-white dark:bg-fluent-darkSurface border border-fluent-border rounded-xl shadow-fluent-lg overflow-hidden select-none text-xs">
      {/* Cabecera del gestor de subidas */}
      <div className="bg-fluent-surfaceHover dark:bg-black/20 p-2.5 px-3 border-b border-fluent-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Upload size={14} className="text-fluent-blue" />
          <span className="font-semibold text-fluent-text dark:text-fluent-darkText">
            {activeCount > 0 ? `Subiendo ${activeCount} archivo(s)` : 'Subidas completadas'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-fluent-textSecondary"
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {activeCount === 0 && (
            <button
              onClick={onDismiss}
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-fluent-textSecondary"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Lista de archivos en progreso */}
      {!collapsed && (
        <div className="max-h-60 overflow-y-auto divide-y divide-fluent-border p-2 space-y-2">
          {uploads.map((up) => (
            <div key={up.id} className="pt-2 first:pt-0">
              <div className="flex items-center justify-between mb-1">
                <span className="truncate font-medium text-fluent-text dark:text-fluent-darkText pr-2">
                  {up.fileName}
                </span>
                {up.status === 'uploading' && (
                  <button
                    onClick={() => onCancelUpload(up.id)}
                    className="text-fluent-textMuted hover:text-red-500"
                    title="Cancelar subida"
                  >
                    <X size={13} />
                  </button>
                )}
                {up.status === 'completed' && (
                  <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                )}
                {up.status === 'error' && (
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                )}
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    up.status === 'completed'
                      ? 'bg-emerald-500'
                      : up.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-fluent-blue'
                  }`}
                  style={{ width: `${up.percent || 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-fluent-textMuted mt-1">
                <span>
                  {formatBytes(up.uploadedBytes || 0)} de {formatBytes(up.totalSize)}
                </span>
                <span>{up.percent || 0}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
