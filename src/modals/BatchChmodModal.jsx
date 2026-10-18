import React, { useState } from 'react';
import { X, Shield, AlertCircle } from 'lucide-react';
import { apiRequest } from '../api.js';

export default function BatchChmodModal({ items, onClose, onUpdated }) {
  const [octal, setOctal] = useState('0644');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleApply = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest('/api/files/batch-chmod', {
        method: 'POST',
        body: {
          paths: items.map((i) => i.path),
          mode: octal,
        },
      });
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al cambiar permisos');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-fluent-darkSurface border border-fluent-border rounded-xl shadow-fluent-lg w-full max-w-sm overflow-hidden text-xs flex flex-col">
        {/* Cabecera */}
        <div className="h-11 bg-fluent-surfaceHover dark:bg-black/20 border-b border-fluent-border px-4 flex items-center justify-between select-none">
          <span className="font-semibold text-fluent-text dark:text-fluent-darkText flex items-center">
            <Shield size={14} className="mr-1.5 text-fluent-blue" />
            Permisos en lote ({items.length} elementos)
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

        <div className="p-4 space-y-3">
          <span className="text-fluent-textSecondary block">
            Introduzca el modo octal a aplicar a todos los elementos seleccionados:
          </span>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={octal}
              onChange={(e) => setOctal(e.target.value)}
              placeholder="0755 o 0644"
              className="flex-1 px-3 py-2 border border-fluent-border rounded font-mono text-sm outline-none focus:border-fluent-blue text-center font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => setOctal('0644')}
              className="p-1.5 border border-fluent-border rounded hover:bg-black/5 text-center"
            >
              0644 (Estándar lectura)
            </button>
            <button
              onClick={() => setOctal('0755')}
              className="p-1.5 border border-fluent-border rounded hover:bg-black/5 text-center"
            >
              0755 (Ejecutable / Carpeta)
            </button>
            <button
              onClick={() => setOctal('0600')}
              className="p-1.5 border border-fluent-border rounded hover:bg-black/5 text-center"
            >
              0600 (Solo propietario)
            </button>
            <button
              onClick={() => setOctal('0777')}
              className="p-1.5 border border-fluent-border rounded hover:bg-black/5 text-center text-red-600"
            >
              0777 (Total)
            </button>
          </div>
        </div>

        <div className="p-3 bg-fluent-surfaceHover dark:bg-black/20 border-t border-fluent-border flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-1.5 bg-black/5 hover:bg-black/10 rounded font-medium">
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={submitting}
            className="px-4 py-1.5 bg-fluent-blue hover:bg-fluent-blueHover text-white rounded font-medium disabled:opacity-50"
          >
            {submitting ? 'Aplicando...' : 'Aplicar permisos'}
          </button>
        </div>
      </div>
    </div>
  );
}
