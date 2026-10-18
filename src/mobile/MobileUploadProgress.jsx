import React from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

export default function MobileUploadProgress({ uploads = [], onCancelUpload }) {
  if (!uploads || uploads.length === 0) return null;

  return (
    <div className="fixed z-40 left-3 right-3 bottom-[calc(4.8rem+env(safe-area-inset-bottom))] max-w-md mx-auto space-y-2 pointer-events-auto">
      {uploads.map((up) => (
        <div
          key={up.id || up.name}
          className="bg-[#1e212b]/95 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
            {up.status === 'uploading' && <Loader2 size={18} className="animate-spin" />}
            {up.status === 'done' && <CheckCircle2 size={18} className="text-emerald-400" />}
            {up.status === 'error' && <AlertCircle size={18} className="text-rose-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-gray-200 truncate pr-2">{up.name}</span>
              <span className="text-gray-400 font-mono text-[11px]">{up.progress}%</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${up.progress}%` }}
                className={`h-full transition-all duration-150 rounded-full ${
                  up.status === 'error'
                    ? 'bg-rose-500'
                    : up.status === 'done'
                    ? 'bg-emerald-500'
                    : 'bg-blue-500'
                }`}
              />
            </div>
            {up.error && <p className="text-[10px] text-rose-400 mt-1 truncate">{up.error}</p>}
          </div>

          {up.status === 'uploading' && (
            <button
              onClick={() => onCancelUpload(up.id)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg active:bg-white/10 touch-target flex items-center justify-center"
              title="Cancelar subida"
              aria-label="Cancelar subida"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
