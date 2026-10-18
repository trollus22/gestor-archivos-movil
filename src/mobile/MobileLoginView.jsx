import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Loader2, AlertCircle, Shield } from 'lucide-react';
import { apiRequest, setCsrfToken } from '../api.js';
import { triggerHaptic } from './native-bridge.js';

export default function MobileLoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    triggerHaptic('medium');
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { username: username.trim(), password },
      });

      if (res.csrfToken) {
        setCsrfToken(res.csrfToken);
      }

      onLoginSuccess(res.user || username.trim());
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[100dvh] w-screen flex flex-col justify-center items-center p-6 bg-[#111318] text-white safe-top safe-bottom">
      <div className="w-full max-w-sm space-y-6">
        {/* App Logo & Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto shadow-xl shadow-blue-900/30">
            <Shield size={38} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestor de Archivos</h1>
          <p className="text-xs text-gray-400">Acceso seguro a servidor Linux remoto</p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300 animate-in fade-in duration-150">
            <AlertCircle size={18} className="flex-shrink-0 text-rose-400" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-[#181a24] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 ml-1">Usuario</label>
            <div className="relative flex items-center">
              <User size={18} className="absolute left-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
                autoCapitalize="none"
                autoCorrect="off"
                required
                className="w-full bg-[#11131a] border border-white/10 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white focus:outline-none focus:border-blue-500 touch-target"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 ml-1">Contraseña</label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-3.5 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña de administrador"
                required
                className="w-full bg-[#11131a] border border-white/10 rounded-xl pl-10 pr-11 py-3 text-sm text-white focus:outline-none focus:border-blue-500 touch-target"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 p-1 text-gray-400 hover:text-white touch-target flex items-center justify-center"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password || !username.trim()}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-900/40 touch-target flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            <span>{loading ? 'Iniciando sesión...' : 'Iniciar sesión'}</span>
          </button>
        </form>

        <p className="text-[11px] text-center text-gray-500">
          Protegido con cookie HttpOnly + CSRF y límite de intentos
        </p>
      </div>
    </div>
  );
}
