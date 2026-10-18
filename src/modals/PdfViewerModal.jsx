import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

export default function PdfViewerModal({ filePath, fileName, onClose }) {
  const pdfUrl = `/api/download/file?path=${encodeURIComponent(filePath)}&inline=true`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-fluent-darkSurface border border-fluent-border rounded-xl shadow-fluent-lg w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden text-xs">
        {/* Cabecera */}
        <div className="h-11 bg-fluent-surfaceHover dark:bg-black/20 border-b border-fluent-border px-4 flex items-center justify-between select-none">
          <span className="font-semibold text-fluent-text dark:text-fluent-darkText truncate max-w-md">
            {fileName}
          </span>
          <div className="flex items-center space-x-2">
            <a
              href={pdfUrl}
              download={fileName}
              className="flex items-center px-2.5 py-1 bg-fluent-blue text-white rounded hover:bg-fluent-blueHover transition-colors font-medium"
            >
              <Download size={13} className="mr-1.5" />
              <span>Descargar PDF</span>
            </a>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-fluent-textSecondary"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Visor PDF embebido */}
        <div className="flex-1 w-full bg-slate-100 dark:bg-black">
          <iframe
            src={pdfUrl}
            title={fileName}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
