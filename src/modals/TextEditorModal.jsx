import React, { useState, useEffect } from 'react';
import { X, Save, Check, AlertCircle } from 'lucide-react';
import { apiRequest } from '../api.js';

export default function TextEditorModal({ filePath, fileName, onClose, onSaved }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    apiRequest(`/api/files/read?path=${encodeURIComponent(filePath)}`)
      .then((data) => {
        if (isMounted) {
          setContent(data.content || '');
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error al cargar archivo');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filePath]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiRequest('/api/files/save', {
        method: 'POST',
        body: { path: filePath, content },
      });
      setSavedSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      setError(err.message || 'Error al guardar archivo');
    } finally {
      setSaving(false);
    }
  };

  // Atajo Ctrl+S para guardar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, filePath]);

  const lines = content.split('\n');

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-fluent-darkSurface border border-fluent-border rounded-xl shadow-fluent-lg w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden text-xs">
        {/* Cabecera */}
        <div className="h-11 bg-fluent-surfaceHover dark:bg-black/20 border-b border-fluent-border px-4 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2 truncate">
            <span className="font-semibold text-fluent-text dark:text-fluent-darkText truncate">
              {fileName}
            </span>
            <span className="text-fluent-textMuted text-[11px] truncate">({filePath})</span>
          </div>

          <div className="flex items-center space-x-2">
            {savedSuccess && (
              <span className="flex items-center text-emerald-600 text-[11px] font-medium mr-2">
                <Check size={13} className="mr-1" /> Guardado
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center px-3 py-1.5 bg-fluent-blue hover:bg-fluent-blueHover text-white rounded-md font-medium transition-colors disabled:opacity-50"
            >
              <Save size={13} className="mr-1.5" />
              <span>{saving ? 'Guardando...' : 'Guardar (Ctrl+S)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-fluent-textSecondary"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 text-red-600 px-4 py-2 flex items-center space-x-2 border-b border-red-200">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Área del editor con números de línea */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-fluent-textMuted">
            Cargando archivo...
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden font-mono text-[13px] bg-slate-50 dark:bg-[#18181b]">
            {/* Números de línea */}
            <div className="w-12 bg-slate-100 dark:bg-[#202023] border-r border-fluent-border py-3 px-2 text-right text-slate-400 select-none overflow-hidden">
              {lines.map((_, i) => (
                <div key={i} className="leading-6 text-[11px]">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Editor de texto */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 p-3 bg-transparent text-slate-800 dark:text-slate-100 outline-none resize-none leading-6 font-mono overflow-auto whitespace-pre tab-4"
              spellCheck={false}
            />
          </div>
        )}

        {/* Barra inferior */}
        <div className="h-6 bg-fluent-surfaceHover dark:bg-black/20 border-t border-fluent-border px-4 flex items-center justify-between text-[11px] text-fluent-textMuted select-none">
          <span>{lines.length} líneas · {content.length} caracteres</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}
