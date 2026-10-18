import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Activity,
  Lock,
  Shield,
  Smartphone,
  LogOut,
  Moon,
  Info,
  Check,
  ChevronRight,
  RotateCw,
  Loader2,
} from 'lucide-react';
import { apiRequest } from '../api.js';
import { formatBytes, formatDate } from '../utils/formatters.jsx';
import { triggerHaptic } from './native-bridge.js';

export default function MobileSettingsView({
  user,
  onLogout,
  pinEnabled,
  onTogglePin,
  onChangePin,
}) {
  const [diskUsage, setDiskUsage] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingDisk, setLoadingDisk] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    // Verificar biometría web
    if (window.PublicKeyCredential && window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => setBiometricsAvailable(Boolean(available)))
        .catch(() => setBiometricsAvailable(false));
    }

    // Cargar uso de disco
    setLoadingDisk(true);
    apiRequest('/api/system/disk')
      .then((data) => setDiskUsage(data))
      .catch((err) => console.error('Error disco:', err))
      .finally(() => setLoadingDisk(false));

    // Cargar registro de actividad
    setLoadingLogs(true);
    apiRequest('/api/system/activity?limit=30')
      .then((data) => setActivityLogs(data.logs || []))
      .catch((err) => console.error('Error logs:', err))
      .finally(() => setLoadingLogs(false));
  }, []);

  const diskPercent = diskUsage && diskUsage.total > 0
    ? Math.round(((diskUsage.total - diskUsage.free) / diskUsage.total) * 100)
    : 0;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#111318] pb-28 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="px-4 py-3 border-b border-white/10 bg-[#161820]">
        <h1 className="text-lg font-bold text-white">Ajustes del Sistema</h1>
        <p className="text-xs text-gray-400">Usuario activo: <span className="font-mono text-blue-400 font-semibold">{user}</span></p>
      </div>

      <div className="p-4 space-y-4">
        {/* Tarjeta de Almacenamiento */}
        <div className="bg-[#181a24] border border-white/10 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive size={18} className="text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Espacio en Disco</h2>
            </div>
            {loadingDisk && <Loader2 size={16} className="animate-spin text-gray-400" />}
          </div>

          {diskUsage ? (
            <div className="space-y-2">
              <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${diskPercent}%` }}
                  className={`h-full transition-all duration-300 rounded-full ${
                    diskPercent > 90 ? 'bg-rose-500' : diskPercent > 75 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Usado: {formatBytes(diskUsage.total - diskUsage.free)} ({diskPercent}%)</span>
                <span>Libre: {formatBytes(diskUsage.free)} de {formatBytes(diskUsage.total)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Consultando almacenamiento...</p>
          )}
        </div>

        {/* Seguridad y Bloqueo Rápido */}
        <div className="bg-[#181a24] border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Seguridad y Bloqueo</h2>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <p className="text-sm font-medium text-gray-200">Bloqueo por código PIN</p>
              <p className="text-xs text-gray-400">Pedir PIN de 4 dígitos al abrir la aplicación</p>
            </div>
            <button
              onClick={() => {
                triggerHaptic();
                onTogglePin();
              }}
              className={`w-12 h-6 rounded-full transition-colors relative touch-target flex items-center px-0.5 ${
                pinEnabled ? 'bg-blue-600' : 'bg-white/20'
              }`}
              aria-label="Alternar bloqueo PIN"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  pinEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {pinEnabled && (
            <button
              onClick={() => {
                triggerHaptic();
                onChangePin();
              }}
              className="w-full flex items-center justify-between py-2 text-xs text-blue-400 font-semibold active:text-blue-300 touch-target"
            >
              <span>Cambiar código PIN actual</span>
              <ChevronRight size={16} />
            </button>
          )}

          <div className="flex items-center justify-between py-2 text-xs text-gray-400 border-t border-white/5 pt-3">
            <span>Biometría de dispositivo (WebAuthn)</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              biometricsAvailable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-400'
            }`}>
              {biometricsAvailable ? 'Compatible' : 'No detectada'}
            </span>
          </div>
        </div>

        {/* Registro de Auditoría */}
        <div className="bg-[#181a24] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-purple-400" />
              <h2 className="text-sm font-semibold text-white">Registro de Actividad</h2>
            </div>
            <button
              onClick={() => {
                triggerHaptic();
                setShowLogsModal(true);
              }}
              className="text-xs text-blue-400 font-semibold active:text-blue-300 touch-target flex items-center gap-1"
            >
              <span>Ver todos ({activityLogs.length})</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-2">
            {activityLogs.slice(0, 4).map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs py-1.5 border-b border-white/5 last:border-0">
                <span className="font-mono text-[10px] text-gray-500 whitespace-nowrap mt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-200 truncate">{log.action}</p>
                  <p className="text-[11px] text-gray-400 truncate font-mono">{log.target || log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Información Técnica de la Aplicación */}
        <div className="bg-[#181a24] border border-white/10 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={18} className="text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Aplicación y Entorno</h2>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-white/5 rounded-xl">
              <p className="text-gray-400 text-[10px]">App ID</p>
              <p className="font-mono font-medium text-gray-200 truncate">ch.mariomartin.gestorarchivos</p>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl">
              <p className="text-gray-400 text-[10px]">Envoltorio Nativo</p>
              <p className="font-medium text-gray-200">Capacitor 7 + PWA</p>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl">
              <p className="text-gray-400 text-[10px]">Tema</p>
              <p className="font-medium text-gray-200">Mica Oscuro Fluent</p>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl">
              <p className="text-gray-400 text-[10px]">Host Servidor</p>
              <p className="font-mono text-gray-200 truncate">:3899 (HTTPS)</p>
            </div>
          </div>
        </div>

        {/* Cerrar Sesión */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onLogout();
          }}
          className="w-full py-3.5 bg-rose-500/10 active:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl text-sm font-semibold touch-target flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          <span>Cerrar sesión en el servidor</span>
        </button>
      </div>

      {/* Modal Completo de Actividad */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col justify-end">
          <div className="bg-[#161822] border-t border-white/10 rounded-t-3xl max-h-[80dvh] flex flex-col p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-semibold text-white">Auditoría completa</h3>
              <button
                onClick={() => setShowLogsModal(false)}
                className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-semibold text-gray-200 touch-target"
              >
                Cerrar
              </button>
            </div>
            <div className="overflow-y-auto no-scrollbar py-2 divide-y divide-white/5 flex-1">
              {activityLogs.map((log, idx) => (
                <div key={idx} className="py-2.5">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-semibold text-blue-400">{log.action}</span>
                    <span className="font-mono text-[10px]">{formatDate(log.timestamp)}</span>
                  </div>
                  <p className="text-xs text-gray-300 font-mono mt-1 break-all">{log.target || log.details}</p>
                  {log.user && <p className="text-[10px] text-gray-500 mt-0.5">Por: {log.user}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
