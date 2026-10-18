import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';
import { triggerHaptic } from './native-bridge.js';

export default function MobilePdfViewer({ item, onClose, onDownload }) {
  if (!item) return null;
  const pdfUrl = `/api/download/file?path=${encodeURIComponent(item.path)}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#111318] flex flex-col justify-between overflow-hidden animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] bg-[#161820] border-b border-white/10">
        <button
          onClick={() => {
            triggerHaptic();
            onClose();
          }}
          className="p-2.5 bg-white/10 text-white rounded-full touch-target flex items-center justify-center"
          aria-label="Cerrar visor PDF"
        >
          <X size={22} />
        </button>

        <div className="text-center px-2 flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{item.name}</p>
          <p className="text-[11px] text-gray-400">Documento PDF</p>
        </div>

        <button
          onClick={() => {
            triggerHaptic();
            onDownload(item);
          }}
          className="p-2.5 bg-white/10 text-white rounded-full touch-target flex items-center justify-center"
          aria-label="Descargar PDF"
        >
          <Download size={20} />
        </button>
      </div>

      {/* PDF Viewport iframe */}
      <div className="flex-1 w-full bg-[#20222a] relative">
        <iframe
          src={pdfUrl}
          title={item.name}
          className="w-full h-full border-0"
        />
      </div>

      {/* Bottom bar with open in new tab fallback */}
      <div className="p-3 bg-[#161820] border-t border-white/10 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between">
        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-400 flex items-center gap-1.5 touch-target py-1"
        >
          <ExternalLink size={14} />
          <span>Abrir visor completo del navegador</span>
        </a>
        <button
          onClick={() => onDownload(item)}
          className="px-3.5 py-1.5 bg-blue-600 active:bg-blue-700 text-white rounded-xl text-xs font-semibold touch-target flex items-center gap-1"
        >
          <Download size={14} />
          <span>Descargar</span>
        </button>
      </div>
    </div>
  );
}
