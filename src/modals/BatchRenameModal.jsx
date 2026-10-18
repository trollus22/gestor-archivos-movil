import React, { useState } from 'react';
import { X, Edit2, AlertCircle, Check } from 'lucide-react';
import { apiRequest } from '../api.js';

export default function BatchRenameModal({ items, onClose, onRenamed }) {
  const [mode, setMode] = useState('replace');
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const getNewName = (oldName) => {
    const ext = oldName.includes('.') ? '.' + oldName.split('.').pop() : '';
    const base = ext ? oldName.slice(0, -ext.length) : oldName;

    if (mode === 'replace') {
      return find ? oldName.replaceAll(find, replace) : oldName;
    } else if (mode === 'prefix') {
      return prefix ? `${prefix}${oldName}` : oldName;
    } else if (mode === 'suffix') {
      return suffix ? `${base}${suffix}${ext}` : oldName;
    }
    return oldName;
  };

  const handleApply = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest('/api/files/batch-rename', {
        method: 'POST',
        body: {
          paths: items.map((i) => i.path),
          mode,
          find,
          replace,
          prefix,
          suffix,
        },
      });
      if (onRenamed) onRenamed();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al renombrar en lote');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-fluent-darkSurface border border-fluent-border rounded-xl shadow-fluent-lg w-full max-w-lg overflow-hidden text-xs flex flex-col">
        {/* Cabecera */}
        <div className="h-11 bg-fluent-surfaceHover dark:bg-black/20 border-b border-fluent-border px-4 flex items-center justify-between select-none">
          <span className="font-semibold text-fluent-text dark:text-fluent-darkText flex items-center">
            <Edit2 size={14} className="mr-1.5 text-fluent-blue" />
            Renombrar en lote ({items.length} elementos)
          </span>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/10 text-fluent-textSecondary">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 flex items-center space-x-2 border-b border-red-200">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Pestañas de modo */}
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-lg">
            <button
              onClick={() => setMode('replace')}
              className={`flex-1 py-1 rounded font-medium transition-colors ${
                mode === 'replace' ? 'bg-white dark:bg-fluent-darkBg shadow-sm text-fluent-blue' : 'text-fluent-textSecondary'
              }`}
            >
              Buscar y reemplazar
            </button>
            <button
              onClick={() => setMode('prefix')}
              className={`flex-1 py-1 rounded font-medium transition-colors ${
                mode === 'prefix' ? 'bg-white dark:bg-fluent-darkBg shadow-sm text-fluent-blue' : 'text-fluent-textSecondary'
              }`}
            >
              Añadir prefijo
            </button>
            <button
              onClick={() => setMode('suffix')}
              className={`flex-1 py-1 rounded font-medium transition-colors ${
                mode === 'suffix' ? 'bg-white dark:bg-fluent-darkBg shadow-sm text-fluent-blue' : 'text-fluent-textSecondary'
              }`}
            >
              Añadir sufijo
            </button>
          </div>

          {/* Formulario según modo */}
          {mode === 'replace' && (
            <div className="space-y-2">
              <div>
                <span className="text-fluent-textSecondary">Buscar texto:</span>
                <input
                  type="text"
                  value={find}
                  onChange={(e) => setFind(e.target.value)}
                  placeholder="Texto a buscar..."
                  className="w-full px-2.5 py-1.5 border border-fluent-border rounded mt-1 outline-none focus:border-fluent-blue"
                />
              </div>
              <div>
                <span className="text-fluent-textSecondary">Reemplazar por:</span>
                <input
                  type="text"
                  value={replace}
                  onChange={(e) => setReplace(e.target.value)}
                  placeholder="Texto nuevo de sustitución..."
                  className="w-full px-2.5 py-1.5 border border-fluent-border rounded mt-1 outline-none focus:border-fluent-blue"
                />
              </div>
            </div>
          )}

          {mode === 'prefix' && (
            <div>
              <span className="text-fluent-textSecondary">Prefijo a añadir al inicio:</span>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="Ej. backup_ o 2026_"
                className="w-full px-2.5 py-1.5 border border-fluent-border rounded mt-1 outline-none focus:border-fluent-blue"
              />
            </div>
          )}

          {mode === 'suffix' && (
            <div>
              <span className="text-fluent-textSecondary">Sufijo a añadir antes de la extensión:</span>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="Ej. _v2 o _procesado"
                className="w-full px-2.5 py-1.5 border border-fluent-border rounded mt-1 outline-none focus:border-fluent-blue"
              />
            </div>
          )}

          {/* Previsualización en vivo */}
          <div>
            <span className="font-semibold text-fluent-text dark:text-fluent-darkText block mb-1">
              Vista previa de cambios:
            </span>
            <div className="max-h-36 overflow-y-auto border border-fluent-border rounded divide-y divide-fluent-border bg-black/[0.02] p-2 space-y-1">
              {items.slice(0, 10).map((it) => {
                const newName = getNewName(it.name);
                const hasChanged = newName !== it.name;
                return (
                  <div key={it.path} className="flex items-center justify-between text-[11px] py-0.5">
                    <span className="text-fluent-textMuted truncate max-w-[180px]">{it.name}</span>
                    <span className="text-fluent-textMuted">→</span>
                    <span className={`font-mono truncate max-w-[180px] ${hasChanged ? 'text-fluent-blue font-semibold' : ''}`}>
                      {newName}
                    </span>
                  </div>
                );
              })}
              {items.length > 10 && (
                <div className="text-[10px] text-fluent-textMuted text-center pt-1 italic">
                  ... y {items.length - 10} elementos más
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="p-3 bg-fluent-surfaceHover dark:bg-black/20 border-t border-fluent-border flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-1.5 bg-black/5 hover:bg-black/10 rounded font-medium">
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={submitting}
            className="px-4 py-1.5 bg-fluent-blue hover:bg-fluent-blueHover text-white rounded font-medium disabled:opacity-50"
          >
            {submitting ? 'Renombrando...' : 'Aplicar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
