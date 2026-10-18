import React, { useState, useEffect } from 'react';
import { X, Trash2, RotateCcw, AlertTriangle, Check, Folder, File } from 'lucide-react';
import { formatBytes, formatDate } from '../utils/formatters.jsx';
import { apiRequest } from '../api.js';

export default function TrashModal({ onClose, onRestored }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const loadTrash = () => {
    setLoading(true);
    apiRequest('/api/trash/list')
      .then((res) => {
        setItems(res.items || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error al listar papelera');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const handleRestore = async (id) => {
    setRestoringId(id);
    try {
      await apiRequest('/api/trash/restore', {
        method: 'POST',
        body: { id },
      });
      loadTrash();
      if (onRestored) onRestored();
    } catch (err) {
      alert('Error al restaurar: ' + err.message);
    } finally {
      setRestoringId(null);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await apiRequest('/api/trash/empty', { method: 'POST' });
      setShowEmptyConfirm(false);
      loadTrash();
      if (onRestored) onRestored();
    } catch (err) {
      alert('Error al vaciar papelera: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-fluent-darkSurface border border-fluent-border rounded-xl shadow-fluent-lg w-full max-w-2xl h-[70vh] flex flex-col overflow-hidden text-xs">
        {/* Cabecera */}
        <div className="h-11 bg-fluent-surfaceHover dark:bg-black/20 border-b border-fluent-border px-4 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <Trash2 size={16} className="text-cyan-600" />
            <span className="font-semibold text-fluent-text dark:text-fluent-darkText">
              Papelera de reciclaje (~/.gestion-trash)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {items.length > 0 && (
              <button
                onClick={() => setShowEmptyConfirm(true)}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
              >
                Vaciar papelera
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded hover:bg-black/10 text-fluent-textSecondary">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Diálogo de confirmación de vaciado */}
        {showEmptyConfirm && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border-b border-red-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle size={16} />
              <span>¿Está seguro de vaciar la papelera? Todos los elementos se destruirán permanentemente.</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowEmptyConfirm(false)}
                className="px-2 py-1 bg-white border border-red-200 rounded text-red-700 hover:bg-red-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEmptyTrash}
                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
              >
                Confirmar vaciado
              </button>
            </div>
          </div>
        )}

        {/* Lista de elementos en papelera */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-fluent-textMuted">
              Cargando papelera...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-fluent-textMuted">
              <Trash2 size={36} className="text-slate-300 mb-2" />
              <span>La papelera está vacía.</span>
            </div>
          ) : (
            <div className="divide-y divide-fluent-border">
              {items.map((item) => (
                <div key={item.id} className="py-2 px-3 flex items-center justify-between hover:bg-fluent-surfaceHover">
                  <div className="flex items-center space-x-3 truncate pr-4">
                    {item.isDirectory ? (
                      <Folder size={18} className="text-amber-500 flex-shrink-0" />
                    ) : (
                      <File size={18} className="text-slate-400 flex-shrink-0" />
                    )}
                    <div className="truncate">
                      <div className="font-medium text-fluent-text dark:text-fluent-darkText truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-fluent-textMuted truncate">
                        Ruta original: {item.originalPath}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <span className="text-[11px] text-fluent-textMuted">
                      {formatDate(item.deletedAt)}
                    </span>
                    <button
                      onClick={() => handleRestore(item.id)}
                      disabled={restoringId === item.id}
                      className="flex items-center px-2 py-1 bg-fluent-blue hover:bg-fluent-blueHover text-white rounded font-medium disabled:opacity-50"
                      title="Restaurar a su ruta original"
                    >
                      <RotateCcw size={12} className="mr-1" />
                      <span>{restoringId === item.id ? 'Restaurando...' : 'Restaurar'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-6 bg-fluent-surfaceHover dark:bg-black/20 border-t border-fluent-border px-4 flex items-center justify-between text-[11px] text-fluent-textMuted select-none">
          <span>{items.length} elementos en papelera</span>
        </div>
      </div>
    </div>
  );
}
