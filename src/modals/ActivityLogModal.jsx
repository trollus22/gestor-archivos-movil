import React, { useState, useEffect } from 'react';
import { X, History, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '../utils/formatters.jsx';
import { apiRequest } from '../api.js';

export default function ActivityLogModal({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/system/activity')
      .then((res) => {
        setLogs(res.logs || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getOpBadge = (op) => {
    const map = {
      mkdir: { label: 'Crear carpeta', color: 'bg-blue-100 text-blue-800' },
      create_file: { label: 'Crear archivo', color: 'bg-emerald-100 text-emerald-800' },
      edit: { label: 'Guardar edición', color: 'bg-indigo-100 text-indigo-800' },
      rename: { label: 'Renombrar', color: 'bg-purple-100 text-purple-800' },
      move: { label: 'Mover', color: 'bg-amber-100 text-amber-800' },
      copy: { label: 'Copiar', color: 'bg-teal-100 text-teal-800' },
      duplicate: { label: 'Duplicar', color: 'bg-cyan-100 text-cyan-800' },
      chmod: { label: 'Cambiar permisos', color: 'bg-orange-100 text-orange-800' },
      trash: { label: 'Mover a papelera', color: 'bg-yellow-100 text-yellow-800' },
      restore: { label: 'Restaurar', color: 'bg-green-100 text-green-800' },
      empty_trash: { label: 'Vaciar papelera', color: 'bg-red-100 text-red-800' },
      permanent_delete: { label: 'Borrado definitivo', color: 'bg-rose-100 text-rose-800' },
      compress: { label: 'Comprimir', color: 'bg-fuchsia-100 text-fuchsia-800' },
      extract: { label: 'Extraer', color: 'bg-sky-100 text-sky-800' },
      upload: { label: 'Subir archivo', color: 'bg-violet-100 text-violet-800' },
    };
    const item = map[op] || { label: op, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${item.color}`}>
        {item.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-fluent-darkSurface border border-fluent-border rounded-xl shadow-fluent-lg w-full max-w-3xl h-[70vh] flex flex-col overflow-hidden text-xs">
        {/* Cabecera */}
        <div className="h-11 bg-fluent-surfaceHover dark:bg-black/20 border-b border-fluent-border px-4 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <History size={16} className="text-fluent-blue" />
            <span className="font-semibold text-fluent-text dark:text-fluent-darkText">
              Registro de actividad y auditoría
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/10 text-fluent-textSecondary">
            <X size={16} />
          </button>
        </div>

        {/* Lista de registros */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-8 text-center text-fluent-textMuted">Cargando registro de auditoría...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-fluent-textMuted">No hay registros de actividad todavía.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-fluent-border text-fluent-textSecondary font-semibold">
                  <th className="py-2 px-3 w-36">Fecha y hora</th>
                  <th className="py-2 px-3 w-32">Operación</th>
                  <th className="py-2 px-3">Ruta objetivo</th>
                  <th className="py-2 px-3 w-20">Usuario</th>
                  <th className="py-2 px-3 w-16 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fluent-border font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-fluent-surfaceHover">
                    <td className="py-2 px-3 whitespace-nowrap text-fluent-textMuted">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">{getOpBadge(log.operation)}</td>
                    <td className="py-2 px-3 break-all text-fluent-text dark:text-fluent-darkText">
                      {log.targetPath}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-fluent-textSecondary">
                      {log.user}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {log.success ? (
                        <CheckCircle size={14} className="text-emerald-500 inline" />
                      ) : (
                        <XCircle size={14} className="text-red-500 inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="h-6 bg-fluent-surfaceHover dark:bg-black/20 border-t border-fluent-border px-4 flex items-center justify-between text-[11px] text-fluent-textMuted select-none">
          <span>{logs.length} operaciones registradas</span>
        </div>
      </div>
    </div>
  );
}
