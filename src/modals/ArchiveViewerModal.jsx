import React, { useState, useEffect } from 'react';
import { X, FolderArchive, ExternalLink, Folder, File, AlertCircle } from 'lucide-react';
import { formatBytes } from '../utils/formatters.jsx';
import { apiRequest } from '../api.js';

export default function ArchiveViewerModal({ filePath, fileName, onClose, onExtract }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    apiRequest(`/api/archive/list?path=${encodeURIComponent(filePath)}`)
      .then((data) => {
        if (isMounted) {
          setItems(data.items || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error al listar archivo comprimido');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filePath]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-fluent-darkSurface border border-fluent-border rounded-xl shadow-fluent-lg w-full max-w-3xl h-[70vh] flex flex-col overflow-hidden text-xs">
        {/* Cabecera */}
        <div className="h-11 bg-fluent-surfaceHover dark:bg-black/20 border-b border-fluent-border px-4 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2 truncate">
            <FolderArchive size={16} className="text-amber-600" />
            <span className="font-semibold text-fluent-text dark:text-fluent-darkText truncate">
              {fileName}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onExtract();
              }}
              className="flex items-center px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
            >
              <ExternalLink size={13} className="mr-1.5" />
              <span>Extraer contenido</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-fluent-textSecondary"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 flex items-center space-x-2 border-b border-red-200">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Lista de entradas */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-fluent-textMuted">
              Leyendo contenido del archivo...
            </div>
          ) : (
            <div className="divide-y divide-fluent-border font-mono text-[11px]">
              {items.map((item, idx) => (
                <div key={idx} className="py-1.5 px-3 flex items-center justify-between hover:bg-fluent-surfaceHover">
                  <div className="flex items-center space-x-2 truncate pr-4">
                    {item.isDirectory ? (
                      <Folder size={14} className="text-amber-500 flex-shrink-0" />
                    ) : (
                      <File size={14} className="text-slate-400 flex-shrink-0" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="text-fluent-textMuted whitespace-nowrap">
                    {item.isDirectory ? '—' : formatBytes(item.size)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-6 bg-fluent-surfaceHover dark:bg-black/20 border-t border-fluent-border px-4 flex items-center justify-between text-[11px] text-fluent-textMuted select-none">
          <span>{items.length} elementos dentro del archivo</span>
        </div>
      </div>
    </div>
  );
}
