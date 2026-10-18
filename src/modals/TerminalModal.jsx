import React, { useState, useRef, useEffect } from 'react';
import { X, Terminal as TerminalIcon, CornerDownLeft } from 'lucide-react';
import { apiRequest } from '../api.js';

export default function TerminalModal({ currentPath, onClose }) {
  const [history, setHistory] = useState([
    { type: 'info', text: 'Consola de terminal segura conectada a 127.0.0.1. Directorio actual: ' + currentPath },
  ]);
  const [inputCmd, setInputCmd] = useState('');
  const [cwd, setCwd] = useState(currentPath);
  const [submitting, setSubmitting] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = async (e) => {
    e.preventDefault();
    const cmdStr = inputCmd.trim();
    if (!cmdStr) return;

    setInputCmd('');
    setHistory((prev) => [...prev, { type: 'cmd', text: `${cwd}$ ${cmdStr}` }]);
    setSubmitting(true);

    // Separar argumentos de forma segura
    const parts = cmdStr.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    if (command === 'cd') {
      // Manejar cambio de directorio
      const target = args[0] || '/';
      setCwd(target);
      setHistory((prev) => [...prev, { type: 'info', text: `Directorio cambiado a ${target}` }]);
      setSubmitting(false);
      return;
    }

    try {
      const res = await apiRequest('/api/terminal/exec', {
        method: 'POST',
        body: { command, args, cwd },
      });

      if (res.stdout) {
        setHistory((prev) => [...prev, { type: 'stdout', text: res.stdout }]);
      }
      if (res.stderr) {
        setHistory((prev) => [...prev, { type: 'stderr', text: res.stderr }]);
      }
      if (res.error) {
        setHistory((prev) => [...prev, { type: 'error', text: res.error }]);
      }
    } catch (err) {
      setHistory((prev) => [...prev, { type: 'error', text: err.message || 'Error al ejecutar comando' }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1e1e24] border border-white/10 rounded-xl shadow-2xl w-full max-w-3xl h-[65vh] flex flex-col overflow-hidden text-xs font-mono text-slate-200">
        {/* Cabecera */}
        <div className="h-10 bg-[#16161a] border-b border-white/10 px-4 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <TerminalIcon size={14} className="text-emerald-400" />
            <span className="font-semibold text-white">Terminal Web Linux (Opcional)</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-slate-400">
            <X size={16} />
          </button>
        </div>

        {/* Salida de la consola */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 select-text">
          {history.map((h, i) => (
            <div key={i} className="whitespace-pre-wrap leading-relaxed">
              {h.type === 'cmd' && <span className="text-emerald-400 font-semibold">{h.text}</span>}
              {h.type === 'stdout' && <span className="text-slate-200">{h.text}</span>}
              {h.type === 'stderr' && <span className="text-amber-400">{h.text}</span>}
              {h.type === 'error' && <span className="text-red-400">{h.text}</span>}
              {h.type === 'info' && <span className="text-cyan-400 italic">{h.text}</span>}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Entrada de comando */}
        <form onSubmit={handleCommand} className="h-10 bg-[#16161a] border-t border-white/10 px-3 flex items-center space-x-2">
          <span className="text-emerald-400 font-semibold select-none">$</span>
          <input
            type="text"
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
            disabled={submitting}
            placeholder="Escriba un comando (ej. ls, uname -a, df -h, uptime)..."
            className="flex-1 bg-transparent text-white outline-none font-mono"
            autoFocus
          />
          <button type="submit" disabled={submitting} className="text-slate-400 hover:text-white">
            <CornerDownLeft size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
