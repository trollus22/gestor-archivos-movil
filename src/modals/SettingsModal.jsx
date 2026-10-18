import React, { useState } from 'react';
import {
  X,
  Settings,
  Terminal,
  Eye,
  Sun,
  Moon,
  LogOut,
  History,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '../api.js';

export default function SettingsModal({
  showHidden,
  onToggleHidden,
  darkMode,
  onToggleDarkMode,
  enableTerminal,
  onToggleTerminal,
  onOpenActivityLog,
  onOpenTrash,
  onLogout,
  onOpenTerminal,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-fluent-darkSurface border border-fluent-border rounded-xl shadow-fluent-lg w-full max-w-md overflow-hidden text-xs flex flex-col">
        {/* Cabecera */}
        <div className="h-11 bg-fluent-surfaceHover dark:bg-black/20 border-b border-fluent-border px-4 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <Settings size={16} className="text-fluent-blue" />
            <span className="font-semibold text-fluent-text dark:text-fluent-darkText">
              Configuración y preferencias
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/10 text-fluent-textSecondary">
            <X size={16} />
          </button>
        </div>

        {/* Opciones */}
        <div className="p-4 space-y-4">
          {/* Mostrar archivos ocultos */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center space-x-2.5">
              <Eye size={16} className="text-slate-500" />
              <div>
                <div className="font-medium text-fluent-text dark:text-fluent-darkText">Archivos ocultos</div>
                <div className="text-[11px] text-fluent-textMuted">Mostrar archivos y carpetas que empiezan por punto</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showHidden}
              onChange={onToggleHidden}
              className="w-4 h-4 rounded text-fluent-blue cursor-pointer"
            />
          </div>

          {/* Modo oscuro */}
          <div className="flex items-center justify-between py-1 border-t border-fluent-border pt-3">
            <div className="flex items-center space-x-2.5">
              {darkMode ? <Moon size={16} className="text-purple-400" /> : <Sun size={16} className="text-amber-500" />}
              <div>
                <div className="font-medium text-fluent-text dark:text-fluent-darkText">Tema de la interfaz</div>
                <div className="text-[11px] text-fluent-textMuted">Modo claro Fluent / Mica o Modo oscuro</div>
              </div>
            </div>
            <button
              onClick={onToggleDarkMode}
              className="px-2.5 py-1 bg-black/5 dark:bg-white/10 rounded font-medium hover:bg-black/10 transition-colors"
            >
              {darkMode ? 'Oscuro' : 'Claro'}
            </button>
          </div>

          {/* Consola de terminal web (opcional y desactivada por defecto) */}
          <div className="flex items-center justify-between py-1 border-t border-fluent-border pt-3">
            <div className="flex items-center space-x-2.5">
              <Terminal size={16} className="text-emerald-500" />
              <div>
                <div className="font-medium text-fluent-text dark:text-fluent-darkText">Consola de terminal web</div>
                <div className="text-[11px] text-fluent-textMuted">
                  {enableTerminal ? 'Terminal activada' : 'Desactivada por defecto por seguridad'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={enableTerminal}
                onChange={onToggleTerminal}
                className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
              />
              {enableTerminal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenTerminal();
                  }}
                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px]"
                >
                  Abrir
                </button>
              )}
            </div>
          </div>

          {/* Accesos directos a Papelera y Registro */}
          <div className="border-t border-fluent-border pt-3 space-y-2">
            <button
              onClick={() => {
                onClose();
                onOpenTrash();
              }}
              className="w-full flex items-center justify-between p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center space-x-2 text-fluent-text dark:text-fluent-darkText">
                <Trash2 size={15} className="text-cyan-600" />
                <span>Gestionar papelera de reciclaje</span>
              </div>
              <span className="text-fluent-textMuted">→</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenActivityLog();
              }}
              className="w-full flex items-center justify-between p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center space-x-2 text-fluent-text dark:text-fluent-darkText">
                <History size={15} className="text-fluent-blue" />
                <span>Ver registro de actividad y auditoría</span>
              </div>
              <span className="text-fluent-textMuted">→</span>
            </button>
          </div>

          {/* Cerrar sesión */}
          <div className="border-t border-fluent-border pt-3">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 rounded font-medium transition-colors"
            >
              <LogOut size={14} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
