import React, { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Loader2,
  RotateCw,
  Folder,
} from 'lucide-react';
import { apiRequest } from '../api.js';
import { formatBytes, formatDate, getFileIcon } from '../utils/formatters.jsx';
import { triggerHaptic } from './native-bridge.js';

export default function MobileTrashView({ onTrashCountChange }) {
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const fetchTrash = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/trash/list');
      const items = data.items || [];
      setTrashItems(items);
      if (onTrashCountChange) onTrashCountChange(items.length);
    } catch (err) {
      setError(err.message || 'Error al cargar la papelera');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (item) => {
    triggerHaptic();
    setActionLoading(true);
    try {
      await apiRequest('/api/trash/restore', {
        method: 'POST',
        body: { id: item.id },
      });
      fetchTrash();
    } catch (err) {
      alert(`Error al restaurar: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmptyTrash = async () => {
    triggerHaptic('medium');
    setActionLoading(true);
    try {
      await apiRequest('/api/trash/empty', {
        method: 'POST',
      });
      setConfirmEmpty(false);
      fetchTrash();
    } catch (err) {
      alert(`Error al vaciar papelera: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#111318]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-[#161820] border-b border-white/10 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <Trash2 size={22} className="text-rose-400" />
          <h2 className="text-base font-semibold text-white">Papelera</h2>
          <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-mono">
            {trashItems.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              triggerHaptic();
              fetchTrash();
            }}
            disabled={loading}
            className="p-2 text-gray-300 rounded-lg active:bg-white/10 touch-target flex items-center justify-center"
            title="Actualizar papelera"
            aria-label="Actualizar"
          >
            <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          {trashItems.length > 0 && (
            <button
              onClick={() => {
                triggerHaptic();
                setConfirmEmpty(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 active:bg-rose-600/30 touch-target"
            >
              Vaciar
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] pb-24">
        {loading && trashItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-2" />
            <p className="text-xs">Cargando papelera...</p>
          </div>
        )}

        {error && (
          <div className="p-4 text-center">
            <p className="text-xs text-rose-400">{error}</p>
          </div>
        )}

        {!loading && trashItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mb-3">
              <Trash2 size={32} />
            </div>
            <h3 className="text-base font-semibold text-gray-200">La papelera está vacía</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Los archivos que elimines se moverán aquí temporalmente antes de ser borrados definitivamente.
            </p>
          </div>
        )}

        {trashItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center min-h-[64px] px-3.5 py-2.5 active:bg-white/5 transition-colors touch-target select-none"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mr-3 flex-shrink-0">
              {getFileIcon(item, 24)}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm font-medium text-white truncate">{item.name}</p>
              <p className="text-xs text-gray-500 truncate font-mono">
                Ruta original: {item.originalPath}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                <span>{item.isDirectory ? 'Carpeta' : formatBytes(item.size)}</span>
                <span>•</span>
                <span>Borrado: {formatDate(item.deletedAt)}</span>
              </div>
            </div>
            <button
              onClick={() => handleRestore(item)}
              disabled={actionLoading}
              className="px-3 py-2 bg-blue-600/20 text-blue-300 active:bg-blue-600/30 border border-blue-500/30 rounded-xl text-xs font-semibold touch-target flex items-center gap-1.5 flex-shrink-0"
              aria-label={`Restaurar ${item.name}`}
            >
              <RotateCcw size={15} />
              <span>Restaurar</span>
            </button>
          </div>
        ))}
      </div>

      {/* Modal de confirmación para vaciar papelera */}
      {confirmEmpty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1b1e2a] border border-white/10 rounded-2xl p-5 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-semibold text-white">¿Vaciar la papelera?</h3>
            <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
              Esta acción eliminará permanentemente todos los {trashItems.length} archivos y carpetas de la papelera del servidor. No se podrán recuperar.
            </p>
            <div className="flex items-center gap-2.5 mt-5">
              <button
                onClick={() => setConfirmEmpty(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 active:bg-white/15 text-gray-200 text-xs font-semibold touch-target"
              >
                Cancelar
              </button>
              <button
                onClick={handleEmptyTrash}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 active:bg-rose-700 text-white text-xs font-semibold touch-target flex items-center justify-center gap-1"
              >
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                <span>Eliminar todo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
