import React, { useState, useEffect } from 'react';
import { X, Shield, Hash, Check, AlertCircle } from 'lucide-react';
import { formatBytes, formatDate, getFileIcon, getFileTypeLabel } from '../utils/formatters.jsx';
import { apiRequest } from '../api.js';

export default function PropertiesModal({ targetItem, onClose, onUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Estado del editor de permisos
  const [octal, setOctal] = useState('0644');
  const [perms, setPerms] = useState({
    ur: true, uw: true, ux: false,
    gr: true, gw: false, gx: false,
    or: true, ow: false, ox: false,
  });

  // Checksums
  const [checksums, setChecksums] = useState(null);
  const [loadingChecksums, setLoadingChecksums] = useState(false);

  // Propietario / grupo
  const [uid, setUid] = useState('');
  const [gid, setGid] = useState('');

  useEffect(() => {
    if (!targetItem) return;
    setLoading(true);

    apiRequest(`/api/files/stat?path=${encodeURIComponent(targetItem.path)}`)
      .then((res) => {
        setData(res);
        setOctal(res.permissionsOctal || '0644');
        setUid(String(res.uid || ''));
        setGid(String(res.gid || ''));
        parseOctalToFlags(res.permissionsOctal || '0644');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [targetItem]);

  const parseOctalToFlags = (oct) => {
    const num = parseInt(oct, 8);
    if (isNaN(num)) return;
    setPerms({
      ur: !!(num & 0o400),
      uw: !!(num & 0o200),
      ux: !!(num & 0o100),
      gr: !!(num & 0o040),
      gw: !!(num & 0o020),
      gx: !!(num & 0o010),
      or: !!(num & 0o004),
      ow: !!(num & 0o002),
      ox: !!(num & 0o001),
    });
  };

  const updateOctalFromFlags = (newPerms) => {
    let mode = 0;
    if (newPerms.ur) mode |= 0o400;
    if (newPerms.uw) mode |= 0o200;
    if (newPerms.ux) mode |= 0o100;
    if (newPerms.gr) mode |= 0o040;
    if (newPerms.gw) mode |= 0o020;
    if (newPerms.gx) mode |= 0o010;
    if (newPerms.or) mode |= 0o004;
    if (newPerms.ow) mode |= 0o002;
    if (newPerms.ox) mode |= 0o001;

    const newOctal = mode.toString(8).padStart(3, '0');
    setOctal(newOctal);
  };

  const handleTogglePerm = (key) => {
    const updated = { ...perms, [key]: !perms[key] };
    setPerms(updated);
    updateOctalFromFlags(updated);
  };

  const handleOctalChange = (e) => {
    const val = e.target.value;
    setOctal(val);
    if (/^[0-7]{3,4}$/.test(val)) {
      parseOctalToFlags(val);
    }
  };

  const handleApplyChmod = async () => {
    setError(null);
    setSuccessMsg(null);
    try {
      await apiRequest('/api/files/chmod', {
        method: 'POST',
        body: { path: targetItem.path, mode: octal },
      });
      setSuccessMsg('Permisos actualizados correctamente');
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.message || 'Error al cambiar permisos');
    }
  };

  const handleApplyChown = async () => {
    setError(null);
    setSuccessMsg(null);
    try {
      await apiRequest('/api/files/chown', {
        method: 'POST',
        body: { path: targetItem.path, uid, gid },
      });
      setSuccessMsg('Propietario actualizado');
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.message || 'Error al cambiar propietario');
    }
  };

  const handleComputeChecksums = async () => {
    setLoadingChecksums(true);
    try {
      const res = await apiRequest(`/api/files/stat?path=${encodeURIComponent(targetItem.path)}&checksums=true`);
      setChecksums(res.checksums);
    } catch (err) {
      setError('Error al calcular checksums: ' + err.message);
    } finally {
      setLoadingChecksums(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-fluent-darkSurface border border-fluent-border rounded-xl shadow-fluent-lg w-full max-w-md overflow-hidden text-xs flex flex-col">
        {/* Cabecera */}
        <div className="h-11 bg-fluent-surfaceHover dark:bg-black/20 border-b border-fluent-border px-4 flex items-center justify-between select-none">
          <span className="font-semibold text-fluent-text dark:text-fluent-darkText truncate">
            Propiedades: {targetItem?.name}
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

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 flex items-center space-x-2 border-b border-emerald-200">
            <Check size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-fluent-textMuted">Cargando propiedades...</div>
        ) : (
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* General */}
            <div className="space-y-2 border-b border-fluent-border pb-3">
              <div className="flex items-center space-x-3">
                {getFileIcon(data || targetItem, 28)}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{data?.name}</div>
                  <div className="text-[11px] text-fluent-textMuted">{getFileTypeLabel(data || targetItem)}</div>
                </div>
              </div>
              <div className="text-[11px] font-mono break-all bg-black/5 dark:bg-white/5 p-1.5 rounded">
                {data?.path}
              </div>
              {!data?.isDirectory && (
                <div className="flex justify-between text-fluent-textSecondary">
                  <span>Tamaño:</span>
                  <span className="font-medium text-fluent-text dark:text-fluent-darkText">
                    {formatBytes(data?.size)} ({data?.size} bytes) · En disco: {formatBytes(data?.diskSize)}
                  </span>
                </div>
              )}
            </div>

            {/* Fechas */}
            <div className="space-y-1.5 border-b border-fluent-border pb-3 text-fluent-textSecondary">
              <div className="flex justify-between">
                <span>Modificación:</span>
                <span className="text-fluent-text dark:text-fluent-darkText">{formatDate(data?.mtime)}</span>
              </div>
              <div className="flex justify-between">
                <span>Último acceso:</span>
                <span className="text-fluent-text dark:text-fluent-darkText">{formatDate(data?.atime)}</span>
              </div>
              {data?.birthtime && (
                <div className="flex justify-between">
                  <span>Creación:</span>
                  <span className="text-fluent-text dark:text-fluent-darkText">{formatDate(data?.birthtime)}</span>
                </div>
              )}
            </div>

            {/* Editor de Permisos (chmod) */}
            <div className="border-b border-fluent-border pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-fluent-text dark:text-fluent-darkText flex items-center">
                  <Shield size={14} className="mr-1 text-fluent-blue" />
                  Permisos (chmod)
                </span>
                <div className="flex items-center space-x-1">
                  <span>Octal:</span>
                  <input
                    type="text"
                    value={octal}
                    onChange={handleOctalChange}
                    className="w-14 px-1.5 py-0.5 border border-fluent-border rounded font-mono text-center outline-none"
                  />
                </div>
              </div>

              {/* Matriz de checkboxes rwx */}
              <div className="grid grid-cols-4 gap-2 text-center bg-black/[0.02] dark:bg-white/[0.02] p-2 rounded">
                <div className="font-semibold text-left">Nivel</div>
                <div className="font-semibold">Leer (r)</div>
                <div className="font-semibold">Escribir (w)</div>
                <div className="font-semibold">Ejecutar (x)</div>

                <div className="text-left font-medium">Usuario</div>
                <div><input type="checkbox" checked={perms.ur} onChange={() => handleTogglePerm('ur')} /></div>
                <div><input type="checkbox" checked={perms.uw} onChange={() => handleTogglePerm('uw')} /></div>
                <div><input type="checkbox" checked={perms.ux} onChange={() => handleTogglePerm('ux')} /></div>

                <div className="text-left font-medium">Grupo</div>
                <div><input type="checkbox" checked={perms.gr} onChange={() => handleTogglePerm('gr')} /></div>
                <div><input type="checkbox" checked={perms.gw} onChange={() => handleTogglePerm('gw')} /></div>
                <div><input type="checkbox" checked={perms.gx} onChange={() => handleTogglePerm('gx')} /></div>

                <div className="text-left font-medium">Otros</div>
                <div><input type="checkbox" checked={perms.or} onChange={() => handleTogglePerm('or')} /></div>
                <div><input type="checkbox" checked={perms.ow} onChange={() => handleTogglePerm('ow')} /></div>
                <div><input type="checkbox" checked={perms.ox} onChange={() => handleTogglePerm('ox')} /></div>
              </div>

              <button
                onClick={handleApplyChmod}
                className="w-full py-1.5 bg-fluent-blue hover:bg-fluent-blueHover text-white rounded font-medium transition-colors"
              >
                Aplicar permisos (chmod {octal})
              </button>
            </div>

            {/* Propietario y grupo */}
            <div className="border-b border-fluent-border pb-3 space-y-2">
              <span className="font-semibold text-fluent-text dark:text-fluent-darkText">Propietario y grupo</span>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <span className="text-[10px] text-fluent-textMuted">Usuario (UID):</span>
                  <input
                    type="text"
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                    className="w-full px-2 py-1 border border-fluent-border rounded outline-none"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-fluent-textMuted">Grupo (GID):</span>
                  <input
                    type="text"
                    value={gid}
                    onChange={(e) => setGid(e.target.value)}
                    className="w-full px-2 py-1 border border-fluent-border rounded outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleApplyChown}
                className="w-full py-1 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded font-medium transition-colors"
              >
                Cambiar propietario (chown)
              </button>
            </div>

            {/* Checksums */}
            {!data?.isDirectory && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-fluent-text dark:text-fluent-darkText flex items-center">
                    <Hash size={14} className="mr-1 text-fluent-blue" />
                    Hashes criptográficos
                  </span>
                  {!checksums && (
                    <button
                      onClick={handleComputeChecksums}
                      disabled={loadingChecksums}
                      className="text-fluent-blue hover:underline"
                    >
                      {loadingChecksums ? 'Calculando...' : 'Calcular'}
                    </button>
                  )}
                </div>

                {checksums && (
                  <div className="space-y-1 font-mono text-[10px]">
                    <div>
                      <span className="text-fluent-textMuted">MD5:</span> {checksums.md5}
                    </div>
                    <div>
                      <span className="text-fluent-textMuted">SHA-1:</span> {checksums.sha1}
                    </div>
                    <div>
                      <span className="text-fluent-textMuted">SHA-256:</span> {checksums.sha256}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="p-3 bg-fluent-surfaceHover dark:bg-black/20 border-t border-fluent-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 rounded font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
