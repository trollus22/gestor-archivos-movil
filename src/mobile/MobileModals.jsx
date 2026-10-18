import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Folder,
  FolderPlus,
  FilePlus,
  Edit3,
  Move,
  Copy,
  Archive,
  Lock,
  Info,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { apiRequest } from '../api.js';
import { formatBytes, formatDate, getFileIcon } from '../utils/formatters.jsx';
import { triggerHaptic } from './native-bridge.js';

/**
 * Modal simple de texto (para Crear Carpeta, Crear Archivo, Renombrar)
 */
export function MobileInputModal({
  isOpen,
  title,
  subtitle,
  defaultValue = '',
  placeholder = '',
  confirmLabel = 'Aceptar',
  onConfirm,
  onClose,
}) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setValue(defaultValue);
    setError(null);
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm(value.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Error en la operación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#1a1d26] border border-white/10 rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-150">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-full touch-target flex items-center justify-center"
            aria-label="Cerrar diálogo"
          >
            <X size={18} />
          </button>
        </div>

        {subtitle && <p className="text-xs text-gray-400 mb-3">{subtitle}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="w-full bg-[#11131a] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-blue-500 touch-target"
          />

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 active:bg-white/15 text-gray-300 text-xs font-semibold touch-target"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !value.trim()}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 active:bg-blue-700 text-white text-xs font-semibold touch-target flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal de Propiedades y Checksums
 */
export function MobilePropertiesModal({ isOpen, item, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !item) return;
    setLoading(true);
    apiRequest(`/api/files/stat?path=${encodeURIComponent(item.path)}&checksums=true`)
      .then((data) => setDetails(data))
      .catch((err) => console.error('Error stat:', err))
      .finally(() => setLoading(false));
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end p-0">
      <div className="bg-[#181a24] border-t border-white/10 rounded-t-3xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[85dvh] flex flex-col animate-in slide-in-from-bottom duration-200">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3" />

        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Info size={20} className="text-blue-400" />
            <h3 className="text-base font-semibold text-white">Propiedades</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 touch-target" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto no-scrollbar py-3 space-y-3 flex-1 text-xs">
          <div className="p-3 bg-white/5 rounded-2xl flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              {getFileIcon(item, 28)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{item.name}</p>
              <p className="text-gray-400">{item.isDirectory ? 'Directorio' : formatBytes(item.size)}</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 space-y-2.5">
            <div>
              <p className="text-gray-400 text-[10px]">Ruta absoluta</p>
              <p className="font-mono text-gray-200 break-all">{item.path}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px]">Última modificación</p>
              <p className="text-gray-200">{formatDate(item.mtime || item.updatedAt)}</p>
            </div>
            {details && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-400 text-[10px]">Permisos octales</p>
                    <p className="font-mono text-gray-200">{details.permissionsOctal || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px]">Propietario / UID</p>
                    <p className="font-mono text-gray-200">{details.owner || details.uid || '—'}</p>
                  </div>
                </div>
                {details.checksums && (
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div>
                      <p className="text-gray-400 text-[10px]">MD5</p>
                      <p className="font-mono text-[10px] text-blue-300 break-all select-text">{details.checksums.md5 || 'Calculando...'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px]">SHA-256</p>
                      <p className="font-mono text-[10px] text-purple-300 break-all select-text">{details.checksums.sha256 || 'Calculando...'}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-white/10 active:bg-white/15 text-white rounded-xl text-xs font-semibold touch-target mt-2"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

/**
 * Modal de Selección de Carpeta Destino (para Mover / Copiar)
 */
export function MobileFolderPickerModal({
  isOpen,
  title = 'Seleccionar destino',
  onSelectDir,
  onClose,
}) {
  const [currentDir, setCurrentDir] = useState('/');
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDir = async (dir) => {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/files/list?path=${encodeURIComponent(dir)}`);
      const dirsOnly = (data.items || []).filter((i) => i.isDirectory);
      setFolders(dirsOnly);
      setCurrentDir(dir);
    } catch (err) {
      console.error('Error listando para mover:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDir('/');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUp = () => {
    const parent = currentDir.substring(0, currentDir.lastIndexOf('/')) || '/';
    fetchDir(parent);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end p-0">
      <div className="bg-[#181a24] border-t border-white/10 rounded-t-3xl p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[85dvh] flex flex-col animate-in slide-in-from-bottom duration-200">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3" />

        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-xs text-blue-400 font-mono truncate max-w-xs">{currentDir}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 touch-target" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Lista de carpetas navegables */}
        <div className="overflow-y-auto no-scrollbar py-2 divide-y divide-white/5 flex-1">
          {currentDir !== '/' && (
            <div
              onClick={() => {
                triggerHaptic();
                handleUp();
              }}
              className="py-2.5 px-3 flex items-center gap-3 active:bg-white/5 rounded-xl touch-target cursor-pointer text-gray-300"
            >
              <Folder size={18} className="text-amber-400" />
              <span className="text-xs font-semibold">.. (Subir nivel)</span>
            </div>
          )}

          {loading && (
            <div className="py-8 flex justify-center text-blue-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          )}

          {!loading && folders.map((f) => (
            <div
              key={f.path}
              onClick={() => {
                triggerHaptic();
                fetchDir(f.path);
              }}
              className="py-2.5 px-3 flex items-center justify-between active:bg-white/5 rounded-xl touch-target cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Folder size={20} className="text-amber-500 fill-amber-400/20" />
                <span className="text-sm font-medium text-white truncate">{f.name}</span>
              </div>
              <ChevronRight size={16} className="text-gray-500" />
            </div>
          ))}

          {!loading && folders.length === 0 && (
            <p className="py-6 text-center text-xs text-gray-500">No hay más subcarpetas aquí</p>
          )}
        </div>

        {/* Botón de confirmar destino */}
        <div className="pt-3 border-t border-white/10 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/10 active:bg-white/15 text-gray-300 rounded-xl text-xs font-semibold touch-target"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              triggerHaptic('medium');
              onSelectDir(currentDir);
              onClose();
            }}
            className="flex-1 py-3 bg-blue-600 active:bg-blue-700 text-white rounded-xl text-xs font-semibold touch-target flex items-center justify-center gap-1.5"
          >
            <Check size={16} />
            <span>Seleccionar esta carpeta</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal de Confirmación Genérico
 */
export function MobileConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  isDanger = false,
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#1b1e2a] border border-white/10 rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 text-amber-400">
          <AlertTriangle size={24} className={isDanger ? 'text-rose-400' : 'text-amber-400'} />
        </div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">{message}</p>

        <div className="flex items-center gap-2.5 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/10 active:bg-white/15 text-gray-300 text-xs font-semibold touch-target"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              triggerHaptic('medium');
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 rounded-xl text-white text-xs font-semibold touch-target ${
              isDanger ? 'bg-rose-600 active:bg-rose-700' : 'bg-blue-600 active:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
