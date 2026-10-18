import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, Check, AlertCircle } from 'lucide-react';
import { apiRequest } from '../api.js';
import { triggerHaptic } from './native-bridge.js';

export default function MobileTextEditor({ item, onClose, onSaveSuccess }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!item) return;
    setLoading(true);
    apiRequest(`/api/files/read?path=${encodeURIComponent(item.path)}`)
      .then((data) => {
        setContent(data.content ?? '');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error al leer el archivo');
        setLoading(false);
      });
  }, [item]);

  const handleSave = async () => {
    if (saving) return;
    triggerHaptic('medium');
    setSaving(true);
    setError(null);
    try {
      await apiRequest('/api/files/save', {
        method: 'POST',
        body: {
          path: item.path,
          content,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      setError(err.message || 'Error al guardar el archivo');
    } finally {
      setSaving(false);
    }
  };

  // Atajo Ctrl+S / Cmd+S
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  if (!item) return null;

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 bg-[#14161f] flex flex-col h-[100dvh] w-screen overflow-hidden animate-in fade-in duration-150"
    >
      {/* Top Bar adaptada a notch móvil */}
      <header className="flex items-center justify-between px-3 py-2 pt-[max(0.75rem,env(safe-area-inset-top))] bg-[#1a1d26] border-b border-white/10 flex-shrink-0">
        <button
          onClick={() => {
            triggerHaptic();
            onClose();
          }}
          className="px-3 py-2 text-gray-300 hover:text-white rounded-xl active:bg-white/10 touch-target flex items-center gap-1 text-xs font-semibold"
          aria-label="Cerrar editor"
        >
          <X size={18} />
          <span>Cerrar</span>
        </button>

        <div className="flex-1 min-w-0 text-center px-2">
          <p className="text-sm font-semibold text-white truncate">{item.name}</p>
          <p className="text-[10px] text-gray-400 font-mono">
            {content.length} caracteres • {content.split('\n').length} líneas
          </p>
        </div>

        {/* Botón Guardar táctil prominente */}
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className={`px-4 py-2 rounded-xl text-xs font-semibold touch-target flex items-center gap-1.5 transition-all shadow-md ${
            saveSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 active:bg-blue-700 text-white shadow-blue-900/30'
          }`}
          aria-label="Guardar cambios"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saveSuccess ? (
            <Check size={16} />
          ) : (
            <Save size={16} />
          )}
          <span>{saving ? 'Guardando' : saveSuccess ? '¡Guardado!' : 'Guardar'}</span>
        </button>
      </header>

      {/* Error banner si falló el guardado */}
      {error && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 flex items-center gap-2 text-xs text-rose-300 flex-shrink-0">
          <AlertCircle size={15} />
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-2" />
            <p className="text-xs">Cargando documento...</p>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            className="w-full h-full bg-[#0f1117] text-gray-100 font-mono text-xs leading-relaxed p-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 resize-none overflow-y-auto overscroll-contain"
            placeholder="Escribe el contenido aquí..."
          />
        )}
      </div>

      {/* Safe area padding inferior para teclado móvil */}
      <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-[#14161f] flex-shrink-0" />
    </div>
  );
}
