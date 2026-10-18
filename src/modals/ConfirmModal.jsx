import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = 'Confirmar', isDanger = true }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-fluent-darkSurface border border-fluent-border rounded-xl shadow-fluent-lg w-full max-w-sm overflow-hidden text-xs flex flex-col">
        <div className="p-4 flex items-start space-x-3">
          <div className={`p-2 rounded-full flex-shrink-0 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-fluent-text dark:text-fluent-darkText mb-1">{title}</h3>
            <p className="text-fluent-textSecondary dark:text-fluent-darkTextSecondary leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="p-3 bg-fluent-surfaceHover dark:bg-black/20 border-t border-fluent-border flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 rounded font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 text-white rounded font-medium transition-colors ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-fluent-blue hover:bg-fluent-blueHover'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
