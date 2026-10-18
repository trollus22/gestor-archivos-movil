import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Clock,
  HardDrive,
  Hash,
  ExternalLink,
  Edit3,
  Copy,
  Check,
} from 'lucide-react';
import { formatBytes, formatDate, getFileIcon, getFileTypeLabel } from '../utils/formatters.jsx';
import { apiRequest } from '../api.js';

export default function DetailsPanel({
  selectedItem,
  onClose,
  onEditChmod,
  onOpenItem,
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checksums, setChecksums] = useState(null);
  const [loadingChecksums, setLoadingChecksums] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  useEffect(() => {
    if (!selectedItem) {
      setDetails(null);
      setChecksums(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setChecksums(null);

    apiRequest(`/api/files/stat?path=${encodeURIComponent(selectedItem.path)}`)
      .then((data) => {
        if (isMounted) {
          setDetails(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setDetails(selectedItem);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedItem]);

  const handleComputeChecksums = async () => {
    if (!selectedItem) return;
    setLoadingChecksums(true);
    try {
      const data = await apiRequest(`/api/files/stat?path=${encodeURIComponent(selectedItem.path)}&checksums=true`);
      setChecksums(data.checksums);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChecksums(false);
    }
  };

  const copyPathToClipboard = () => {
    if (!selectedItem) return;
    navigator.clipboard.writeText(selectedItem.path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  if (!selectedItem) {
    return (
      <div className="w-72 bg-white/90 dark:bg-fluent-darkSurface/90 border-l border-fluent-border p-4 flex flex-col items-center justify-center text-xs text-fluent-textMuted select-none">
        <span>Seleccione un elemento para ver sus detalles.</span>
      </div>
    );
  }

  const item = details || selectedItem;

  return (
    <div className="w-80 bg-white/90 dark:bg-fluent-darkSurface/90 border-l border-fluent-border flex flex-col h-full select-none text-xs overflow-y-auto no-scrollbar">
      {/* Cabecera del panel */}
      <div className="p-3 border-b border-fluent-border flex items-center justify-between">
        <span className="font-semibold text-fluent-text dark:text-fluent-darkText">Detalles</span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-fluent-textSecondary hover:text-fluent-text"
        >
          <X size={15} />
        </button>
      </div>

      {/* Vista previa / Icono */}
      <div className="p-6 flex flex-col items-center justify-center border-b border-fluent-border bg-black/[0.01]">
        <div className="w-20 h-20 rounded-xl bg-fluent-blueLight/50 dark:bg-fluent-blue/10 flex items-center justify-center shadow-inner mb-3 overflow-hidden">
          {item.path && !item.isDirectory && (item.name.endsWith('.png') || item.name.endsWith('.jpg') || item.name.endsWith('.jpeg') || item.name.endsWith('.webp')) ? (
            <img
              src={`/api/thumbnail?path=${encodeURIComponent(item.path)}`}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            getFileIcon(item, 44)
          )}
        </div>
        <span className="font-semibold text-fluent-text dark:text-fluent-darkText text-center break-all text-sm px-2">
          {item.name}
        </span>
        <span className="text-fluent-textMuted text-[11px] mt-0.5">
          {getFileTypeLabel(item)}
        </span>
      </div>

      {/* Información detallada */}
      <div className="p-4 space-y-4 flex-1">
        {/* Ruta */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-fluent-textSecondary">Ruta absoluta</span>
            <button
              onClick={copyPathToClipboard}
              className="flex items-center text-[10px] text-fluent-blue hover:underline"
            >
              {copiedPath ? (
                <>
                  <Check size={11} className="mr-0.5 text-emerald-600" /> Copiado
                </>
              ) : (
                <>
                  <Copy size={11} className="mr-0.5" /> Copiar ruta
                </>
              )}
            </button>
          </div>
          <div className="bg-black/5 dark:bg-white/5 p-2 rounded text-[11px] font-mono break-all text-fluent-text dark:text-fluent-darkText">
            {item.path}
          </div>
        </div>

        {/* Destino de Symlink si aplica */}
        {item.isSymlink && (
          <div>
            <span className="text-[11px] font-semibold text-fluent-textSecondary">Apunta a</span>
            <div className="bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-300 p-2 rounded text-[11px] font-mono break-all mt-1">
              {item.symlinkTarget || 'Destino no accesible'}
            </div>
          </div>
        )}

        {/* Tamaño */}
        {!item.isDirectory && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] font-semibold text-fluent-textSecondary">Tamaño</span>
              <div className="font-medium text-fluent-text dark:text-fluent-darkText mt-0.5">
                {formatBytes(item.size)}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-fluent-textSecondary">En disco</span>
              <div className="font-medium text-fluent-text dark:text-fluent-darkText mt-0.5">
                {formatBytes(item.diskSize || item.size)}
              </div>
            </div>
          </div>
        )}

        {/* Fechas */}
        <div className="space-y-1.5 border-t border-fluent-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-fluent-textSecondary">Modificado:</span>
            <span className="font-medium text-fluent-text dark:text-fluent-darkText">
              {formatDate(item.mtime)}
            </span>
          </div>
          {item.birthtime && (
            <div className="flex items-center justify-between">
              <span className="text-fluent-textSecondary">Creado:</span>
              <span className="font-medium text-fluent-text dark:text-fluent-darkText">
                {formatDate(item.birthtime)}
              </span>
            </div>
          )}
        </div>

        {/* Permisos */}
        <div className="border-t border-fluent-border pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-fluent-textSecondary">Permisos</span>
            <button
              onClick={() => onEditChmod(item)}
              className="text-[10px] text-fluent-blue hover:underline flex items-center"
            >
              <Edit3 size={11} className="mr-0.5" /> Editar (chmod)
            </button>
          </div>
          <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-2 rounded">
            <span className="font-mono text-xs">{item.permissionsRwx || '—'}</span>
            <span className="font-mono text-xs text-fluent-textMuted">
              Octal: {item.permissionsOctal || '—'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-fluent-textSecondary mt-1 px-1">
            <span>Propietario: {item.owner || String(item.uid)}</span>
            <span>Grupo: {item.group || String(item.gid)}</span>
          </div>
        </div>

        {/* Checksums */}
        {!item.isDirectory && (
          <div className="border-t border-fluent-border pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-fluent-textSecondary">Checksums</span>
              {!checksums && (
                <button
                  onClick={handleComputeChecksums}
                  disabled={loadingChecksums}
                  className="text-[10px] text-fluent-blue hover:underline flex items-center disabled:opacity-50"
                >
                  <Hash size={11} className="mr-0.5" />
                  {loadingChecksums ? 'Calculando...' : 'Calcular'}
                </button>
              )}
            </div>

            {checksums ? (
              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] text-fluent-textMuted">MD5</span>
                  <div className="text-[10px] font-mono break-all bg-black/5 dark:bg-white/5 p-1 rounded">
                    {checksums.md5}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-fluent-textMuted">SHA-1</span>
                  <div className="text-[10px] font-mono break-all bg-black/5 dark:bg-white/5 p-1 rounded">
                    {checksums.sha1}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-fluent-textMuted">SHA-256</span>
                  <div className="text-[10px] font-mono break-all bg-black/5 dark:bg-white/5 p-1 rounded">
                    {checksums.sha256}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-[11px] text-fluent-textMuted italic">
                Pulse «Calcular» para verificar la integridad criptográfica.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
