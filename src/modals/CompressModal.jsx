import React, { useState } from 'react';
import { X, FolderArchive, AlertCircle } from 'lucide-react';
import { apiRequest } from '../api.js';

export default function CompressModal({ items, currentPath, onClose, onCompressed }) {
  const defaultName = items.length === 1 ? items[0].name : 'archivo_comprimido';
  const [archiveName, setArchiveName] = useState(defaultName);
  const [format, setFormat] = useState('zip');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleCompress = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest('/api/archive/compress', {
        method: 'POST',
        body: {
          sources: items.map((i) => i.path),
          targetDir: currentPath,
          archiveName: archiveName.trim(),
          format,
        },
      });
      if (onCompressed) onCompressed();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al comprimir');
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
            <FolderArchive size={14} className="mr-1.5 text-amber-600" />
            Comprimir ({items.length} elemento{items.length > 1 ? 's' : ''})
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
          <div>
            <span className="text-fluent-textSecondary block mb-1">Nombre del archivo resultante:</span>
            <input
              type="text"
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-fluent-border rounded outline-none focus:border-fluent-blue font-medium"
            />
          </div>

          <div>
            <span className="text-fluent-textSecondary block mb-1">Formato de compresión:</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-fluent-border rounded outline-none focus:border-fluent-blue bg-white dark:bg-fluent-darkBg"
            >
              <option value="zip">.ZIP (Recomendado, estándar multiplataforma)</option>
              <option value="tar.gz">.TAR.GZ (Comprimido Unix/Linux)</option>
              <option value="tar">.TAR (Empaquetado sin comprimir)</option>
              <option value="gz">.GZ (Gzip individual)</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-fluent-surfaceHover dark:bg-black/20 border-t border-fluent-border flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-1.5 bg-black/5 hover:bg-black/10 rounded font-medium">
            Cancelar
          </button>
          <button
            onClick={handleCompress}
            disabled={submitting || !archiveName.trim()}
            className="px-4 py-1.5 bg-fluent-blue hover:bg-fluent-blueHover text-white rounded font-medium disabled:opacity-50"
          >
            {submitting ? 'Comprimiendo...' : 'Comprimir'}
          </button>
        </div>
      </div>
    </div>
  );
}
