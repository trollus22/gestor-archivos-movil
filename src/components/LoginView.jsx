import React, { useState } from 'react';
import { Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';
import { apiRequest, setCsrfToken } from '../api.js';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      });

      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
      }
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#c8e2f8] via-[#e4edf5] to-[#d4eae2] p-4 select-none font-sans">
      <div className="w-full max-w-sm bg-white/80 dark:bg-[#202023]/90 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-fluent-flyout p-7 flex flex-col items-center">
        {/* Logo Files Fluent */}
        <div className="w-14 h-14 bg-gradient-to-tr from-[#0067c0] to-[#2b88d8] rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
          <ShieldCheck size={28} />
        </div>

        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
          Gestor de Archivos
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 text-center">
          Acceso autenticado y seguro al servidor VPS
        </p>

        {error && (
          <div className="w-full mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-lg flex items-start space-x-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Usuario
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
                required
                className="w-full pl-9 pr-3 py-2 bg-white/70 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:border-fluent-blue transition-all"
              />
              <User size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoFocus
                className="w-full pl-9 pr-3 py-2 bg-white/70 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:border-fluent-blue transition-all"
              />
              <Lock size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-fluent-blue hover:bg-fluent-blueHover text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 text-[10px] text-slate-400 text-center">
          Servicio restringido · Conexión local 127.0.0.1
        </div>
      </div>
    </div>
  );
}
